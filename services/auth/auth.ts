import { PrismaClient } from "@/prisma/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin, emailOTP, openAPI } from "better-auth/plugins";

import { sendOtpEmail } from "@/services/email/resend";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  emailAndPassword: {
    enabled: true,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 30 * 60,
      strategy: "compact",
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  plugins: [
    openAPI(),
    emailOTP({
      otpLength: 6,
      expiresIn: 300,
      storeOTP: "hashed",
      allowedAttempts: 5,
      sendVerificationOTP: async ({ email, otp }) => {
        await sendOtpEmail({ email, otp });
      },
    }),
    admin({
      // Optional: configure admin settings
      defaultRole: "user",
      adminRole: "admin",
      teacherRole: "teacher",
      studentRole: "student",
      parentRole: "parent",
    }),
    nextCookies(), // ✅ MOVED: Cookie plugin MUST be last
  ],
});
