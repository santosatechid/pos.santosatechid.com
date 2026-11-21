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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type DiningTableRecord,
  useCreateTable,
  useDeleteTable,
  useGetTables,
  useUpdateTable,
} from "@/hooks/qris/usePos";
import { useGetQrisAccounts } from "@/hooks/qris/useQris";
import { useGetBranchs } from "@/hooks/branches/useBranches";
import { Pencil, Plus, QrCode, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import CopyButton from "./CopyButton";
import QrisDialogContent from "./QrisDialogContent";
import QrImage from "./QrImage";

type TableForm = {
  code: string;
  label: string;
  qrisAccountId: string;
  branchId: string;
  isActive: boolean;
};

const emptyForm: TableForm = {
  code: "",
  label: "",
  qrisAccountId: "",
  branchId: "",
  isActive: true,
};

const NO_ACCOUNT = "none";

export default function TablesTab() {
  const { data: tables, isLoading } = useGetTables();
  const { data: accounts } = useGetQrisAccounts();
  const { data: branches = [] } = useGetBranchs();
  const createTable = useCreateTable();
  const updateTable = useUpdateTable();
  const deleteTable = useDeleteTable();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DiningTableRecord | null>(null);
  const [form, setForm] = useState<TableForm>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<DiningTableRecord | null>(
    null,
  );
  const [qrTarget, setQrTarget] = useState<DiningTableRecord | null>(null);
  const [publicUrl, setPublicUrl] = useState("");

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (table: DiningTableRecord) => {
    setEditing(table);
    setForm({
      code: table.code,
      label: table.label ?? "",
      qrisAccountId: table.qrisAccountId ?? NO_ACCOUNT,
      branchId: table.branchId ?? NO_ACCOUNT,
      isActive: table.isActive,
    });
    setOpen(true);
  };

  const openQr = (table: DiningTableRecord) => {
    setQrTarget(table);
    setPublicUrl(`${window.location.origin}/t/${table.token}`);
  };

  const submit = () => {
    const payload = {
      code: form.code,
      label: form.label || null,
      qrisAccountId:
        form.qrisAccountId === NO_ACCOUNT ? null : form.qrisAccountId,
      branchId: form.branchId === NO_ACCOUNT ? null : form.branchId,
      isActive: form.isActive,
    };

    if (editing) {
      updateTable.mutate(
        { id: editing.id, ...payload },
        {
          onSuccess: () => {
            toast.success("Meja diperbarui");
            setOpen(false);
          },
          onError: (error) => toast.error(error.message),
        },
      );
      return;
    }

    createTable.mutate(payload, {
      onSuccess: () => {
        toast.success("Meja ditambahkan");
        setOpen(false);
      },
      onError: (error) => toast.error(error.message),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-extrabold tracking-[-0.6px] text-[#16181D]">Meja</h2>
          <p className="text-[13px] font-medium text-[#5D6370]">
            Setiap meja punya QR permanen untuk pesan dan bayar.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Tambah meja
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#E3E5E9] bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode</TableHead>
              <TableHead>Label</TableHead>
              <TableHead>Cabang</TableHead>
              <TableHead>Akun QRIS</TableHead>
              <TableHead>Pesanan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7}>Memuat data...</TableCell>
              </TableRow>
            ) : !tables?.length ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground">
                  Belum ada meja.
                </TableCell>
              </TableRow>
            ) : (
              tables.map((table) => (
                <TableRow key={table.id}>
                  <TableCell className="font-medium">{table.code}</TableCell>
                  <TableCell>{table.label ?? "-"}</TableCell>
                  <TableCell>{table.branch?.name ?? "-"}</TableCell>
                  <TableCell>{table.qrisAccount?.label ?? "Otomatis"}</TableCell>
                  <TableCell>{table._count?.orders ?? 0}</TableCell>
                  <TableCell>
                    <Badge variant={table.isActive ? "default" : "secondary"}>
                      {table.isActive ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        title="QR meja"
                        onClick={() => openQr(table)}
                      >
                        <QrCode className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEdit(table)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => setDeleteTarget(table)}
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
        <QrisDialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Ubah meja" : "Tambah meja"}
            </DialogTitle>
            <DialogDescription>
              Kode meja dipakai di QR permanen dan struk pesanan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="table-code">Kode meja</Label>
                <Input
                  id="table-code"
                  value={form.code}
                  maxLength={20}
                  placeholder="A1"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      code: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="table-label">Label</Label>
                <Input
                  id="table-label"
                  value={form.label}
                  maxLength={60}
                  placeholder="Dekat jendela"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      label: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Cabang</Label>
              <Select
                value={form.branchId || NO_ACCOUNT}
                onValueChange={(value) =>
                  setForm((current) => ({ ...current, branchId: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Tanpa cabang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_ACCOUNT}>Tanpa cabang</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Akun QRIS</Label>
              <Select
                value={form.qrisAccountId || NO_ACCOUNT}
                onValueChange={(value) =>
                  setForm((current) => ({ ...current, qrisAccountId: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_ACCOUNT}>
                    Otomatis (akun aktif pertama)
                  </SelectItem>
                  {accounts?.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.label} · {account.merchantName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <p className="text-sm font-medium">Meja aktif</p>
              <Switch
                checked={form.isActive}
                onCheckedChange={(checked) =>
                  setForm((current) => ({ ...current, isActive: checked }))
                }
              />
            </div>
          </div>
          <DialogFooter className="sticky bottom-0 -mx-5 -mb-5 border-t bg-popover px-5 py-4 sm:-mx-6 sm:-mb-6 sm:px-6">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={submit}
              disabled={
                createTable.isPending ||
                updateTable.isPending ||
                !form.code.trim()
              }
            >
              Simpan
            </Button>
          </DialogFooter>
        </QrisDialogContent>
      </Dialog>

      <Dialog open={Boolean(qrTarget)} onOpenChange={() => setQrTarget(null)}>
        <QrisDialogContent>
          <DialogHeader>
            <DialogTitle>QR meja {qrTarget?.code}</DialogTitle>
            <DialogDescription>
              Cetak dan tempel di meja. Pelanggan memindai untuk memesan dan
              membayar.
            </DialogDescription>
          </DialogHeader>
          {publicUrl ? (
            <div className="space-y-4">
              <QrImage
                value={publicUrl}
                downloadName={`meja-${qrTarget?.code ?? "qr"}.png`}
              />
              <div className="flex items-center gap-2">
                <Input readOnly value={publicUrl} className="text-xs" />
                <CopyButton value={publicUrl} label="" />
              </div>
            </div>
          ) : null}
        </QrisDialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <QrisDialogContent>
          <DialogHeader>
            <DialogTitle>Hapus meja?</DialogTitle>
            <DialogDescription>
              QR meja berhenti berfungsi. Riwayat pesanan tetap tersimpan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              disabled={deleteTable.isPending}
              onClick={() => {
                if (!deleteTarget) return;
                deleteTable.mutate(deleteTarget.id, {
                  onSuccess: () => {
                    toast.success("Meja dihapus");
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
