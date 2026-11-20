import PosDemo from "@/components/demo/PosDemo";
import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Demo kasir — Santosa POS",
  description:
    "Coba kasir Santosa POS tanpa login: pilih menu, bayar, lalu lihat laporan omzet, laba, menu terlaris, dan stok.",
  openGraph: {
    title: "Demo kasir Santosa POS",
    description:
      "Demo interaktif kasir untuk warung, kafe, dan toko. Tanpa login, data hanya di browser.",
    type: "website",
    locale: "id_ID",
  },
};

export default function DemoPage() {
  return <PosDemo />;
}
