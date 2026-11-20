-- DropUniqueConstraint
ALTER TABLE "branches" DROP CONSTRAINT IF EXISTS "branches_clientId_code_key";

-- AlterTable
ALTER TABLE "branches" DROP COLUMN IF EXISTS "code";
