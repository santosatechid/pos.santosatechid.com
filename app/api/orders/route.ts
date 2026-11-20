import { resolveClient } from "@/services/clients";
import { listOrders } from "@/services/qris/orders";
import { qrisErrorResponse } from "@/services/qris/qris";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const t = await resolveClient(request);
  if (!t.ok) return t.response;

  try {
    const orders = await listOrders(
      t.clientId,
      request.nextUrl.searchParams.get("status"),
      request.nextUrl.searchParams.get("branchId"),
    );
    return NextResponse.json(orders);
  } catch (error) {
    return qrisErrorResponse(error);
  }
}
