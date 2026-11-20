"use client";

import QRCode from "qrcode";

export async function toQrDataUrl(value: string, width = 512): Promise<string> {
  return QRCode.toDataURL(value, {
    width,
    margin: 2,
    errorCorrectionLevel: "M",
  });
}

export function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDateTime(value: string | Date | null): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function statusVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "paid") return "default";
  if (status === "pending") return "secondary";
  if (status === "expired" || status === "cancelled") return "destructive";
  return "outline";
}
