import { resolveClient } from "@/services/clients";
import {
  createTable,
  deleteTable,
  listTables,
  updateTable,
} from "@/services/qris/orders";
import { qrisErrorResponse } from "@/services/qris/qris";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const t = await resolveClient(request);
  if (!t.ok) return t.response;

  try {
    return NextResponse.json(await listTables(t.clientId));
  } catch (error) {
    return qrisErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  const t = await resolveClient(request);
  if (!t.ok) return t.response;

  try {
    const body = await request.json();
    return NextResponse.json(await createTable(t.clientId, body), {
      status: 201,
    });
  } catch (error) {
    return qrisErrorResponse(error);
  }
}

export async function PUT(request: NextRequest) {
  const t = await resolveClient(request);
  if (!t.ok) return t.response;

  try {
    const body = await request.json();
    return NextResponse.json(await updateTable(t.clientId, body));
  } catch (error) {
    return qrisErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  const t = await resolveClient(request);
  if (!t.ok) return t.response;

  try {
    const { id } = await request.json();
    await deleteTable(t.clientId, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return qrisErrorResponse(error);
  }
}
