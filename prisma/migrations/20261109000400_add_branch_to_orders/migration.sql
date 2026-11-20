-- AlterTable
ALTER TABLE "dining_tables" ADD COLUMN "branchId" TEXT;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN "branchId" TEXT;

-- CreateIndex
CREATE INDEX "dining_tables_branchId_idx" ON "dining_tables"("branchId");

-- CreateIndex
CREATE INDEX "orders_branchId_idx" ON "orders"("branchId");

-- AddForeignKey
ALTER TABLE "dining_tables" ADD CONSTRAINT "dining_tables_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
