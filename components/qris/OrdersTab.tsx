"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGetBranchs } from "@/hooks/branches/useBranches";
import {
  type OrderRecord,
  useGetOrders,
  useGetOrderStats,
} from "@/hooks/qris/usePos";
import {
  useConfirmQrisTransaction,
  useResendQrisWebhook,
} from "@/hooks/qris/useQris";
import { Check, QrCode, RefreshCw } from "lucide-react";
import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
} from "recharts";
import { toast } from "sonner";

import QrisDialogContent from "./QrisDialogContent";
import QrImage from "./QrImage";
import { formatDateTime, formatRupiah, statusVariant } from "./qr";

const DAILY_CONFIG = {
  revenue: { label: "Omzet", color: "#C81E28" },
} satisfies ChartConfig;

const MONTHLY_CONFIG = {
  revenue: { label: "Omzet", color: "#C81E28" },
} satisfies ChartConfig;

const TYPE_CONFIG = {
  orders: { label: "Pesanan", color: "#C81E28" },
} satisfies ChartConfig;

const BALANCE_CONFIG = {
  cash: { label: "Cash", color: "#15803D" },
  qris: { label: "QRIS", color: "#C81E28" },
} satisfies ChartConfig;

const BALANCE_COLORS: Record<string, string> = {
  cash: "#15803D",
  qris: "#C81E28",
};

const ACCOUNT_COLORS = ["#C81E28", "#16181D", "#7C8290", "#15803D", "#B7791F"];

const TYPE_COLORS = ["#C81E28", "#16181D", "#7C8290"];

const ORDER_TYPE_LABELS: Record<string, string> = {
  "dine-in": "Dine-in",
  takeaway: "Bawa pulang",
  delivery: "Diantar",
};

