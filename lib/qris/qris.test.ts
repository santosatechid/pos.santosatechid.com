/// <reference types="bun" />
import { describe, expect, test } from "bun:test";

import { convertQRIS } from "./converter";
import { calculateCRC16 } from "./crc16";
import { parseQRIS } from "./parser";
import { validateQRIS } from "./validator";

function tlv(tag: string, value: string): string {
  return `${tag}${value.length.toString().padStart(2, "0")}${value}`;
}

function staticPayload(): string {
  const merchant =
    tlv("00", "ID.CO.QRIS.WWW") +
    tlv("01", "936000000000000000") +
    tlv("02", "ID1234567890123") +
    tlv("03", "UMI");
  const body =
    tlv("00", "01") +
    tlv("01", "11") +
    tlv("26", merchant) +
    tlv("52", "5812") +
    tlv("53", "360") +
    tlv("58", "ID") +
    tlv("59", "Warung Test") +
    tlv("60", "Jakarta") +
    tlv("61", "12345");
  return `${body}6304${calculateCRC16(`${body}6304`)}`;
}

describe("qris core", () => {
  test("CRC16-CCITT known vector", () => {
    expect(calculateCRC16("123456789")).toBe("29B1");
  });

  test("parses a valid static payload", () => {
    const payload = staticPayload();
    expect(validateQRIS(payload)).toEqual({ valid: true, errors: [] });

    const parsed = parseQRIS(payload);
    expect(parsed.method).toBe("static");
    expect(parsed.merchantName).toBe("Warung Test");
    expect(parsed.merchantCity).toBe("Jakarta");
    expect(parsed.merchantAccountInfo[0]?.merchantId).toBe(
      "936000000000000000",
    );
    expect(
      parsed.merchantAccountInfo[0]?.fields.find((field) => field.tag === "02")
        ?.value,
    ).toBe("ID1234567890123");
  });

  test("rejects a payload with a broken checksum", () => {
    const payload = staticPayload();
    const broken = payload.slice(0, -1) + (payload.endsWith("0") ? "1" : "0");
    expect(validateQRIS(broken).valid).toBe(false);
  });

  test("converts static to dynamic with amount and recomputed CRC", () => {
    const dynamic = convertQRIS(staticPayload(), { amount: 25000 });
    expect(dynamic.startsWith("000201010212")).toBe(true);
    expect(dynamic).toContain(tlv("54", "25000"));
    expect(validateQRIS(dynamic)).toEqual({ valid: true, errors: [] });

    const parsed = parseQRIS(dynamic);
    expect(parsed.method).toBe("dynamic");
    expect(parsed.amount).toBe("25000");
    expect(parsed.raw.some((element) => element.tag === "54")).toBe(true);
  });

  test("adds percentage convenience fee", () => {
    const dynamic = convertQRIS(staticPayload(), {
      amount: 10000,
      fee: { type: "percentage", value: 2.5 },
    });
    expect(dynamic).toContain(tlv("55", "03"));
    expect(dynamic).toContain(tlv("57", "2.5"));
    expect(validateQRIS(dynamic).valid).toBe(true);
  });
});
