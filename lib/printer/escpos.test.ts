/// <reference types="bun" />
import { describe, expect, test } from "bun:test";

import {
  buildReceiptBytes,
  columns,
  formatAmount,
  paymentLabel,
  RECEIPT_COLS,
  type ReceiptData,
  wrapText,
} from "./escpos";

function ascii(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
}

function findSequence(bytes: Uint8Array, sequence: number[]): number {
  outer: for (let index = 0; index <= bytes.length - sequence.length; index += 1) {
    for (let offset = 0; offset < sequence.length; offset += 1) {
      if (bytes[index + offset] !== sequence[offset]) continue outer;
    }
    return index;
  }
  return -1;
}

function receipt(overrides: Partial<ReceiptData["order"]> = {}): ReceiptData {
  return {
    store: {
      name: "Warung Santosa",
      address: "Jl. Merdeka No. 10, Jakarta",
      phone: "0819-2745-3030",
    },
    order: {
      id: "cm3abcdefghijklmnopqrstuv",
      createdAt: "2026-11-21T07:30:00.000Z",
      orderType: "dine-in",
      paymentMethod: "transfer",
      receiptNumber: 21,
      receiptCode: "A1B2C3",
      cashier: "Fito",
      customerName: "Budi",
      table: { code: "A1", label: "Depan" },
      items: [
        { name: "Nasi Goreng Spesial", qty: 1, unitPrice: 25000 },
        { name: "Es Teh Manis", qty: 2, unitPrice: 5000 },
      ],
      total: 35000,
      ...overrides,
    },
    footer: "Terima kasih",
  };
}

describe("escpos receipt", () => {
  test("formats rupiah without separators bugs", () => {
    expect(formatAmount(0)).toBe("0");
    expect(formatAmount(1250000)).toBe("1.250.000");
    expect(formatAmount(999)).toBe("999");
  });

  test("wraps long text to receipt width", () => {
    const lines = wrapText("Nasi Goreng Spesial Dengan Telur Dan Ayam", 16);
    expect(lines.length).toBeGreaterThan(1);
    for (const line of lines) expect(line.length).toBeLessThanOrEqual(16);
  });

  test("aligns right column to 32 characters", () => {
    const line = columns("TOTAL", "35.000");
    expect(line.length).toBe(RECEIPT_COLS);
    expect(line.endsWith("35.000")).toBe(true);
  });

  test("builds init, content, raster, and cut commands", () => {
    const bytes = buildReceiptBytes({
      ...receipt(),
      store: {
        ...receipt().store,
        logo: {
          width: 16,
          height: 2,
          bytesPerRow: 2,
          data: new Uint8Array([0xff, 0xff, 0x00, 0x00]),
        },
      },
    });

    expect(bytes[0]).toBe(0x1b);
    expect(bytes[1]).toBe(0x40);
    expect(findSequence(bytes, [0x1d, 0x76, 0x30, 0x00])).toBeGreaterThan(-1);
    expect(
      findSequence(bytes, [0x1d, 0x56, 0x42, 0x00]),
    ).toBe(bytes.length - 4);

    const text = ascii(bytes);
    expect(text).toContain("Warung Santosa");
    expect(text).toContain("Jl. Merdeka No. 10, Jakarta");
    expect(text).toContain("0819-2745-3030");
    expect(text).toContain("TRANSFER");
    expect(text).toContain("35.000");
    expect(text).toContain("#021");
    expect(text).toContain("A1B2C3");
    expect(text).toContain("21/11/26");
    expect(text).not.toContain("No.   ");
    expect(text).toContain("Nasi Goreng Spesial");
    expect(text).toContain("Terima kasih");
  });

  test("labels every payment method", () => {
    expect(paymentLabel("cash")).toBe("CASH");
    expect(paymentLabel("transfer")).toBe("TRANSFER");
    expect(paymentLabel("qris")).toBe("QRIS");
  });

  test("long names and notes do not overflow the receipt", () => {
    const bytes = buildReceiptBytes(
      receipt({
        items: [
          {
            name: "Paket Nasi Goreng Spesial Komplit Dengan Ayam Bakar Dan Es Teh",
            qty: 3,
            unitPrice: 123456,
            note: "Tanpa sambal, tambah kerupuk",
          },
        ],
        total: 370368,
        note: "Antar ke meja paling belakang dekat pintu",
      }),
    );
    expect(bytes.length).toBeGreaterThan(0);
    expect(ascii(bytes)).toContain("370.368");
  });
});
