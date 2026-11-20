-- AlterTable
ALTER TABLE "user" ADD COLUMN "otpVerifiedAt" TIMESTAMP(3),
ADD COLUMN "otpSentAt" TIMESTAMP(3);
