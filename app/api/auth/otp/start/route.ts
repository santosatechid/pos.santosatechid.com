import { auth } from "@/services/auth/auth";
import { getOtpGate, maskEmail } from "@/services/auth/otp";
import { sendOtpEmail } from "@/services/email/resend";
import { prisma } from "@/services/prisma";
import { type NextRequest, NextResponse } from "next/server";

const RESEND_COOLDOWN_MS = 60_000;

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json(
      { success: false, message: "Sesi tidak ditemukan" },
      { status: 401 },
    );
  }

  try {
    const gate = await getOtpGate(session.user.id);
    if (!gate) {
      return NextResponse.json(
        { success: false, message: "User tidak ditemukan" },
        { status: 404 },
      );
    }

    if (!gate.requiresOtp) {
      return NextResponse.json({
        required: false,
        next: gate.next,
      });
    }

    if (
      gate.sentAt &&
      Date.now() - gate.sentAt.getTime() < RESEND_COOLDOWN_MS
    ) {
      return NextResponse.json({
        required: true,
        throttled: true,
        email: maskEmail(gate.email),
        next: gate.next,
      });
    }

    const otp = await auth.api.createVerificationOTP({
      body: { email: gate.email, type: "email-verification" },
    });

    await sendOtpEmail({ email: gate.email, otp });

    await prisma.user.update({
      where: { id: session.user.id },
      data: { otpSentAt: new Date() },
    });

    return NextResponse.json({
      required: true,
      throttled: false,
      email: maskEmail(gate.email),
      next: gate.next,
    });
  } catch (error) {
    console.error("OTP send failed:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Gagal mengirim kode verifikasi",
      },
      { status: 502 },
    );
  }
}
