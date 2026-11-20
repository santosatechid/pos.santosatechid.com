import { resolveClient } from "@/services/clients";
import {
  createQrisTransaction,
  listQrisTransactions,
  qrisErrorResponse,
} from "@/services/qris/qris";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const t = await resolveClient(request);
  if (!t.ok) return t.response;

  try {
    const transactions = await listQrisTransactions(
      t.clientId,
      request.nextUrl.searchParams.get("status"),
    );
    return NextResponse.json(transactions);
  } catch (error) {
    return qrisErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  const t = await resolveClient(request);
  if (!t.ok) return t.response;

  try {
    const body = await request.json();
    const transaction = await createQrisTransaction(t.clientId, body);
    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    return qrisErrorResponse(error);
  }
}
