import { resolveClient } from "@/services/clients";
import { createCounterOrder } from "@/services/qris/orders";
import { qrisErrorResponse } from "@/services/qris/qris";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const t = await resolveClient(request);
  if (!t.ok) return t.response;

  try {
    const body = await request.json();
    const order = await createCounterOrder(t.clientId, {
      ...body,
      branchId: t.branchId,
    });
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    return qrisErrorResponse(error);
  }
}