export default function OrdersTab() {
  const [status, setStatus] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const { data: branches = [] } = useGetBranchs();
  const { data: orders, isLoading } = useGetOrders(status, branchFilter);
  const { data: stats } = useGetOrderStats(branchFilter);
  const confirmTransaction = useConfirmQrisTransaction();
  const resendWebhook = useResendQrisWebhook();

  const [qrTarget, setQrTarget] = useState<OrderRecord | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<OrderRecord | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-extrabold tracking-[-0.6px] text-[#16181D]">Pesanan</h2>
          <p className="text-[13px] font-medium text-[#5D6370]">
            Pesanan dari QR meja beserta status pembayarannya.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger size="sm" className="w-40">
              <SelectValue placeholder="Semua cabang" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua cabang</SelectItem>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua status</SelectItem>
              <SelectItem value="pending">Menunggu bayar</SelectItem>
              <SelectItem value="paid">Lunas</SelectItem>
              <SelectItem value="expired">Kedaluwarsa</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-[16px] border-[#E3E5E9] bg-white shadow-none lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-[13px] font-extrabold text-[#16181D]">
              Omzet 14 hari
            </CardTitle>
            <CardDescription className="text-[11.5px] text-[#5D6370]">
              Pembayaran lunas per hari.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-1 pr-3">
            <ChartContainer config={DAILY_CONFIG} className="h-[190px] w-full">
              <BarChart
                data={stats?.daily ?? []}
                margin={{ top: 8, right: 0, bottom: 0, left: 0 }}
              >
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 3"
                  stroke="#E3E5E9"
                />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={6}
                  fontSize={10}
                  interval="preserveStartEnd"
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="revenue"
                  fill="var(--color-revenue)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={30}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="rounded-[16px] border-[#E3E5E9] bg-white shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-[13px] font-extrabold text-[#16181D]">
              Omzet 6 bulan
            </CardTitle>
            <CardDescription className="text-[11.5px] text-[#5D6370]">
              Tren bulanan.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-1 pr-3">
            <ChartContainer config={MONTHLY_CONFIG} className="h-[190px] w-full">
              <AreaChart
                data={stats?.monthly ?? []}
                margin={{ top: 8, right: 0, bottom: 0, left: 0 }}
              >
                <defs>
                  <linearGradient id="monthly-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C81E28" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#C81E28" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 3"
                  stroke="#E3E5E9"
                />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={6}
                  fontSize={10}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-revenue)"
                  strokeWidth={2}
                  fill="url(#monthly-fill)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="rounded-[16px] border-[#E3E5E9] bg-white shadow-none lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-[13px] font-extrabold text-[#16181D]">
              Tipe pesanan
            </CardTitle>
            <CardDescription className="text-[11.5px] text-[#5D6370]">
              Komposisi dine-in, bawa pulang, dan diantar.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <ChartContainer
              config={TYPE_CONFIG}
              className="h-[190px] w-full max-w-[260px]"
            >
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="label" />} />
                <Pie
                  data={stats?.byType ?? []}
                  dataKey="orders"
                  nameKey="label"
                  innerRadius={48}
                  outerRadius={78}
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {(stats?.byType ?? []).map((entry, index) => (
                    <Cell
                      key={entry.key}
                      fill={TYPE_COLORS[index % TYPE_COLORS.length]}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="space-y-2">
              {(stats?.byType ?? []).length === 0 ? (
                <p className="text-[12px] font-medium text-[#5D6370]">
                  Belum ada pesanan.
                </p>
              ) : (
                stats?.byType.map((entry, index) => (
                  <div
                    key={entry.key}
                    className="flex items-center gap-2 text-[12px] font-semibold text-[#16181D]"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor: TYPE_COLORS[index % TYPE_COLORS.length],
                      }}
                    />
                    <span className="min-w-24">{entry.label}</span>
                    <span className="text-[#5D6370]">{entry.orders}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-[16px] border-[#E3E5E9] bg-white shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-[13px] font-extrabold text-[#16181D]">
              Saldo Cash &amp; QRIS
            </CardTitle>
            <CardDescription className="text-[11.5px] text-[#5D6370]">
              Total pembayaran lunas per metode.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <ChartContainer
              config={BALANCE_CONFIG}
              className="h-[190px] w-full max-w-[240px]"
            >
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="label" />} />
                <Pie
                  data={[
                    {
                      key: "cash",
                      label: "Cash",
                      amount: stats?.balances.cash ?? 0,
                    },
                    {
                      key: "qris",
                      label: "QRIS",
                      amount: stats?.balances.qris ?? 0,
                    },
                  ]}
                  dataKey="amount"
                  nameKey="label"
                  innerRadius={48}
                  outerRadius={78}
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  <Cell fill={BALANCE_COLORS.cash} />
                  <Cell fill={BALANCE_COLORS.qris} />
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[12px] font-semibold text-[#16181D]">
                <span className="h-2.5 w-2.5 rounded-full bg-[#15803D]" />
                <span className="min-w-16">Cash</span>
                <span className="text-[#5D6370]">
                  {formatRupiah(stats?.balances.cash ?? 0)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[12px] font-semibold text-[#16181D]">
                <span className="h-2.5 w-2.5 rounded-full bg-[#C81E28]" />
                <span className="min-w-16">QRIS</span>
                <span className="text-[#5D6370]">
                  {formatRupiah(stats?.balances.qris ?? 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[16px] border-[#E3E5E9] bg-white shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-[13px] font-extrabold text-[#16181D]">
              Saldo QRIS per akun
            </CardTitle>
            <CardDescription className="text-[11.5px] text-[#5D6370]">
              Pembayaran lunas masing-masing QRIS.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            {(stats?.qrisByAccount ?? []).length === 0 ? (
              <p className="py-10 text-[12px] font-medium text-[#5D6370]">
                Belum ada saldo QRIS.
              </p>
            ) : (
              <>
                <ChartContainer
                  config={{}}
                  className="h-[190px] w-full max-w-[240px]"
                >
                  <PieChart>
                    <ChartTooltip
                      content={<ChartTooltipContent nameKey="label" />}
                    />
                    <Pie
                      data={stats?.qrisByAccount ?? []}
                      dataKey="amount"
                      nameKey="label"
                      innerRadius={48}
                      outerRadius={78}
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {(stats?.qrisByAccount ?? []).map((account, index) => (
                        <Cell
                          key={account.id}
                          fill={ACCOUNT_COLORS[index % ACCOUNT_COLORS.length]}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className="space-y-2">
                  {(stats?.qrisByAccount ?? []).map((account, index) => (
                    <div
                      key={account.id}
                      className="flex items-center gap-2 text-[12px] font-semibold text-[#16181D]"
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          backgroundColor:
                            ACCOUNT_COLORS[index % ACCOUNT_COLORS.length],
                        }}
                      />
                      <span className="min-w-16">{account.label}</span>
                      <span className="text-[#5D6370]">
                        {formatRupiah(account.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#E3E5E9] bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Waktu</TableHead>
              <TableHead>Cabang</TableHead>
              <TableHead>Meja</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead>Pelanggan</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Pesanan</TableHead>
              <TableHead>Bayar</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={10}>Memuat data...</TableCell>
              </TableRow>
            ) : !orders?.length ? (
              <TableRow>
                <TableCell colSpan={10} className="text-muted-foreground">
                  Belum ada pesanan.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="text-xs">
                    {formatDateTime(order.createdAt)}
                  </TableCell>
                  <TableCell className="text-xs">
                    {order.branch?.name ?? "-"}
                  </TableCell>
                  <TableCell>{order.table?.code ?? "-"}</TableCell>
                  <TableCell className="text-xs">
                    {ORDER_TYPE_LABELS[order.orderType] ?? order.orderType}
                  </TableCell>
                  <TableCell>
                    {order.customerName ?? "-"}
                    {order.note ? (
                      <div className="text-muted-foreground line-clamp-1 text-xs">
                        {order.note}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell className="max-w-64 text-xs">
                    {order.items
                      .map((item) => `${item.qty}x ${item.productName}`)
                      .join(", ")}
                  </TableCell>
                  <TableCell>{formatRupiah(order.total)}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(order.status)}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {order.paymentMethod === "cash" ? (
                      <Badge>Cash</Badge>
                    ) : order.qrisTransaction ? (
                      <Badge
                        variant={statusVariant(order.qrisTransaction.status)}
                      >
                        {order.qrisTransaction.status}
                      </Badge>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      {order.qrisTransaction ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Lihat QR"
                          onClick={() => setQrTarget(order)}
                        >
                          <QrCode className="size-4" />
                        </Button>
                      ) : null}
                      {order.qrisTransaction?.status === "pending" ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Konfirmasi lunas"
                          onClick={() => setConfirmTarget(order)}
                        >
                          <Check className="size-4" />
                        </Button>
                      ) : null}
                      {order.qrisTransaction?.status === "paid" ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Kirim ulang webhook"
                          disabled={resendWebhook.isPending}
                          onClick={() => {
                            if (!order.qrisTransaction) return;
                            resendWebhook.mutate(order.qrisTransaction.id, {
                              onSuccess: (delivery) =>
                                toast.success(
                                  delivery
                                    ? delivery.ok
                                      ? "Webhook terkirim"
                                      : `Webhook gagal: ${delivery.error ?? "unknown"}`
                                    : "Akun belum punya webhook URL",
                                ),
                              onError: (error) => toast.error(error.message),
                            });
                          }}
                        >
                          <RefreshCw className="size-4" />
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={Boolean(qrTarget)} onOpenChange={() => setQrTarget(null)}>
        <QrisDialogContent>
          <DialogHeader>
            <DialogTitle>QRIS pesanan</DialogTitle>
            <DialogDescription>
              {qrTarget
                ? `Meja ${qrTarget.table?.code ?? "-"} · ${formatRupiah(qrTarget.total)}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          {qrTarget?.qrisTransaction ? (
            <QrImage
              value={qrTarget.qrisTransaction.dynamicPayload}
              downloadName={`qris-order-${qrTarget.id}.png`}
            />
          ) : null}
        </QrisDialogContent>
      </Dialog>

      <Dialog
        open={Boolean(confirmTarget)}
        onOpenChange={() => setConfirmTarget(null)}
      >
        <QrisDialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi pembayaran lunas?</DialogTitle>
            <DialogDescription>
              Pesanan dan transaksi QRIS ditandai lunas, lalu webhook dikirim.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmTarget(null)}>
              Batal
            </Button>
            <Button
              disabled={confirmTransaction.isPending}
              onClick={() => {
                const transactionId = confirmTarget?.qrisTransaction?.id;
                if (!transactionId) return;
                confirmTransaction.mutate(transactionId, {
                  onSuccess: (result) => {
                    const delivery = result.delivery;
                    toast.success(
                      delivery
                        ? delivery.ok
                          ? "Lunas, webhook terkirim"
                          : `Lunas, webhook gagal: ${delivery.error ?? "unknown"}`
                        : "Lunas. Webhook URL belum diatur",
                    );
                    setConfirmTarget(null);
                  },
                  onError: (error) => toast.error(error.message),
                });
              }}
            >
              {confirmTransaction.isPending ? "Memproses..." : "Konfirmasi lunas"}
            </Button>
          </DialogFooter>
        </QrisDialogContent>
      </Dialog>
    </div>
  );
}
