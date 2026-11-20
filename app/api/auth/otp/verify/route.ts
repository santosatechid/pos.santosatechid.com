import { auth } from "@/services/auth/auth";
import { getOtpGate } from "@/services/auth/otp";
import { prisma } from "@/services/prisma";
import { type NextRequest, NextResponse } from "next/server";

function errorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    if (
      "body" in error &&
      error.body &&
      typeof error.body === "object" &&
      "message" in error.body &&
      typeof error.body.message === "string"
    ) {
      return error.body.message;
    }
    if ("message" in error && typeof error.message === "string") {
      return error.message;
    }
  }
  return "Kode tidak valid";
}

function errorStatus(error: unknown): number {
  if (error && typeof error === "object" && "statusCode" in error) {
    const status = error.statusCode;
    if (typeof status === "number" && status >= 400 && status < 600) {
      return status;
    }
  }
  return 400;
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json(
      { success: false, message: "Sesi tidak ditemukan" },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    const otp = typeof body?.otp === "string" ? body.otp.trim() : "";

    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { success: false, message: "Kode harus 6 digit" },
        { status: 400 },
      );
    }

    const gate = await getOtpGate(session.user.id);
    if (!gate) {
      return NextResponse.json(
        { success: false, message: "User tidak ditemukan" },
        { status: 404 },
      );
    }

    if (!gate.requiresOtp) {
      return NextResponse.json({ success: true, next: gate.next });
    }

    await auth.api.verifyEmailOTP({
      body: { email: gate.email, otp },
      headers: request.headers,
    });

    await prisma.user.update({
      where: { id: session.user.id },
      data: { otpVerifiedAt: new Date(), otpSentAt: null },
    });

    return NextResponse.json({ success: true, next: gate.next });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: errorMessage(error) },
      { status: errorStatus(error) },
    );
  }
}
