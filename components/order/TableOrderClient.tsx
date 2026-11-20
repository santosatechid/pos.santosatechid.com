"use client";

import { Brand } from "@/components/landing/Brand";
import { jakarta } from "@/components/landing/font";
import QrImage from "@/components/qris/QrImage";
import { formatRupiah } from "@/components/qris/qr";
import FluidOrb from "@/components/ui/fluid-orb";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Check,
  ChevronRight,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";

type PublicProduct = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  imageUrl: string | null;
};

type PublicTableData = {
  table: { code: string; label: string | null };
  clientName: string;
  qrisReady: boolean;
  products: PublicProduct[];
};

type PaymentState = {
  orderId: string;
  total: number;
  expiresAt: string;
  qrisPayload: string;
  status: "pending" | "paid" | "expired";
};

function StatusBar() {
  return (
    <div className="hidden items-center justify-between px-5 pt-3 md:flex">
      <span className="text-[10.5px] font-extrabold text-[#16181D]">9:41</span>
      <span className="flex items-center gap-[5px] text-[#16181D]">
        <svg viewBox="0 0 24 24" className="h-[9px] w-[9px] fill-current">
          <path d="M2 20h3v-5H2v5zm5 0h3V10H7v10zm5 0h3V5h-3v15zm5 0h3V2h-3v18z" />
        </svg>
        <svg viewBox="0 0 24 24" className="h-[9px] w-[9px] fill-current">
          <path d="M12 18.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM12 3a13 13 0 0 0-9.2 3.8l1.7 1.7A10.6 10.6 0 0 1 12 5.6c2.9 0 5.6 1.1 7.5 2.9l1.7-1.7A13 13 0 0 0 12 3z" />
        </svg>
        <svg viewBox="0 0 24 24" className="h-[9px] w-[9px] fill-current">
          <path d="M2 7h17v10H2z" />
          <path d="M20.5 10H22v4h-1.5z" />
        </svg>
      </span>
    </div>
  );
}

