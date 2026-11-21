import { auth } from "@/services/auth/auth";
import { prisma } from "@/services/prisma";
import {
  generateWebhookSecret,
  parseStaticPayload,
} from "@/services/qris/qris";
import { type NextRequest, NextResponse } from "next/server";

export const ALL_PERMISSIONS = [
  "/",
  "/dashboard",
  "/dashboard/admin/master/users",
  "/dashboard/admin/master/roles",
  "/dashboard/admin/master/branches",
  "/dashboard/admin/master/receipt",
  "/dashboard/admin/utility/whatsapp",
  "/dashboard/admin/utility/qris/accounts",
  "/dashboard/admin/utility/qris/transactions",
  "/dashboard/admin/utility/qris/products",
  "/dashboard/admin/utility/qris/tables",
  "/dashboard/admin/utility/qris/orders",
];

export const KASIR_PERMISSIONS = [
  "/",
  "/dashboard",
  "/dashboard/admin/utility/qris/accounts",
  "/dashboard/admin/utility/qris/transactions",
  "/dashboard/admin/utility/qris/products",
  "/dashboard/admin/utility/qris/tables",
  "/dashboard/admin/utility/qris/orders",
];

/**
 * Role Kasir dibuat untuk client lama yang belum punya. Idempoten dan aman
 * dipanggil dari route daftar role.
 */
export async function ensureClientRoles(clientId: string) {
  const existing = await prisma.role.findUnique({
    where: { clientId_name: { clientId, name: "Kasir" } },
    select: { id: true, permissions: true },
  });

  if (!existing) {
    await prisma.role.upsert({
      where: { clientId_name: { clientId, name: "Kasir" } },
      create: {
        clientId,
        name: "Kasir",
        description: "Akses kasir: QRIS, pesanan, dan konfirmasi pembayaran",
        permissions: KASIR_PERMISSIONS,
      },
      update: {},
    });
    return;
  }

  if (existing.permissions.join("|") !== KASIR_PERMISSIONS.join("|")) {
    await prisma.role.update({
      where: { id: existing.id },
      data: {
        permissions: KASIR_PERMISSIONS,
        description: "Akses kasir: QRIS, pesanan, dan konfirmasi pembayaran",
      },
    });
  }
}

export type ClientContext =
  | { ok: true; clientId: string; userId: string; branchId: string | null }
  | { ok: false; response: NextResponse };

export function clientUnauthorized(message = "Sesi tidak ditemukan") {
  return NextResponse.json({ success: false, message }, { status: 401 });
}

export function clientForbidden(message = "Akun belum terhubung ke client") {
  return NextResponse.json({ success: false, message }, { status: 403 });
}

/**
 * Client milik pemanggil. User yang belum onboarding tidak punya clientId,
 * sehingga route bisnis membalas 403 dan UI mengarahkan ke /onboarding.
 */
export async function resolveClient(
  request: NextRequest,
  explicit?: string | null,
): Promise<ClientContext> {
  const session = await auth.api.getSession({ headers: request.headers });
  const userId = session?.user?.id;

  if (!userId) return { ok: false, response: clientUnauthorized() };

  const [user, userData] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { clientId: true },
    }),
    prisma.userData.findUnique({
      where: { userId },
      select: { clientId: true, branchId: true },
    }),
  ]);

  const clientId = user?.clientId ?? userData?.clientId ?? null;

  if (!clientId) return { ok: false, response: clientForbidden() };

  if (explicit && explicit !== clientId) {
    return {
      ok: false,
      response: clientForbidden("Tidak punya akses ke client ini"),
    };
  }

  return { ok: true, clientId, userId, branchId: userData?.branchId ?? null };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

//  Onboarding: buat client + role Admin + branch Main + userData pemilik.
//  Satu transaksi supaya akun tidak pernah setengah jadi.

export type CreateClientInput = {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
  branch?: {
    name?: string;
    phone?: string;
    address?: string;
    adminName?: string;
  } | null;
  qris?: { label?: string; staticPayload?: string } | null;
};

function optionalField(value: unknown, max = 200): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text ? text.slice(0, max) : null;
}

export async function createClientForUser(
  userId: string,
  input: CreateClientInput,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, clientId: true },
  });

  if (!user) throw new Error("Akun tidak ditemukan");
  if (user.clientId) throw new Error("Akun sudah memiliki client");

  const baseSlug = slugify(input.name) || "client";
  const slug = `${baseSlug}-${crypto.randomUUID().slice(0, 4)}`;

  return prisma.$transaction(async (tx) => {
    const client = await tx.client.create({
      data: {
        name: input.name,
        slug,
        email: input.email || user.email,
        phone: input.phone,
        address: input.address,
        logoUrl: optionalField(input.logoUrl, 2048),
      },
    });

    const role = await tx.role.create({
      data: {
        clientId: client.id,
        name: "Admin",
        description: "Akses penuh ke client",
        permissions: ALL_PERMISSIONS,
      },
    });

    await tx.role.create({
      data: {
        clientId: client.id,
        name: "Kasir",
        description: "Akses kasir: QRIS, pesanan, dan konfirmasi pembayaran",
        permissions: KASIR_PERMISSIONS,
      },
    });

    const branch = await tx.branch.create({
      data: {
        clientId: client.id,
        name: optionalField(input.branch?.name, 100) ?? "Main",
        phone: optionalField(input.branch?.phone, 32),
        address: optionalField(input.branch?.address, 300),
        adminName: optionalField(input.branch?.adminName, 120),
      },
    });

    if (input.qris?.staticPayload?.trim()) {
      const parsed = parseStaticPayload(input.qris.staticPayload);
      await tx.qrisAccount.create({
        data: {
          clientId: client.id,
          label:
            optionalField(input.qris.label, 64) ?? "QRIS Utama",
          staticPayload: parsed.payload,
          merchantName: parsed.merchantName,
          merchantCity: parsed.merchantCity,
          merchantNmid: parsed.merchantNmid,
          webhookSecret: generateWebhookSecret(),
        },
      });
    }

    await tx.user.update({
      where: { id: userId },
      data: { clientId: client.id, role: "admin" },
    });

    await tx.userData.upsert({
      where: { userId },
      create: {
        userId,
        clientId: client.id,
        name: user.name,
        email: user.email,
        roleId: role.id,
        branchId: branch.id,
        status: "active",
        isActive: true,
      },
      update: {
        clientId: client.id,
        roleId: role.id,
        branchId: branch.id,
      },
    });

    return client;
  });
}
