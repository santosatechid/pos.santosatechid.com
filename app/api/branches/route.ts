import { randomBytes } from "node:crypto";

import { handlePrismaError } from "@/services/errorHandler";
import { prisma } from "@/services/prisma";
import {
  resolveClient,
  clientForbidden,
  ensureClientRoles,
} from "@/services/clients";
import {
  createTenantUser,
  requireAdmin,
  userAdminErrorResponse,
} from "@/services/users";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const t = await resolveClient(
    request,
    request.nextUrl.searchParams.get("clientId"),
  );
  if (!t.ok) return t.response;

  try {
    const branches = await prisma.branch.findMany({
      where: { clientId: t.clientId },
      include: {
        _count: { select: { users: true } },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: { select: { name: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(branches);
  } catch (error) {
    return handlePrismaError(error);
  }
}

export async function POST(request: NextRequest) {
  const t = await resolveClient(request);
  if (!t.ok) return t.response;

  try {
    await requireAdmin(request.headers);
    const {
      name,
      description,
      address,
      phone,
      adminName,
      signatureUrl,
      isActive,
      cashier,
    } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Nama cabang wajib diisi" },
        { status: 400 },
      );
    }

    const branch = await prisma.branch.create({
      data: {
        name,
        description,
        address,
        phone,
        adminName,
        signatureUrl,
        isActive: isActive ?? true,
        clientId: t.clientId,
      },
    });

    let credentials: { email: string; password: string } | null = null;
    if (cashier?.name && cashier?.email) {
      await ensureClientRoles(t.clientId);
      const role = await prisma.role.findFirst({
        where: { clientId: t.clientId, name: "Kasir" },
        select: { id: true },
      });
      if (!role) {
        await prisma.branch.delete({ where: { id: branch.id } });
        return NextResponse.json(
          { error: "Role Kasir tidak ditemukan" },
          { status: 500 },
        );
      }

      const password =
        typeof cashier.password === "string" && cashier.password.length >= 8
          ? cashier.password
          : randomBytes(12).toString("base64url");

      try {
        await createTenantUser(t.clientId, request.headers, {
          name: cashier.name,
          email: cashier.email,
          password,
          roleId: role.id,
          branchId: branch.id,
          status: "active",
          isActive: true,
        });
        credentials = { email: String(cashier.email), password };
      } catch (error) {
        await prisma.branch.delete({ where: { id: branch.id } }).catch(() => {
          // Cabang tanpa kasir lebih baik dihapus, error asli tetap dilempar.
        });
        return userAdminErrorResponse(error);
      }
    }

    return NextResponse.json(
      { ...branch, cashier: credentials },
      { status: 201 },
    );
  } catch (error) {
    return userAdminErrorResponse(error);
  }
}

export async function PUT(request: NextRequest) {
  const t = await resolveClient(request);
  if (!t.ok) return t.response;

  try {
    const { id, name, description, address, phone, adminName, signatureUrl, isActive } =
      await request.json();

    if (!id || !name) {
      return NextResponse.json(
        { error: "ID and name are required" },
        { status: 400 },
      );
    }

    const owned = await prisma.branch.findFirst({
      where: { id, clientId: t.clientId },
      select: { id: true },
    });
    if (!owned) {
      return clientForbidden("Data tidak ditemukan di client ini");
    }

    const branch = await prisma.branch.update({
      where: { id },
      data: { name, description, address, phone, adminName, signatureUrl, isActive },
    });

    return NextResponse.json(branch);
  } catch (error) {
    return handlePrismaError(error);
  }
}

export async function DELETE(request: NextRequest) {
  const t = await resolveClient(request);
  if (!t.ok) return t.response;

  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const owned = await prisma.branch.findFirst({
      where: { id, clientId: t.clientId },
      select: { id: true },
    });
    if (!owned) {
      return clientForbidden("Data tidak ditemukan di client ini");
    }

    const branch = await prisma.branch.delete({ where: { id } });
    return NextResponse.json(branch);
  } catch (error) {
    return handlePrismaError(error);
  }
}
