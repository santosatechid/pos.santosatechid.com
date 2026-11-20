import { resolveClient } from "@/services/clients";
import {
  getQrisTransaction,
  qrisErrorResponse,
} from "@/services/qris/qris";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const t = await resolveClient(request);
  if (!t.ok) return t.response;

  try {
    const { id } = await params;
    const transaction = await getQrisTransaction(t.clientId, id);
    return NextResponse.json(transaction, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return qrisErrorResponse(error);
  }
}
