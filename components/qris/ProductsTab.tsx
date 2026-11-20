"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
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
  type ProductRecord,
  useCreateProduct,
  useDeleteProduct,
  useGetProducts,
  useUpdateProduct,
} from "@/hooks/qris/usePos";
import {
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import QrisDialogContent from "./QrisDialogContent";
import { formatRupiah } from "./qr";

type ProductForm = {
  name: string;
  category: string;
  price: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
};

const emptyForm: ProductForm = {
  name: "",
  category: "",
  price: "",
  description: "",
  imageUrl: "",
  isActive: true,
};

export default function ProductsTab() {
  const { data: products, isLoading } = useGetProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProductRecord | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<ProductRecord | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadImage = async (file: File) => {
    const endpoint = process.env.NEXT_PUBLIC_FILESERVER_URL;
    if (!endpoint) {
      toast.error("File server belum diatur.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar.");
      return;
    }

    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch(endpoint, { method: "POST", body });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.fileUrl) {
        throw new Error(data.message || "Gagal mengupload gambar");
      }
      setForm((current) => ({ ...current, imageUrl: data.fileUrl }));
      toast.success("Gambar berhasil diunggah.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal upload");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (product: ProductRecord) => {
    setEditing(product);
    setForm({
      name: product.name,
      category: product.category ?? "",
      price: String(product.price),
      description: product.description ?? "",
      imageUrl: product.imageUrl ?? "",
      isActive: product.isActive,
    });
    setOpen(true);
  };

  const submit = () => {
    const price = Number(form.price);
    if (!Number.isSafeInteger(price) || price < 0) {
      toast.error("Harga harus bilangan bulat");
      return;
    }

    const payload = {
      name: form.name,
      category: form.category || null,
      price,
      description: form.description || null,
      imageUrl: form.imageUrl || null,
      isActive: form.isActive,
    };

    if (editing) {
      updateProduct.mutate(
        { id: editing.id, ...payload },
        {
          onSuccess: () => {
            toast.success("Produk diperbarui");
            setOpen(false);
          },
          onError: (error) => toast.error(error.message),
        },
      );
      return;
    }

    createProduct.mutate(payload, {
      onSuccess: () => {
        toast.success("Produk ditambahkan");
        setOpen(false);
      },
      onError: (error) => toast.error(error.message),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-extrabold tracking-[-0.6px] text-[#16181D]">Produk</h2>
          <p className="text-[13px] font-medium text-[#5D6370]">
            Menu yang tampil di halaman pesan pelanggan.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Tambah produk
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#E3E5E9] bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Harga</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5}>Memuat data...</TableCell>
              </TableRow>
            ) : !products?.length ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
                  Belum ada produk.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="font-medium">{product.name}</div>
                    {product.description ? (
                      <div className="text-muted-foreground line-clamp-1 text-xs">
                        {product.description}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell>{product.category ?? "-"}</TableCell>
                  <TableCell>{formatRupiah(product.price)}</TableCell>
                  <TableCell>
                    <Badge variant={product.isActive ? "default" : "secondary"}>
                      {product.isActive ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEdit(product)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => setDeleteTarget(product)}
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
              {editing ? "Ubah produk" : "Tambah produk"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product-name">Nama</Label>
              <Input
                id="product-name"
                value={form.name}
                maxLength={100}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="product-category">Kategori</Label>
                <Input
                  id="product-category"
                  value={form.category}
                  maxLength={60}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      category: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-price">Harga (Rp)</Label>
                <Input
                  id="product-price"
                  type="number"
                  min={0}
                  step={1}
                  value={form.price}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      price: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-description">Deskripsi</Label>
              <Textarea
                id="product-description"
                rows={3}
                value={form.description}
                maxLength={500}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Gambar produk</Label>
              <div className="flex items-center gap-3">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[12px] border border-[#E3E5E9] bg-[#F5F6F8]">
                  {form.imageUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={form.imageUrl}
                        alt="Preview produk"
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        aria-label="Hapus gambar"
                        onClick={() =>
                          setForm((current) => ({ ...current, imageUrl: "" }))
                        }
                        className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-[#16181D]/70 text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </>
                  ) : (
                    <span className="grid h-full w-full place-items-center text-[#7C8290]">
                      {uploading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Upload className="h-5 w-5" />
                      )}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading ? "Mengunggah..." : "Upload gambar"}
                  </Button>
                  <p className="text-[11px] text-[#7C8290]">
                    JPG/PNG. Disimpan ke file server.
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void uploadImage(file);
                    }}
                  />
                </div>
              </div>

              <Input
                value={form.imageUrl}
                placeholder="atau tempel URL gambar"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    imageUrl: event.target.value,
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <p className="text-sm font-medium">Produk aktif</p>
              <Switch
                checked={form.isActive}
                onCheckedChange={(checked) =>
                  setForm((current) => ({ ...current, isActive: checked }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={submit}
              disabled={
                createProduct.isPending ||
                updateProduct.isPending ||
                !form.name.trim()
              }
            >
              Simpan
            </Button>
          </DialogFooter>
        </QrisDialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <QrisDialogContent>
          <DialogHeader>
            <DialogTitle>Hapus produk?</DialogTitle>
          </DialogHeader>
          <p className="text-[13px] font-medium text-[#5D6370]">
            Produk hilang dari menu. Item pesanan lama tetap menyimpan nama dan
            harga saat transaksi.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              disabled={deleteProduct.isPending}
              onClick={() => {
                if (!deleteTarget) return;
                deleteProduct.mutate(deleteTarget.id, {
                  onSuccess: () => {
                    toast.success("Produk dihapus");
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
