import { createHash } from "node:crypto";

import { convertQRIS, validateQRIS } from "@/lib/qris";
import { prisma } from "@/services/prisma";

import {
  QrisError,
  expireQrisTransactions,
  optionalText,
  requiredText,
} from "./qris";

const MAX_PRICE = 1_000_000_000;
const MAX_TOTAL = 1_000_000_000_000;
const DEFAULT_EXPIRY_MINUTES = 15;
const MAX_ORDER_ITEMS = 50;
const MAX_QTY = 99;
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

function jakartaDayRange(reference: Date) {
  const local = new Date(reference.getTime() + WIB_OFFSET_MS);
  const start =
    Date.UTC(
      local.getUTCFullYear(),
      local.getUTCMonth(),
      local.getUTCDate(),
    ) - WIB_OFFSET_MS;
  return { start: new Date(start), end: new Date(start + 86_400_000) };
}

function jakartaDayKey(reference: Date) {
  const local = new Date(reference.getTime() + WIB_OFFSET_MS);
  const month = String(local.getUTCMonth() + 1).padStart(2, "0");
  const day = String(local.getUTCDate()).padStart(2, "0");
  return `${local.getUTCFullYear()}${month}${day}`;
}

// ponytail: hitungan harian pakai count, bukan sequence DB. Aman untuk satu
// kasir; dua transaksi persis bersamaan bisa dapat nomor sama.
function receiptIdentity(reference: Date, sequence: number) {
  const receiptCode = createHash("sha256")
    .update(`${jakartaDayKey(reference)}-${sequence}`)
    .digest("hex")
    .slice(0, 6)
    .toUpperCase();
  return { receiptNumber: sequence, receiptCode };
}

function parsePrice(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value)) {
    throw new QrisError("Harga harus bilangan bulat", 400);
  }
  if (value < 0 || value > MAX_PRICE) {
    throw new QrisError("Harga tidak valid", 400);
  }
  return value;
}

