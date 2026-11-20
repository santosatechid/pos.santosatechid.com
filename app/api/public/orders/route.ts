import { createPublicOrder } from "@/services/qris/orders";
import { qrisErrorResponse } from "@/services/qris/qris";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const order = await createPublicOrder(body);
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    return qrisErrorResponse(error);
  }
}
