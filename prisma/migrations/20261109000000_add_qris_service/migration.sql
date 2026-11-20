-- CreateTable
CREATE TABLE "qris_accounts" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "staticPayload" TEXT NOT NULL,
    "merchantName" TEXT NOT NULL,
    "merchantCity" TEXT NOT NULL,
    "merchantNmid" TEXT,
    "webhookUrl" TEXT,
    "webhookSecret" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qris_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qris_transactions" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "dynamicPayload" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "confirmedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qris_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qris_webhook_deliveries" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "statusCode" INTEGER,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "ok" BOOLEAN NOT NULL DEFAULT false,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),

    CONSTRAINT "qris_webhook_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "qris_accounts_clientId_idx" ON "qris_accounts"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "qris_accounts_clientId_label_key" ON "qris_accounts"("clientId", "label");

-- CreateIndex
CREATE INDEX "qris_transactions_clientId_status_idx" ON "qris_transactions"("clientId", "status");

-- CreateIndex
CREATE INDEX "qris_transactions_accountId_idx" ON "qris_transactions"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "qris_transactions_clientId_orderId_key" ON "qris_transactions"("clientId", "orderId");

-- CreateIndex
CREATE INDEX "qris_webhook_deliveries_transactionId_idx" ON "qris_webhook_deliveries"("transactionId");

-- AddForeignKey
ALTER TABLE "qris_accounts" ADD CONSTRAINT "qris_accounts_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qris_transactions" ADD CONSTRAINT "qris_transactions_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qris_transactions" ADD CONSTRAINT "qris_transactions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "qris_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qris_webhook_deliveries" ADD CONSTRAINT "qris_webhook_deliveries_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "qris_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
