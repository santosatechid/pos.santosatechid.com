export const RECEIPT_COLS = 32;
export const RECEIPT_LOGO_MAX_WIDTH = 320;
export const RECEIPT_LOGO_MAX_HEIGHT = 180;

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

export type ReceiptImage = {
  width: number;
  height: number;
  bytesPerRow: number;
  /** 1-bit rows, MSB = leftmost dot, 1 = black. */
  data: Uint8Array;
};

export type ReceiptItem = {
  name: string;
  qty: number;
  unitPrice: number;
  note?: string | null;
};

export type ReceiptStore = {
  name: string;
  address?: string | null;
  phone?: string | null;
  logo?: ReceiptImage | null;
};

export type ReceiptOrder = {
  id: string;
  createdAt: string;
  orderType: string;
  paymentMethod: string;
  receiptNumber?: number;
  receiptCode?: string;
  cashier?: string | null;
  customerName?: string | null;
  note?: string | null;
  table?: { code: string; label?: string | null } | null;
  items: ReceiptItem[];
  total: number;
};

export type ReceiptData = {
  store: ReceiptStore;
  order: ReceiptOrder;
  footer?: string;
};

class EscPos {
  private bytes: number[] = [];

  raw(...values: number[]) {
    for (const value of values) this.bytes.push(value & 0xff);
    return this;
  }

  text(value: string) {
    for (const char of value) this.bytes.push(encodeChar(char));
    return this;
  }

  line(value = "") {
    return this.text(value).raw(LF);
  }

  align(value: "left" | "center" | "right") {
    return this.raw(ESC, 0x61, value === "center" ? 1 : value === "right" ? 2 : 0);
  }

  bold(value = true) {
    return this.raw(ESC, 0x45, value ? 1 : 0);
  }

  double(value = true) {
    return this.raw(GS, 0x21, value ? 0x11 : 0x00);
  }

  feed(lines = 3) {
    return this.raw(ESC, 0x64, Math.min(255, Math.max(0, lines)));
  }

  cut() {
    return this.raw(GS, 0x56, 0x42, 0x00);
  }

  image(image: ReceiptImage) {
    this.raw(
      GS,
      0x76,
      0x30,
      0x00,
      image.bytesPerRow & 0xff,
      (image.bytesPerRow >> 8) & 0xff,
      image.height & 0xff,
      (image.height >> 8) & 0xff,
    );
    for (const byte of image.data) this.bytes.push(byte);
    return this;
  }

  toBytes() {
    return Uint8Array.from(this.bytes);
  }
}

function encodeChar(char: string): number {
  const code = char.codePointAt(0) ?? 63;
  return code >= 0x20 && code <= 0xff ? code : 63;
}

export function formatAmount(value: number): string {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function formatReceiptStamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const parts = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Jakarta",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${get("day")}/${get("month")}/${get("year")} ${get("hour")}:${get("minute")}`;
}

export function wrapText(value: string, width = RECEIPT_COLS): string[] {
  const text = value.trim();
  if (!text) return [];

  const lines: string[] = [];
  for (const paragraph of text.split(/\r?\n/)) {
    let current = "";
    for (const word of paragraph.split(/\s+/)) {
      if (!word) continue;
      if (word.length > width) {
        if (current) {
          lines.push(current);
          current = "";
        }
        for (let index = 0; index < word.length; index += width) {
          lines.push(word.slice(index, index + width));
        }
        continue;
      }
      if (!current) {
        current = word;
      } else if (current.length + 1 + word.length <= width) {
        current += ` ${word}`;
      } else {
        lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

export function columns(
  left: string,
  right: string,
  width = RECEIPT_COLS,
): string {
  if (right.length + 1 >= width) return right.slice(-width);
  const maxLeft = width - right.length - 1;
  const trimmed = left.length > maxLeft ? left.slice(0, maxLeft) : left;
  return trimmed + " ".repeat(width - trimmed.length - right.length) + right;
}

function shortOrderId(id: string): string {
  const clean = id.replace(/[^A-Za-z0-9]/g, "");
  return clean.length > 10 ? clean.slice(-10) : clean;
}

function orderTypeLabel(orderType: string): string {
  if (orderType === "dine-in") return "Dine-in";
  if (orderType === "takeaway") return "Bawa pulang";
  if (orderType === "delivery") return "Diantar";
  return orderType;
}

export function paymentLabel(method: string): string {
  if (method === "cash") return "CASH";
  if (method === "transfer") return "TRANSFER";
  if (method === "qris") return "QRIS";
  return method.toUpperCase();
}

function writeItem(b: EscPos, item: ReceiptItem) {
  const amount = formatAmount(item.unitPrice * item.qty);
  const left = `${item.qty}x ${item.name}`;

  if (left.length + amount.length + 1 <= RECEIPT_COLS) {
    b.line(columns(left, amount));
  } else {
    const lines = wrapText(left);
    b.line(lines[0] ?? left.slice(0, RECEIPT_COLS));
    for (const line of lines.slice(1)) b.line(`  ${line}`);
    b.align("right").line(amount).align("left");
  }

  if (item.note?.trim()) {
    for (const line of wrapText(`  ${item.note.trim()}`)) b.line(line);
  }
}

export function buildReceiptBytes(receipt: ReceiptData): Uint8Array {
  const { store, order } = receipt;
  const b = new EscPos();

  b.raw(ESC, 0x40); // initialize

  if (store.logo) {
    b.align("center").image(store.logo).raw(LF);
  }

  const storeName = store.name.trim();
  const nameLines = wrapText(storeName, storeName.length <= 16 ? 16 : RECEIPT_COLS);
  b.align("center").bold(true);
  if (storeName.length <= 16) b.double(true);
  for (const line of nameLines) b.line(line);
  b.double(false).bold(false);

  for (const line of wrapText(store.address ?? "")) b.line(line);
  if (store.phone?.trim()) b.line(`Telp ${store.phone.trim()}`);

  b.line("-".repeat(RECEIPT_COLS)).align("left");
  const sequence = order.receiptNumber
    ? `#${String(order.receiptNumber).padStart(3, "0")}`
    : `#${shortOrderId(order.id)}`;
  const metaLeft = `${sequence} ${formatReceiptStamp(order.createdAt)}`;
  const metaRight = order.receiptCode?.toUpperCase() ?? "";
  b.line(metaRight ? columns(metaLeft, metaRight) : metaLeft);

  const flow = [
    order.cashier?.trim() ? `Kasir ${order.cashier.trim()}` : null,
    orderTypeLabel(order.orderType),
    order.table?.code ? `Meja ${order.table.code}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  if (flow) b.line(flow);
  if (order.customerName?.trim()) b.line(`Nama ${order.customerName.trim()}`);
  for (const line of wrapText(order.note ? `Catatan: ${order.note}` : "")) {
    b.line(line);
  }

  b.line("-".repeat(RECEIPT_COLS));
  for (const item of order.items) writeItem(b, item);
  b.line("-".repeat(RECEIPT_COLS));

  b.bold(true).line(columns("TOTAL", formatAmount(order.total))).bold(false);
  b.line(columns("Bayar", paymentLabel(order.paymentMethod)));
  b.line("-".repeat(RECEIPT_COLS));

  b.align("center");
  for (const line of wrapText(receipt.footer ?? "Terima kasih atas kunjungan Anda")) {
    b.line(line);
  }
  b.feed(4).cut();

  return b.toBytes();
}
