import { createHmac, randomBytes, randomUUID } from "node:crypto";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

import { convertQRIS, parseQRIS, validateQRIS } from "@/lib/qris";
import { handlePrismaError } from "@/services/errorHandler";
import { prisma } from "@/services/prisma";
import { NextResponse } from "next/server";

const MAX_PAYLOAD_LENGTH = 4096;
const DEFAULT_EXPIRY_MINUTES = 15;
const MIN_EXPIRY_MINUTES = 5;
const MAX_EXPIRY_MINUTES = 60;
const MAX_AMOUNT = 1_000_000_000_000;
const WEBHOOK_TIMEOUT_MS = 5_000;
const WEBHOOK_RETRY_DELAYS_MS = [0, 1_000, 3_000];

export class QrisError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
    this.name = "QrisError";
  }
}

export function qrisErrorResponse(error: unknown) {
  if (error instanceof QrisError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: error.status },
    );
  }
  return handlePrismaError(error);
}

export function requiredText(value: unknown, label: string, max: number): string {
  if (typeof value !== "string") {
    throw new QrisError(`${label} wajib diisi`, 400);
  }
  const text = value.trim();
  if (!text) throw new QrisError(`${label} wajib diisi`, 400);
  if (text.length > max) {
    throw new QrisError(`${label} maksimal ${max} karakter`, 400);
  }
  return text;
}

export function optionalText(
  value: unknown,
  label: string,
  max: number,
): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") {
    throw new QrisError(`${label} tidak valid`, 400);
  }
  const text = value.trim();
  if (!text) return null;
  if (text.length > max) {
    throw new QrisError(`${label} maksimal ${max} karakter`, 400);
  }
  return text;
}

export function parseAmount(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value)) {
    throw new QrisError("Nominal harus bilangan bulat", 400);
  }
  if (value <= 0 || value > MAX_AMOUNT) {
    throw new QrisError("Nominal tidak valid", 400);
  }
  return value;
}

export function parseStaticPayload(raw: unknown) {
  const payload = requiredText(raw, "Payload QRIS", MAX_PAYLOAD_LENGTH);
  const validation = validateQRIS(payload);
  if (!validation.valid) {
    throw new QrisError(`QRIS tidak valid: ${validation.errors.join("; ")}`, 400);
  }

  const parsed = parseQRIS(payload);
  if (parsed.method !== "static") {
    throw new QrisError("QRIS harus bertipe statis", 400);
  }

  return {
    payload,
    merchantName: parsed.merchantName,
    merchantCity: parsed.merchantCity,
    merchantNmid:
      parsed.merchantAccountInfo[0]?.fields.find((field) => field.tag === "02")
        ?.value ?? parsed.merchantAccountInfo[0]?.merchantId ?? null,
  };
}

function isPrivateIp(address: string): boolean {
  const version = isIP(address);
  if (version === 4) {
    const [a, b] = address.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224
    );
  }

  if (version === 6) {
    const normalized = address.toLowerCase();
    return (
      normalized === "::" ||
      normalized === "::1" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      normalized.startsWith("fe80") ||
      normalized.startsWith("::ffff:127.") ||
      normalized.startsWith("::ffff:10.") ||
      normalized.startsWith("::ffff:192.168.")
    );
  }

  return true;
}

export async function assertSafeWebhookUrl(raw: unknown): Promise<string> {
  const value = requiredText(raw, "Webhook URL", 2048);

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new QrisError("Webhook URL tidak valid", 400);
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new QrisError("Webhook URL harus http atau https", 400);
  }
  if (url.username || url.password) {
    throw new QrisError("Webhook URL tidak boleh memuat kredensial", 400);
  }

  const host = url.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    throw new QrisError("Webhook URL tidak boleh mengarah ke jaringan lokal", 400);
  }

  const addresses = await lookup(host, { all: true });
  if (addresses.length === 0 || addresses.some((item) => isPrivateIp(item.address))) {
    throw new QrisError("Webhook URL tidak boleh mengarah ke jaringan lokal", 400);
  }

  return url.toString();
}

export function generateWebhookSecret(): string {
  return `whsec_${randomBytes(24).toString("base64url")}`;
}

export function signWebhook(
  secret: string,
  timestamp: string,
  rawBody: string,
): string {
  return `sha256=${createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex")}`;
}

