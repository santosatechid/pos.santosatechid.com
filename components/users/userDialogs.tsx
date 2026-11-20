"use client";

import { useEffect, useState } from "react";

import { useGetBranchs } from "@/hooks/branches/useBranches";
import { useGetRoles } from "@/hooks/roles/useRoles";
import {
  useCreateUser,
  useDeleteUser,
  useUpdateUser,
} from "@/hooks/users/useUsers";
import { getErrorMessage, type UserDataTypes } from "@/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alertDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { toast } from "sonner";

export type UserData = UserDataTypes;

type FormState = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  roleId: string;
  branchId: string;
  status: string;
  isActive: boolean;
};

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  roleId: "",
  branchId: "",
  status: "active",
  isActive: true,
};

export function UserFormDialog({
  open,
  onOpenChange,
  editData,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: UserData | null;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const { data: roles = [] } = useGetRoles();
  const { data: branches = [] } = useGetBranchs();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const isSaving = createUser.isPending || updateUser.isPending;

  useEffect(() => {
    if (!open) return;

    setForm(
      editData
        ? {
            name: editData.name || "",
            email: editData.email || "",
            password: "",
            confirmPassword: "",
            roleId: editData.roleId || "",
            branchId: editData.branchId || "",
            status: editData.status || "active",
            isActive: editData.isActive ?? true,
          }
        : EMPTY_FORM,
    );
  }, [open, editData]);

  useEffect(() => {
    if (!open || editData || form.roleId) return;
    const kasir = roles.find((role) => role.name.toLowerCase() === "kasir");
    if (kasir) {
      setForm((current) => ({ ...current, roleId: kasir.id }));
    }
  }, [open, editData, roles, form.roleId]);

  const update = (patch: Partial<FormState>) =>
    setForm((current) => ({ ...current, ...patch }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.roleId) {
      toast.error("Nama, email, dan role wajib diisi.");
      return;
    }

    if (!editData || form.password) {
      if (form.password.length < 8) {
        toast.error("Password minimal 8 karakter.");
        return;
      }
      if (form.password !== form.confirmPassword) {
        toast.error("Konfirmasi password tidak sama.");
        return;
      }
    }

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      roleId: form.roleId,
      branchId: form.branchId || null,
      status: form.status,
      isActive: form.isActive,
      ...(form.password ? { password: form.password } : {}),
    };

    try {
      if (editData) {
        await updateUser.mutateAsync({ id: editData.id, ...payload });
        toast.success(
          form.password
            ? "User dan password berhasil diperbarui."
            : "User berhasil diperbarui.",
        );
      } else {
        await createUser.mutateAsync(payload);
        toast.success("User dibuat. Akun bisa langsung login.");
      }
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editData ? "Edit User" : "Tambah User & Akun Login"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user-name">Nama</Label>
            <Input
              id="user-name"
              value={form.name}
              onChange={(event) => update({ name: event.target.value })}
              placeholder="Nama lengkap"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-email">Email login</Label>
            <Input
              id="user-email"
              type="email"
              autoComplete="off"
              value={form.email}
              onChange={(event) => update({ email: event.target.value })}
              placeholder="email@example.com"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="user-password">
                {editData ? "Password baru (opsional)" : "Password"}
              </Label>
              <Input
                id="user-password"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(event) => update({ password: event.target.value })}
                placeholder={editData ? "Kosongkan jika tetap" : "Min. 8 karakter"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-password-confirm">Konfirmasi password</Label>
              <Input
                id="user-password-confirm"
                type="password"
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={(event) =>
                  update({ confirmPassword: event.target.value })
                }
                placeholder="Ulangi password"
              />
            </div>
          </div>

          <p className="text-muted-foreground text-xs">
            Akun login langsung terdaftar. Kasir bisa masuk memakai email dan
            password ini tanpa halaman BetterAuth.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={form.roleId || "none"}
                onValueChange={(value) =>
                  update({ roleId: value === "none" ? "" : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Pilih role</SelectItem>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Branch</Label>
              <Select
                value={form.branchId || "none"}
                onValueChange={(value) =>
                  update({ branchId: value === "none" ? "" : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tanpa branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tanpa branch</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(value) => update({ status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => update({ isActive: event.target.checked })}
              className="accent-primary h-4 w-4"
            />
            Aktif
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteUserDialog({
  open,
  onOpenChange,
  userData,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userData: UserData | null;
  onSuccess: () => void;
}) {
  const deleteUser = useDeleteUser();

  const handleDelete = async () => {
    if (!userData) return;
    try {
      await deleteUser.mutateAsync(userData.id);
      toast.success("User dan akun login berhasil dihapus.");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus user?</AlertDialogTitle>
          <AlertDialogDescription>
            Akun login, profil, dan sesi <strong>{userData?.name}</strong> akan
            dihapus permanen. User tidak bisa masuk lagi.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteUser.isPending}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {deleteUser.isPending ? "Menghapus..." : "Hapus"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