export default function TableOrderClient({
  token,
  data,
}: {
  token: string;
  data: PublicTableData;
}) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [customerName, setCustomerName] = useState("");
  const [note, setNote] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Semua");
  const [showCart, setShowCart] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payment, setPayment] = useState<PaymentState | null>(null);
  const [now, setNow] = useState(Date.now());
  const reduced = useReducedMotion() ?? false;

  const categories = useMemo(
    () => [
      "Semua",
      ...new Set(
        data.products
          .map((product) => product.category?.trim())
          .filter((value): value is string => Boolean(value)),
      ),
    ],
    [data.products],
  );

  const visibleProducts = useMemo(
    () =>
      data.products.filter((product) => {
        const matchesCategory =
          category === "Semua" || product.category === category;
        const matchesQuery = product.name
          .toLowerCase()
          .includes(query.trim().toLowerCase());
        return matchesCategory && matchesQuery;
      }),
    [category, data.products, query],
  );

  const productById = useMemo(
    () => new Map(data.products.map((product) => [product.id, product])),
    [data.products],
  );

  const cartItems = useMemo(
    () =>
      Object.entries(cart)
        .filter(([, qty]) => qty > 0)
        .map(([productId, qty]) => ({
          product: productById.get(productId),
          qty,
        }))
        .filter(
          (item): item is { product: PublicProduct; qty: number } =>
            Boolean(item.product),
        ),
    [cart, productById],
  );

  const total = useMemo(
    () =>
      cartItems.reduce((sum, item) => sum + item.product.price * item.qty, 0),
    [cartItems],
  );

  const itemCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.qty, 0),
    [cartItems],
  );

  useEffect(() => {
    if (payment?.status !== "pending") return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [payment?.status]);

  useEffect(() => {
    if (payment?.status !== "pending") return;

    let active = true;
    const poll = async () => {
      try {
        const response = await fetch(
          `/api/public/orders/${payment.orderId}?token=${encodeURIComponent(token)}`,
          { cache: "no-store" },
        );
        if (!response.ok) return;
        const order = (await response.json()) as {
          status: string;
          payment: { status: string } | null;
        };
        if (!active) return;
        const nextStatus =
          order.status === "paid" || order.payment?.status === "paid"
            ? "paid"
            : order.status === "expired" || order.payment?.status === "expired"
              ? "expired"
              : "pending";
        if (nextStatus !== "pending") {
          setPayment((current) =>
            current ? { ...current, status: nextStatus } : current,
          );
        }
      } catch {
        // Jaringan putus sesaat: polling berikutnya mencoba lagi.
      }
    };

    void poll();
    const timer = setInterval(() => void poll(), 5000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [payment?.orderId, payment?.status, token]);

  const expiresIn = payment
    ? Math.max(0, new Date(payment.expiresAt).getTime() - now)
    : 0;
  const countdown = `${Math.floor(expiresIn / 60000)
    .toString()
    .padStart(2, "0")}:${Math.floor((expiresIn % 60000) / 1000)
    .toString()
    .padStart(2, "0")}`;

  const changeQty = (productId: string, delta: number) => {
    setCart((current) => {
      const next = Math.min(99, Math.max(0, (current[productId] ?? 0) + delta));
      return { ...current, [productId]: next };
    });
  };

  const submitOrder = async () => {
    setError(null);
    if (!data.qrisReady) {
      setError("Merchant belum menyiapkan QRIS.");
      return;
    }
    if (cartItems.length === 0) {
      setError("Pilih minimal satu menu.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/public/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          customerName: customerName.trim() || null,
          note: note.trim() || null,
          items: cartItems.map((item) => ({
            productId: item.product.id,
            qty: item.qty,
          })),
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body?.message ?? "Gagal membuat pesanan");
      }

      setPayment({
        orderId: body.orderId,
        total: body.total,
        expiresAt: body.expiresAt,
        qrisPayload: body.qrisPayload,
        status: "pending",
      });
      setCart({});
      setShowCart(false);
      setCustomerName("");
      setNote("");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Gagal membuat pesanan",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resetOrder = () => {
    setPayment(null);
    setNow(Date.now());
    setCart({});
  };

  return (
    <div
      className={`${jakarta.className} landing-theme min-h-[100dvh] bg-[#F7F7F8] text-[#16181D]`}
    >
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(180deg,#FFFFFF_0%,#FDF7F7_100%)]" />
      <div className="pointer-events-none fixed -top-[180px] left-[55%] h-[760px] w-[760px] rounded-full bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,#FBE3E3_0%,#FFFFFF_100%)] opacity-70" />

      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-[1180px] flex-col items-center justify-center gap-10 px-0 py-0 lg:flex-row lg:gap-20 lg:px-8 lg:py-14">
        <div className="pointer-events-none absolute right-[4%] top-[12%] hidden opacity-30 lg:block">
          <FluidOrb size={300} color="#C81E28" />
        </div>
        <section className="hidden w-full max-w-[380px] flex-col gap-5 lg:flex">
          <Brand />
          <p className="text-[13px] font-extrabold tracking-[1.2px] text-[#C81E28]">
            PESAN DARI MEJA
          </p>
          <motion.h1
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-[42px] leading-[46px] font-extrabold tracking-[-1.8px] text-[#16181D]"
          >
            Pesan, bayar,
            <span className="block text-[#C81E28]">lanjut makan.</span>
          </motion.h1>
          <p className="max-w-[340px] text-[15.5px] leading-[25px] font-medium text-[#5D6370]">
            Pilih menu langsung dari HP, bayar dengan QRIS, lalu tunjukkan
            pesananmu ke kasir. Tanpa install aplikasi.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FDECEC] px-3 py-1.5 text-[11px] font-extrabold tracking-[0.4px] text-[#C81E28]">
              <Check className="h-3 w-3" />
              QRIS
            </span>
            <span className="inline-flex items-center rounded-full bg-white px-3 py-1.5 text-[11px] font-extrabold text-[#5D6370] outline outline-1 outline-[#E3E5E9]">
              Meja {data.table.code}
            </span>
            <span className="inline-flex items-center rounded-full bg-white px-3 py-1.5 text-[11px] font-extrabold text-[#5D6370] outline outline-1 outline-[#E3E5E9]">
              {data.clientName}
            </span>
          </div>
        </section>

        <div className="w-full md:w-[390px] md:shrink-0">
          <div className="mx-auto w-full md:rounded-[46px] md:bg-[#16181D] md:p-[11px] md:shadow-[0_26px_25px_#16181D33]">
            <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-white md:h-[740px] md:rounded-[36px]">
              <StatusBar />

              {payment ? (
                <div className="flex flex-1 flex-col overflow-y-auto px-4 pb-6 pt-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-extrabold tracking-[0.5px] text-[#C81E28]">
                        MEJA {data.table.code}
                      </p>
                      <p className="text-[15px] font-extrabold text-[#16181D]">
                        {data.clientName}
                      </p>
                    </div>
                    <span className="rounded-full bg-[#F2F3F5] px-2.5 py-1 text-[10px] font-extrabold text-[#5D6370]">
                      {payment.status === "paid"
                        ? "LUNAS"
                        : payment.status === "expired"
                          ? "KEDALUWARSA"
                          : "MENUNGGU BAYAR"}
                    </span>
                  </div>

                  {payment.status === "paid" ? (
                    <div className="mt-8 flex flex-col items-center gap-4 text-center">
                      <motion.span
                        initial={reduced ? false : { opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 320,
                          damping: 22,
                        }}
                        className="grid h-16 w-16 place-items-center rounded-full bg-[#EAF7EE]"
                      >
                        <Check className="h-8 w-8 text-[#15803D]" />
                      </motion.span>
                      <div>
                        <h2 className="text-[24px] font-extrabold tracking-[-0.8px]">
                          Pembayaran berhasil
                        </h2>
                        <p className="mt-1 text-[13px] font-medium text-[#5D6370]">
                          {formatRupiah(payment.total)} sudah diterima. Pesanan
                          diteruskan ke dapur.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={resetOrder}
                        className="mt-2 w-full rounded-[10px] bg-[#C81E28] px-5 py-3 text-[14px] font-bold text-white transition-colors hover:bg-[#A8161F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C81E28]"
                      >
                        Pesan lagi
                      </button>
                    </div>
                  ) : payment.status === "expired" ? (
                    <div className="mt-8 flex flex-col items-center gap-4 text-center">
                      <span className="grid h-16 w-16 place-items-center rounded-full bg-[#F2F3F5]">
                        <X className="h-8 w-8 text-[#5D6370]" />
                      </span>
                      <div>
                        <h2 className="text-[24px] font-extrabold tracking-[-0.8px]">
                          Waktu pembayaran habis
                        </h2>
                        <p className="mt-1 text-[13px] font-medium text-[#5D6370]">
                          Pesanan belum dibayar. Silakan pesan ulang.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={resetOrder}
                        className="mt-2 w-full rounded-[10px] bg-[#C81E28] px-5 py-3 text-[14px] font-bold text-white transition-colors hover:bg-[#A8161F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C81E28]"
                      >
                        Pesan lagi
                      </button>
                    </div>
                  ) : (
                    <>
                      <motion.div
                        initial={reduced ? false : { opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.4,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className="mt-4 rounded-[16px] bg-white p-4 outline outline-1 -outline-offset-[0.5px] outline-[#E3E5E9]"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-[10px] font-extrabold tracking-[0.5px] text-[#5D6370]">
                              TOTAL BAYAR
                            </p>
                            <p className="text-[30px] font-extrabold tracking-[-1.2px] text-[#16181D]">
                              {formatRupiah(payment.total)}
                            </p>
                          </div>
                          <span className="rounded-full bg-[#FDECEC] px-2.5 py-1 text-[10px] font-extrabold text-[#C81E28]">
                            {countdown}
                          </span>
                        </div>
                        <div className="mt-4 rounded-[12px] bg-[#F5F6F8] p-2">
                          <QrImage
                            value={payment.qrisPayload}
                            downloadName={`qris-${payment.orderId}.png`}
                            width={420}
                          />
                        </div>
                        <p className="mt-3 text-center text-[11.5px] leading-[18px] font-medium text-[#5D6370]">
                          Pindai dengan aplikasi pembayaran. Status berubah
                          otomatis setelah kasir mengonfirmasi.
                        </p>
                      </motion.div>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto px-4 pb-28">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-extrabold tracking-[0.5px] text-[#C81E28]">
                          MEJA {data.table.code}
                          {data.table.label ? ` · ${data.table.label}` : ""}
                        </p>
                        <h1 className="text-[22px] font-extrabold tracking-[-0.6px] text-[#16181D]">
                          {data.clientName}
                        </h1>
                      </div>
                      <span className="inline-flex items-center rounded-full bg-[#EAF7EE] px-2.5 py-1 text-[9px] font-extrabold tracking-[0.4px] text-[#15803D]">
                        <span className="mr-1 h-1.5 w-1.5 rounded-full bg-[#15803D]" />
                        {data.qrisReady ? "QRIS SIAP" : "QRIS BELUM SIAP"}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-2 rounded-[10px] bg-[#F5F6F8] px-3 py-2.5">
                      <Search className="h-3.5 w-3.5 text-[#7C8290]" />
                      <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Cari menu…"
                        className="w-full bg-transparent text-[12px] font-medium text-[#16181D] outline-none placeholder:text-[#7C8290]"
                      />
                    </div>

                    <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
                      {categories.map((entry) => (
                        <button
                          key={entry}
                          type="button"
                          onClick={() => setCategory(entry)}
                          className={`shrink-0 rounded-[7px] px-3 py-1.5 text-[10.5px] font-bold transition-colors ${
                            category === entry
                              ? "bg-[#C81E28] text-white"
                              : "bg-[#F2F3F5] text-[#5D6370] hover:bg-[#E3E5E9]"
                          }`}
                        >
                          {entry}
                        </button>
                      ))}
                    </div>

                    {!data.qrisReady ? (
                      <p className="mt-4 rounded-[10px] bg-[#FDECEC] p-3 text-[11.5px] font-semibold text-[#C81E28]">
                        Merchant belum menyiapkan QRIS aktif. Pesanan belum bisa
                        dibayar.
                      </p>
                    ) : null}

                    {visibleProducts.length === 0 ? (
                      <div className="mt-10 flex flex-col items-center gap-2 text-center">
                        <UtensilsCrossed className="h-6 w-6 text-[#7C8290]" />
                        <p className="text-[12px] font-medium text-[#5D6370]">
                          Menu tidak ditemukan.
                        </p>
                      </div>
                    ) : (
                      <div className="mt-4 grid grid-cols-2 gap-x-2.5 gap-y-4">
                        {visibleProducts.map((product, index) => {
                          const qty = cart[product.id] ?? 0;
                          return (
                            <motion.button
                              key={product.id}
                              type="button"
                              onClick={() => changeQty(product.id, 1)}
                              initial={reduced ? false : { opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{
                                duration: 0.26,
                                delay: reduced ? 0 : Math.min(index * 0.03, 0.24),
                                ease: [0.22, 1, 0.36, 1],
                              }}
                              whileTap={reduced ? undefined : { scale: 0.97 }}
                              className="group flex flex-col text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C81E28]"
                              aria-label={`Tambah ${product.name}`}
                            >
                              <span className="relative block overflow-hidden rounded-[10px] bg-[#FDECEC]">
                                {product.imageUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={product.imageUrl}
                                    alt=""
                                    className="h-[104px] w-full object-cover"
                                  />
                                ) : (
                                  <span className="grid h-[104px] w-full place-items-center">
                                    <UtensilsCrossed className="h-7 w-7 text-[#C81E28]" />
                                  </span>
                                )}
                                {qty > 0 ? (
                                  <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-[#C81E28] text-[10px] font-extrabold text-white">
                                    {qty}
                                  </span>
                                ) : null}
                                <span className="absolute bottom-1.5 right-1.5 grid h-6 w-6 place-items-center rounded-full bg-white text-[#C81E28] shadow-sm">
                                  <Plus className="h-3.5 w-3.5" />
                                </span>
                              </span>
                              <span className="mt-1.5 line-clamp-1 text-[10.5px] font-bold text-[#16181D]">
                                {product.name}
                              </span>
                              <span className="text-[10.5px] font-extrabold text-[#C81E28]">
                                {formatRupiah(product.price)}
                              </span>
                            </motion.button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <motion.div
                    initial={reduced ? false : { y: 48, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 260,
                      damping: 28,
                    }}
                    className="absolute inset-x-0 bottom-0 border-t border-[#EFF0F3] bg-white/95 p-3 backdrop-blur"
                  >
                    <button
                      type="button"
                      disabled={cartItems.length === 0}
                      onClick={() => setShowCart(true)}
                      className="flex w-full items-center justify-between rounded-[10px] bg-[#C81E28] px-3.5 py-2.5 text-left transition-colors hover:bg-[#A8161F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C81E28] disabled:cursor-not-allowed disabled:bg-[#E3E5E9]"
                    >
                      <span className="flex flex-col">
                        <span className="text-[8px] font-extrabold tracking-[0.4px] text-[#F6D3D3]">
                          {itemCount > 0
                            ? `${itemCount} ITEM · LIHAT KERANJANG`
                            : "PILIH MENU DULU"}
                        </span>
                        <span
                          className={`text-[14px] font-extrabold ${cartItems.length > 0 ? "text-white" : "text-[#7C8290]"}`}
                        >
                          {formatRupiah(total)}
                        </span>
                      </span>
                      <span
                        className={`rounded-[6px] px-3 py-1.5 text-[10px] font-extrabold ${
                          cartItems.length > 0
                            ? "bg-white text-[#C81E28]"
                            : "bg-[#F2F3F5] text-[#7C8290]"
                        }`}
                      >
                        Bayar
                        <ChevronRight className="ml-0.5 inline h-3 w-3" />
                      </span>
                    </button>
                  </motion.div>
                </>
              )}

              <AnimatePresence>
                {showCart ? (
                  <motion.div
                    key="cart"
                    initial={reduced ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="absolute inset-0 z-20 flex flex-col justify-end bg-[#16181D]/35"
                  >
                    <button
                      type="button"
                      aria-label="Tutup keranjang"
                      className="flex-1"
                      onClick={() => setShowCart(false)}
                    />
                    <motion.div
                      initial={reduced ? false : { y: "100%" }}
                      animate={{ y: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 320,
                        damping: 34,
                      }}
                      className="max-h-[82%] overflow-y-auto rounded-t-[22px] bg-white p-4 shadow-[0_-14px_34px_#16181D1F]"
                    >
                    <div className="flex items-center justify-between">
                      <h2 className="text-[18px] font-extrabold tracking-[-0.4px]">
                        Pesanan kamu
                      </h2>
                      <button
                        type="button"
                        aria-label="Tutup"
                        onClick={() => setShowCart(false)}
                        className="grid h-8 w-8 place-items-center rounded-full bg-[#F2F3F5] text-[#5D6370]"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-3 space-y-2.5">
                      {cartItems.map((item) => (
                        <div
                          key={item.product.id}
                          className="flex items-center gap-2.5 rounded-[10px] bg-[#F5F6F8] p-2.5"
                        >
                          <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-[8px] bg-[#FDECEC]">
                            {item.product.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.product.imageUrl}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <UtensilsCrossed className="h-4 w-4 text-[#C81E28]" />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[11.5px] font-bold text-[#16181D]">
                              {item.product.name}
                            </span>
                            <span className="block text-[10.5px] font-extrabold text-[#C81E28]">
                              {formatRupiah(item.product.price * item.qty)}
                            </span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <button
                              type="button"
                              aria-label={`Kurangi ${item.product.name}`}
                              onClick={() => changeQty(item.product.id, -1)}
                              className="grid h-6 w-6 place-items-center rounded-full bg-white text-[#16181D] outline outline-1 -outline-offset-[0.5px] outline-[#D9DBE0]"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-4 text-center text-[11px] font-bold">
                              {item.qty}
                            </span>
                            <button
                              type="button"
                              aria-label={`Tambah ${item.product.name}`}
                              onClick={() => changeQty(item.product.id, 1)}
                              className="grid h-6 w-6 place-items-center rounded-full bg-[#C81E28] text-white"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 grid gap-2">
                      <Input
                        value={customerName}
                        maxLength={80}
                        placeholder="Nama (opsional)"
                        onChange={(event) => setCustomerName(event.target.value)}
                        className="h-10 rounded-[10px] bg-[#F5F6F8] text-[12px]"
                      />
                      <Textarea
                        value={note}
                        maxLength={500}
                        rows={2}
                        placeholder="Catatan untuk dapur (opsional)"
                        onChange={(event) => setNote(event.target.value)}
                        className="rounded-[10px] bg-[#F5F6F8] text-[12px]"
                      />
                    </div>

                    {error ? (
                      <p className="mt-2 text-[11.5px] font-semibold text-[#C81E28]">
                        {error}
                      </p>
                    ) : null}

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[10px] font-extrabold tracking-[0.4px] text-[#5D6370]">
                        TOTAL
                      </span>
                      <span className="text-[22px] font-extrabold tracking-[-0.8px] text-[#16181D]">
                        {formatRupiah(total)}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={
                        submitting || cartItems.length === 0 || !data.qrisReady
                      }
                      onClick={submitOrder}
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#C81E28] px-5 py-3 text-[14px] font-bold text-white transition-colors hover:bg-[#A8161F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C81E28] disabled:cursor-not-allowed disabled:bg-[#E3E5E9] disabled:text-[#7C8290]"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      {submitting
                        ? "Memproses..."
                        : `Pesan & bayar · ${formatRupiah(total)}`}
                    </button>
                    </motion.div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
          <p className="hidden text-center text-[11.5px] font-medium text-[#7C8290] md:block">
            Tampilan pelanggan setelah memindai QR meja.
          </p>
        </div>
      </div>
    </div>
  );
}
