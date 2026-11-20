import { handlePrismaError } from "@/services/errorHandler";
import { prisma } from "@/services/prisma";
import { resolveClient } from "@/services/clients";
import {
  createTenantUser,
  deleteTenantUser,
  requireAdmin,
  updateTenantUser,
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
    const users = await prisma.userData.findMany({
      where: {
        clientId: t.clientId,
      },
      include: {
        role: true,
        branch: true,
        user: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
    return NextResponse.json(users);
  } catch (error) {
    return handlePrismaError(error);
  }
}

export async function POST(request: NextRequest) {
  const t = await resolveClient(request);
  if (!t.ok) return t.response;

  try {
    await requireAdmin(request.headers);
    const body = await request.json();
    const user = await createTenantUser(t.clientId, request.headers, body);
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return userAdminErrorResponse(error);
  }
}

export async function PUT(request: NextRequest) {
  const t = await resolveClient(request);
  if (!t.ok) return t.response;

  try {
    await requireAdmin(request.headers);
    const body = await request.json();
    const user = await updateTenantUser(t.clientId, request.headers, body);
    return NextResponse.json(user);
  } catch (error) {
    return userAdminErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  const t = await resolveClient(request);
  if (!t.ok) return t.response;

  try {
    await requireAdmin(request.headers);
    const { id } = await request.json();
    await deleteTenantUser(t.clientId, t.userId, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return userAdminErrorResponse(error);
  }
}
