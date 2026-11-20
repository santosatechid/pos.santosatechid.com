import { resolveClient } from "@/services/clients";
import {
  confirmQrisTransaction,
  qrisErrorResponse,
} from "@/services/qris/qris";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const t = await resolveClient(request);
  if (!t.ok) return t.response;

  try {
    const { id } = await params;
    const result = await confirmQrisTransaction(t.clientId, id, t.userId);
    return NextResponse.json(result);
  } catch (error) {
    return qrisErrorResponse(error);
  }
}
