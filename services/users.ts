import { randomBytes } from "node:crypto";

import type { Prisma } from "@/prisma/generated/client";
import { auth } from "@/services/auth/auth";
import { handlePrismaError } from "@/services/errorHandler";
import { prisma } from "@/services/prisma";
import { NextResponse } from "next/server";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;
const MAX_PASSWORD = 128;

const USER_DATA_FIELDS = [
  "address",
  "avatarUrl",
  "birthDate",
  "birthPlace",
  "employeeId",
  "endDate",
  "enrollmentDate",
  "gender",
  "graduationDate",
  "nik",
  "nisn",
  "parentPhone",
  "position",
  "relation",
  "startDate",
  "status",
  "studentIds",
] as const;

export class UserAdminError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
    this.name = "UserAdminError";
  }
}

function authErrorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    if (
      "body" in error &&
      error.body &&
      typeof error.body === "object" &&
      "message" in error.body &&
      typeof error.body.message === "string"
    ) {
      return error.body.message;
    }
    if ("message" in error && typeof error.message === "string") {
      return error.message;
    }
  }
  return "Gagal memproses akun login";
}

function authErrorStatus(error: unknown): number | null {
  if (!error || typeof error !== "object") return null;

  if ("statusCode" in error) {
    const status = error.statusCode;
    if (typeof status === "number" && status >= 400 && status < 600) {
      return status;
    }
  }

  if ("status" in error) {
    const status = error.status;
    if (typeof status === "number" && status >= 400 && status < 600) {
      return status;
    }
  }

  return null;
}

export function userAdminErrorResponse(error: unknown) {
  if (error instanceof UserAdminError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: error.status },
    );
  }

  const status = authErrorStatus(error);
  if (status) {
    const message = authErrorMessage(error);
    if (/already exists/i.test(message)) {
      return NextResponse.json(
        { success: false, message: "Email sudah terdaftar" },
        { status: 409 },
      );
    }
    if (/password/i.test(message)) {
      return NextResponse.json(
        { success: false, message },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { success: false, message },
      { status },
    );
  }

  return handlePrismaError(error);
}

export async function requireAdmin(headers: Headers) {
  const session = await auth.api.getSession({ headers });
  if (!session?.user) {
    throw new UserAdminError("Sesi tidak ditemukan", 401);
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "admin") {
    throw new UserAdminError("Hanya admin yang bisa mengelola user", 403);
  }
  return session;
}

function requiredText(value: unknown, label: string, max: number): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new UserAdminError(`${label} wajib diisi`, 400);
  }
  const text = value.trim();
  if (text.length > max) {
    throw new UserAdminError(`${label} maksimal ${max} karakter`, 400);
  }
  return text;
}

function normalizeEmail(value: unknown): string {
  const email = requiredText(value, "Email", 160).toLowerCase();
  if (!EMAIL_PATTERN.test(email)) {
    throw new UserAdminError("Email tidak valid", 400);
  }
  return email;
}

function normalizePassword(value: unknown): string {
  if (typeof value !== "string") {
    throw new UserAdminError("Password wajib diisi", 400);
  }
  if (value.length < MIN_PASSWORD || value.length > MAX_PASSWORD) {
    throw new UserAdminError(
      `Password harus ${MIN_PASSWORD}-${MAX_PASSWORD} karakter`,
      400,
    );
  }
  return value;
}

function optionalPassword(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  return normalizePassword(value);
}

function pickUserDataFields(input: Record<string, unknown>) {
  const data: Record<string, unknown> = {};
  for (const key of USER_DATA_FIELDS) {
    if (input[key] !== undefined) data[key] = input[key];
  }
  return data;
}

async function resolveRole(clientId: string, rawRoleId: unknown) {
  const roleId = requiredText(rawRoleId, "Role", 64);
  const role = await prisma.role.findFirst({
    where: { id: roleId, OR: [{ clientId }, { clientId: null }] },
    select: { id: true, name: true },
  });
  if (!role) throw new UserAdminError("Role tidak ditemukan", 400);
  return role;
}

async function resolveBranch(clientId: string, rawBranchId: unknown) {
  if (rawBranchId === undefined || rawBranchId === null || rawBranchId === "") {
    return null;
  }
  const branchId = requiredText(rawBranchId, "Branch", 64);
  const branch = await prisma.branch.findFirst({
    where: { id: branchId, clientId },
    select: { id: true },
  });
  if (!branch) throw new UserAdminError("Branch tidak ditemukan", 400);
  return branch.id;
}

