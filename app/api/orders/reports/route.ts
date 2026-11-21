import { resolveClient } from "@/services/clients";
import { getSalesReport } from "@/services/qris/orders";
import { qrisErrorResponse } from "@/services/qris/qris";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const t = await resolveClient(request);
  if (!t.ok) return t.response;

  try {
    const params = request.nextUrl.searchParams;
    return NextResponse.json(
      await getSalesReport(t.clientId, {
        from: params.get("from"),
        to: params.get("to"),
        branchId: params.get("branchId"),
      }),
    );
  } catch (error) {
    return qrisErrorResponse(error);
  }
}
