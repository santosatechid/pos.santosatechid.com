"use client";
import { useState, useEffect } from "react";

import {
  type BranchRecord,
  findMainBranch,
  useCreateBranch,
  useDeleteBranch,
  useGetBranchs,
  useUpdateBranch,
} from "@/hooks/branches/useBranches";
import { useGetUserByIdBetterAuth } from "@/hooks/users/useUsersByIdBetterAuth";
import { useResetUserPassword } from "@/hooks/users/useUsers";
import { getErrorMessage } from "@/types";
import Loading from "@/components/common/loading";
import CopyButton from "@/components/qris/CopyButton";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdownMenu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
import { useSession } from "@/services/auth/authClients";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronDown,
  Eye,
  KeyRound,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { unauthorized } from "next/navigation";

import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

// ─── Types ────────────────────────────────────────────────────────────────────
export type BranchData = BranchRecord;

// ─── Schema ───────────────────────────────────────────────────────────────────
const branchSchema = z.object({
  name: z
    .string()
    .min(1, "Nama Cabang wajib diisi")
    .max(100, "Nama maksimal 100 karakter"),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  adminName: z.string().optional(),
  isActive: z.boolean(),
  cashierName: z.string().optional(),
  cashierEmail: z.string().optional(),
  cashierPassword: z.string().optional(),
});

type BranchFormValues = z.infer<typeof branchSchema>;

