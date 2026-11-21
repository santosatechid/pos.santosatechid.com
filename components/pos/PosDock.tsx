"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Building2,
  House,
  LayoutGrid,
  LogOut,
  QrCode,
  ReceiptText,
  UtensilsCrossed,
} from "lucide-react";

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
import {
  findMainBranch,
  useGetBranchs,
} from "@/hooks/branches/useBranches";
import { useGetUserByIdBetterAuth } from "@/hooks/users/useUsersByIdBetterAuth";
import { signOut, useSession } from "@/services/auth/authClients";

const ITEMS = [
  { href: "/dashboard", label: "Kasir", icon: House },
  {
    href: "/dashboard/admin/utility/qris/orders",
    label: "Pesanan",
    icon: ReceiptText,
  },
  {
    href: "/dashboard/admin/utility/qris/products",
    label: "Produk",
    icon: UtensilsCrossed,
  },
  {
    href: "/dashboard/admin/utility/qris/tables",
    label: "Meja",
    icon: LayoutGrid,
  },
  {
    href: "/dashboard/admin/utility/qris/accounts",
    label: "QRIS",
    icon: QrCode,
  },
  {
    href: "/dashboard/admin/master/receipt",
    label: "Struk",
    icon: ReceiptText,
  },
  {
    href: "/dashboard/admin/master/branches",
    label: "Cabang",
    icon: Building2,
  },
];

function itemClass(active: boolean) {
  return `flex flex-col items-center justify-center gap-0.5 text-[9px] font-bold transition-colors ${
    active ? "text-[#C81E28]" : "text-[#7C8290] hover:text-[#16181D]"
  }`;
}

export default function PosDock() {
  const pathname = usePathname();
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();
  const { data: userData } = useGetUserByIdBetterAuth(
    session?.user?.id ?? "",
  );
  const { data: branches = [] } = useGetBranchs();

  const mainBranch = findMainBranch(branches);
  const canManageBranches =
    userData?.role?.name === "Admin" &&
    Boolean(
      userData?.branchId &&
        mainBranch &&
        userData.branchId === mainBranch.id,
    );

  const items = ITEMS.filter(
    (item) =>
      item.href !== "/dashboard/admin/master/branches" || canManageBranches,
  );
  const columnClass =
    items.length === ITEMS.length ? "grid-cols-8" : "grid-cols-7";

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut();
      router.replace("/auth/signIn");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <nav className="pb-[env(safe-area-inset-bottom)] fixed inset-x-0 bottom-0 z-40 border-t border-[#E3E5E9] bg-white/95 backdrop-blur">
        <div
          className={`mx-auto grid h-[62px] max-w-[820px] ${columnClass}`}
        >
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className={itemClass(false)}
          >
            <LogOut className="h-[19px] w-[19px]" strokeWidth={1.8} />
            Keluar
          </button>
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} className={itemClass(active)}>
                <Icon
                  className="h-[19px] w-[19px]"
                  strokeWidth={active ? 2.4 : 1.8}
                />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Keluar dari akun?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda yakin mau keluar? Sesi akan diakhiri dan kembali ke halaman
              masuk.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleLogout()}
              disabled={loading}
            >
              {loading ? "Keluar..." : "Keluar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
