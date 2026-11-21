"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  useGetBranchs,
  useUpdateBranch,
} from "@/hooks/branches/useBranches";
import { useGetClient, useUpdateClient } from "@/hooks/clients/useClients";
import { useGetUserByIdBetterAuth } from "@/hooks/users/useUsersByIdBetterAuth";
import { useSession } from "@/services/auth/authClients";

type StoreForm = {
  name: string;
  phone: string;
  address: string;
  logoUrl: string;
};

type BranchForm = {
  name: string;
  phone: string;
  address: string;
  adminName: string;
};

const emptyBranch: BranchForm = {
  name: "",
  phone: "",
  address: "",
  adminName: "",
};

export default function ReceiptSettingsPage() {
  const { data: client, isLoading: clientLoading } = useGetClient();
  const { data: branches = [], isLoading: branchLoading } = useGetBranchs();
  const { data: session } = useSession();
  const { data: currentUser } = useGetUserByIdBetterAuth(
    session?.user?.id ?? "",
  );
  const updateClient = useUpdateClient();
  const updateBranch = useUpdateBranch();

  const [store, setStore] = useState<StoreForm>({
    name: "",
    phone: "",
    address: "",
    logoUrl: "",
  });
  const [branchId, setBranchId] = useState("");
  const [branch, setBranch] = useState<BranchForm>(emptyBranch);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadedClientRef = useRef<string | null>(null);

  useEffect(() => {
    if (!client || loadedClientRef.current === client.id) return;
    loadedClientRef.current = client.id;
    setStore({
      name: client.name,
      phone: client.phone ?? "",
      address: client.address ?? "",
      logoUrl: client.logoUrl ?? "",
    });
  }, [client]);

  useEffect(() => {
    if (!branches.length || branchId) return;
    const preferred = currentUser?.branch?.id;
    const target =
      preferred && branches.some((item) => item.id === preferred)
        ? preferred
        : branches[0].id;
    setBranchId(target);
  }, [branches, branchId, currentUser?.branch?.id]);

  useEffect(() => {
    const selected = branches.find((item) => item.id === branchId);
    if (!selected) return;
    setBranch({
      name: selected.name,
      phone: selected.phone ?? "",
      address: selected.address ?? "",
      adminName: selected.adminName ?? "",
    });
  }, [branches, branchId]);

  const selectedBranch = branches.find((item) => item.id === branchId);

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
      setStore((current) => ({ ...current, logoUrl: data.fileUrl }));
      toast.success("Logo diunggah. Klik Simpan toko untuk menerapkan.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal upload");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const saveStore = async () => {
    if (store.name.trim().length < 2) {
      toast.error("Nama toko minimal 2 karakter.");
      return;
    }
    try {
      await updateClient.mutateAsync({
        name: store.name.trim(),
        phone: store.phone.trim(),
        address: store.address.trim(),
        logoUrl: store.logoUrl.trim(),
      });
      toast.success("Profil toko tersimpan.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal menyimpan profil toko",
      );
    }
  };

  const saveBranch = async () => {
    if (!selectedBranch) {
      toast.error("Pilih cabang dulu.");
      return;
    }
    if (branch.name.trim().length < 1) {
      toast.error("Nama cabang wajib diisi.");
      return;
    }
    try {
      await updateBranch.mutateAsync({
        id: selectedBranch.id,
        name: branch.name.trim(),
        address: branch.address.trim(),
        phone: branch.phone.trim(),
        adminName: branch.adminName.trim(),
        isActive: selectedBranch.isActive,
      });
      toast.success("Profil cabang tersimpan.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal menyimpan profil cabang",
      );
    }
  };

  if (clientLoading || branchLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-[13px] font-medium text-[#5D6370]">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Memuat profil...
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <div>
        <h1 className="text-[22px] font-extrabold tracking-[-0.6px] text-[#16181D]">
          Struk &amp; Profil
        </h1>
        <p className="text-[13px] font-medium text-[#5D6370]">
          Logo, alamat, dan telepon di bawah ini yang tercetak di struk.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-[16px] border border-[#E3E5E9] bg-white p-4">
          <h2 className="text-[15px] font-extrabold text-[#16181D]">
            Profil toko
          </h2>
          <p className="mb-3 text-[11.5px] font-medium text-[#5D6370]">
            Dipakai sebagai header utama struk.
          </p>

          <div className="flex items-center gap-3">
            <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-[12px] border border-[#E3E5E9] bg-[#F5F6F8]">
              {store.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={store.logoUrl}
                  alt="Logo toko"
                  className="h-full w-full object-contain"
                />
              ) : (
                <ImagePlus className="h-7 w-7 text-[#7C8290]" />
              )}
            </div>
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadLogo(file);
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ImagePlus className="mr-2 h-4 w-4" />
                )}
                {uploading ? "Mengunggah..." : "Upload logo"}
              </Button>
              <p className="text-[10.5px] text-[#7C8290]">
                PNG/JPG, latar putih lebih baik.
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="store-name">Nama toko</Label>
              <Input
                id="store-name"
                value={store.name}
                onChange={(event) =>
                  setStore((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="store-phone">Telepon</Label>
              <Input
                id="store-phone"
                value={store.phone}
                onChange={(event) =>
                  setStore((current) => ({
                    ...current,
                    phone: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="store-address">Alamat</Label>
              <Textarea
                id="store-address"
                rows={2}
                value={store.address}
                onChange={(event) =>
                  setStore((current) => ({
                    ...current,
                    address: event.target.value,
                  }))
                }
              />
            </div>
          </div>

          <Button
            type="button"
            onClick={() => void saveStore()}
            disabled={updateClient.isPending}
            className="mt-4 w-full"
          >
            <Save className="mr-2 h-4 w-4" />
            {updateClient.isPending ? "Menyimpan..." : "Simpan toko"}
          </Button>
        </section>

        <section className="rounded-[16px] border border-[#E3E5E9] bg-white p-4">
          <h2 className="text-[15px] font-extrabold text-[#16181D]">
            Profil cabang
          </h2>
          <p className="mb-3 text-[11.5px] font-medium text-[#5D6370]">
            Alamat dan telepon cabang menimpa profil toko di struk.
          </p>

          <div className="space-y-2">
            <Label>Pilih cabang</Label>
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih cabang" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedBranch ? (
            <div className="mt-3 space-y-3">
              <div className="space-y-2">
                <Label htmlFor="branch-name">Nama cabang</Label>
                <Input
                  id="branch-name"
                  value={branch.name}
                  onChange={(event) =>
                    setBranch((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="branch-phone">Telepon cabang</Label>
                <Input
                  id="branch-phone"
                  value={branch.phone}
                  onChange={(event) =>
                    setBranch((current) => ({
                      ...current,
                      phone: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="branch-address">Alamat cabang</Label>
                <Textarea
                  id="branch-address"
                  rows={2}
                  value={branch.address}
                  onChange={(event) =>
                    setBranch((current) => ({
                      ...current,
                      address: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="branch-admin">Penanggung jawab</Label>
                <Input
                  id="branch-admin"
                  value={branch.adminName}
                  onChange={(event) =>
                    setBranch((current) => ({
                      ...current,
                      adminName: event.target.value,
                    }))
                  }
                />
              </div>

              <Button
                type="button"
                onClick={() => void saveBranch()}
                disabled={updateBranch.isPending}
                className="w-full"
              >
                <Save className="mr-2 h-4 w-4" />
                {updateBranch.isPending ? "Menyimpan..." : "Simpan cabang"}
              </Button>
            </div>
          ) : (
            <p className="mt-3 rounded-[10px] bg-[#F5F6F8] p-3 text-[12px] text-[#5D6370]">
              Belum ada cabang. Tambahkan cabang dulu di menu Cabang.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