export function toPublicAccount<T extends { webhookSecret: string }>(
  account: T,
) {
  const { webhookSecret, ...rest } = account;
  return { ...rest, webhookSecretTail: webhookSecret.slice(-4) };
}

export async function listQrisAccounts(clientId: string) {
  return prisma.qrisAccount.findMany({
    where: { clientId },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { transactions: true } } },
  });
}

export async function createQrisAccount(
  clientId: string,
  input: { label?: unknown; staticPayload?: unknown; webhookUrl?: unknown },
) {
  const label = requiredText(input.label, "Label", 64);
  const parsed = parseStaticPayload(input.staticPayload);
  const webhookUrl = input.webhookUrl
    ? await assertSafeWebhookUrl(input.webhookUrl)
    : null;

  return prisma.qrisAccount.create({
    data: {
      clientId,
      label,
      staticPayload: parsed.payload,
      merchantName: parsed.merchantName,
      merchantCity: parsed.merchantCity,
      merchantNmid: parsed.merchantNmid,
      webhookUrl,
      webhookSecret: generateWebhookSecret(),
    },
  });
}

export async function updateQrisAccount(
  clientId: string,
  input: {
    id?: unknown;
    label?: unknown;
    staticPayload?: unknown;
    webhookUrl?: unknown;
    isActive?: unknown;
    rotateSecret?: unknown;
  },
) {
  const id = requiredText(input.id, "ID", 64);

  const existing = await prisma.qrisAccount.findFirst({
    where: { id, clientId },
    select: { id: true },
  });
  if (!existing) throw new QrisError("Akun QRIS tidak ditemukan", 404);

  const data: {
    label?: string;
    staticPayload?: string;
    merchantName?: string;
    merchantCity?: string;
    merchantNmid?: string | null;
    webhookUrl?: string | null;
    webhookSecret?: string;
    isActive?: boolean;
  } = {};

  if (input.label !== undefined) {
    data.label = requiredText(input.label, "Label", 64);
  }
  if (input.staticPayload !== undefined) {
    const parsed = parseStaticPayload(input.staticPayload);
    data.staticPayload = parsed.payload;
    data.merchantName = parsed.merchantName;
    data.merchantCity = parsed.merchantCity;
    data.merchantNmid = parsed.merchantNmid;
  }
  if (input.webhookUrl !== undefined) {
    data.webhookUrl = input.webhookUrl
      ? await assertSafeWebhookUrl(input.webhookUrl)
      : null;
  }
  if (input.isActive !== undefined) {
    data.isActive = input.isActive === true;
  }
  if (input.rotateSecret === true) {
    data.webhookSecret = generateWebhookSecret();
  }

  return prisma.qrisAccount.update({ where: { id }, data });
}

export async function deleteQrisAccount(clientId: string, rawId: unknown) {
  const id = requiredText(rawId, "ID", 64);
  const owned = await prisma.qrisAccount.findFirst({
    where: { id, clientId },
    select: { id: true },
  });
  if (!owned) throw new QrisError("Akun QRIS tidak ditemukan", 404);

  return prisma.qrisAccount.delete({ where: { id } });
}

export async function expireQrisTransactions(clientId: string) {
  await prisma.qrisTransaction.updateMany({
    where: { clientId, status: "pending", expiresAt: { lt: new Date() } },
    data: { status: "expired" },
  });
}