function authRoleFor(appRoleName: string) {
  return appRoleName.toLowerCase() === "admin" ? "admin" : "user";
}

export async function createTenantUser(
  clientId: string,
  headers: Headers,
  input: Record<string, unknown>,
) {
  const name = requiredText(input.name, "Nama", 120);
  const email = normalizeEmail(input.email);
  const password = normalizePassword(input.password);
  const role = await resolveRole(clientId, input.roleId);
  const branchId = await resolveBranch(clientId, input.branchId);

  const created = await auth.api.createUser({
    body: {
      name,
      email,
      password,
      role: authRoleFor(role.name),
    },
    headers,
  });

  try {
    return await prisma.$transaction(async (tx) => {
      const userData = await tx.userData.create({
        data: {
          ...(pickUserDataFields(input) as Prisma.UserDataUncheckedCreateInput),
          name,
          email,
          roleId: role.id,
          branchId,
          status: typeof input.status === "string" ? input.status : "active",
          isActive: input.isActive !== false,
          userId: created.user.id,
          clientId,
        },
        include: { role: true, branch: true },
      });

      await tx.user.update({
        where: { id: created.user.id },
        data: { clientId },
      });

      return userData;
    });
  } catch (error) {
    await prisma.user.delete({ where: { id: created.user.id } }).catch(() => {
      // Best effort: akun yatim lebih baik dihapus, tapi error asli tetap dilempar.
    });
    throw error;
  }
}

export async function updateTenantUser(
  clientId: string,
  headers: Headers,
  input: Record<string, unknown>,
) {
  const id = requiredText(input.id, "ID", 64);
  const existing = await prisma.userData.findFirst({
    where: { id, clientId },
    include: { user: { select: { id: true, email: true } } },
  });
  if (!existing) throw new UserAdminError("User tidak ditemukan", 404);

  const name = requiredText(input.name, "Nama", 120);
  const email = normalizeEmail(input.email);
  const role = await resolveRole(clientId, input.roleId);
  const branchId = await resolveBranch(clientId, input.branchId);
  const password = optionalPassword(input.password);

  if (password && !existing.userId) {
    throw new UserAdminError("Akun login user ini tidak terhubung", 409);
  }

  if (password && existing.userId) {
    await auth.api.setUserPassword({
      body: { userId: existing.userId, newPassword: password },
      headers,
    });
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.userData.update({
      where: { id },
      data: {
        ...(pickUserDataFields(input) as Prisma.UserDataUncheckedUpdateInput),
        name,
        email,
        roleId: role.id,
        branchId,
        status: typeof input.status === "string" ? input.status : existing.status,
        isActive:
          input.isActive === undefined
            ? existing.isActive
            : input.isActive === true,
      },
      include: { role: true, branch: true },
    });

    if (existing.userId) {
      await tx.user.update({
        where: { id: existing.userId },
        data: {
          name,
          email,
          role: authRoleFor(role.name),
          ...(email !== existing.user?.email.toLowerCase()
            ? { emailVerified: false }
            : {}),
        },
      });
    }

    return updated;
  });
}

export async function resetTenantUserPassword(
  clientId: string,
  headers: Headers,
  rawId: unknown,
) {
  const id = requiredText(rawId, "ID", 64);
  const userData = await prisma.userData.findFirst({
    where: { id, clientId },
    select: {
      userId: true,
      email: true,
      name: true,
      user: { select: { email: true } },
    },
  });
  if (!userData) throw new UserAdminError("User tidak ditemukan", 404);
  if (!userData.userId) {
    throw new UserAdminError("Akun login user ini tidak terhubung", 409);
  }

  const password = randomBytes(12).toString("base64url");
  await auth.api.setUserPassword({
    body: { userId: userData.userId, newPassword: password },
    headers,
  });

  return {
    name: userData.name,
    email: userData.email ?? userData.user?.email ?? "",
    password,
  };
}

export async function deleteTenantUser(
  clientId: string,
  actorUserId: string,
  rawId: unknown,
) {
  const id = requiredText(rawId, "ID", 64);
  const existing = await prisma.userData.findFirst({
    where: { id, clientId },
    select: { id: true, userId: true },
  });
  if (!existing) throw new UserAdminError("User tidak ditemukan", 404);

  if (existing.userId && existing.userId === actorUserId) {
    throw new UserAdminError("Tidak bisa menghapus akun sendiri", 400);
  }

  if (existing.userId) {
    await prisma.user.delete({ where: { id: existing.userId } });
  } else {
    await prisma.userData.delete({ where: { id } });
  }

  return { success: true };
}