export async function listProducts(clientId: string) {
  return prisma.product.findMany({
    where: { clientId },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
}

export async function createProduct(
  clientId: string,
  input: {
    name?: unknown;
    description?: unknown;
    category?: unknown;
    price?: unknown;
    imageUrl?: unknown;
    isActive?: unknown;
  },
) {
  return prisma.product.create({
    data: {
      clientId,
      name: requiredText(input.name, "Nama produk", 100),
      description: optionalText(input.description, "Deskripsi", 500),
      category: optionalText(input.category, "Kategori", 60),
      price: parsePrice(input.price),
      imageUrl: optionalText(input.imageUrl, "URL gambar", 1000),
      isActive: input.isActive !== false,
    },
  });
}

export async function updateProduct(
  clientId: string,
  input: {
    id?: unknown;
    name?: unknown;
    description?: unknown;
    category?: unknown;
    price?: unknown;
    imageUrl?: unknown;
    isActive?: unknown;
  },
) {
  const id = requiredText(input.id, "ID", 64);
  const owned = await prisma.product.findFirst({
    where: { id, clientId },
    select: { id: true },
  });
  if (!owned) throw new QrisError("Produk tidak ditemukan", 404);

  return prisma.product.update({
    where: { id },
    data: {
      ...(input.name !== undefined
        ? { name: requiredText(input.name, "Nama produk", 100) }
        : {}),
      ...(input.description !== undefined
        ? { description: optionalText(input.description, "Deskripsi", 500) }
        : {}),
      ...(input.category !== undefined
        ? { category: optionalText(input.category, "Kategori", 60) }
        : {}),
      ...(input.price !== undefined ? { price: parsePrice(input.price) } : {}),
      ...(input.imageUrl !== undefined
        ? { imageUrl: optionalText(input.imageUrl, "URL gambar", 1000) }
        : {}),
      ...(input.isActive !== undefined
        ? { isActive: input.isActive === true }
        : {}),
    },
  });
}

export async function deleteProduct(clientId: string, rawId: unknown) {
  const id = requiredText(rawId, "ID", 64);
  const owned = await prisma.product.findFirst({
    where: { id, clientId },
    select: { id: true },
  });
  if (!owned) throw new QrisError("Produk tidak ditemukan", 404);

  return prisma.product.delete({ where: { id } });
}

export async function listTables(clientId: string) {
  return prisma.diningTable.findMany({
    where: { clientId },
    orderBy: { code: "asc" },
    include: {
      qrisAccount: { select: { id: true, label: true, merchantName: true } },
      branch: { select: { id: true, name: true } },
      _count: { select: { orders: true } },
    },
  });
}

async function ownedAccountId(
  clientId: string,
  rawAccountId: unknown,
): Promise<string | null> {
  const accountId = optionalText(rawAccountId, "Akun QRIS", 64);
  if (!accountId) return null;

  const account = await prisma.qrisAccount.findFirst({
    where: { id: accountId, clientId },
    select: { id: true },
  });
  if (!account) throw new QrisError("Akun QRIS tidak ditemukan", 404);
  return account.id;
}

async function ownedBranchId(
  clientId: string,
  rawBranchId: unknown,
): Promise<string | null> {
  const branchId = optionalText(rawBranchId, "Cabang", 64);
  if (!branchId) return null;

  const branch = await prisma.branch.findFirst({
    where: { id: branchId, clientId },
    select: { id: true },
  });
  if (!branch) throw new QrisError("Cabang tidak ditemukan", 404);
  return branch.id;
}

export async function createTable(
  clientId: string,
  input: {
    code?: unknown;
    label?: unknown;
    qrisAccountId?: unknown;
    branchId?: unknown;
    isActive?: unknown;
  },
) {
  return prisma.diningTable.create({
    data: {
      clientId,
      code: requiredText(input.code, "Kode meja", 20),
      label: optionalText(input.label, "Label meja", 60),
      qrisAccountId: await ownedAccountId(clientId, input.qrisAccountId),
      branchId: await ownedBranchId(clientId, input.branchId),
      isActive: input.isActive !== false,
    },
  });
}

export async function updateTable(
  clientId: string,
  input: {
    id?: unknown;
    code?: unknown;
    label?: unknown;
    qrisAccountId?: unknown;
    branchId?: unknown;
    isActive?: unknown;
  },
) {
  const id = requiredText(input.id, "ID", 64);
  const owned = await prisma.diningTable.findFirst({
    where: { id, clientId },
    select: { id: true },
  });
  if (!owned) throw new QrisError("Meja tidak ditemukan", 404);

  return prisma.diningTable.update({
    where: { id },
    data: {
      ...(input.code !== undefined
        ? { code: requiredText(input.code, "Kode meja", 20) }
        : {}),
      ...(input.label !== undefined
        ? { label: optionalText(input.label, "Label meja", 60) }
        : {}),
      ...(input.qrisAccountId !== undefined
        ? {
            qrisAccountId: await ownedAccountId(
              clientId,
              input.qrisAccountId,
            ),
          }
        : {}),
      ...(input.branchId !== undefined
        ? { branchId: await ownedBranchId(clientId, input.branchId) }
        : {}),
      ...(input.isActive !== undefined
        ? { isActive: input.isActive === true }
        : {}),
    },
  });
}

export async function deleteTable(clientId: string, rawId: unknown) {
  const id = requiredText(rawId, "ID", 64);
  const owned = await prisma.diningTable.findFirst({
    where: { id, clientId },
    select: { id: true },
  });
  if (!owned) throw new QrisError("Meja tidak ditemukan", 404);

  return prisma.diningTable.delete({ where: { id } });
}

export type OrderStatsPoint = {
  key: string;
  label: string;
  orders: number;
  revenue: number;
};

export type OrderStats = {
  daily: OrderStatsPoint[];
  monthly: OrderStatsPoint[];
  byType: { key: string; label: string; orders: number }[];
  balances: { cash: number; transfer: number; qris: number };
  qrisByAccount: { id: string; label: string; amount: number }[];
};

const pad = (value: number) => value.toString().padStart(2, "0");
const dayKey = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const monthKey = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
const dayLabel = (date: Date) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
  }).format(date);
const monthLabel = (date: Date) =>
  new Intl.DateTimeFormat("id-ID", {
    month: "short",
    year: "2-digit",
  }).format(date);

