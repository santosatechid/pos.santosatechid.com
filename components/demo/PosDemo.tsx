"use client";

import {
  ArrowLeft,
  Boxes,
  ChartColumn,
  Check,
  Minus,
  Plus,
  QrCode,
  ReceiptText,
  RotateCcw,
  Search,
  ShoppingCart,
  Store,
  Trash2,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Brand } from "@/components/landing/Brand";
import { jakarta } from "@/components/landing/font";

type Category = "Makanan" | "Minuman";
type Method = "Tunai" | "QRIS";
type Step = "cart" | "pay" | "done";
type Tab = "kasir" | "laporan";

type MenuItem = {
  id: string;
  name: string;
  price: number;
  cost: number;
  img: string;
  category: Category;
};

type Line = { item: MenuItem; qty: number };

type Tx = {
  id: string;
  time: string;
  lines: Line[];
  subtotal: number;
  tax: number;
  total: number;
  cost: number;
  method: Method;
};

const TAX_RATE = 0.1;

const MENU: MenuItem[] = [
  {
    id: "nasi-goreng",
    name: "Nasi Goreng Spesial",
    price: 25000,
    cost: 11000,
    img: "/landing/nasi-goreng.jpg",
    category: "Makanan",
  },
  {
    id: "mie-ayam",
    name: "Mie Ayam Bakso",
    price: 20000,
    cost: 8000,
    img: "/landing/mie-ayam.jpg",
    category: "Makanan",
  },
  {
    id: "ayam-geprek",
    name: "Ayam Geprek",
    price: 22000,
    cost: 9000,
    img: "/landing/ayam-geprek.jpg",
    category: "Makanan",
  },
  {
    id: "sate-ayam",
    name: "Sate Ayam Madura",
    price: 28000,
    cost: 12000,
    img: "/landing/sate-ayam.jpg",
    category: "Makanan",
  },
  {
    id: "ayam-bakar-rica",
    name: "Ayam Bakar Rica",
    price: 27000,
    cost: 12500,
    img: "/landing/ayam-bakar-rica.jpg",
    category: "Makanan",
  },
  {
    id: "soto-betawi",
    name: "Soto Betawi",
    price: 24000,
    cost: 10000,
    img: "/landing/soto-betawi.jpg",
    category: "Makanan",
  },
  {
    id: "es-teh",
    name: "Es Teh Manis",
    price: 8000,
    cost: 2000,
    img: "/landing/es-teh.jpg",
    category: "Minuman",
  },
  {
    id: "es-campur",
    name: "Es Campur Segar",
    price: 15000,
    cost: 5000,
    img: "/landing/es-campur.jpg",
    category: "Minuman",
  },
];

const HISTORY = [
  { label: "Sel", omzet: 1685000 },
  { label: "Rab", omzet: 1924000 },
  { label: "Kam", omzet: 1745000 },
  { label: "Jum", omzet: 2210000 },
  { label: "Sab", omzet: 2650000 },
  { label: "Min", omzet: 1430000 },
];

const STOCK = [
  { name: "Cabai Merah", left: 42, total: 60, unit: "kg" },
  { name: "Bawang", left: 18, total: 40, unit: "kg" },
  { name: "Sayuran Segar", left: 9, total: 30, unit: "kg" },
  { name: "Rempah & Daging", left: 24, total: 50, unit: "kg" },
];

const CARD =
  "rounded-[16px] bg-white outline outline-1 -outline-offset-[0.5px] outline-[#E3E5E9]";
const PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-[10px] bg-[#C81E28] px-4 py-3 text-[13.5px] font-bold text-white transition-colors hover:bg-[#A8161F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C81E28] disabled:cursor-not-allowed disabled:bg-[#E3E5E9] disabled:text-[#7C8290]";
const GHOST =
  "inline-flex items-center justify-center gap-2 rounded-[10px] bg-white px-3.5 py-2.5 text-[12.5px] font-bold text-[#16181D] outline outline-[1.5px] -outline-offset-[0.75px] outline-[#D9DBE0] transition-colors hover:outline-[#16181D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C81E28]";
const CHIP =
  "inline-flex items-center rounded-full bg-[#FDECEC] px-2 py-1 text-[10px] font-extrabold tracking-[0.4px] text-[#C81E28]";

function rp(value: number) {
  return `Rp ${Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

function menuById(id: string) {
  const item = MENU.find((entry) => entry.id === id);
  if (!item) throw new Error(`Menu tidak dikenal: ${id}`);
  return item;
}

function buildTx(
  id: string,
  time: string,
  items: ReadonlyArray<readonly [string, number]>,
  method: Method,
): Tx {
  const lines = items.map(([menuId, qty]) => ({ item: menuById(menuId), qty }));
  const subtotal = lines.reduce(
    (sum, line) => sum + line.item.price * line.qty,
    0,
  );
  const tax = Math.round(subtotal * TAX_RATE);
  return {
    id,
    time,
    lines,
    subtotal,
    tax,
    total: subtotal + tax,
    cost: lines.reduce((sum, line) => sum + line.item.cost * line.qty, 0),
    method,
  };
}

const SEED_SALES: Tx[] = [
  buildTx(
    "INV-0092",
    "13:24",
    [
      ["nasi-goreng", 2],
      ["es-teh", 2],
    ],
    "QRIS",
  ),
  buildTx(
    "INV-0091",
    "13:02",
    [
      ["ayam-geprek", 3],
      ["es-teh", 3],
    ],
    "Tunai",
  ),
  buildTx(
    "INV-0090",
    "12:41",
    [
      ["mie-ayam", 2],
      ["es-campur", 1],
    ],
    "QRIS",
  ),
  buildTx(
    "INV-0089",
    "12:18",
    [
      ["sate-ayam", 1],
      ["nasi-goreng", 1],
      ["es-teh", 2],
    ],
    "Tunai",
  ),
  buildTx(
    "INV-0088",
    "11:56",
    [
      ["soto-betawi", 2],
      ["es-campur", 2],
    ],
    "QRIS",
  ),
  buildTx(
    "INV-0087",
    "11:30",
    [
      ["ayam-bakar-rica", 1],
      ["es-teh", 1],
    ],
    "Tunai",
  ),
  buildTx(
    "INV-0086",
    "10:12",
    [
      ["mie-ayam", 1],
      ["es-teh", 1],
    ],
    "QRIS",
  ),
  buildTx(
    "INV-0085",
    "09:48",
    [
      ["nasi-goreng", 1],
      ["es-teh", 1],
    ],
    "Tunai",
  ),
];

function nextInvoice(sales: Tx[]) {
  const latest = Number.parseInt(sales[0]?.id.replace("INV-", "") ?? "0", 10);
  return `INV-${String(latest + 1).padStart(4, "0")}`;
}

export default function PosDemo() {
  const [tab, setTab] = useState<Tab>("kasir");
  const [category, setCategory] = useState<"Semua" | Category>("Semua");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [step, setStep] = useState<Step>("cart");
  const [method, setMethod] = useState<Method>("Tunai");
  const [cash, setCash] = useState("");
  const [sales, setSales] = useState<Tx[]>(SEED_SALES);
  const [lastTx, setLastTx] = useState<Tx | null>(null);

  const lines = useMemo(
    () =>
      MENU.flatMap((item) => {
        const qty = cart[item.id] ?? 0;
        return qty > 0 ? [{ item, qty }] : [];
      }),
    [cart],
  );

  const subtotal = lines.reduce(
    (sum, line) => sum + line.item.price * line.qty,
    0,
  );
  const tax = Math.round(subtotal * TAX_RATE);
  const total = subtotal + tax;
  const cartCount = lines.reduce((sum, line) => sum + line.qty, 0);
  const cashValue = Number(cash || 0);
  const change = cashValue - total;

  const visibleMenu = MENU.filter((item) => {
    const matchCategory = category === "Semua" || item.category === category;
    return (
      matchCategory &&
      item.name.toLowerCase().includes(query.trim().toLowerCase())
    );
  });

  const quickCash = [...new Set([total, 50000, 100000, 200000])]
    .filter((value) => value >= total)
    .sort((a, b) => a - b)
    .slice(0, 4);

  function addToCart(id: string) {
    setCart((current) => ({ ...current, [id]: (current[id] ?? 0) + 1 }));
  }

  function decrease(id: string) {
    setCart((current) => {
      const next = { ...current };
      const qty = (next[id] ?? 0) - 1;
      if (qty <= 0) delete next[id];
      else next[id] = qty;
      return next;
    });
  }

  function removeLine(id: string) {
    setCart((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  function resetOrder() {
    setCart({});
    setCash("");
    setMethod("Tunai");
    setStep("cart");
  }

  function completePayment() {
    if (lines.length === 0) return;
    if (method === "Tunai" && cashValue < total) return;

    const tx: Tx = {
      id: nextInvoice(sales),
      time: new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      lines,
      subtotal,
      tax,
      total,
      cost: lines.reduce((sum, line) => sum + line.item.cost * line.qty, 0),
      method,
    };

    setSales((current) => [tx, ...current]);
    setLastTx(tx);
    setStep("done");
  }

  function resetDemo() {
    setSales(SEED_SALES);
    setLastTx(null);
    resetOrder();
  }

  const todayOmzet = sales.reduce((sum, tx) => sum + tx.total, 0);
  const todayProfit = sales.reduce((sum, tx) => sum + tx.subtotal - tx.cost, 0);
  const todayItems = sales.reduce(
    (sum, tx) => sum + tx.lines.reduce((count, line) => count + line.qty, 0),
    0,
  );
  const averageTicket = sales.length > 0 ? todayOmzet / sales.length : 0;

  const menuTotals = new Map<
    string,
    { item: MenuItem; qty: number; revenue: number }
  >();
  for (const tx of sales) {
    for (const line of tx.lines) {
      const current = menuTotals.get(line.item.id) ?? {
        item: line.item,
        qty: 0,
        revenue: 0,
      };
      current.qty += line.qty;
      current.revenue += line.item.price * line.qty;
      menuTotals.set(line.item.id, current);
    }
  }
  const topItems = [...menuTotals.values()]
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);
  const topMaxQty = topItems[0]?.qty ?? 1;

  const paymentSplit = (["Tunai", "QRIS"] as const).map((value) => {
    const txs = sales.filter((tx) => tx.method === value);
    return {
      method: value,
      count: txs.length,
      amount: txs.reduce((sum, tx) => sum + tx.total, 0),
    };
  });

  const chartData = [
    ...HISTORY.map((entry) => ({ ...entry, today: false })),
    { label: "Kini", omzet: todayOmzet, today: true },
  ];
  const chartMax = Math.max(...chartData.map((entry) => entry.omzet), 1);

  return (
    <div
      className={`${jakarta.className} min-h-screen bg-[#F7F7F8] text-[#16181D]`}
    >
      <header className="sticky top-0 z-50 border-b border-[#E3E5E9] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Brand />
            <span className="hidden rounded-full bg-[#FDECEC] px-2.5 py-1 text-[10px] font-extrabold tracking-[0.6px] text-[#C81E28] sm:inline">
              DEMO INTERAKTIF
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/"
              className="rounded-sm text-[13px] font-semibold text-[#5D6370] transition-colors hover:text-[#16181D] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C81E28]"
            >
              Beranda
            </Link>
            <Link
              href="/auth/google"
              className="rounded-[10px] bg-[#C81E28] px-3.5 py-2.5 text-[13px] font-bold whitespace-nowrap text-white transition-colors hover:bg-[#A8161F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C81E28]"
            >
              Coba Gratis
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1440px] px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <p className="text-[12.5px] font-extrabold tracking-[1px] text-[#C81E28]">
                DEMO POS
              </p>
              <h1 className="max-w-[760px] text-[30px] leading-[36px] font-extrabold tracking-[-1.2px] sm:text-[38px] sm:leading-[44px]">
                Coba kasirnya, lalu lihat laporannya.
              </h1>
              <p className="max-w-[640px] text-[14px] leading-[23px] font-medium text-[#5D6370] sm:text-[15px]">
                Tanpa login dan tanpa data asli. Klik menu, bayar, lalu buka tab
                Laporan untuk melihat omzet, laba, dan menu terlaris.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-[12px] bg-white p-1 outline outline-1 -outline-offset-[0.5px] outline-[#E3E5E9]">
                {(["kasir", "laporan"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTab(value)}
                    aria-pressed={tab === value}
                    className={`rounded-[8px] px-4 py-2 text-[13px] font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C81E28] ${
                      tab === value
                        ? "bg-[#C81E28] text-white"
                        : "text-[#5D6370] hover:text-[#16181D]"
                    }`}
                  >
                    {value === "kasir" ? "Kasir" : "Laporan"}
                  </button>
                ))}
              </div>
              <button type="button" onClick={resetDemo} className={GHOST}>
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Reset demo
              </button>
            </div>
          </div>

          {tab === "kasir" ? (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
              <section className="flex flex-col gap-4">
                <div
                  className={`${CARD} flex flex-col gap-3 p-3 sm:flex-row sm:items-center`}
                >
                  <label className="flex flex-1 items-center gap-2 rounded-[10px] bg-[#F5F6F8] px-3 py-2.5 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#C81E28]">
                    <Search
                      className="h-4 w-4 text-[#5D6370]"
                      aria-hidden="true"
                    />
                    <span className="sr-only">Cari menu</span>
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Cari menu…"
                      className="w-full bg-transparent text-[13.5px] font-medium text-[#16181D] outline-none placeholder:text-[#5D6370]"
                    />
                  </label>
                  <div className="flex gap-1.5">
                    {(["Semua", "Makanan", "Minuman"] as const).map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setCategory(value)}
                        aria-pressed={category === value}
                        className={`rounded-[8px] px-3 py-2 text-[12.5px] font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C81E28] ${
                          category === value
                            ? "bg-[#16181D] text-white"
                            : "bg-[#F2F3F5] text-[#5D6370] hover:text-[#16181D]"
                        }`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>

                {visibleMenu.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                    {visibleMenu.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => addToCart(item.id)}
                        aria-label={`Tambah ${item.name}`}
                        className={`${CARD} group flex flex-col overflow-hidden text-left transition-colors hover:outline-[#C81E28] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C81E28]`}
                      >
                        <img
                          src={item.img}
                          alt={item.name}
                          width={320}
                          height={112}
                          loading="lazy"
                          className="h-[112px] w-full object-cover"
                        />
                        <span className="flex flex-1 flex-col gap-1 p-3">
                          <span className="text-[13px] leading-[18px] font-bold">
                            {item.name}
                          </span>
                          <span className="text-[11.5px] font-medium text-[#5D6370]">
                            {item.category}
                          </span>
                          <span className="mt-auto flex items-center justify-between pt-2">
                            <span className="text-[13px] font-extrabold text-[#C81E28]">
                              {rp(item.price)}
                            </span>
                            <span className="grid h-7 w-7 place-items-center rounded-[8px] bg-[#FDECEC] text-[#C81E28]">
                              <Plus className="h-4 w-4" aria-hidden="true" />
                            </span>
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div
                    className={`${CARD} flex flex-col items-center gap-2 p-10 text-center`}
                  >
                    <Search
                      className="h-6 w-6 text-[#7C8290]"
                      aria-hidden="true"
                    />
                    <p className="text-[14px] font-bold">
                      Menu tidak ditemukan
                    </p>
                    <p className="text-[12.5px] font-medium text-[#5D6370]">
                      Coba kata kunci lain atau pilih kategori Semua.
                    </p>
                  </div>
                )}
              </section>

              <aside
                className={`${CARD} flex flex-col gap-4 p-4 lg:sticky lg:top-[84px]`}
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="flex items-center gap-2 text-[15px] font-extrabold">
                    <ShoppingCart
                      className="h-4 w-4 text-[#C81E28]"
                      aria-hidden="true"
                    />
                    {step === "cart"
                      ? "Pesanan"
                      : step === "pay"
                        ? "Pembayaran"
                        : "Struk"}
                  </h2>
                  {step === "cart" ? (
                    <span className="text-[11.5px] font-bold text-[#5D6370]">
                      {cartCount} item
                    </span>
                  ) : null}
                </div>

                {step === "cart" ? (
                  <>
                    {lines.length === 0 ? (
                      <div className="flex flex-col items-center gap-2 rounded-[12px] bg-[#F7F7F8] px-4 py-10 text-center">
                        <ReceiptText
                          className="h-6 w-6 text-[#7C8290]"
                          aria-hidden="true"
                        />
                        <p className="text-[13px] font-bold">
                          Belum ada pesanan
                        </p>
                        <p className="text-[12px] font-medium text-[#5D6370]">
                          Klik salah satu menu untuk menambah pesanan.
                        </p>
                      </div>
                    ) : (
                      <div className="flex max-h-[340px] flex-col overflow-y-auto">
                        {lines.map((line) => (
                          <div
                            key={line.item.id}
                            className="flex items-start justify-between gap-3 border-t border-[#EFF0F3] py-3 first:border-t-0 first:pt-0"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-bold">
                                {line.item.name}
                              </p>
                              <p className="text-[11.5px] font-medium text-[#5D6370]">
                                {rp(line.item.price)} × {line.qty}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => decrease(line.item.id)}
                                aria-label={`Kurangi ${line.item.name}`}
                                className="grid h-7 w-7 place-items-center rounded-[7px] bg-[#F2F3F5] text-[#16181D] transition-colors hover:bg-[#E3E5E9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C81E28]"
                              >
                                <Minus
                                  className="h-3.5 w-3.5"
                                  aria-hidden="true"
                                />
                              </button>
                              <span className="w-5 text-center text-[12.5px] font-extrabold">
                                {line.qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => addToCart(line.item.id)}
                                aria-label={`Tambah ${line.item.name}`}
                                className="grid h-7 w-7 place-items-center rounded-[7px] bg-[#F2F3F5] text-[#16181D] transition-colors hover:bg-[#E3E5E9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C81E28]"
                              >
                                <Plus
                                  className="h-3.5 w-3.5"
                                  aria-hidden="true"
                                />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeLine(line.item.id)}
                                aria-label={`Hapus ${line.item.name}`}
                                className="grid h-7 w-7 place-items-center rounded-[7px] text-[#7C8290] transition-colors hover:bg-[#FDECEC] hover:text-[#C81E28] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C81E28]"
                              >
                                <Trash2
                                  className="h-3.5 w-3.5"
                                  aria-hidden="true"
                                />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-col gap-1.5 border-t border-[#E3E5E9] pt-3 text-[12.5px]">
                      <Row label="Subtotal" value={rp(subtotal)} />
                      <Row label="Pajak 10%" value={rp(tax)} />
                      <div className="flex items-center justify-between gap-3 pt-1.5 text-[14px] font-extrabold">
                        <span>Total</span>
                        <span>{rp(total)}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setStep("pay")}
                      disabled={lines.length === 0}
                      className={PRIMARY}
                    >
                      <Wallet className="h-4 w-4" aria-hidden="true" />
                      Bayar sekarang
                    </button>
                  </>
                ) : null}

                {step === "pay" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setStep("cart")}
                      className="inline-flex w-fit items-center gap-1.5 text-[12.5px] font-bold text-[#5D6370] hover:text-[#16181D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C81E28]"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                      Kembali ke pesanan
                    </button>

                    <div className="flex items-center justify-between gap-3 rounded-[12px] bg-[#F7F7F8] px-4 py-3">
                      <span className="text-[12px] font-bold text-[#5D6370]">
                        Total tagihan
                      </span>
                      <span className="text-[20px] font-extrabold tracking-[-0.6px]">
                        {rp(total)}
                      </span>
                    </div>

                    <div
                      className="grid grid-cols-2 gap-2"
                      role="group"
                      aria-label="Metode pembayaran"
                    >
                      {(["Tunai", "QRIS"] as const).map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setMethod(value)}
                          aria-pressed={method === value}
                          className={`flex items-center justify-center gap-2 rounded-[9px] border px-3 py-2.5 text-[12.5px] font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C81E28] ${
                            method === value
                              ? "border-[#C81E28] bg-[#FDECEC] text-[#C81E28]"
                              : "border-[#E3E5E9] bg-white text-[#5D6370] hover:text-[#16181D]"
                          }`}
                        >
                          {value === "Tunai" ? (
                            <Wallet className="h-4 w-4" aria-hidden="true" />
                          ) : (
                            <QrCode className="h-4 w-4" aria-hidden="true" />
                          )}
                          {value}
                        </button>
                      ))}
                    </div>

                    {method === "Tunai" ? (
                      <>
                        <label className="flex flex-col gap-1.5">
                          <span className="text-[11.5px] font-bold text-[#5D6370]">
                            Uang diterima
                          </span>
                          <input
                            type="number"
                            inputMode="numeric"
                            min={0}
                            value={cash}
                            onChange={(event) => setCash(event.target.value)}
                            placeholder={String(total)}
                            className="rounded-[9px] border border-[#E3E5E9] px-3 py-2.5 text-[14px] font-bold text-[#16181D] outline-none focus-visible:border-[#C81E28] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C81E28]"
                          />
                        </label>

                        <div className="flex flex-wrap gap-1.5">
                          {quickCash.map((value) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => setCash(String(value))}
                              className="rounded-[8px] bg-[#F2F3F5] px-2.5 py-1.5 text-[11.5px] font-bold text-[#16181D] transition-colors hover:bg-[#E3E5E9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C81E28]"
                            >
                              {value === total ? "Uang pas" : rp(value)}
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center justify-between gap-3 border-t border-[#E3E5E9] pt-3 text-[12.5px]">
                          <span className="font-semibold text-[#5D6370]">
                            Kembalian
                          </span>
                          <span
                            className={`text-[14px] font-extrabold ${
                              change < 0 ? "text-[#C81E28]" : "text-[#16181D]"
                            }`}
                          >
                            {change < 0 ? "Uang kurang" : rp(change)}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-2 rounded-[12px] bg-[#F7F7F8] px-4 py-6 text-center">
                        <QrCode
                          className="h-8 w-8 text-[#16181D]"
                          aria-hidden="true"
                        />
                        <p className="text-[12.5px] font-bold">
                          QRIS demo — pembayaran dianggap lunas.
                        </p>
                        <p className="text-[11.5px] font-medium text-[#5D6370]">
                          Di aplikasi asli, status menunggu konfirmasi QRIS.
                        </p>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={completePayment}
                      disabled={method === "Tunai" && cashValue < total}
                      className={PRIMARY}
                    >
                      <Check className="h-4 w-4" aria-hidden="true" />
                      Selesaikan pembayaran
                    </button>
                  </>
                ) : null}

                {step === "done" && lastTx ? (
                  <>
                    <div className="flex flex-col items-center gap-1 border-b border-dashed border-[#D9DBE0] pb-4 text-center">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-[#FDECEC] text-[#C81E28]">
                        <Check className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <p className="text-[14.5px] font-extrabold">
                        Pembayaran berhasil
                      </p>
                      <p className="text-[11.5px] font-medium text-[#5D6370]">
                        {lastTx.id} · {lastTx.time} · {lastTx.method}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 text-[12.5px]">
                      {lastTx.lines.map((line) => (
                        <div
                          key={line.item.id}
                          className="flex items-start justify-between gap-3"
                        >
                          <span className="font-medium">
                            {line.item.name} × {line.qty}
                          </span>
                          <span className="font-bold">
                            {rp(line.item.price * line.qty)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col gap-1.5 border-t border-dashed border-[#D9DBE0] pt-3 text-[12.5px]">
                      <Row label="Subtotal" value={rp(lastTx.subtotal)} />
                      <Row label="Pajak 10%" value={rp(lastTx.tax)} />
                      <div className="flex items-center justify-between gap-3 text-[14px] font-extrabold">
                        <span>Total</span>
                        <span>{rp(lastTx.total)}</span>
                      </div>
                      <Row label="Metode" value={lastTx.method} />
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={resetOrder}
                        className={PRIMARY}
                      >
                        <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                        Transaksi baru
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          resetOrder();
                          setTab("laporan");
                        }}
                        className={GHOST}
                      >
                        <ChartColumn
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        />
                        Lihat laporan
                      </button>
                    </div>
                  </>
                ) : null}
              </aside>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Stat
                  icon={Wallet}
                  label="Omzet hari ini"
                  value={rp(todayOmzet)}
                  note={`${sales.length} transaksi`}
                />
                <Stat
                  icon={ReceiptText}
                  label="Rata-rata / nota"
                  value={rp(averageTicket)}
                  note={`${todayItems} item terjual`}
                />
                <Stat
                  icon={TrendingUp}
                  label="Laba kotor"
                  value={rp(todayProfit)}
                  note="Omzet menu − HPP"
                />
                <Stat
                  icon={Store}
                  label="Outlet"
                  value="Kemang"
                  note="Demo 1 outlet"
                />
              </div>

              <div className="grid gap-4 xl:grid-cols-3">
                <div
                  className={`${CARD} flex flex-col gap-4 p-4 sm:p-5 xl:col-span-2`}
                >
                  <div className="flex flex-col gap-1">
                    <h2 className="text-[15px] font-extrabold">Omzet 7 hari</h2>
                    <p className="text-[12px] font-medium text-[#5D6370]">
                      Termasuk pajak. Bar merah adalah hari ini.
                    </p>
                  </div>
                  <div className="flex items-end gap-2 sm:gap-3">
                    {chartData.map((entry) => (
                      <div
                        key={entry.label}
                        className="flex flex-1 flex-col items-center gap-2"
                      >
                        <div className="flex h-[150px] w-full items-end">
                          <div
                            style={{
                              height: `${Math.max(4, Math.round((entry.omzet / chartMax) * 100))}%`,
                            }}
                            title={`${entry.label}: ${rp(entry.omzet)}`}
                            className={`w-full rounded-t-[5px] ${
                              entry.today ? "bg-[#C81E28]" : "bg-[#F3C4C6]"
                            }`}
                          />
                        </div>
                        <span
                          className={`text-[10.5px] font-semibold ${
                            entry.today ? "text-[#C81E28]" : "text-[#5D6370]"
                          }`}
                        >
                          {entry.label}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="border-t border-[#EFF0F3] pt-3 text-[11.5px] font-medium text-[#5D6370]">
                    Tertinggi minggu ini: {rp(chartMax)} · rata-rata{" "}
                    {rp(
                      chartData.reduce((sum, entry) => sum + entry.omzet, 0) /
                        chartData.length,
                    )}
                  </p>
                </div>

                <div className={`${CARD} flex flex-col gap-3 p-4 sm:p-5`}>
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-[15px] font-extrabold">
                      Menu terlaris
                    </h2>
                    <ChartColumn
                      className="h-4 w-4 text-[#C81E28]"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    {topItems.map((entry) => (
                      <div
                        key={entry.item.id}
                        className="relative flex items-center justify-between gap-3 overflow-hidden rounded-[9px] bg-[#F7F7F8] px-3 py-2"
                      >
                        <div
                          className="absolute inset-y-0 left-0 bg-[#FDECEC]"
                          style={{
                            width: `${Math.round((entry.qty / topMaxQty) * 100)}%`,
                          }}
                        />
                        <span className="relative truncate text-[12.5px] font-semibold">
                          {entry.item.name}
                        </span>
                        <span className="relative shrink-0 text-[11.5px] font-bold text-[#5D6370]">
                          {entry.qty}× · {rp(entry.revenue)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <div className={`${CARD} flex flex-col gap-3 p-4 sm:p-5`}>
                  <h2 className="text-[15px] font-extrabold">Metode bayar</h2>
                  {paymentSplit.map((entry) => {
                    const percent =
                      todayOmzet > 0
                        ? Math.round((entry.amount / todayOmzet) * 100)
                        : 0;
                    return (
                      <div key={entry.method} className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between gap-3 text-[12.5px]">
                          <span className="font-semibold">{entry.method}</span>
                          <span className="font-bold">{rp(entry.amount)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#F2F3F5]">
                            <div
                              className="h-full rounded-full bg-[#C81E28]"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="w-20 text-right text-[11px] font-medium text-[#5D6370]">
                            {percent}% · {entry.count} nota
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className={`${CARD} flex flex-col gap-3 p-4 sm:p-5`}>
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-[15px] font-extrabold">Stok menipis</h2>
                    <Boxes
                      className="h-4 w-4 text-[#C81E28]"
                      aria-hidden="true"
                    />
                  </div>
                  {STOCK.map((entry) => {
                    const percent = Math.round(
                      (entry.left / entry.total) * 100,
                    );
                    const low = percent <= 40;
                    return (
                      <div key={entry.name} className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between gap-3 text-[12.5px]">
                          <span className="font-semibold">{entry.name}</span>
                          <span
                            className={`font-bold ${low ? "text-[#B45309]" : "text-[#5D6370]"}`}
                          >
                            {entry.left} / {entry.total} {entry.unit}
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-[#F2F3F5]">
                          <div
                            className={`h-full rounded-full ${low ? "bg-[#B45309]" : "bg-[#15803D]"}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className={`${CARD} flex flex-col gap-3 p-4 sm:p-5`}>
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-[15px] font-extrabold">
                      Transaksi terakhir
                    </h2>
                    <span className="text-[11px] font-medium text-[#5D6370]">
                      {sales.length} nota
                    </span>
                  </div>
                  <div className="flex flex-col">
                    {sales.slice(0, 5).map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between gap-3 border-t border-[#EFF0F3] py-2.5 first:border-t-0 first:pt-0"
                      >
                        <div className="min-w-0">
                          <p className="text-[12.5px] font-bold">{tx.id}</p>
                          <p className="text-[11px] font-medium text-[#5D6370]">
                            {tx.time} ·{" "}
                            {tx.lines.reduce((sum, line) => sum + line.qty, 0)}{" "}
                            item
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className={CHIP}>{tx.method}</span>
                          <span className="text-[12.5px] font-extrabold">
                            {rp(tx.total)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <p className="text-[11.5px] font-medium text-[#5D6370]">
                Angka di atas berasal dari 8 transaksi contoh hari ini ditambah
                transaksi yang kamu buat di tab Kasir. Laba kotor = omzet menu
                sebelum pajak − HPP.
              </p>
            </div>
          )}
        </div>

        <p className="mt-8 border-t border-[#E3E5E9] pt-5 text-[11.5px] font-medium text-[#5D6370]">
          Demo berjalan di browser. Tidak ada data yang dikirim atau disimpan;
          semuanya kembali saat halaman dimuat ulang.
        </p>
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-medium text-[#5D6370]">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className={`${CARD} flex flex-col gap-2 p-4`}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11.5px] font-semibold text-[#5D6370]">
          {label}
        </span>
        <span className="grid h-7 w-7 place-items-center rounded-[8px] bg-[#FDECEC] text-[#C81E28]">
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      </div>
      <span className="text-[22px] font-extrabold tracking-[-0.7px]">
        {value}
      </span>
      <span className="text-[11px] font-medium text-[#5D6370]">{note}</span>
    </div>
  );
}
