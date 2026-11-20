import LandingPage from "@/components/landing/LandingPage";
import { type Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Santosa POS — Kasir untuk warung, kafe, dan toko",
  description:
    "Aplikasi kasir Android untuk warung, kafe, dan toko: pesanan, kembalian, stok, dan laporan laba bersih. Bisa jalan tanpa internet. Gratis 14 hari.",
  openGraph: {
    title: "Santosa POS — Kasir yang rapi, untung yang jelas",
    description:
      "Catat pesanan, hitung kembalian, pantau stok, dan lihat untung dari satu aplikasi Android.",
    type: "website",
    locale: "id_ID",
  },
};

export default LandingPage;
