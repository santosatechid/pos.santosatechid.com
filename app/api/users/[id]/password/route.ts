import { resolveClient } from "@/services/clients";
import {
  requireAdmin,
  resetTenantUserPassword,
  userAdminErrorResponse,
} from "@/services/users";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const t = await resolveClient(request);
  if (!t.ok) return t.response;

  try {
    await requireAdmin(request.headers);
    const { id } = await params;
    const credentials = await resetTenantUserPassword(
      t.clientId,
      request.headers,
      id,
    );
    return NextResponse.json(credentials);
  } catch (error) {
    return userAdminErrorResponse(error);
  }
}
