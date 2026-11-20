import { getPublicOrder } from "@/services/qris/orders";
import { qrisErrorResponse } from "@/services/qris/qris";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = request.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Token meja wajib diisi" },
        { status: 400 },
      );
    }

    const { id } = await params;
    const order = await getPublicOrder(token, id);
    return NextResponse.json(order, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return qrisErrorResponse(error);
  }
}
