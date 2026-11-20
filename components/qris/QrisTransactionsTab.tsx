"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  type QrisTransactionRecord,
  useCheckQrisTransaction,
  useConfirmQrisTransaction,
  useCreateQrisTransaction,
  useGetQrisAccounts,
  useGetQrisTransaction,
  useGetQrisTransactions,
  useResendQrisWebhook,
} from "@/hooks/qris/useQris";
import { Check, Plus, QrCode, RefreshCcw, RefreshCw, ScrollText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import CopyButton from "./CopyButton";
import QrisDialogContent from "./QrisDialogContent";
import QrImage from "./QrImage";
import { formatDateTime, formatRupiah, statusVariant } from "./qr";

function notifyPaymentStatus(status: string) {
  if (status === "paid") toast.success("Pembayaran sudah diterima");
  else if (status === "expired") toast.error("QRIS sudah kedaluwarsa");
  else toast("Belum ada pembayaran masuk");
}

export default function QrisTransactionsTab() {
  const [status, setStatus] = useState("all");
  const { data: transactions, isLoading } = useGetQrisTransactions(status);
  const { data: accounts } = useGetQrisAccounts();
  const createTransaction = useCreateQrisTransaction();
  const confirmTransaction = useConfirmQrisTransaction();
  const resendWebhook = useResendQrisWebhook();
  const checkTransaction = useCheckQrisTransaction();

  const [createOpen, setCreateOpen] = useState(false);
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [orderId, setOrderId] = useState("");
  const [expiry, setExpiry] = useState("15");
  const [qrTarget, setQrTarget] = useState<QrisTransactionRecord | null>(null);
  const qrStatus = useGetQrisTransaction(qrTarget?.id ?? null, true);
  const [confirmTarget, setConfirmTarget] =
    useState<QrisTransactionRecord | null>(null);
  const [logTarget, setLogTarget] = useState<QrisTransactionRecord | null>(
    null,
  );

  const submitCreate = () => {
    const value = Number(amount);
    if (!Number.isSafeInteger(value) || value <= 0) {
      toast.error("Nominal harus bilangan bulat lebih dari 0");
      return;
    }
    if (!accountId) {
      toast.error("Pilih akun QRIS");
      return;
    }

    createTransaction.mutate(
      {
        accountId,
        amount: value,
        orderId: orderId.trim() || undefined,
        expiresInMinutes: Number(expiry) || 15,
      },
      {
        onSuccess: (transaction) => {
          toast.success("QRIS dinamis dibuat");
          setCreateOpen(false);
          setAmount("");
          setOrderId("");
          setQrTarget(transaction);
        },
        onError: (error) => toast.error(error.message),
      },
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-extrabold tracking-[-0.6px] text-[#16181D]">Transaksi QRIS</h2>
          <p className="text-[13px] font-medium text-[#5D6370]">
            Buat QRIS dinamis, konfirmasi pembayaran, dan kirim webhook.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Lunas</SelectItem>
              <SelectItem value="expired">Kedaluwarsa</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => {
              setAccountId(accounts?.find((item) => item.isActive)?.id ?? "");
              setCreateOpen(true);
            }}
          >
            <Plus className="size-4" />
            Buat QRIS
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#E3E5E9] bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Akun</TableHead>
              <TableHead>Nominal</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Kedaluwarsa</TableHead>
              <TableHead>Webhook</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7}>Memuat data...</TableCell>
              </TableRow>
            ) : !transactions?.length ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground">
                  Belum ada transaksi.
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((transaction) => {
                const lastDelivery = transaction.deliveries?.[0];
                return (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div className="font-mono text-xs">{transaction.orderId}</div>
                      {transaction.order?.table ? (
                        <div className="text-muted-foreground text-xs">
                          Meja {transaction.order.table.code}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell>{transaction.account?.label ?? "-"}</TableCell>
                    <TableCell>{formatRupiah(transaction.amount)}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(transaction.status)}>
                        {transaction.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {formatDateTime(transaction.expiresAt)}
                    </TableCell>
                    <TableCell className="text-xs">
                      {!transaction.account ? (
                        "-"
                      ) : lastDelivery ? (
                        <div className="flex items-center gap-1">
                          <Badge
                            variant={lastDelivery.ok ? "default" : "destructive"}
                          >
                            {lastDelivery.ok ? "OK" : "Gagal"}
                          </Badge>
                          <span className="text-muted-foreground">
                            {lastDelivery.attempts}x
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Lihat QR"
                          onClick={() => setQrTarget(transaction)}
                        >
                          <QrCode className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Log webhook"
                          onClick={() => setLogTarget(transaction)}
                        >
                          <ScrollText className="size-4" />
                        </Button>
                        {transaction.status === "pending" ? (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Cek pembayaran"
                              disabled={checkTransaction.isPending}
                              onClick={() =>
                                checkTransaction.mutate(transaction.id, {
                                  onSuccess: (result) =>
                                    notifyPaymentStatus(result.status),
                                  onError: (error) =>
                                    toast.error(error.message),
                                })
                              }
                            >
                              <RefreshCcw className="size-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Konfirmasi lunas"
                              onClick={() => setConfirmTarget(transaction)}
                            >
                              <Check className="size-4" />
                            </Button>
                          </>
                        ) : null}
                        {transaction.status === "paid" ? (
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Kirim ulang webhook"
                            disabled={resendWebhook.isPending}
                            onClick={() =>
                              resendWebhook.mutate(transaction.id, {
                                onSuccess: (delivery) =>
                                  toast.success(
                                    delivery
                                      ? delivery.ok
                                        ? "Webhook terkirim"
                                        : `Webhook gagal: ${delivery.error ?? "unknown"}`
                                      : "Akun belum punya webhook URL",
                                  ),
                                onError: (error) => toast.error(error.message),
                              })
                            }
                          >
                            <RefreshCw className="size-4" />
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <QrisDialogContent>
          <DialogHeader>
            <DialogTitle>Buat QRIS dinamis</DialogTitle>
            <DialogDescription>
              Nominal disuntikkan ke payload QRIS statis, lalu CRC dihitung
              ulang.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Akun QRIS</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih akun" />
                </SelectTrigger>
                <SelectContent>
                  {accounts?.filter((account) => account.isActive).length ? (
                    accounts
                      .filter((account) => account.isActive)
                      .map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.label} · {account.merchantName}
                        </SelectItem>
                      ))
                  ) : (
                    <SelectItem value="__none" disabled>
                      Belum ada akun aktif
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="qris-amount">Nominal (Rp)</Label>
              <Input
                id="qris-amount"
                type="number"
                min={1}
                step={1}
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qris-order">Order ID (opsional)</Label>
              <Input
                id="qris-order"
                value={orderId}
                maxLength={64}
                placeholder="Otomatis jika kosong"
                onChange={(event) => setOrderId(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Kedaluwarsa (menit)</Label>
              <Select value={expiry} onValueChange={setExpiry}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 menit</SelectItem>
                  <SelectItem value="15">15 menit</SelectItem>
                  <SelectItem value="30">30 menit</SelectItem>
                  <SelectItem value="60">60 menit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Batal
            </Button>
            <Button onClick={submitCreate} disabled={createTransaction.isPending}>
              {createTransaction.isPending ? "Membuat..." : "Buat QRIS"}
            </Button>
          </DialogFooter>
        </QrisDialogContent>
      </Dialog>

      <Dialog open={Boolean(qrTarget)} onOpenChange={() => setQrTarget(null)}>
        <QrisDialogContent>
          <DialogHeader>
            <DialogTitle>QRIS dinamis</DialogTitle>
            <DialogDescription>
              {qrTarget
                ? `${qrTarget.orderId} · ${formatRupiah(qrTarget.amount)}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          {qrTarget ? (
            <div className="space-y-4">
              <QrImage
                value={qrTarget.dynamicPayload}
                downloadName={`qris-${qrTarget.orderId}.png`}
              />
              <div className="flex items-center justify-between gap-2">
                <Badge
                  variant={statusVariant(
                    qrStatus.data?.status ?? qrTarget.status,
                  )}
                >
                  {qrStatus.data?.status ?? qrTarget.status}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={qrStatus.isFetching}
                  onClick={async () => {
                    const result = await qrStatus.refetch();
                    if (result.data) notifyPaymentStatus(result.data.status);
                    else toast.error("Gagal cek status pembayaran");
                  }}
                >
                  <RefreshCcw className="size-4" />
                  {qrStatus.isFetching ? "Mengecek..." : "Cek pembayaran"}
                </Button>
              </div>
              <div className="space-y-2">
                <p className="text-muted-foreground text-xs">Payload</p>
                <div className="flex items-start gap-2">
                  <code className="bg-muted max-h-24 flex-1 overflow-auto rounded-lg p-2 text-xs break-all">
                    {qrTarget.dynamicPayload}
                  </code>
                  <CopyButton value={qrTarget.dynamicPayload} label="" />
                </div>
              </div>
            </div>
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
              Status berubah menjadi lunas dan webhook dikirim ke merchant.
              Tindakan ini tidak bisa dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmTarget(null)}>
              Batal
            </Button>
            <Button
              disabled={confirmTransaction.isPending}
              onClick={() => {
                if (!confirmTarget) return;
                confirmTransaction.mutate(confirmTarget.id, {
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

      <Dialog open={Boolean(logTarget)} onOpenChange={() => setLogTarget(null)}>
        <QrisDialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Log webhook</DialogTitle>
            <DialogDescription>{logTarget?.orderId ?? ""}</DialogDescription>
          </DialogHeader>
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {!logTarget?.deliveries?.length ? (
              <p className="text-[13px] font-medium text-[#5D6370]">
                Belum ada pengiriman webhook.
              </p>
            ) : (
              logTarget.deliveries.map((delivery) => (
                <div key={delivery.id} className="rounded-lg border p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={delivery.ok ? "default" : "destructive"}>
                      {delivery.ok ? "Terkirim" : "Gagal"}
                    </Badge>
                    <span className="text-muted-foreground text-xs">
                      {formatDateTime(delivery.createdAt)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs break-all">{delivery.url}</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    HTTP {delivery.statusCode ?? "-"} · {delivery.attempts}x
                    {delivery.error ? ` · ${delivery.error}` : ""}
                  </p>
                </div>
              ))
            )}
          </div>
        </QrisDialogContent>
      </Dialog>
    </div>
  );
}
