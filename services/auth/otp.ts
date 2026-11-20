import { prisma } from "@/services/prisma";

export type OtpGate = {
  email: string;
  requiresOtp: boolean;
  next: string;
  sentAt: Date | null;
};

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}${"•".repeat(Math.max(2, local.length - 2))}@${domain}`;
}

export async function getOtpGate(userId: string): Promise<OtpGate | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      clientId: true,
      otpVerifiedAt: true,
      otpSentAt: true,
      userData: { select: { clientId: true } },
      accounts: {
        where: { providerId: "google" },
        select: { id: true },
      },
    },
  });

  if (!user) return null;

  return {
    email: user.email,
    requiresOtp: user.accounts.length > 0 && !user.otpVerifiedAt,
    next:
      user.clientId || user.userData?.clientId ? "/dashboard" : "/onboarding",
    sentAt: user.otpSentAt,
  };
}