// ─── BranchFormDialog ──────────────────────────────────────────────────────────
function BranchFormDialog({
  open,
  onOpenChange,
  editData,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: BranchData | null;
  onSuccess: () => void;
}) {
  const createBranch = useCreateBranch();
  const updateBranch = useUpdateBranch();
  const [credentials, setCredentials] = useState<{
    branchName: string;
    email: string;
    password: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<BranchFormValues>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      name: "",
      description: "",
      address: "",
      cashierName: "",
      cashierEmail: "",
      isActive: true,
    },
  });

  const isActive = watch("isActive");

  useEffect(() => {
    if (editData) {
      setValue("name", editData.name);
      setValue("description", editData.description || "");
      setValue("address", editData.address || "");
      setValue("phone", editData.phone || "");
      setValue("adminName", editData.adminName || "");
      setValue("isActive", editData.isActive);
    } else {
      reset({
        name: "",
        description: "",
        address: "",
        phone: "",
        adminName: "",
        cashierName: "",
        cashierEmail: "",
        cashierPassword: "",
        isActive: true,
      });
    }
  }, [editData, setValue, reset]);

  const onSubmit = async (data: BranchFormValues) => {
    try {
      if (editData) {
        await updateBranch.mutateAsync({
          id: editData.id,
          name: data.name,
          description: data.description,
          address: data.address,
          phone: data.phone,
          adminName: data.adminName,
          isActive: data.isActive,
        });
        toast.success("Cabang berhasil diperbarui!");
      } else {
        const cashierName = data.cashierName?.trim() ?? "";
        const cashierEmail = data.cashierEmail?.trim() ?? "";

        if (!cashierName || !cashierEmail) {
          toast.error("Nama dan email kasir wajib diisi.");
          return;
        }

        if (
          data.cashierPassword &&
          data.cashierPassword.length > 0 &&
          data.cashierPassword.length < 8
        ) {
          toast.error("Password minimal 8 karakter.");
          return;
        }

        const created = await createBranch.mutateAsync({
          name: data.name,
          description: data.description,
          address: data.address,
          phone: data.phone,
          adminName: data.adminName,
          isActive: data.isActive,
          cashier: {
            name: cashierName,
            email: cashierEmail,
            password: data.cashierPassword?.trim() || undefined,
          },
        });

        if (created.cashier) {
          setCredentials({
            branchName: data.name,
            email: created.cashier.email,
            password: created.cashier.password,
          });
        }
        toast.success("Cabang dan akun kasir berhasil dibuat!");
      }
      reset();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editData ? "Edit Cabang" : "Tambah Cabang"}
            </DialogTitle>
            <DialogDescription>
              Isi profil cabang. Akun kasir otomatis dibuat saat tambah cabang.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Nama Cabang <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Contoh: Cabang Bandung"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-destructive text-sm">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Deskripsi{" "}
                <span className="text-muted-foreground text-xs">(opsional)</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Deskripsi singkat cabang..."
                rows={2}
                {...register("description")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">
                Alamat{" "}
                <span className="text-muted-foreground text-xs">(opsional)</span>
              </Label>
              <Textarea
                id="address"
                placeholder="Alamat lengkap cabang..."
                rows={2}
                {...register("address")}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Telepon cabang</Label>
                <Input
                  id="phone"
                  placeholder="0812-xxxx-xxxx"
                  {...register("phone")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminName">Penanggung jawab</Label>
                <Input
                  id="adminName"
                  placeholder="Nama admin cabang"
                  {...register("adminName")}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Cabang aktif</p>
                <p className="text-muted-foreground text-xs">
                  Cabang nonaktif tidak muncul di pilihan meja.
                </p>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={(checked) => setValue("isActive", checked)}
              />
            </div>

            {!editData ? (
              <>
                <Separator />
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold">Akun login cabang</p>
                    <p className="text-muted-foreground text-xs">
                      Akun kasir otomatis terdaftar saat cabang disimpan.
                      Password dibuat otomatis bila dikosongkan.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cashierName">Nama kasir</Label>
                    <Input
                      id="cashierName"
                      placeholder="Nama kasir"
                      {...register("cashierName")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cashierEmail">Email login</Label>
                    <Input
                      id="cashierEmail"
                      type="email"
                      autoComplete="off"
                      placeholder="kasir@email.com"
                      {...register("cashierEmail")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cashierPassword">
                      Password{" "}
                      <span className="text-muted-foreground text-xs">
                        (opsional, min. 8 karakter)
                      </span>
                    </Label>
                    <Input
                      id="cashierPassword"
                      type="password"
                      autoComplete="new-password"
                      placeholder="Kosongkan untuk dibuat otomatis"
                      {...register("cashierPassword")}
                    />
                  </div>
                </div>
              </>
            ) : null}

            <DialogFooter className="sticky bottom-0 -mx-5 -mb-5 border-t bg-popover px-5 py-4 sm:-mx-6 sm:-mb-6 sm:px-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={createBranch.isPending || updateBranch.isPending}
              >
                {createBranch.isPending || updateBranch.isPending
                  ? "Menyimpan..."
                  : editData
                    ? "Perbarui"
                    : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(credentials)}
        onOpenChange={() => setCredentials(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Akses kasir {credentials?.branchName ?? ""}
            </DialogTitle>
            <DialogDescription>
              Simpan email dan password ini sekarang. Password hanya
              ditampilkan sekali.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Simpan sekarang. Password hanya ditampilkan sekali.
            </p>
            <div className="space-y-2">
              <Label>Email</Label>
              <div className="flex items-center gap-2">
                <Input readOnly value={credentials?.email ?? ""} />
                <CopyButton value={credentials?.email ?? ""} label="" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={credentials?.password ?? ""}
                  className="font-mono"
                />
                <CopyButton value={credentials?.password ?? ""} label="" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setCredentials(null)}>Selesai</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── BranchDetailDialog ────────────────────────────────────────────────────────
function BranchDetailDialog({
  open,
  onOpenChange,
  branchData,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchData: BranchData | null;
}) {
  const resetPassword = useResetUserPassword();
  const [credentials, setCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);

  if (!branchData) return null;

  const cashier = branchData.users?.find(
    (user) => user.role?.name === "Kasir",
  );

  const handleReset = async () => {
    if (!cashier) return;
    try {
      const result = await resetPassword.mutateAsync(cashier.id);
      setCredentials({ email: result.email, password: result.password });
      toast.success("Password kasir direset. Tampilkan sekarang.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detail Cabang</DialogTitle>
          <DialogDescription>
            Profil cabang, akun kasir, dan statistik singkat.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Header info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-muted-foreground mb-1 text-xs">
                Status
              </p>
              <Badge
                variant={branchData.isActive ? "default" : "secondary"}
                className="mt-1"
              >
                {branchData.isActive ? "Aktif" : "Tidak Aktif"}
              </Badge>
            </div>
          </div>

          <div>
            <p className="text-muted-foreground mb-1 text-xs">
              Nama Cabang
            </p>
            <p className="text-base font-semibold">{branchData.name}</p>
          </div>

          {branchData.description && (
            <div>
              <p className="text-muted-foreground mb-1 text-xs">
                Deskripsi
              </p>
              <p className="text-sm">{branchData.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {branchData.address && (
              <div>
                <p className="text-muted-foreground mb-1 text-xs">
                  Alamat
                </p>
                <p className="text-sm">{branchData.address}</p>
              </div>
            )}
          </div>

          <Separator />

          <div className="rounded-lg border p-3">
            <p className="text-muted-foreground mb-2 text-xs">Akun kasir</p>
            {cashier ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{cashier.name}</p>
                  <p className="text-muted-foreground text-sm">
                    {cashier.email}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={resetPassword.isPending}
                  onClick={() => void handleReset()}
                >
                  <KeyRound className="mr-2 h-4 w-4" />
                  {resetPassword.isPending
                    ? "Mereset..."
                    : "Reset password"}
                </Button>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                Belum ada akun kasir di cabang ini.
              </p>
            )}
          </div>

          <Separator />

          {/* Statistik */}
          <div>
            <p className="text-muted-foreground mb-3 text-xs">
              Statistik
            </p>
            <div className="grid grid-cols-1 gap-3">
              {[
                {
                  label: "Users",
                  value: branchData._count?.users ?? 0,
                  color: "text-success",
                  bg: "bg-success-surface",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className={`rounded-3xl p-3 text-center ${stat.bg} border`}
                >
                  <div className={`text-2xl font-semibold tracking-tight ${stat.color}`}>
                    {stat.value}
                  </div>
                  <div className="text-muted-foreground mt-0.5 text-xs">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={() => onOpenChange(false)}>Tutup</Button>
        </div>
      </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(credentials)}
        onOpenChange={() => setCredentials(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Password kasir baru</DialogTitle>
            <DialogDescription>
              Simpan sekarang. Password hanya ditampilkan sekali; admin bisa
              reset lagi kapan saja lewat detail cabang.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Simpan sekarang. Password hanya ditampilkan sekali; admin bisa
              reset lagi kapan saja lewat detail cabang.
            </p>
            <div className="space-y-2">
              <Label>Email</Label>
              <div className="flex items-center gap-2">
                <Input readOnly value={credentials?.email ?? ""} />
                <CopyButton value={credentials?.email ?? ""} label="" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={credentials?.password ?? ""}
                  className="font-mono"
                />
                <CopyButton value={credentials?.password ?? ""} label="" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setCredentials(null)}>Selesai</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── DeleteBranchDialog ────────────────────────────────────────────────────────
function DeleteBranchDialog({
  open,
  onOpenChange,
  branchData,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchData: BranchData | null;
  onSuccess: () => void;
}) {
  const deleteBranch = useDeleteBranch();

  const handleDelete = async () => {
    if (!branchData) return;
    try {
      await deleteBranch.mutateAsync(branchData.id);
      toast.success("Branch berhasil dihapus!");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const hasRelatedData = (branchData?._count?.users ?? 0) > 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Cabang</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div>
              {hasRelatedData ? (
                <div className="space-y-2">
                  <p>
                    Branch <strong>{branchData?.name}</strong> masih dipakai{" "}
                    {branchData?._count?.users ?? 0} user.
                  </p>
                  <p className="text-destructive text-sm font-medium">
                    User terkait akan kehilangan branch. Tindakan ini tidak dapat
                    dibatalkan.
                  </p>
                </div>
              ) : (
                <p>
                  Apakah Anda yakin ingin menghapus Branch{" "}
                  <strong>{branchData?.name}</strong>? Tindakan ini tidak dapat
                  dibatalkan.
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteBranch.isPending}
            className="bg-destructive-solid hover:bg-destructive-solid/90"
          >
            {deleteBranch.isPending ? "Menghapus..." : "Hapus"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── BranchDataTable ───────────────────────────────────────────────────────────
function BranchDataTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<BranchData | null>(null);

  const { data: branchs = [], isLoading, refetch } = useGetBranchs();
  const handleSuccess = () => refetch();

  const columns: ColumnDef<BranchData>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Nama Cabang <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "description",
      header: "Deskripsi",
      cell: ({ row }) => (
        <div className="text-muted-foreground max-w-[180px] truncate text-sm">
          {(row.getValue("description") as string) || "-"}
        </div>
      ),
    },
    {
      accessorKey: "address",
      header: "Alamat",
      cell: ({ row }) => (
        <div className="text-muted-foreground max-w-[160px] truncate text-sm">
          {(row.getValue("address") as string) || "-"}
        </div>
      ),
    },
    {
      id: "cashier",
      header: "Kasir",
      cell: ({ row }) => {
        const cashier = row.original.users?.find(
          (user) => user.role?.name === "Kasir",
        );
        return (
          <div className="text-xs">
            <div className="font-medium">{cashier?.name ?? "-"}</div>
            <div className="text-muted-foreground">
              {cashier?.email ?? "Belum ada kasir"}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "isActive",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <Badge
          variant={
            (row.getValue("isActive") as boolean) ? "default" : "secondary"
          }
        >
          {(row.getValue("isActive") as boolean) ? "Aktif" : "Tidak Aktif"}
        </Badge>
      ),
    },
    {
      id: "stats",
      header: "Statistik",
      cell: ({ row }) => {
        const m = row.original;
        return (
          <div className="text-xs">
            <span className="text-success font-medium">
              {m._count?.users ?? 0} user
            </span>
          </div>
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const m = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Aksi</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(m.id)}
              >
                Copy ID Branch
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setSelectedBranch(m);
                  setDetailDialogOpen(true);
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                Lihat Detail
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedBranch(m);
                  setEditDialogOpen(true);
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedBranch(m);
                  setDeleteDialogOpen(true);
                }}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: branchs,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: { sorting, columnFilters, columnVisibility, rowSelection },
  });

  if (isLoading) return <Loading />;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-[-0.6px] text-[#16181D]">
            Cabang
          </h1>
          <p className="text-[13px] font-medium text-[#5D6370]">
            Kelola cabang, alamat, telepon, dan penanggung jawab.
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Cabang
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Cari nama atau kode cabang..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(e) =>
              table.getColumn("name")?.setFilterValue(e.target.value)
            }
            className="w-full pl-10"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Kolom <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((c) => c.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#E3E5E9] bg-white">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-muted-foreground h-24 text-center"
                >
                  Belum ada cabang.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between py-4">
        <div className="text-muted-foreground text-sm">
          {table.getFilteredSelectedRowModel().rows.length} dari{" "}
          {table.getFilteredRowModel().rows.length} baris dipilih.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Sebelumnya
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Selanjutnya
          </Button>
        </div>
      </div>

      {/* Dialogs */}
      <BranchFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleSuccess}
      />
      <BranchFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        editData={selectedBranch}
        onSuccess={handleSuccess}
      />
      <BranchDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        branchData={selectedBranch}
      />
      <DeleteBranchDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        branchData={selectedBranch}
        onSuccess={handleSuccess}
      />
    </div>
  );
}

// ─── Auth Wrapper ─────────────────────────────────────────────────────────────
export default function UserDataTable() {
  const { data: session, isPending } = useSession();
  const userId = session?.user?.id;
  const { data: userData, isLoading: isLoadingUserData } =
    useGetUserByIdBetterAuth(userId as string);
  const { data: branchs, isLoading: isLoadingBranches } = useGetBranchs();
  const userRole = userData?.role?.name;

  if (isPending || isLoadingUserData || isLoadingBranches) return <Loading />;

  const mainBranch = findMainBranch(branchs ?? []);
  if (
    userRole !== "Admin" ||
    !mainBranch ||
    userData?.branchId !== mainBranch.id
  ) {
    unauthorized();
    return null;
  }

  return <BranchDataTable />;
}
