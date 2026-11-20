import { resolveClient } from "@/services/clients";
import {
  qrisErrorResponse,
  resendQrisWebhook,
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
    const delivery = await resendQrisWebhook(t.clientId, id);
    return NextResponse.json(delivery);
  } catch (error) {
    return qrisErrorResponse(error);
  }
}