export async function getOrderStats(
  clientId: string,
  branchId?: string | null,
): Promise<OrderStats> {
  const now = new Date();
  const currentDay = new Date(now);
  currentDay.setHours(0, 0, 0, 0);

  const firstDay = new Date(currentDay);
  firstDay.setDate(firstDay.getDate() - 13);

  const firstMonth = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const orders = await prisma.order.findMany({
    where: {
      clientId,
      createdAt: { gte: firstMonth },
      ...(branchId ? { branchId } : {}),
    },
    select: {
      createdAt: true,
      total: true,
      status: true,
      orderType: true,
    },
  });

  const dailyMap = new Map<string, OrderStatsPoint>();
  const monthlyMap = new Map<string, OrderStatsPoint>();
  const typeCount = new Map<string, number>();

  for (const order of orders) {
    const orderDay = dayKey(order.createdAt);
    const orderMonth = monthKey(order.createdAt);
    const revenue = order.status === "paid" ? order.total : 0;

    const daily = dailyMap.get(orderDay) ?? {
      key: orderDay,
      label: dayLabel(order.createdAt),
      orders: 0,
      revenue: 0,
    };
    daily.orders += 1;
    daily.revenue += revenue;
    dailyMap.set(orderDay, daily);

    const monthly = monthlyMap.get(orderMonth) ?? {
      key: orderMonth,
      label: monthLabel(order.createdAt),
      orders: 0,
      revenue: 0,
    };
    monthly.orders += 1;
    monthly.revenue += revenue;
    monthlyMap.set(orderMonth, monthly);

    typeCount.set(order.orderType, (typeCount.get(order.orderType) ?? 0) + 1);
  }

  const daily = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(currentDay);
    date.setDate(date.getDate() - (13 - index));
    const key = dayKey(date);
    return (
      dailyMap.get(key) ?? {
        key,
        label: dayLabel(date),
        orders: 0,
        revenue: 0,
      }
    );
  });

  const monthly = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
    const key = monthKey(date);
    return (
      monthlyMap.get(key) ?? {
        key,
        label: monthLabel(date),
        orders: 0,
        revenue: 0,
      }
    );
  });

  const typeLabels: Record<string, string> = {
    "dine-in": "Dine-in",
    takeaway: "Bawa pulang",
    delivery: "Diantar",
  };

  const balanceRows = await prisma.order.groupBy({
    by: ["paymentMethod"],
    where: {
      clientId,
      status: "paid",
      ...(branchId ? { branchId } : {}),
    },
    _sum: { total: true },
  });

  const balances = balanceRows.reduce(
    (result, row) => {
      if (row.paymentMethod === "cash") {
        result.cash = row._sum.total ?? 0;
      } else if (row.paymentMethod === "transfer") {
        result.transfer = row._sum.total ?? 0;
      } else {
        result.qris += row._sum.total ?? 0;
      }
      return result;
    },
    { cash: 0, transfer: 0, qris: 0 },
  );

  const qrisRows = await prisma.qrisTransaction.groupBy({
    by: ["accountId"],
    where: {
      clientId,
      status: "paid",
      ...(branchId ? { order: { is: { branchId } } } : {}),
    },
    _sum: { amount: true },
  });

  const qrisAccounts = await prisma.qrisAccount.findMany({
    where: { clientId, id: { in: qrisRows.map((row) => row.accountId) } },
    select: { id: true, label: true },
  });
  const accountLabels = new Map(
    qrisAccounts.map((account) => [account.id, account.label]),
  );

  const qrisByAccount = qrisRows
    .map((row) => ({
      id: row.accountId,
      label: accountLabels.get(row.accountId) ?? "QRIS",
      amount: row._sum.amount ?? 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  return {
    daily,
    monthly,
    byType: Array.from(typeCount.entries()).map(([key, count]) => ({
      key,
      label: typeLabels[key] ?? key,
      orders: count,
    })),
    balances,
    qrisByAccount,
  };
}

export type SalesReportPoint = OrderStatsPoint;

export type SalesReport = {
  from: string;
  to: string;
  totals: {
    revenue: number;
    orders: number;
    items: number;
    average: number;
  };
  daily: SalesReportPoint[];
  topProducts: { name: string; qty: number; revenue: number }[];
  payments: { method: string; label: string; amount: number; orders: number }[];
  recent: {
    id: string;
    createdAt: string;
    tableCode: string | null;
    orderType: string;
    paymentMethod: string;
    total: number;
    items: number;
  }[];
};

const MAX_REPORT_DAYS = 92;

function parseReportDay(value: string | null | undefined): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new QrisError("Tanggal laporan tidak valid", 400);
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );
  if (Number.isNaN(date.getTime()) || dayKey(date) !== value) {
    throw new QrisError("Tanggal laporan tidak valid", 400);
  }
  return date;
}

