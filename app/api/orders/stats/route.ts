import { resolveClient } from "@/services/clients";
import { getOrderStats } from "@/services/qris/orders";
import { qrisErrorResponse } from "@/services/qris/qris";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const t = await resolveClient(request);
  if (!t.ok) return t.response;

  try {
    return NextResponse.json(
      await getOrderStats(
        t.clientId,
        request.nextUrl.searchParams.get("branchId"),
      ),
    );
  } catch (error) {
    return qrisErrorResponse(error);
  }
}
