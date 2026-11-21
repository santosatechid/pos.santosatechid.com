"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { ImagePlus, Loader2, QrCode } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { decodeQrFromFile } from "@/components/qris/decodeQr";
import { useCreateClient } from "@/hooks/clients/useClients";
import { parseQRIS, validateQRIS } from "@/lib/qris";
import { getErrorMessage } from "@/types";

export default function OnboardingForm({
  defaultName,
  defaultEmail,
}: {
  defaultName: string;
  defaultEmail: string;
}) {
  const router = useRouter();
  const createClient = useCreateClient();
  const [form, setForm] = useState({
    name: defaultName ? `${defaultName}'s Workspace` : "",
    email: defaultEmail,
    phone: "",
    address: "",
    logoUrl: "",
    branchName: "Main",
    branchPhone: "",
    branchAddress: "",
    branchAdmin: "",
    qrisLabel: "QRIS Utama",
    qrisPayload: "",
  });
  const [uploading, setUploading] = useState(false);
  const [decoding, setDecoding] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const qrisInputRef = useRef<HTMLInputElement>(null);

  const update = (patch: Partial<typeof form>) =>
    setForm((current) => ({ ...current, ...patch }));

  const qrisPreview = useMemo(() => {
    const payload = form.qrisPayload.trim();
    if (!payload) return null;
    const validation = validateQRIS(payload);
    if (!validation.valid) {
      return { error: validation.errors.join("; ") };
    }
    const parsed = parseQRIS(payload);
    if (parsed.method !== "static") {
      return { error: "QRIS harus bertipe statis." };
    }
    return {
      error: null,
      name: parsed.merchantName,
      city: parsed.merchantCity,
    };
  }, [form.qrisPayload]);

  const uploadLogo = async (file: File) => {
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
        throw new Error(data.message || "Gagal mengunggah logo");
      }
      update({ logoUrl: data.fileUrl });
      toast.success("Logo siap dipakai di struk.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal upload");
    } finally {
      setUploading(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  const readQrisImage = async (file: File) => {
    setDecoding(true);
    try {
      const payload = await decodeQrFromFile(file);
      update({ qrisPayload: payload });
      toast.success("QRIS berhasil dibaca.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal membaca QR");
    } finally {
      setDecoding(false);
      if (qrisInputRef.current) qrisInputRef.current.value = "";
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (form.name.trim().length < 2) {
      toast.error("Nama client minimal 2 karakter.");
      return;
    }
    if (form.qrisPayload.trim() && qrisPreview?.error) {
      toast.error("QRIS tidak valid. Periksa kembali.");
      return;
    }

    try {
      await createClient.mutateAsync({
        name: form.name.trim(),
        email: form.email,
        phone: form.phone.trim(),
        address: form.address.trim(),
        logoUrl: form.logoUrl,
        branch: {
          name: form.branchName.trim() || "Main",
          phone: form.branchPhone.trim(),
          address: form.branchAddress.trim(),
          adminName: form.branchAdmin.trim(),
        },
        qris: form.qrisPayload.trim()
          ? {
              label: form.qrisLabel.trim() || "QRIS Utama",
              staticPayload: form.qrisPayload.trim(),
            }
          : undefined,
      });
      toast.success("Akun, cabang utama, dan struk siap.");
      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Buat akun</CardTitle>
        <CardDescription>
          Satu akun memiliki satu client. Cabang Main, profil struk, dan QRIS
          statis bisa langsung disiapkan di sini.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client-name">Nama client</Label>
            <Input
              id="client-name"
              value={form.name}
              onChange={(event) => update({ name: event.target.value })}
              placeholder="PT Contoh Indonesia"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="client-phone">Telepon toko</Label>
              <Input
                id="client-phone"
                value={form.phone}
                onChange={(event) => update({ phone: event.target.value })}
                placeholder="08xxxxxxxxxx"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-logo">Logo struk</Label>
              <input
                ref={logoInputRef}
                id="client-logo"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadLogo(file);
                }}
              />
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 flex-1"
                  disabled={uploading}
                  onClick={() => logoInputRef.current?.click()}
                >
                  {uploading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ImagePlus className="mr-2 h-4 w-4" />
                  )}
                  {form.logoUrl ? "Ganti logo" : "Upload logo"}
                </Button>
                {form.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.logoUrl}
                    alt="Logo"
                    className="h-9 w-9 rounded border border-[#E3E5E9] object-contain"
                  />
                ) : null}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-address">Alamat toko</Label>
            <Textarea
              id="client-address"
              value={form.address}
              onChange={(event) => update({ address: event.target.value })}
              placeholder="Alamat yang tercetak di struk"
              rows={2}
            />
          </div>

          <Separator />
          <div>
            <p className="text-sm font-semibold">Cabang utama</p>
            <p className="text-muted-foreground text-xs">
              Cabang pertama otomatis dibuat dan dipakai untuk login kasir.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="branch-name">Nama cabang</Label>
              <Input
                id="branch-name"
                value={form.branchName}
                onChange={(event) => update({ branchName: event.target.value })}
                placeholder="Main"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch-phone">Telepon cabang</Label>
              <Input
                id="branch-phone"
                value={form.branchPhone}
                onChange={(event) => update({ branchPhone: event.target.value })}
                placeholder="08xxxxxxxxxx"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="branch-address">Alamat cabang</Label>
            <Textarea
              id="branch-address"
              value={form.branchAddress}
              onChange={(event) =>
                update({ branchAddress: event.target.value })
              }
              placeholder="Alamat cabang yang tercetak di struk"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="branch-admin">Penanggung jawab</Label>
            <Input
              id="branch-admin"
              value={form.branchAdmin}
              onChange={(event) => update({ branchAdmin: event.target.value })}
              placeholder="Nama admin cabang"
            />
          </div>

          <Separator />
          <div>
            <p className="text-sm font-semibold">QRIS statis (opsional)</p>
            <p className="text-muted-foreground text-xs">
              Tempel payload atau unggah gambar QRIS merchant. Bisa diubah nanti
              di menu QRIS.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="qris-label">Label QRIS</Label>
            <Input
              id="qris-label"
              value={form.qrisLabel}
              onChange={(event) => update({ qrisLabel: event.target.value })}
              placeholder="QRIS Utama"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="qris-payload">Payload QRIS</Label>
            <Textarea
              id="qris-payload"
              value={form.qrisPayload}
              onChange={(event) => update({ qrisPayload: event.target.value })}
              placeholder="00020101021126..."
              rows={3}
              className="font-mono text-xs"
            />
            <div className="flex items-center gap-2">
              <input
                ref={qrisInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void readQrisImage(file);
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={decoding}
                onClick={() => qrisInputRef.current?.click()}
              >
                {decoding ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <QrCode className="mr-2 h-4 w-4" />
                )}
                {decoding ? "Membaca..." : "Upload gambar QRIS"}
              </Button>
            </div>
            {qrisPreview ? (
              <p
                className={`text-xs font-medium ${
                  qrisPreview.error ? "text-destructive" : "text-success"
                }`}
              >
                {qrisPreview.error
                  ? qrisPreview.error
                  : `${qrisPreview.name} · ${qrisPreview.city}`}
              </p>
            ) : null}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={createClient.isPending}
          >
            {createClient.isPending ? "Membuat akun..." : "Buat akun"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