export async function getSalesReport(
  clientId: string,
  options: {
    from?: string | null;
    to?: string | null;
    branchId?: string | null;
  },
): Promise<SalesReport> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const from = parseReportDay(options.from) ?? today;
  const to = parseReportDay(options.to) ?? from;

  if (to.getTime() < from.getTime()) {
    throw new QrisError("Tanggal akhir harus setelah tanggal mulai", 400);
  }

  const days = Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1;
  if (days > MAX_REPORT_DAYS) {
    throw new QrisError(
      `Rentang laporan maksimal ${MAX_REPORT_DAYS} hari`,
      400,
    );
  }

  const end = new Date(to);
  end.setDate(end.getDate() + 1);

  const orders = await prisma.order.findMany({
    where: {
      clientId,
      status: "paid",
      createdAt: { gte: from, lt: end },
      ...(options.branchId ? { branchId: options.branchId } : {}),
    },
    select: {
      id: true,
      createdAt: true,
      total: true,
      orderType: true,
      paymentMethod: true,
      table: { select: { code: true } },
      items: { select: { productName: true, unitPrice: true, qty: true } },
    },
  });

  const dailyMap = new Map<string, SalesReportPoint>();
  const productMap = new Map<string, { qty: number; revenue: number }>();
  const payments = new Map<string, { amount: number; orders: number }>();
  let revenue = 0;
  let items = 0;

  for (const order of orders) {
    revenue += order.total;

    const key = dayKey(order.createdAt);
    const daily = dailyMap.get(key) ?? {
      key,
      label: dayLabel(order.createdAt),
      orders: 0,
      revenue: 0,
    };
    daily.orders += 1;
    daily.revenue += order.total;
    dailyMap.set(key, daily);

    const payment = payments.get(order.paymentMethod) ?? {
      amount: 0,
      orders: 0,
    };
    payment.amount += order.total;
    payment.orders += 1;
    payments.set(order.paymentMethod, payment);

    for (const item of order.items) {
      items += item.qty;
      const product = productMap.get(item.productName) ?? {
        qty: 0,
        revenue: 0,
      };
      product.qty += item.qty;
      product.revenue += item.unitPrice * item.qty;
      productMap.set(item.productName, product);
    }
  }

  const daily: SalesReportPoint[] = [];
  for (let index = 0; index < days; index += 1) {
    const date = new Date(from);
    date.setDate(date.getDate() + index);
    const key = dayKey(date);
    daily.push(
      dailyMap.get(key) ?? {
        key,
        label: dayLabel(date),
        orders: 0,
        revenue: 0,
      },
    );
  }

  const paymentLabels: Record<string, string> = {
    cash: "Cash",
    transfer: "Transfer",
    qris: "QRIS",
  };

  return {
    from: dayKey(from),
    to: dayKey(to),
    totals: {
      revenue,
      orders: orders.length,
      items,
      average: orders.length > 0 ? Math.round(revenue / orders.length) : 0,
    },
    daily,
    topProducts: Array.from(productMap.entries())
      .map(([name, value]) => ({ name, ...value }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 8),
    payments: Array.from(payments.entries())
      .map(([method, value]) => ({
        method,
        label: paymentLabels[method] ?? method,
        ...value,
      }))
      .sort((a, b) => b.amount - a.amount),
    recent: orders
      .slice()
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10)
      .map((order) => ({
        id: order.id,
        createdAt: order.createdAt.toISOString(),
        tableCode: order.table?.code ?? null,
        orderType: order.orderType,
        paymentMethod: order.paymentMethod,
        total: order.total,
        items: order.items.reduce((sum, item) => sum + item.qty, 0),
      })),
  };
}

