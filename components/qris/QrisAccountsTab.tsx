"use client";

import { parseQRIS, validateQRIS } from "@/lib/qris";
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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  type QrisAccountRecord,
  useCreateQrisAccount,
  useDeleteQrisAccount,
  useGetQrisAccounts,
  useUpdateQrisAccount,
} from "@/hooks/qris/useQris";
import { Pencil, Plus, Trash2, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { decodeQrFromFile } from "./decodeQr";
import CopyButton from "./CopyButton";
import QrisDialogContent from "./QrisDialogContent";

type AccountForm = {
  label: string;
  staticPayload: string;
  webhookUrl: string;
  isActive: boolean;
  rotateSecret: boolean;
};

const emptyForm: AccountForm = {
  label: "",
  staticPayload: "",
  webhookUrl: "",
  isActive: true,
  rotateSecret: false,
};

export default function QrisAccountsTab() {
  const { data: accounts, isLoading } = useGetQrisAccounts();
  const createAccount = useCreateQrisAccount();
  const updateAccount = useUpdateQrisAccount();
  const deleteAccount = useDeleteQrisAccount();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<QrisAccountRecord | null>(null);
  const [form, setForm] = useState<AccountForm>(emptyForm);
  const [secret, setSecret] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<QrisAccountRecord | null>(
    null,
  );
  const [decoding, setDecoding] = useState(false);

  const preview = useMemo(() => {
    if (!form.staticPayload.trim()) return null;
    const validation = validateQRIS(form.staticPayload.trim());
    if (!validation.valid) return { error: validation.errors.join("; ") };
    const parsed = parseQRIS(form.staticPayload.trim());
    return {
      error: null,
      name: parsed.merchantName,
      city: parsed.merchantCity,
      method: parsed.method,
    };
  }, [form.staticPayload]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (account: QrisAccountRecord) => {
    setEditing(account);
    setForm({
      label: account.label,
      staticPayload: account.staticPayload,
      webhookUrl: account.webhookUrl ?? "",
      isActive: account.isActive,
      rotateSecret: false,
    });
    setOpen(true);
  };

  const onPickImage = async (file: File | undefined) => {
    if (!file) return;
    setDecoding(true);
    try {
      const payload = await decodeQrFromFile(file);
      setForm((current) => ({ ...current, staticPayload: payload }));
      toast.success("QR berhasil dibaca");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal membaca QR");
    } finally {
      setDecoding(false);
    }
  };

  const submit = () => {
    const payload = {
      label: form.label,
      staticPayload: form.staticPayload,
      webhookUrl: form.webhookUrl || null,
      isActive: form.isActive,
    };

    if (editing) {
      updateAccount.mutate(
        { id: editing.id, ...payload, rotateSecret: form.rotateSecret },
        {
          onSuccess: (account) => {
            if (account.webhookSecret) setSecret(account.webhookSecret);
            toast.success("Akun QRIS diperbarui");
            setOpen(false);
          },
          onError: (error) => toast.error(error.message),
        },
      );
      return;
    }

    createAccount.mutate(payload, {
      onSuccess: (account) => {
        setSecret(account.webhookSecret);
        toast.success("Akun QRIS ditambahkan");
        setOpen(false);
      },
      onError: (error) => toast.error(error.message),
    });
  };

  const saving = createAccount.isPending || updateAccount.isPending;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-extrabold tracking-[-0.6px] text-[#16181D]">Akun QRIS</h2>
          <p className="text-[13px] font-medium text-[#5D6370]">
            QRIS statis merchant dan tujuan webhook pembayaran.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Tambah QRIS
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#E3E5E9] bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Label</TableHead>
              <TableHead>Merchant</TableHead>
              <TableHead>Webhook</TableHead>
              <TableHead>Secret</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6}>Memuat data...</TableCell>
              </TableRow>
            ) : !accounts?.length ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
                  Belum ada QRIS. Tambahkan QRIS statis merchant.
                </TableCell>
              </TableRow>
            ) : (
              accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">{account.label}</TableCell>
                  <TableCell>
                    <div>{account.merchantName}</div>
                    <div className="text-muted-foreground text-xs">
                      {account.merchantCity}
                      {account.merchantNmid
                        ? ` · NMID ${account.merchantNmid}`
                        : ""}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-56 truncate text-xs">
                    {account.webhookUrl ?? "-"}
                  </TableCell>
                  <TableCell className="text-xs">
                    ••••{account.webhookSecretTail}
                  </TableCell>
                  <TableCell>
                    <Badge variant={account.isActive ? "default" : "secondary"}>
                      {account.isActive ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEdit(account)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => setDeleteTarget(account)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <QrisDialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Ubah akun QRIS" : "Tambah akun QRIS"}
            </DialogTitle>
            <DialogDescription>
              Upload gambar QRIS statis atau tempel payload-nya. Payload
              divalidasi checksum CRC16 sebelum disimpan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="qris-label">Label</Label>
              <Input
                id="qris-label"
                value={form.label}
                maxLength={64}
                placeholder="Contoh: Kasir Utama"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    label: event.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Payload QRIS statis</Label>
              <div className="flex flex-wrap items-center gap-2">
                <Button asChild variant="outline" size="sm" disabled={decoding}>
                  <label className="cursor-pointer">
                    <Upload className="size-4" />
                    {decoding ? "Membaca..." : "Upload gambar QR"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        void onPickImage(event.target.files?.[0]);
                        event.target.value = "";
                      }}
                    />
                  </label>
                </Button>
                <span className="text-muted-foreground text-xs">
                  PNG/JPG, QR terbaca otomatis.
                </span>
              </div>
              <Textarea
                value={form.staticPayload}
                rows={5}
                className="font-mono text-xs"
                placeholder="000201010211..."
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    staticPayload: event.target.value,
                  }))
                }
              />
              {preview ? (
                preview.error ? (
                  <p className="text-destructive text-xs">{preview.error}</p>
                ) : (
                  <p className="text-muted-foreground text-xs">
                    {preview.name} · {preview.city} · {preview.method}
                  </p>
                )
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="qris-webhook">Webhook URL</Label>
              <Input
                id="qris-webhook"
                value={form.webhookUrl}
                placeholder="https://sistem-anda.com/webhook/qris"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    webhookUrl: event.target.value,
                  }))
                }
              />
              <p className="text-muted-foreground text-xs">
                Dipanggil saat pembayaran dikonfirmasi. Ditandatangani
                HMAC-SHA256 via header X-Qris-Signature.
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Akun aktif</p>
                <p className="text-muted-foreground text-xs">
                  Hanya akun aktif yang bisa dipakai membuat QRIS dinamis.
                </p>
              </div>
              <Switch
                checked={form.isActive}
                onCheckedChange={(checked) =>
                  setForm((current) => ({ ...current, isActive: checked }))
                }
              />
            </div>

            {editing ? (
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Rotasi webhook secret</p>
                  <p className="text-muted-foreground text-xs">
                    Secret lama tidak berlaku setelah disimpan.
                  </p>
                </div>
                <Switch
                  checked={form.rotateSecret}
                  onCheckedChange={(checked) =>
                    setForm((current) => ({
                      ...current,
                      rotateSecret: checked,
                    }))
                  }
                />
              </div>
            ) : null}
          </div>

          <DialogFooter className="sticky bottom-0 -mx-5 -mb-5 border-t bg-popover px-5 py-4 sm:-mx-6 sm:-mb-6 sm:px-6">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={submit}
              disabled={saving || !form.label.trim() || !form.staticPayload.trim()}
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </QrisDialogContent>
      </Dialog>

      <Dialog open={Boolean(secret)} onOpenChange={() => setSecret(null)}>
        <QrisDialogContent>
          <DialogHeader>
            <DialogTitle>Webhook secret</DialogTitle>
            <DialogDescription>
              Simpan sekarang. Secret tidak akan ditampilkan lagi.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Input readOnly value={secret ?? ""} className="font-mono text-xs" />
            <CopyButton value={secret ?? ""} label="" />
          </div>
          <DialogFooter>
            <Button onClick={() => setSecret(null)}>Selesai</Button>
          </DialogFooter>
        </QrisDialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <QrisDialogContent>
          <DialogHeader>
            <DialogTitle>Hapus akun QRIS?</DialogTitle>
            <DialogDescription>
              Transaksi dan meja yang memakai akun ini ikut kehilangan
              relasinya.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              disabled={deleteAccount.isPending}
              onClick={() => {
                if (!deleteTarget) return;
                deleteAccount.mutate(deleteTarget.id, {
                  onSuccess: () => {
                    toast.success("Akun QRIS dihapus");
                    setDeleteTarget(null);
                  },
                  onError: (error) => toast.error(error.message),
                });
              }}
            >
              Hapus
            </Button>
          </DialogFooter>
        </QrisDialogContent>
      </Dialog>
    </div>
  );
}