export async function listQrisTransactions(
  clientId: string,
  status?: string | null,
) {
  await expireQrisTransactions(clientId);

  return prisma.qrisTransaction.findMany({
    where: {
      clientId,
      ...(status && status !== "all" ? { status } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      account: { select: { id: true, label: true, merchantName: true } },
      order: {
        select: {
          id: true,
          customerName: true,
          table: { select: { code: true, label: true } },
        },
      },
      deliveries: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
}

export async function getQrisTransaction(clientId: string, rawId: string) {
  const id = requiredText(rawId, "ID", 64);

  await prisma.qrisTransaction.updateMany({
    where: { id, clientId, status: "pending", expiresAt: { lt: new Date() } },
    data: { status: "expired" },
  });

  const transaction = await prisma.qrisTransaction.findFirst({
    where: { id, clientId },
    include: {
      account: { select: { id: true, label: true, merchantName: true } },
      order: {
        select: {
          id: true,
          customerName: true,
          table: { select: { code: true, label: true } },
        },
      },
      deliveries: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  if (!transaction) throw new QrisError("Transaksi tidak ditemukan", 404);

  return transaction;
}

export async function createQrisTransaction(
  clientId: string,
  input: {
    accountId?: unknown;
    amount?: unknown;
    orderId?: unknown;
    expiresInMinutes?: unknown;
  },
) {
  const accountId = requiredText(input.accountId, "Akun QRIS", 64);
  const amount = parseAmount(input.amount);

  const account = await prisma.qrisAccount.findFirst({
    where: { id: accountId, clientId, isActive: true },
    select: { id: true, staticPayload: true },
  });
  if (!account) throw new QrisError("Akun QRIS aktif tidak ditemukan", 404);

  const orderId =
    input.orderId === undefined || input.orderId === null || input.orderId === ""
      ? `QRIS-${Date.now().toString(36).toUpperCase()}-${randomBytes(3)
          .toString("hex")
          .toUpperCase()}`
      : requiredText(input.orderId, "Order ID", 64);

  let expiresInMinutes = DEFAULT_EXPIRY_MINUTES;
  if (input.expiresInMinutes !== undefined) {
    if (
      typeof input.expiresInMinutes !== "number" ||
      !Number.isInteger(input.expiresInMinutes)
    ) {
      throw new QrisError("Batas waktu tidak valid", 400);
    }
    expiresInMinutes = Math.min(
      MAX_EXPIRY_MINUTES,
      Math.max(MIN_EXPIRY_MINUTES, input.expiresInMinutes),
    );
  }

  const dynamicPayload = convertQRIS(account.staticPayload, { amount });
  const validation = validateQRIS(dynamicPayload);
  if (!validation.valid) {
    throw new QrisError(
      `Gagal membuat QRIS dinamis: ${validation.errors.join("; ")}`,
      500,
    );
  }

  return prisma.qrisTransaction.create({
    data: {
      clientId,
      accountId: account.id,
      orderId,
      amount,
      dynamicPayload,
      expiresAt: new Date(Date.now() + expiresInMinutes * 60_000),
    },
  });
}

type WebhookTransaction = {
  id: string;
  orderId: string;
  amount: number;
  status: string;
  paidAt: Date | null;
  dynamicPayload: string;
  account: { merchantName: string; merchantCity: string; webhookUrl: string | null; webhookSecret: string };
  order:
    | {
        id: string;
        status: string;
        total: number;
        customerName: string | null;
        note: string | null;
        table: { code: string; label: string | null } | null;
        items: {
          productName: string;
          unitPrice: number;
          qty: number;
          note: string | null;
        }[];
      }
    | null;
};

function buildWebhookPayload(
  deliveryId: string,
  event: string,
  transaction: WebhookTransaction,
) {
  return {
    id: deliveryId,
    event,
    createdAt: new Date().toISOString(),
    data: {
      transaction: {
        id: transaction.id,
        orderId: transaction.orderId,
        amount: transaction.amount,
        status: transaction.status,
        paidAt: transaction.paidAt?.toISOString() ?? null,
      },
      order: transaction.order
        ? {
            id: transaction.order.id,
            status: transaction.order.status,
            total: transaction.order.total,
            customerName: transaction.order.customerName,
            note: transaction.order.note,
            table: transaction.order.table,
            items: transaction.order.items,
          }
        : null,
      merchant: {
        name: transaction.account.merchantName,
        city: transaction.account.merchantCity,
      },
      qrisPayload: transaction.dynamicPayload,
    },
  };
}

export async function deliverWebhook(transactionId: string, event = "qris.paid") {
  const transaction = await prisma.qrisTransaction.findUnique({
    where: { id: transactionId },
    include: {
      account: {
        select: {
          merchantName: true,
          merchantCity: true,
          webhookUrl: true,
          webhookSecret: true,
        },
      },
      order: {
        select: {
          id: true,
          status: true,
          total: true,
          customerName: true,
          note: true,
          table: { select: { code: true, label: true } },
          items: {
            select: {
              productName: true,
              unitPrice: true,
              qty: true,
              note: true,
            },
          },
        },
      },
    },
  });

  if (!transaction) throw new QrisError("Transaksi tidak ditemukan", 404);
  if (transaction.status !== "paid") {
    throw new QrisError("Transaksi belum lunas", 409);
  }
  if (!transaction.account.webhookUrl) return null;

  const url = await assertSafeWebhookUrl(transaction.account.webhookUrl);
  const deliveryId = `whd_${randomUUID()}`;
  const payload = buildWebhookPayload(deliveryId, event, transaction);
  const rawBody = JSON.stringify(payload);

  await prisma.webhookDelivery.create({
    data: {
      id: deliveryId,
      transactionId,
      event,
      url,
      payload,
    },
  });

  let attempts = 0;
  let statusCode: number | null = null;
  let error: string | null = null;
  let ok = false;

  for (const delay of WEBHOOK_RETRY_DELAYS_MS) {
    if (delay > 0) {
      const { promise, resolve } = Promise.withResolvers<void>();
      setTimeout(resolve, delay);
      await promise;
    }
    attempts += 1;

    const timestamp = Math.floor(Date.now() / 1000).toString();
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "pos-qris-webhook/1.0",
          "X-Qris-Event": event,
          "X-Qris-Delivery": deliveryId,
          "X-Qris-Timestamp": timestamp,
          "X-Qris-Signature": signWebhook(
            transaction.account.webhookSecret,
            timestamp,
            rawBody,
          ),
        },
        body: rawBody,
        redirect: "manual",
        signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
      });

      statusCode = response.status;
      if (response.ok) {
        ok = true;
        error = null;
        break;
      }
      error = `HTTP ${response.status}`;
    } catch (caught) {
      error = caught instanceof Error ? caught.message : String(caught);
    }
  }

  return prisma.webhookDelivery.update({
    where: { id: deliveryId },
    data: {
      attempts,
      statusCode,
      error,
      ok,
      deliveredAt: ok ? new Date() : null,
    },
  });
}

export async function confirmQrisTransaction(
  clientId: string,
  rawId: string,
  userId: string,
) {
  const id = requiredText(rawId, "ID", 64);

  const transaction = await prisma.qrisTransaction.findFirst({
    where: { id, clientId },
    include: { account: { select: { webhookUrl: true } } },
  });
  if (!transaction) throw new QrisError("Transaksi tidak ditemukan", 404);

  if (transaction.status === "expired") {
    throw new QrisError("Transaksi sudah kedaluwarsa", 409);
  }
  if (transaction.status === "cancelled") {
    throw new QrisError("Transaksi sudah dibatalkan", 409);
  }

  if (transaction.status === "pending" && transaction.expiresAt < new Date()) {
    await prisma.qrisTransaction.updateMany({
      where: { id, clientId, status: "pending" },
      data: { status: "expired" },
    });
    throw new QrisError("Transaksi sudah kedaluwarsa", 409);
  }

  if (transaction.status !== "paid") {
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.qrisTransaction.updateMany({
        where: { id, clientId, status: "pending" },
        data: { status: "paid", paidAt: new Date(), confirmedBy: userId },
      });
      if (result.count === 0) return null;

      const fresh = await tx.qrisTransaction.findUnique({
        where: { id },
        include: { order: { select: { id: true } } },
      });
      if (fresh?.order) {
        await tx.order.update({
          where: { id: fresh.order.id },
          data: { status: "paid" },
        });
      }
      return fresh;
    });

    if (!updated) {
      throw new QrisError("Transaksi gagal dikonfirmasi", 409);
    }
  }

  const delivery = transaction.account.webhookUrl
    ? await deliverWebhook(id).catch((caught) => {
        console.error("QRIS webhook delivery failed:", caught);
        return null;
      })
    : null;

  const fresh = await prisma.qrisTransaction.findUnique({
    where: { id },
    include: { account: { select: { id: true, label: true } } },
  });

  return { transaction: fresh, delivery };
}

export async function resendQrisWebhook(
  clientId: string,
  rawId: string,
) {
  const id = requiredText(rawId, "ID", 64);
  const transaction = await prisma.qrisTransaction.findFirst({
    where: { id, clientId },
    select: { id: true, status: true },
  });
  if (!transaction) throw new QrisError("Transaksi tidak ditemukan", 404);
  if (transaction.status !== "paid") {
    throw new QrisError("Transaksi belum lunas", 409);
  }

  return deliverWebhook(id);
}