export async function listOrders(
  clientId: string,
  status?: string | null,
  branchId?: string | null,
) {
  await expireQrisTransactions(clientId);

  const expired = await prisma.order.findMany({
    where: {
      clientId,
      status: "pending",
      qrisTransaction: { is: { status: "expired" } },
    },
    select: { id: true },
  });
  if (expired.length > 0) {
    await prisma.order.updateMany({
      where: { id: { in: expired.map((item) => item.id) } },
      data: { status: "expired" },
    });
  }

  return prisma.order.findMany({
    where: {
      clientId,
      ...(status && status !== "all" ? { status } : {}),
      ...(branchId ? { branchId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      table: { select: { code: true, label: true } },
      branch: { select: { id: true, name: true } },
      items: true,
      qrisTransaction: {
        select: {
          id: true,
          status: true,
          amount: true,
          dynamicPayload: true,
          expiresAt: true,
          paidAt: true,
          deliveries: {
            orderBy: { createdAt: "desc" },
            take: 5,
            select: {
              id: true,
              ok: true,
              attempts: true,
              statusCode: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });
}

export async function getPublicTable(token: string) {
  const table = await prisma.diningTable.findUnique({
    where: { token },
    include: {
      client: { select: { name: true } },
      qrisAccount: { select: { id: true, label: true, isActive: true } },
    },
  });

  if (!table || !table.isActive) return null;

  const fallbackAccount = table.qrisAccount?.isActive
    ? table.qrisAccount
    : await prisma.qrisAccount.findFirst({
        where: { clientId: table.clientId, isActive: true },
        select: { id: true, label: true },
      });

  const products = await prisma.product.findMany({
    where: { clientId: table.clientId, isActive: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      price: true,
      imageUrl: true,
    },
  });

  return {
    table: { code: table.code, label: table.label },
    clientName: table.client.name,
    qrisReady: Boolean(fallbackAccount),
    products,
  };
}

type PublicOrderItemInput = {
  productId: string;
  qty: number;
  note: string | null;
};

function parseOrderItems(raw: unknown): PublicOrderItemInput[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new QrisError("Pesanan minimal berisi satu item", 400);
  }
  if (raw.length > MAX_ORDER_ITEMS) {
    throw new QrisError(`Maksimal ${MAX_ORDER_ITEMS} item per pesanan`, 400);
  }

  return raw.map((item) => {
    if (!item || typeof item !== "object") {
      throw new QrisError("Item pesanan tidak valid", 400);
    }
    const record = item as Record<string, unknown>;
    const qty = record.qty;
    if (
      typeof qty !== "number" ||
      !Number.isInteger(qty) ||
      qty < 1 ||
      qty > MAX_QTY
    ) {
      throw new QrisError(`Jumlah item harus 1-${MAX_QTY}`, 400);
    }

    return {
      productId: requiredText(record.productId, "Produk", 64),
      qty,
      note: optionalText(record.note, "Catatan item", 200),
    };
  });
}

export type PosOrderType = "dine-in" | "takeaway" | "delivery";
export type PaymentMethod = "qris" | "cash" | "transfer";

const ORDER_TYPES: PosOrderType[] = ["dine-in", "takeaway", "delivery"];
const PAYMENT_METHODS: PaymentMethod[] = ["qris", "cash", "transfer"];

function parsePaymentMethod(value: unknown): PaymentMethod {
  if (value === undefined || value === null || value === "") return "qris";
  if (
    typeof value === "string" &&
    PAYMENT_METHODS.includes(value as PaymentMethod)
  ) {
    return value as PaymentMethod;
  }
  throw new QrisError("Metode pembayaran tidak valid", 400);
}

function parseOrderType(value: unknown): PosOrderType {
  if (typeof value === "string" && ORDER_TYPES.includes(value as PosOrderType)) {
    return value as PosOrderType;
  }
  throw new QrisError("Tipe pesanan tidak valid", 400);
}

async function resolveOrderLines(clientId: string, rawItems: unknown) {
  const requestedItems = parseOrderItems(rawItems);
  const products = await prisma.product.findMany({
    where: {
      clientId,
      isActive: true,
      id: { in: requestedItems.map((item) => item.productId) },
    },
    select: { id: true, name: true, price: true },
  });
  const productById = new Map(products.map((product) => [product.id, product]));

  const items = requestedItems.map((item) => {
    const product = productById.get(item.productId);
    if (!product) {
      throw new QrisError("Produk tidak tersedia atau sudah nonaktif", 400);
    }
    return {
      productId: product.id,
      productName: product.name,
      unitPrice: product.price,
      qty: item.qty,
      note: item.note,
    };
  });

  const total = items.reduce(
    (sum, item) => sum + item.unitPrice * item.qty,
    0,
  );
  if (!Number.isSafeInteger(total) || total <= 0 || total > MAX_TOTAL) {
    throw new QrisError("Total pesanan tidak valid", 400);
  }

  return { items, total };
}

async function resolveActiveAccount(clientId: string, preferredId?: string | null) {
  if (preferredId) {
    const preferred = await prisma.qrisAccount.findFirst({
      where: { id: preferredId, clientId, isActive: true },
      select: { id: true, staticPayload: true },
    });
    if (preferred) return preferred;
  }

  const account = await prisma.qrisAccount.findFirst({
    where: { clientId, isActive: true },
    select: { id: true, staticPayload: true },
  });
  if (!account) {
    throw new QrisError("Merchant belum menyiapkan QRIS aktif", 409);
  }
  return account;
}

async function persistPaidOrder(params: {
  clientId: string;
  tableId: string | null;
  branchId: string | null;
  orderType: PosOrderType;
  paymentMethod: "cash" | "transfer";
  customerName: string | null;
  note: string | null;
  items: { productId: string; productName: string; unitPrice: number; qty: number; note: string | null }[];
  total: number;
}) {
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const { start, end } = jakartaDayRange(now);
    const dailyCount = await tx.order.count({
      where: {
        clientId: params.clientId,
        ...(params.branchId ? { branchId: params.branchId } : {}),
        createdAt: { gte: start, lt: end },
      },
    });
    const identity = receiptIdentity(now, dailyCount + 1);

    const order = await tx.order.create({
      data: {
        clientId: params.clientId,
        tableId: params.tableId,
        branchId: params.branchId,
        orderType: params.orderType,
        paymentMethod: params.paymentMethod,
        status: "paid",
        customerName: params.customerName,
        note: params.note,
        total: params.total,
        items: { create: params.items },
      },
    });

    return {
      orderId: order.id,
      total: params.total,
      paymentMethod: params.paymentMethod,
      ...identity,
    };
  });
}

async function persistOrderWithPayment(params: {
  clientId: string;
  tableId: string | null;
  branchId: string | null;
  orderType: PosOrderType;
  customerName: string | null;
  note: string | null;
  items: { productId: string; productName: string; unitPrice: number; qty: number; note: string | null }[];
  total: number;
  account: { id: string; staticPayload: string };
}) {
  const dynamicPayload = convertQRIS(params.account.staticPayload, {
    amount: params.total,
  });
  const validation = validateQRIS(dynamicPayload);
  if (!validation.valid) {
    throw new QrisError(
      `Gagal membuat QRIS dinamis: ${validation.errors.join("; ")}`,
      500,
    );
  }

  const expiresAt = new Date(Date.now() + DEFAULT_EXPIRY_MINUTES * 60_000);
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const { start, end } = jakartaDayRange(now);
    const dailyCount = await tx.order.count({
      where: {
        clientId: params.clientId,
        ...(params.branchId ? { branchId: params.branchId } : {}),
        createdAt: { gte: start, lt: end },
      },
    });
    const identity = receiptIdentity(now, dailyCount + 1);

    const order = await tx.order.create({
      data: {
        clientId: params.clientId,
        tableId: params.tableId,
        branchId: params.branchId,
        orderType: params.orderType,
        paymentMethod: "qris",
        customerName: params.customerName,
        note: params.note,
        total: params.total,
        items: { create: params.items },
      },
    });

    const qrisTransaction = await tx.qrisTransaction.create({
      data: {
        clientId: params.clientId,
        accountId: params.account.id,
        orderId: order.id,
        amount: params.total,
        dynamicPayload,
        expiresAt,
      },
    });

    await tx.order.update({
      where: { id: order.id },
      data: { qrisTransactionId: qrisTransaction.id },
    });

    return {
      orderId: order.id,
      total: params.total,
      paymentMethod: "qris" as const,
      expiresAt,
      qrisPayload: dynamicPayload,
      qrisTransactionId: qrisTransaction.id,
      ...identity,
    };
  });
}

export async function createPublicOrder(input: {
  token?: unknown;
  customerName?: unknown;
  note?: unknown;
  items?: unknown;
}) {
  const token = requiredText(input.token, "Token meja", 64);
  const table = await prisma.diningTable.findUnique({
    where: { token },
    select: {
      id: true,
      clientId: true,
      code: true,
      label: true,
      isActive: true,
      qrisAccountId: true,
      branchId: true,
    },
  });
  if (!table || !table.isActive) {
    throw new QrisError("Meja tidak ditemukan atau tidak aktif", 404);
  }

  const resolved = await resolveOrderLines(table.clientId, input.items);
  const account = await resolveActiveAccount(
    table.clientId,
    table.qrisAccountId,
  );
  const created = await persistOrderWithPayment({
    clientId: table.clientId,
    tableId: table.id,
    branchId: table.branchId,
    orderType: "dine-in",
    customerName: optionalText(input.customerName, "Nama", 80),
    note: optionalText(input.note, "Catatan", 500),
    items: resolved.items,
    total: resolved.total,
    account,
  });

  return {
    ...created,
    table: { code: table.code, label: table.label },
  };
}

export async function createCounterOrder(
  clientId: string,
  input: {
    orderType?: unknown;
    paymentMethod?: unknown;
    tableId?: unknown;
    branchId?: unknown;
    accountId?: unknown;
    customerName?: unknown;
    note?: unknown;
    items?: unknown;
  },
) {
  const orderType = parseOrderType(input.orderType ?? "dine-in");
  const paymentMethod = parsePaymentMethod(input.paymentMethod);
  let branchId = await ownedBranchId(clientId, input.branchId);

  let tableId: string | null = null;
  let preferredAccountId: string | null = await ownedAccountId(
    clientId,
    input.accountId,
  );
  if (input.tableId !== undefined && input.tableId !== null && input.tableId !== "") {
    const tableIdValue = requiredText(input.tableId, "Meja", 64);
    const table = await prisma.diningTable.findFirst({
      where: { id: tableIdValue, clientId, isActive: true },
      select: { id: true, qrisAccountId: true, branchId: true },
    });
    if (!table) throw new QrisError("Meja tidak ditemukan", 404);
    tableId = table.id;
    preferredAccountId = table.qrisAccountId;
    branchId = table.branchId ?? branchId;
  }

  const resolved = await resolveOrderLines(clientId, input.items);
  const customerName = optionalText(input.customerName, "Nama", 80);
  const note = optionalText(input.note, "Catatan", 500);

  if (paymentMethod === "cash" || paymentMethod === "transfer") {
    return persistPaidOrder({
      clientId,
      tableId,
      branchId,
      orderType,
      paymentMethod,
      customerName,
      note,
      items: resolved.items,
      total: resolved.total,
    });
  }

  const account = await resolveActiveAccount(clientId, preferredAccountId);

  return persistOrderWithPayment({
    clientId,
    tableId,
    branchId,
    orderType,
    customerName,
    note,
    items: resolved.items,
    total: resolved.total,
    account,
  });
}

export async function getPublicOrder(token: string, rawOrderId: string) {
  const orderId = requiredText(rawOrderId, "Order ID", 64);

  await prisma.qrisTransaction.updateMany({
    where: {
      status: "pending",
      expiresAt: { lt: new Date() },
      order: { is: { table: { is: { token } } } },
    },
    data: { status: "expired" },
  });

  const order = await prisma.order.findFirst({
    where: { id: orderId, table: { is: { token } } },
    include: {
      table: { select: { code: true, label: true } },
      items: {
        select: {
          productName: true,
          unitPrice: true,
          qty: true,
          note: true,
        },
      },
      qrisTransaction: {
        select: {
          status: true,
          amount: true,
          dynamicPayload: true,
          expiresAt: true,
          paidAt: true,
        },
      },
    },
  });

  if (!order) throw new QrisError("Pesanan tidak ditemukan", 404);

  if (
    order.status === "pending" &&
    order.qrisTransaction?.status === "expired"
  ) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "expired" },
    });
    order.status = "expired";
  }

  return {
    id: order.id,
    status: order.status,
    total: order.total,
    customerName: order.customerName,
    note: order.note,
    createdAt: order.createdAt,
    table: order.table,
    items: order.items,
    payment: order.qrisTransaction
      ? {
          status: order.qrisTransaction.status,
          amount: order.qrisTransaction.amount,
          qrisPayload: order.qrisTransaction.dynamicPayload,
          expiresAt: order.qrisTransaction.expiresAt,
          paidAt: order.qrisTransaction.paidAt,
        }
      : null,
  };
}
