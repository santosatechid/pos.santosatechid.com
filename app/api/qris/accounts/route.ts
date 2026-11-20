import { resolveClient } from "@/services/clients";
import {
  createQrisAccount,
  deleteQrisAccount,
  listQrisAccounts,
  qrisErrorResponse,
  toPublicAccount,
  updateQrisAccount,
} from "@/services/qris/qris";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const t = await resolveClient(request);
  if (!t.ok) return t.response;

  try {
    const accounts = await listQrisAccounts(t.clientId);
    return NextResponse.json(accounts.map(toPublicAccount));
  } catch (error) {
    return qrisErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  const t = await resolveClient(request);
  if (!t.ok) return t.response;

  try {
    const body = await request.json();
    const account = await createQrisAccount(t.clientId, body);
    return NextResponse.json(
      { ...toPublicAccount(account), webhookSecret: account.webhookSecret },
      { status: 201 },
    );
  } catch (error) {
    return qrisErrorResponse(error);
  }
}

export async function PUT(request: NextRequest) {
  const t = await resolveClient(request);
  if (!t.ok) return t.response;

  try {
    const body = await request.json();
    const account = await updateQrisAccount(t.clientId, body);
    const response = toPublicAccount(account);
    return NextResponse.json(
      body?.rotateSecret === true
        ? { ...response, webhookSecret: account.webhookSecret }
        : response,
    );
  } catch (error) {
    return qrisErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  const t = await resolveClient(request);
  if (!t.ok) return t.response;

  try {
    const { id } = await request.json();
    await deleteQrisAccount(t.clientId, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return qrisErrorResponse(error);
  }
}
