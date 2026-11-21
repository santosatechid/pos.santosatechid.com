"use client";

import { jakarta } from "@/components/landing/font";
import PrinterSettingsButton from "@/components/printer/PrinterSettingsButton";
import QrImage from "@/components/qris/QrImage";
import QrisDialogContent from "@/components/qris/QrisDialogContent";
import { formatDateTime, formatRupiah } from "@/components/qris/qr";
import { Button } from "@/components/ui/button";
import { Dialog, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useGetClient } from "@/hooks/clients/useClients";
import { useReceiptPrinter } from "@/hooks/printer/useReceiptPrinter";
import {
  type OrderType,
  type PosOrderResult,
  type ProductRecord,
  useCreatePosOrder,
  useGetOrderStats,
  useGetProducts,
  useGetTables,
} from "@/hooks/qris/usePos";
import {
  useConfirmQrisTransaction,
  useGetQrisAccounts,
  useGetQrisTransaction,
} from "@/hooks/qris/useQris";
import { useGetUserByIdBetterAuth } from "@/hooks/users/useUsersByIdBetterAuth";
import { buildReceiptBytes } from "@/lib/printer/escpos";
import { loadReceiptLogo } from "@/lib/printer/image";
import {
  Banknote,
  Check,
  ChevronRight,
  Landmark,
  Minus,
  Plus,
  Printer,
  QrCode,
  RefreshCcw,
  Search,
  ShoppingCart,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "@/services/auth/authClients";
import { toast } from "sonner";

type CartItem = { product: ProductRecord; qty: number };

type ReceiptSnapshot = {
  orderId: string;
  total: number;
  paymentMethod: "qris" | "cash" | "transfer";
  receiptNumber?: number;
  receiptCode?: string;
  createdAt: string;
  orderType: OrderType;
  customerName: string | null;
  note: string | null;
  table: { code: string; label: string | null } | null;
  items: { name: string; qty: number; unitPrice: number; note: null }[];
};

const ORDER_TYPES: { value: OrderType; label: string }[] = [
  { value: "dine-in", label: "Dine-in" },
  { value: "takeaway", label: "Bawa pulang" },
  { value: "delivery", label: "Diantar" },
];

function OrderPanel({
  cartItems,
  total,
  itemCount,
  orderType,
  tableId,
  setTableId,
  tables,
  customerName,
  setCustomerName,
  note,
  setNote,
  changeQty,
  qrisReady,
  submitting,
  onSubmit,
}: {
  cartItems: CartItem[];
  total: number;
  itemCount: number;
  orderType: OrderType;
  tableId: string;
  setTableId: (value: string) => void;
  tables: { id: string; code: string; label: string | null }[];
  customerName: string;
  setCustomerName: (value: string) => void;
  note: string;
  setNote: (value: string) => void;
  changeQty: (productId: string, delta: number) => void;
  qrisReady: boolean;
  submitting: boolean;
  onSubmit: () => void;
}) {
  return (
    <div className="rounded-[16px] bg-white p-4 outline outline-1 -outline-offset-[0.5px] outline-[#E3E5E9]">
      <div className="flex items-center justify-between">
        <h2 className="text-[17px] font-extrabold tracking-[-0.4px] text-[#16181D]">
          Pesanan
        </h2>
        <span className="rounded-full bg-[#FDECEC] px-2.5 py-1 text-[10px] font-extrabold text-[#C81E28]">
          {itemCount} item
        </span>
      </div>

      <div className="mt-3 max-h-[280px] space-y-2 overflow-y-auto pr-1">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <ShoppingCart className="h-6 w-6 text-[#7C8290]" />
            <p className="text-[12px] font-medium text-[#5D6370]">
              Pilih menu untuk mulai pesanan.
            </p>
          </div>
        ) : (
          cartItems.map(({ product, qty }) => (
            <div
              key={product.id}
              className="flex items-center gap-2.5 rounded-[10px] bg-[#F5F6F8] p-2.5"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-[8px] bg-[#FDECEC]">
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UtensilsCrossed className="h-4 w-4 text-[#C81E28]" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[11.5px] font-bold text-[#16181D]">
                  {product.name}
                </span>
                <span className="block text-[10.5px] font-extrabold text-[#C81E28]">
                  {formatRupiah(product.price * qty)}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label={`Kurangi ${product.name}`}
                  onClick={() => changeQty(product.id, -1)}
                  className="grid h-6 w-6 place-items-center rounded-full bg-white text-[#16181D] outline outline-1 -outline-offset-[0.5px] outline-[#D9DBE0]"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-4 text-center text-[11px] font-bold">
                  {qty}
                </span>
                <button
                  type="button"
                  aria-label={`Tambah ${product.name}`}
                  onClick={() => changeQty(product.id, 1)}
                  className="grid h-6 w-6 place-items-center rounded-full bg-[#C81E28] text-white"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </span>
            </div>
          ))
        )}
      </div>

      {orderType === "dine-in" ? (
        <div className="mt-3 space-y-1.5">
          <p className="text-[10px] font-extrabold tracking-[0.4px] text-[#5D6370]">
            MEJA
          </p>
          <Select
            value={tableId || "none"}
            onValueChange={(value) =>
              setTableId(value === "none" ? "" : value)
            }
          >
            <SelectTrigger className="h-10 w-full rounded-[10px] bg-[#F5F6F8] text-[12px]">
              <SelectValue placeholder="Pilih meja" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Tanpa meja</SelectItem>
              {tables.map((table) => (
                <SelectItem key={table.id} value={table.id}>
                  Meja {table.code}
                  {table.label ? ` · ${table.label}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <div className="mt-3 grid gap-2">
        <Input
          value={customerName}
          maxLength={80}
          placeholder="Nama pelanggan (opsional)"
          onChange={(event) => setCustomerName(event.target.value)}
          className="h-10 rounded-[10px] bg-[#F5F6F8] text-[12px]"
        />
        <Textarea
          value={note}
          maxLength={500}
          rows={2}
          placeholder="Catatan dapur (opsional)"
          onChange={(event) => setNote(event.target.value)}
          className="rounded-[10px] bg-[#F5F6F8] text-[12px]"
        />
      </div>

      {!qrisReady ? (
        <p className="mt-3 rounded-[10px] bg-[#FDECEC] p-2.5 text-[11px] font-semibold text-[#C81E28]">
          QRIS belum aktif. Pembayaran cash tetap bisa; aktifkan QRIS di menu
          QRIS untuk pembayaran QR.
        </p>
      ) : null}

      <div className="mt-3 flex items-center justify-between border-t border-[#EFF0F3] pt-3">
        <span className="text-[10px] font-extrabold tracking-[0.4px] text-[#5D6370]">
          TOTAL
        </span>
        <span className="text-[22px] font-extrabold tracking-[-0.8px] text-[#16181D]">
          {formatRupiah(total)}
        </span>
      </div>

      <Button
        type="button"
        onClick={onSubmit}
        disabled={submitting || cartItems.length === 0}
        className="mt-2 h-11 w-full rounded-[10px] bg-[#C81E28] text-[13px] font-bold text-white hover:bg-[#A8161F]"
      >
        <ShoppingCart className="mr-2 h-4 w-4" />
        {submitting ? "Memproses..." : "Bayar"}
      </Button>
    </div>
  );
}

export default function PosTerminal() {
  const reduced = useReducedMotion() ?? false;
  const { data: session } = useSession();
  const { data: currentUser } = useGetUserByIdBetterAuth(
    session?.user?.id ?? "",
  );
  const { data: products = [] } = useGetProducts();
  const { data: tables = [] } = useGetTables();
  const { data: accounts = [] } = useGetQrisAccounts();
  const createOrder = useCreatePosOrder();
  const confirmPayment = useConfirmQrisTransaction();
  const { data: client } = useGetClient();
  const printer = useReceiptPrinter();
  const { autoPrint, print: printBytes } = printer;
  const printerConnected =
    printer.status === "connected" || printer.status === "printing";

  const [lastOrder, setLastOrder] = useState<ReceiptSnapshot | null>(null);
  const printedOrderRef = useRef<string | null>(null);

  const [cart, setCart] = useState<Record<string, number>>({});
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Semua");
  const [orderType, setOrderType] = useState<OrderType>("dine-in");
  const [tableId, setTableId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [note, setNote] = useState("");
  const [showCart, setShowCart] = useState(false);
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [showQrisPicker, setShowQrisPicker] = useState(false);
  const [payment, setPayment] = useState<PosOrderResult | null>(null);
  const qrisStatus = useGetQrisTransaction(
    payment?.qrisTransactionId ?? null,
    true,
  );
  const { data: stats } = useGetOrderStats(currentUser?.branch?.id ?? "all");
  const balances = stats?.balances ?? { cash: 0, transfer: 0, qris: 0 };

  const activeQrisAccounts = useMemo(
    () => accounts.filter((account) => account.isActive),
    [accounts],
  );
  const qrisReady = activeQrisAccounts.length > 0;
  const activeTables = tables.filter((table) => table.isActive);

  const categories = useMemo(
    () => [
      "Semua",
      ...new Set(
        products
          .map((product) => product.category?.trim())
          .filter((value): value is string => Boolean(value)),
      ),
    ],
    [products],
  );

  const visibleProducts = useMemo(
    () =>
      products.filter((product) => {
        const matchesCategory =
          category === "Semua" || product.category === category;
        const matchesQuery = product.name
          .toLowerCase()
          .includes(query.trim().toLowerCase());
        return product.isActive && matchesCategory && matchesQuery;
      }),
    [category, products, query],
  );

  const productById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
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
          (item): item is CartItem => Boolean(item.product),
        ),
    [cart, productById],
  );

  const total = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.qty,
    0,
  );
  const itemCount = cartItems.reduce((sum, item) => sum + item.qty, 0);

  const changeQty = (productId: string, delta: number) => {
    setCart((current) => {
      const next = Math.min(99, Math.max(0, (current[productId] ?? 0) + delta));
      return { ...current, [productId]: next };
    });
  };

  const resetOrder = () => {
    setCart({});
    setTableId("");
    setCustomerName("");
    setNote("");
    setShowCart(false);
  };

  const printReceipt = useCallback(
    async (snapshot: ReceiptSnapshot) => {
      const logo =
        (await loadReceiptLogo(client?.logoUrl)) ??
        (await loadReceiptLogo("/Logo.svg"));
      const ok = await printBytes(
        buildReceiptBytes({
          store: {
            name: client?.name ?? currentUser?.branch?.name ?? "Kasir",
            address: currentUser?.branch?.address ?? client?.address ?? null,
            phone: currentUser?.branch?.phone ?? client?.phone ?? null,
            logo,
          },
          order: {
            id: snapshot.orderId,
            createdAt: snapshot.createdAt,
            orderType: snapshot.orderType,
            paymentMethod: snapshot.paymentMethod,
            receiptNumber: snapshot.receiptNumber,
            receiptCode: snapshot.receiptCode,
            cashier: currentUser?.name ?? null,
            customerName: snapshot.customerName,
            note: snapshot.note,
            table: snapshot.table,
            items: snapshot.items,
            total: snapshot.total,
          },
        }),
      );
      if (ok) toast.success("Struk dikirim ke printer.");
      else toast.error("Gagal mencetak struk. Cek printer.");
    },
    [client, currentUser, printBytes],
  );

  const printReceiptIfNeeded = useCallback(
    async (snapshot: ReceiptSnapshot | null) => {
      if (!snapshot || printedOrderRef.current === snapshot.orderId) return;
      printedOrderRef.current = snapshot.orderId;
      if (!autoPrint || !printerConnected) return;
      await printReceipt(snapshot);
    },
    [autoPrint, printReceipt, printerConnected],
  );

  const submitOrder = () => {
    if (cartItems.length === 0) {
      toast.error("Pilih minimal satu menu.");
      return;
    }
    setShowPaymentMethods(true);
  };

  const payWith = async (
    method: "qris" | "cash" | "transfer",
    accountId?: string,
  ) => {
    if (method === "qris" && !qrisReady) {
      toast.error("QRIS belum aktif.");
      return;
    }

    const selectedTable =
      orderType === "dine-in"
        ? activeTables.find((table) => table.id === tableId)
        : undefined;
    const receiptBase = {
      createdAt: new Date().toISOString(),
      orderType,
      customerName: customerName.trim() || null,
      note: note.trim() || null,
      table: selectedTable
        ? { code: selectedTable.code, label: selectedTable.label }
        : null,
      items: cartItems.map(({ product, qty }) => ({
        name: product.name,
        qty,
        unitPrice: product.price,
        note: null as null,
      })),
    };

    try {
      const result = await createOrder.mutateAsync({
        orderType,
        paymentMethod: method,
        accountId: method === "qris" ? accountId ?? null : null,
        tableId: orderType === "dine-in" ? tableId || null : null,
        customerName: customerName.trim() || null,
        note: note.trim() || null,
        items: cartItems.map((item) => ({
          productId: item.product.id,
          qty: item.qty,
        })),
      });

      setShowPaymentMethods(false);
      resetOrder();

      const snapshot: ReceiptSnapshot = {
        ...receiptBase,
        orderId: result.orderId,
        total: result.total,
        paymentMethod: result.paymentMethod,
        receiptNumber: result.receiptNumber,
        receiptCode: result.receiptCode,
      };
      setLastOrder(snapshot);

      if (result.paymentMethod === "cash") {
        toast.success("Pembayaran cash masuk saldo cash.");
        await printReceiptIfNeeded(snapshot);
        return;
      }

      if (result.paymentMethod === "transfer") {
        toast.success("Pembayaran transfer dicatat.");
        await printReceiptIfNeeded(snapshot);
        return;
      }

      setPayment(result);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal membuat pesanan",
      );
    }
  };

  const handleQrisPay = () => {
    if (activeQrisAccounts.length === 0) {
      toast.error("QRIS belum aktif.");
      return;
    }
    if (activeQrisAccounts.length === 1) {
      setShowPaymentMethods(false);
      void payWith("qris", activeQrisAccounts[0].id);
      return;
    }
    setShowPaymentMethods(false);
    setShowQrisPicker(true);
  };

  const paymentStatus = qrisStatus.data?.status ?? "pending";
  const paymentStatusLabel =
    paymentStatus === "paid"
      ? "Lunas"
      : paymentStatus === "expired"
        ? "Kedaluwarsa"
        : "Menunggu pembayaran";

  useEffect(() => {
    if (paymentStatus !== "paid" || !payment || !lastOrder) return;
    if (payment.orderId !== lastOrder.orderId) return;
    void printReceiptIfNeeded(lastOrder);
  }, [paymentStatus, payment, lastOrder, printReceiptIfNeeded]);

  const checkPayment = async () => {
    const result = await qrisStatus.refetch();
    const status = result.data?.status;
    if (!status) {
      toast.error("Gagal cek status pembayaran");
      return;
    }
    if (status === "paid") toast.success("Pembayaran sudah diterima");
    else if (status === "expired") toast.error("QRIS sudah kedaluwarsa");
    else toast("Belum ada pembayaran masuk");
  };

  const markPaid = async () => {
    if (!payment?.qrisTransactionId) return;
    try {
      await confirmPayment.mutateAsync(payment.qrisTransactionId);
      toast.success("Pembayaran lunas, masuk saldo QRIS.");
      await printReceiptIfNeeded(lastOrder);
      setPayment(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal konfirmasi pembayaran",
      );
    }
  };

  const panelProps = {
    cartItems,
    total,
    itemCount,
    orderType,
    tableId,
    setTableId,
    tables: activeTables,
    customerName,
    setCustomerName,
    note,
    setNote,
    changeQty,
    qrisReady,
    submitting: createOrder.isPending,
    onSubmit: submitOrder,
  };

  return (
    <div
      className={`${jakarta.className} landing-theme min-h-[100dvh] bg-[#F7F7F8] pb-40 text-[#16181D]`}
    >
      <header className="sticky top-0 z-30 border-b border-[#E3E5E9] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-4 py-3 lg:px-6">
          <div className="min-w-0 flex-1">
            <p className="text-[9.5px] font-extrabold tracking-[0.6px] text-[#C81E28]">
              KASIR
            </p>
            <p className="truncate text-[16px] font-extrabold tracking-[-0.3px] text-[#16181D]">
              {currentUser?.branch?.name ?? "Kasir"}
              {tableId
                ? ` · Meja ${activeTables.find((table) => table.id === tableId)?.code ?? ""}`
                : ""}
            </p>
          </div>
          <span
            className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[9px] font-extrabold tracking-[0.4px] ${
              qrisReady
                ? "bg-[#EAF7EE] text-[#15803D]"
                : "bg-[#FDECEC] text-[#C81E28]"
            }`}
          >
            <span
              className={`mr-1 h-1.5 w-1.5 rounded-full ${
                qrisReady ? "bg-[#15803D]" : "bg-[#C81E28]"
              }`}
            />
            {qrisReady ? "QRIS SIAP" : "QRIS BELUM SIAP"}
          </span>
          <PrinterSettingsButton />
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[1440px] gap-5 px-4 py-4 lg:grid-cols-[1fr_360px] lg:px-6 lg:py-6">
        <section>
          <div className="mb-3 grid grid-cols-3 gap-2">
            <div className="rounded-[12px] bg-white p-3 outline outline-1 -outline-offset-[0.5px] outline-[#E3E5E9]">
              <p className="text-[9px] font-extrabold tracking-[0.5px] text-[#5D6370]">
                SALDO CASH
              </p>
              <p className="mt-0.5 text-[16px] font-extrabold tracking-[-0.4px] text-[#16181D]">
                {formatRupiah(balances.cash)}
              </p>
            </div>
            <div className="rounded-[12px] bg-white p-3 outline outline-1 -outline-offset-[0.5px] outline-[#E3E5E9]">
              <p className="text-[9px] font-extrabold tracking-[0.5px] text-[#5D6370]">
                SALDO TF
              </p>
              <p className="mt-0.5 text-[16px] font-extrabold tracking-[-0.4px] text-[#16181D]">
                {formatRupiah(balances.transfer)}
              </p>
            </div>
            <div className="rounded-[12px] bg-white p-3 outline outline-1 -outline-offset-[0.5px] outline-[#E3E5E9]">
              <p className="text-[9px] font-extrabold tracking-[0.5px] text-[#5D6370]">
                SALDO QRIS
              </p>
              <p className="mt-0.5 text-[16px] font-extrabold tracking-[-0.4px] text-[#16181D]">
                {formatRupiah(balances.qris)}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {ORDER_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setOrderType(type.value)}
                className={`flex-1 rounded-[8px] px-3 py-2.5 text-[12px] font-bold transition-colors ${
                  orderType === type.value
                    ? "bg-[#C81E28] text-white"
                    : "bg-[#F2F3F5] text-[#5D6370] hover:bg-[#E3E5E9]"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-[10px] bg-white px-3 py-2.5 outline outline-1 -outline-offset-[0.5px] outline-[#E3E5E9]">
            <Search className="h-4 w-4 text-[#7C8290]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari menu..."
              className="w-full bg-transparent text-[13px] font-medium text-[#16181D] outline-none placeholder:text-[#7C8290]"
            />
          </div>

          <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0">
            {categories.map((entry) => (
              <button
                key={entry}
                type="button"
                onClick={() => setCategory(entry)}
                className={`shrink-0 rounded-[7px] px-3 py-1.5 text-[11px] font-bold transition-colors ${
                  category === entry
                    ? "bg-[#C81E28] text-white"
                    : "bg-white text-[#5D6370] outline outline-1 -outline-offset-[0.5px] outline-[#E3E5E9] hover:bg-[#F5F6F8]"
                }`}
              >
                {entry}
              </button>
            ))}
          </div>

          {visibleProducts.length === 0 ? (
            <div className="mt-10 flex flex-col items-center gap-2 text-center">
              <UtensilsCrossed className="h-7 w-7 text-[#7C8290]" />
              <p className="text-[13px] font-medium text-[#5D6370]">
                Belum ada produk aktif.
              </p>
              <a
                href="/dashboard/admin/utility/qris/products"
                className="text-[12px] font-bold text-[#C81E28] underline-offset-2 hover:underline"
              >
                Tambah produk
              </a>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {visibleProducts.map((product) => {
                const qty = cart[product.id] ?? 0;
                return (
                  <motion.button
                    key={product.id}
                    type="button"
                    onClick={() => changeQty(product.id, 1)}
                    whileTap={reduced ? undefined : { scale: 0.98 }}
                    className="group flex flex-col overflow-hidden rounded-[14px] bg-white text-left outline outline-1 -outline-offset-[0.5px] outline-[#E3E5E9] transition-shadow hover:shadow-[0_8px_24px_#16181D12] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C81E28]"
                    aria-label={`Tambah ${product.name}`}
                  >
                    <span className="relative block h-[120px] overflow-hidden bg-[#FDECEC]">
                      {product.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.imageUrl}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <span className="grid h-full w-full place-items-center">
                          <UtensilsCrossed className="h-8 w-8 text-[#C81E28]" />
                        </span>
                      )}
                      {qty > 0 ? (
                        <span className="absolute right-2 top-2 grid h-6 min-w-6 place-items-center rounded-full bg-[#C81E28] px-1.5 text-[10px] font-extrabold text-white">
                          {qty}
                        </span>
                      ) : null}
                      <span className="absolute bottom-2 right-2 grid h-7 w-7 place-items-center rounded-full bg-white text-[#C81E28] shadow-sm">
                        <Plus className="h-4 w-4" />
                      </span>
                    </span>
                    <span className="flex flex-1 flex-col gap-0.5 p-3">
                      <span className="line-clamp-1 text-[12.5px] font-bold text-[#16181D]">
                        {product.name}
                      </span>
                      <span className="text-[11.5px] font-extrabold text-[#C81E28]">
                        {formatRupiah(product.price)}
                      </span>
                    </span>
                  </motion.button>
                );
              })}
            </div>
          )}
        </section>

        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <OrderPanel {...panelProps} />
          </div>
        </aside>
      </main>

      <div className="fixed inset-x-0 bottom-[70px] z-30 border-t border-[#E3E5E9] bg-white/95 p-3 backdrop-blur lg:hidden">
        <div className="mx-auto max-w-[720px]">
          <button
            type="button"
            disabled={cartItems.length === 0}
            onClick={() => setShowCart(true)}
            className="flex w-full items-center justify-between rounded-[10px] bg-[#C81E28] px-3.5 py-2.5 text-left transition-colors hover:bg-[#A8161F] disabled:bg-[#E3E5E9]"
          >
            <span className="flex flex-col">
              <span className="text-[8px] font-extrabold tracking-[0.4px] text-[#F6D3D3]">
                {itemCount > 0
                  ? `${itemCount} ITEM · LIHAT KERANJANG`
                  : "PILIH MENU DULU"}
              </span>
              <span
                className={`text-[14px] font-extrabold ${
                  cartItems.length > 0 ? "text-white" : "text-[#7C8290]"
                }`}
              >
                {formatRupiah(total)}
              </span>
            </span>
            <span className="flex items-center gap-1 rounded-[6px] bg-white px-3 py-1.5 text-[10px] font-extrabold text-[#C81E28]">
              Pesanan <ChevronRight className="h-3 w-3" />
            </span>
          </button>
        </div>
      </div>

      <Dialog open={showCart} onOpenChange={setShowCart}>
        <QrisDialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-md">
          <DialogTitle className="sr-only">Keranjang pesanan</DialogTitle>
          <DialogDescription className="sr-only">
            Ringkasan item dan total sebelum pembayaran.
          </DialogDescription>
          <OrderPanel {...panelProps} />
        </QrisDialogContent>
      </Dialog>

      <Dialog open={showQrisPicker} onOpenChange={setShowQrisPicker}>
        <QrisDialogContent className="sm:max-w-md">
          <DialogTitle className="sr-only">Pilih akun QRIS</DialogTitle>
          <DialogDescription className="sr-only">
            Pilih akun QRIS yang dipakai untuk pembayaran ini.
          </DialogDescription>
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-extrabold tracking-[0.5px] text-[#C81E28]">
                PILIH QRIS
              </p>
              <p className="text-[18px] font-extrabold tracking-[-0.4px] text-[#16181D]">
                Akun mana yang dipakai?
              </p>
              <p className="mt-1 text-[11.5px] font-medium text-[#5D6370]">
                Total {formatRupiah(total)}. QR yang tampil mengikuti akun yang
                dipilih.
              </p>
            </div>

            <div className="space-y-2">
              {activeQrisAccounts.map((account) => (
                <button
                  key={account.id}
                  type="button"
                  disabled={createOrder.isPending}
                  onClick={() => {
                    setShowQrisPicker(false);
                    void payWith("qris", account.id);
                  }}
                  className="flex w-full items-center gap-3 rounded-[14px] border border-[#E3E5E9] bg-white p-3 text-left transition-colors hover:border-[#C81E28] hover:bg-[#FDECEC] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[10px] bg-[#FDECEC] text-[#C81E28]">
                    <QrCode className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-extrabold text-[#16181D]">
                      {account.label}
                    </span>
                    <span className="block truncate text-[11px] font-medium text-[#5D6370]">
                      {account.merchantName} · {account.merchantCity}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-[#7C8290]" />
                </button>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowQrisPicker(false);
                setShowPaymentMethods(true);
              }}
              className="h-11 w-full rounded-[10px] text-[13px] font-bold"
            >
              Kembali
            </Button>
          </div>
        </QrisDialogContent>
      </Dialog>

      <Dialog
        open={showPaymentMethods}
        onOpenChange={setShowPaymentMethods}
      >
        <QrisDialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogTitle className="sr-only">Pilih pembayaran</DialogTitle>
          <DialogDescription className="sr-only">
            Pilih metode pembayaran QRIS, transfer, atau cash.
          </DialogDescription>
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-extrabold tracking-[0.5px] text-[#C81E28]">
                PILIH PEMBAYARAN
              </p>
              <p className="text-[24px] font-extrabold tracking-[-0.8px] text-[#16181D]">
                {formatRupiah(total)}
              </p>
            </div>

            <button
              type="button"
              disabled={!qrisReady || createOrder.isPending}
              onClick={handleQrisPay}
              className="flex w-full items-center gap-3 rounded-[14px] border border-[#E3E5E9] bg-white p-3 text-left transition-colors hover:border-[#C81E28] hover:bg-[#FDECEC] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="grid h-11 w-11 place-items-center rounded-[10px] bg-[#FDECEC] text-[#C81E28]">
                <QrCode className="h-5 w-5" />
              </span>
              <span className="flex-1">
                <span className="block text-[13px] font-extrabold text-[#16181D]">
                  QRIS
                </span>
                <span className="block text-[11px] font-medium text-[#5D6370]">
                  {qrisReady
                    ? activeQrisAccounts.length > 1
                      ? `${activeQrisAccounts.length} akun aktif, pilih QRIS dulu.`
                      : "Buat QR dinamis, konfirmasi setelah dana masuk."
                    : "QRIS belum aktif."}
                </span>
              </span>
              <ChevronRight className="h-4 w-4 text-[#7C8290]" />
            </button>

            <button
              type="button"
              disabled={createOrder.isPending}
              onClick={() => void payWith("transfer")}
              className="flex w-full items-center gap-3 rounded-[14px] border border-[#E3E5E9] bg-white p-3 text-left transition-colors hover:border-[#C81E28] hover:bg-[#FDECEC] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="grid h-11 w-11 place-items-center rounded-[10px] bg-[#EEF3FD] text-[#1D4ED8]">
                <Landmark className="h-5 w-5" />
              </span>
              <span className="flex-1">
                <span className="block text-[13px] font-extrabold text-[#16181D]">
                  Transfer
                </span>
                <span className="block text-[11px] font-medium text-[#5D6370]">
                  Transfer bank, lunas setelah dana masuk.
                </span>
              </span>
              <ChevronRight className="h-4 w-4 text-[#7C8290]" />
            </button>

            <button
              type="button"
              disabled={createOrder.isPending}
              onClick={() => void payWith("cash")}
              className="flex w-full items-center gap-3 rounded-[14px] border border-[#E3E5E9] bg-white p-3 text-left transition-colors hover:border-[#C81E28] hover:bg-[#FDECEC] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="grid h-11 w-11 place-items-center rounded-[10px] bg-[#EAF7EE] text-[#15803D]">
                <Banknote className="h-5 w-5" />
              </span>
              <span className="flex-1">
                <span className="block text-[13px] font-extrabold text-[#16181D]">
                  Cash
                </span>
                <span className="block text-[11px] font-medium text-[#5D6370]">
                  Lunas sekarang, masuk saldo cash.
                </span>
              </span>
              <ChevronRight className="h-4 w-4 text-[#7C8290]" />
            </button>
          </div>
        </QrisDialogContent>
      </Dialog>

      <Dialog
        open={Boolean(payment)}
        onOpenChange={(open) => {
          if (!open) setPayment(null);
        }}
      >
        <QrisDialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogTitle className="sr-only">Pembayaran QRIS</DialogTitle>
        <DialogDescription className="sr-only">
          QR dinamis, total, status, dan konfirmasi pembayaran.
        </DialogDescription>
        {payment ? (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-extrabold tracking-[0.5px] text-[#C81E28]">
                  PEMBAYARAN QRIS
                </p>
                <p className="text-[13px] font-bold text-[#16181D]">
                  {payment.orderId}
                </p>
              </div>
              <button
                type="button"
                aria-label="Tutup pembayaran"
                onClick={() => setPayment(null)}
                className="grid h-8 w-8 place-items-center rounded-full bg-[#F2F3F5] text-[#5D6370]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-[16px] bg-[#F5F6F8] p-3">
              <QrImage
                value={payment.qrisPayload ?? ""}
                downloadName={`qris-${payment.orderId}.png`}
                width={420}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#5D6370]">
                Total
              </span>
              <span className="text-[24px] font-extrabold tracking-[-0.8px]">
                {formatRupiah(payment.total)}
              </span>
            </div>
            <p className="text-[11px] font-medium text-[#7C8290]">
              Berlaku sampai{" "}
              {payment.expiresAt ? formatDateTime(payment.expiresAt) : "-"}.
              Minta pelanggan memindai QR, lalu konfirmasi setelah dana masuk.
            </p>

            <div className="flex items-center justify-between rounded-[10px] bg-[#F5F6F8] px-3 py-2">
              <span className="text-[11px] font-semibold text-[#5D6370]">
                Status
              </span>
              <span
                className={`text-[11px] font-extrabold ${
                  paymentStatus === "paid"
                    ? "text-[#15803D]"
                    : paymentStatus === "expired"
                      ? "text-[#C81E28]"
                      : "text-[#7C8290]"
                }`}
              >
                {paymentStatusLabel}
              </span>
            </div>

            {paymentStatus === "paid" && lastOrder ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => void printReceipt(lastOrder)}
                className="h-11 w-full rounded-[10px] text-[13px] font-bold"
              >
                <Printer className="mr-2 h-4 w-4" />
                Cetak struk
              </Button>
            ) : null}

            <Button
              type="button"
              variant="outline"
              onClick={checkPayment}
              disabled={qrisStatus.isFetching}
              className="h-11 w-full rounded-[10px] text-[13px] font-bold"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              {qrisStatus.isFetching ? "Mengecek..." : "Cek pembayaran"}
            </Button>

            <Button
              type="button"
              onClick={markPaid}
              disabled={confirmPayment.isPending}
              className="h-11 w-full rounded-[10px] bg-[#C81E28] text-[13px] font-bold text-white hover:bg-[#A8161F]"
            >
              <Check className="mr-2 h-4 w-4" />
              {confirmPayment.isPending ? "Memproses..." : "Konfirmasi lunas"}
            </Button>
          </div>
        ) : null}
        </QrisDialogContent>
      </Dialog>
    </div>
  );
}
