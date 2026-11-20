import {
  Boxes,
  Calculator,
  ChartColumn,
  Check,
  ChevronDown,
  ClipboardList,
  HardDriveDownload,
  ImagePlus,
  KeyRound,
  LineChart,
  Mail,
  NotebookPen,
  PackageSearch,
  Play,
  ReceiptText,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Store,
  TrendingUp,
  UserPlus,
  WifiOff,
} from "lucide-react";
import Link from "next/link";

import { Brand } from "./Brand";
import { jakarta } from "./font";

const WA = "https://wa.me/6281927453030";

const MENU = [
  {
    name: "Nasi Goreng Spesial",
    price: "Rp 25.000",
    img: "/landing/nasi-goreng.jpg",
  },
  { name: "Es Teh Manis", price: "Rp 8.000", img: "/landing/es-teh.jpg" },
  { name: "Mie Ayam Bakso", price: "Rp 20.000", img: "/landing/mie-ayam.jpg" },
  { name: "Ayam Geprek", price: "Rp 22.000", img: "/landing/ayam-geprek.jpg" },
] as const;

const PROBLEMS = [
  {
    icon: NotebookPen,
    title: "Masih catat pesanan di buku?",
    body: "Pesanan langsung masuk sistem. Struk keluar sendiri, gak perlu nulis dua kali.",
  },
  {
    icon: Calculator,
    title: "Total dan kembalian sering salah pas ramai?",
    body: "Dihitung otomatis — topping, diskon, pajak, dan uang kembalian.",
  },
  {
    icon: PackageSearch,
    title: "Stok baru ketahuan habis pas mau masak?",
    body: "Stok berkurang tiap porsi terjual, plus notifikasi sebelum benar-benar habis.",
  },
  {
    icon: TrendingUp,
    title: "Gak tahu untung harian?",
    body: "Laporan laba bersih tiap hari — bukan cuma omzet yang kelihatan besar.",
  },
] as const;

const FEATURES = [
  {
    icon: ShoppingCart,
    title: "Kasir dan transaksi",
    desc: "Melayani antrean lebih cepat tanpa salah hitung.",
    img: "/landing/fitur-kasir.jpg",
    alt: "Nasi goreng dan telur mata sapi di meja kasir",
    points: [
      "Kasir 3 ketukan: pilih menu, bayar, struk keluar",
      "Tunai, QRIS, kartu, dan e-wallet",
      "Struk Bluetooth 58/80 mm atau kirim WhatsApp",
    ],
  },
  {
    icon: ClipboardList,
    title: "Pesanan dan operasional",
    desc: "Kasir, pelayan, dan dapur bekerja dari pesanan yang sama.",
    img: "/landing/fitur-pesanan.jpg",
    alt: "Semangkuk bakso disajikan dengan sumpit",
    points: [
      "Pesanan langsung ke layar dapur atau tiket cetak",
      "Level pedas, topping, dan catatan dapur",
      "Harga khusus GoFood, GrabFood, ShopeeFood",
    ],
  },
  {
    icon: Boxes,
    title: "Stok dan produk",
    desc: "Tahu bahan yang menipis sebelum kehabisan.",
    img: "/landing/fitur-stok.jpg",
    alt: "Rempah dan bumbu dapur ditata di atas meja",
    points: [
      "Resep per menu, stok bahan terpotong otomatis",
      "Modal (HPP) per porsi dihitung dari resep",
      "Notifikasi stok menipis dan daftar belanja",
    ],
  },
  {
    icon: ChartColumn,
    title: "Laporan dan keuangan",
    desc: "Melihat untung bersih, bukan hanya omzet.",
    img: "/landing/fitur-laporan.jpg",
    alt: "Semangkuk sup dengan potongan tomat segar",
    points: [
      "Omzet, laba kotor, dan laba bersih",
      "Menu terlaris, jam ramai, metode bayar",
      "Multi-outlet dengan laporan terpisah",
    ],
  },
] as const;

const EXTRAS = [
  {
    icon: WifiOff,
    title: "Jalan tanpa internet",
    body: "Internet mati? Kasir tetap nyala, data nyusul saat online.",
  },
  {
    icon: Store,
    title: "Multi-outlet",
    body: "Satu akun untuk banyak cabang, stok dan laporan terpisah.",
  },
  {
    icon: KeyRound,
    title: "Akses dengan PIN",
    body: "Setiap karyawan punya PIN sendiri, pembatalan butuh izin.",
  },
  {
    icon: HardDriveDownload,
    title: "Data di HP Anda",
    body: "Transaksi tersimpan di perangkat, bisa backup ke satu file.",
  },
] as const;

const GALLERY = [
  {
    name: "Ayam Bakar Rica",
    tag: "Ayam bakar",
    price: "Rp 27.000",
    img: "/landing/ayam-bakar-rica.jpg",
    alt: "Ayam bakar rica dengan sambal dan lalapan",
  },
  {
    name: "Es Campur Segar",
    tag: "Minuman",
    price: "Rp 15.000",
    img: "/landing/es-campur.jpg",
    alt: "Es campur dengan sirup merah dan buah segar",
  },
  {
    name: "Soto Betawi",
    tag: "Berkuah",
    price: "Rp 24.000",
    img: "/landing/soto-betawi.jpg",
    alt: "Soto betawi berkuah santan dengan jeruk nipis",
  },
] as const;

const STOCK = [
  { name: "Cabai Merah", left: "42 kg tersisa", img: "/landing/cabai.jpg" },
  { name: "Bawang", left: "18 kg tersisa", img: "/landing/bawang.jpg" },
  {
    name: "Sayuran Segar",
    left: "9 kg tersisa",
    img: "/landing/sayuran.jpg",
  },
  {
    name: "Rempah & Daging",
    left: "24 kg tersisa",
    img: "/landing/rempah.jpg",
  },
] as const;

const STEPS = [
  {
    icon: UserPlus,
    title: "Daftar & unduh",
    body: "Bikin akun, unduh aplikasinya, login. Kurang dari 5 menit.",
  },
  {
    icon: ImagePlus,
    title: "Isi menu & foto",
    body: "Tambah produk, harga, dan foto. Bisa impor dari Excel.",
  },
  {
    icon: ReceiptText,
    title: "Mulai jualan",
    body: "Buka kasir, pilih menu, terima bayaran. Struk langsung keluar.",
  },
  {
    icon: LineChart,
    title: "Pantau untung",
    body: "Tiap malam buka laporan: omzet, laba, menu paling laku.",
  },
] as const;

const TIERS = [
  {
    name: "WARUNG",
    price: "Rp 0",
    per: "14 hari pertama",
    desc: "Buat yang mau coba dulu, tanpa mikir biaya.",
    features: [
      "1 outlet, 1 kasir",
      "Laporan harian",
      "Mode offline",
      "Struk dasar",
    ],
    cta: "Mulai gratis",
    popular: false,
  },
  {
    name: "BISNIS",
    price: "Rp 149rb",
    per: "per bulan / outlet",
    desc: "Paling pas buat kafe dan toko yang sudah ramai.",
    features: [
      "Kasir tanpa batas",
      "Stok & resep otomatis",
      "Printer struk & WhatsApp",
      "Member, promo, dan pajak",
      "Laporan laba + ekspor Excel",
      "Foto menu tak terbatas",
    ],
    cta: "Pilih Bisnis",
    popular: true,
  },
  {
    name: "MULTI-OUTLET",
    price: "Custom",
    per: "ngobrol dulu",
    desc: "Untuk yang cabangnya sudah lebih dari dua.",
    features: [
      "Cabang tanpa batas",
      "Dashboard pusat",
      "Onboarding & training tim",
      "Prioritas dukungan",
    ],
    cta: "Ngobrol dulu",
    popular: false,
  },
] as const;

const FAQ = [
  {
    q: "Butuh internet gak?",
    a: "Gak. Setelah aktivasi, kasir jalan penuh secara offline. Data tersimpan di HP dan nyusul otomatis saat online lagi.",
  },
  {
    q: "Bisa dipakai di HP apa?",
    a: "HP atau tablet Android 7.0 ke atas, termasuk HP kelas menengah. Aplikasi ringan dan tidak butuh RAM besar.",
  },
  {
    q: "Kalau HP-nya ganti atau rusak?",
    a: "Login di HP baru dengan akun yang sama, data transaksi tersimpan di server dan bisa dipulihkan. Backup manual ke satu file juga tersedia.",
  },
  {
    q: "Ada biaya bulanan?",
    a: "Setelah 14 hari gratis, paket Bisnis Rp149rb per bulan per outlet. Tidak ada biaya aktivasi, bisa berhenti kapan saja.",
  },
  {
    q: "Bisa buat beberapa cabang?",
    a: "Bisa. Tiap cabang punya stok dan laporan sendiri dalam satu akun. Untuk lebih dari dua cabang pakai paket Multi-Outlet.",
  },
  {
    q: "Datanya aman?",
    a: "Transaksi disinkronkan terenkripsi dan hanya bisa dibuka dengan akun Anda. Akses karyawan pakai PIN, pembatalan transaksi butuh izin pemilik.",
  },
] as const;

const FOOTER_LINKS = [
  {
    title: "PRODUK",
    links: [
      { label: "Fitur", href: "#fitur" },
      { label: "Coba demo", href: "/demo" },
      { label: "Cara kerja", href: "#cara-kerja" },
      { label: "Harga", href: "#harga" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "KONTAK",
    links: [
      { label: "santosatechid@gmail.com", href: "mailto:santosatechid@gmail.com" },
      { label: "+62 819 2745 3030", href: WA },
      { label: "Jakarta Timur, Indonesia", href: "#kontak" },
    ],
  },
  {
    title: "BANTUAN",
    links: [
      { label: "Panduan pemakaian", href: "#cara-kerja" },
      { label: "Status layanan", href: "#faq" },
    ],
  },
] as const;

function SectionHead({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <p className="text-[13px] font-extrabold tracking-[1.2px] text-[#C81E28]">
        {eyebrow}
      </p>
      <h2 className="text-[28px] leading-[34px] font-extrabold tracking-[-1px] text-[#16181D] sm:text-[34px] sm:leading-[43px]">
        {title}
      </h2>
      {sub ? (
        <p className="max-w-[700px] text-[15.5px] leading-[25px] font-medium text-[#5D6370]">
          {sub}
        </p>
      ) : null}
    </div>
  );
}

function Phone() {
  return (
    <div className="relative h-[650px] w-[600px]">
      <div className="absolute left-[110px] top-[60px] h-[520px] w-[520px] rounded-full bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,#F8DEDE_0%,#FBFCFF_100%)] opacity-85" />

      <div className="absolute left-[200px] top-[-7px] flex h-[570px] w-[330px] flex-col rounded-[46px] bg-[#16181D] p-[11px] shadow-[0_26px_25px_#16181D33]">
        <div className="flex h-full w-full flex-col gap-[10px] overflow-hidden rounded-[36px] bg-white p-[14px]">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-extrabold text-[#16181D]">
              9:41
            </span>
            <span className="flex items-center gap-[5px] text-[#16181D]">
              <svg viewBox="0 0 24 24" className="h-[9px] w-[9px] fill-current">
                <path d="M2 20h3v-5H2v5zm5 0h3V10H7v10zm5 0h3V5h-3v15zm5 0h3V2h-3v18z" />
              </svg>
              <svg viewBox="0 0 24 24" className="h-[9px] w-[9px] fill-current">
                <path d="M12 18.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM12 3a13 13 0 0 0-9.2 3.8l1.7 1.7A10.6 10.6 0 0 1 12 5.6c2.9 0 5.6 1.1 7.5 2.9l1.7-1.7A13 13 0 0 0 12 3z" />
              </svg>
              <svg viewBox="0 0 24 24" className="h-[9px] w-[9px] fill-current">
                <path d="M2 7h17v10H2z" />
                <path d="M20.5 10H22v4h-1.5z" />
              </svg>
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-[7px]">
              <svg viewBox="0 0 24 24" className="h-[11px] w-[11px] fill-none stroke-[#16181D] stroke-2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              <span className="text-[12.5px] font-extrabold text-[#16181D]">
                Kasir · Meja 04
              </span>
            </span>
            <span className="flex items-center gap-1 rounded-[5px] bg-[#EAF7EE] px-[7px] py-[3px]">
              <svg viewBox="0 0 24 24" className="h-[7px] w-[7px] fill-[#15803D]">
                <circle cx="12" cy="12" r="10" />
              </svg>
              <span className="text-[8px] font-extrabold tracking-[0.4px] text-[#15803D]">
                OFFLINE
              </span>
            </span>
          </div>

          <div className="flex gap-[6px]">
            <span className="flex-1 rounded-[7px] bg-[#C81E28] px-2 py-[6px] text-center text-[9.5px] font-bold text-white">
              Dine-in
            </span>
            <span className="flex-1 rounded-[7px] bg-[#F2F3F5] px-2 py-[6px] text-center text-[9.5px] font-bold text-[#5D6370]">
              Bawa pulang
            </span>
            <span className="flex-1 rounded-[7px] bg-[#F2F3F5] px-2 py-[6px] text-center text-[9.5px] font-bold text-[#5D6370]">
              Diantar
            </span>
          </div>

          <div className="flex items-center gap-[7px] rounded-[8px] bg-[#F5F6F8] px-[10px] py-2">
            <svg viewBox="0 0 24 24" className="h-[11px] w-[11px] fill-none stroke-[#7C8290] stroke-2">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <span className="text-[10px] font-medium text-[#7C8290]">
              Cari menu…
            </span>
          </div>

          <div className="flex flex-col gap-[9px]">
            {[0, 2].map((row) => (
              <div key={row} className="flex gap-[9px]">
                {MENU.slice(row, row + 2).map((item) => (
                  <div key={item.name} className="flex flex-1 flex-col gap-[5px]">
                    <img
                      src={item.img}
                      alt=""
                      width={136}
                      height={112}
                      className="h-[112px] w-full rounded-[10px] object-cover"
                    />
                    <span className="text-[10px] font-bold text-[#16181D]">
                      {item.name}
                    </span>
                    <span className="text-[10px] font-extrabold text-[#C81E28]">
                      {item.price}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between rounded-[9px] bg-[#C81E28] px-[11px] py-[9px]">
            <span className="flex flex-col">
              <span className="text-[7.5px] font-extrabold tracking-[0.3px] text-[#F6D3D3]">
                4 ITEM · LIHAT KERANJANG
              </span>
              <span className="text-[13px] font-extrabold text-white">
                Rp 75.000
              </span>
            </span>
            <span className="rounded-[6px] bg-white px-[10px] py-[6px] text-[9.5px] font-extrabold text-[#C81E28]">
              Bayar
            </span>
          </div>

          <div className="mt-auto flex items-center justify-around border-t border-[#EFF0F3] pb-[2px] pt-2 text-[#7C8290]">
            <svg viewBox="0 0 24 24" className="h-[13px] w-[13px] fill-none stroke-current stroke-[1.6]">
              <path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
            </svg>
            <svg viewBox="0 0 24 24" className="h-[13px] w-[13px] fill-none stroke-current stroke-[1.6]">
              <rect x="4" y="3" width="16" height="18" rx="2" />
              <path d="M8 7h8M8 12h8M8 17h5" />
            </svg>
            <svg viewBox="0 0 24 24" className="h-[13px] w-[13px] fill-none stroke-current stroke-[1.6]">
              <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" />
              <path d="M8 12h8" />
            </svg>
            <svg viewBox="0 0 24 24" className="h-[13px] w-[13px] fill-none stroke-current stroke-[1.6]">
              <path d="M12 3a6 6 0 0 0-6 6c0 4 3 5 3 8h6c0-3 3-4 3-8a6 6 0 0 0-6-6z" />
              <path d="M9 21h6" />
            </svg>
            <svg viewBox="0 0 24 24" className="h-[13px] w-[13px] fill-none stroke-current stroke-[1.6]">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
            </svg>
          </div>
        </div>
      </div>

      <div className="absolute left-[16px] top-[80px] w-[190px] overflow-hidden rounded-[14px] bg-white shadow-[0_14px_34px_#16181D26]">
        <img
          src="/landing/sate-ayam.jpg"
          alt="Sate ayam madura"
          width={190}
          height={112}
          className="h-[112px] w-full object-cover"
        />
        <div className="flex flex-col gap-[3px] px-3 pb-[13px] pt-[11px]">
          <span className="text-[8.5px] font-extrabold tracking-[0.6px] text-[#C81E28]">
            MENU BARU
          </span>
          <span className="text-[13px] font-extrabold text-[#16181D]">
            Sate Ayam Madura
          </span>
          <span className="text-[10.5px] font-semibold text-[#5D6370]">
            Rp 28.000 / porsi
          </span>
        </div>
      </div>

      <span className="absolute left-[36px] top-[566px] flex items-center gap-2 rounded-full bg-[#16181D] px-4 py-[11px] text-[12px] font-bold text-white shadow-[0_10px_24px_#16181D2E]">
        <svg viewBox="0 0 24 24" className="h-3 w-3 fill-[#FFC53D]">
          <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z" />
        </svg>
        Dipakai 1.200+ warung
      </span>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className={`${jakarta.className} bg-[#F7F7F8] text-[#16181D]`}>
      <header className="sticky top-0 z-50 border-b border-[#E3E5E9] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[75.5px] w-full max-w-[1440px] items-center justify-between px-6 lg:px-[72px]">
          <Brand />

          <nav className="hidden items-center gap-[30px] md:flex">
            {[
              { label: "Demo", href: "/demo" },
              { label: "Fitur", href: "#fitur" },
              { label: "Harga", href: "#harga" },
              { label: "FAQ", href: "#faq" },
            ].map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="rounded-sm text-[14.5px] font-semibold text-[#5D6370] transition-colors hover:text-[#16181D] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C81E28]"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3 sm:gap-5">
            <Link
              href="/auth/signIn"
              className="rounded-sm text-[14.5px] font-semibold whitespace-nowrap text-[#16181D] hover:text-[#C81E28] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C81E28]"
            >
              Masuk
            </Link>
            <Link
              href="/auth/google"
              className="rounded-[10px] bg-[#C81E28] px-4 py-[11px] text-[14px] font-bold whitespace-nowrap text-white transition-colors hover:bg-[#A8161F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C81E28] sm:px-5 sm:text-[15px]"
            >
              Coba Gratis
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section
          id="demo"
          className="relative scroll-mt-[76px] overflow-hidden bg-[linear-gradient(180deg,#FFFFFF_0%,#FDF7F7_100%)]"
        >
          <div className="pointer-events-none absolute -top-[180px] left-[55%] h-[760px] w-[760px] rounded-full bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,#FBE3E3_0%,#FFFFFF_100%)] opacity-70" />

          <div className="relative mx-auto flex w-full max-w-[1440px] flex-col items-center justify-between gap-10 px-6 py-14 lg:flex-row lg:px-[72px] lg:py-[72px] lg:pb-[88px]">
            <div className="flex w-full max-w-[640px] flex-col gap-[22px]">
              <p className="text-[14.5px] font-bold text-[#C81E28]">
                Aplikasi kasir untuk warung, kafe, dan toko
              </p>

              <h1 className="text-[38px] leading-[44px] font-extrabold tracking-[-1.5px] text-[#16181D] sm:text-[48px] sm:leading-[52px] lg:text-[56px] lg:leading-[60px] lg:tracking-[-2px]">
                Kasir yang rapi,
                <span className="block text-[#C81E28]">untung yang jelas.</span>
              </h1>

              <p className="max-w-[520px] text-[16px] leading-[27px] font-medium text-[#5D6370] sm:text-[17.5px] sm:leading-[29px]">
                Catat pesanan, hitung kembalian, pantau stok, dan lihat untung —
                semua dari satu aplikasi di HP Android. Gak perlu buku, gak perlu
                jago Excel.
              </p>

              <p className="flex items-center gap-[10px]">
                <span className="text-[24px] font-extrabold tracking-[-0.6px] text-[#16181D]">
                  Gratis 14 hari
                </span>
                <span className="text-[14.5px] font-semibold text-[#5D6370]">
                  · lalu Rp149rb / bulan
                </span>
              </p>

              <div className="flex flex-wrap items-center gap-[14px]">
                <Link
                  href="/auth/google"
                  className="inline-flex items-center gap-[9px] rounded-[10px] bg-[#C81E28] px-6 py-[15px] text-[15px] font-bold text-white transition-colors hover:bg-[#A8161F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C81E28]"
                >
                  <Sparkles className="h-[18px] w-[18px]" aria-hidden="true" />
                  Coba Gratis 14 Hari
                </Link>
                <a
                  href="/demo"
                  className="inline-flex items-center gap-[9px] rounded-[10px] bg-white px-6 py-[15px] text-[15px] font-bold text-[#16181D] outline outline-[1.5px] -outline-offset-[0.75px] outline-[#D9DBE0] transition-colors hover:outline-[#16181D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C81E28]"
                >
                  <Play className="h-[18px] w-[18px]" aria-hidden="true" />
                  Lihat Demo Aplikasi
                </a>
              </div>

              <p className="flex items-center gap-2 text-[13.5px] font-medium text-[#8A8F9A]">
                <Smartphone className="h-4 w-4" aria-hidden="true" />
                Cukup HP atau tablet Android 7.0 ke atas. Printer struk opsional.
              </p>
            </div>

            <div className="flex w-full justify-center lg:w-[600px] lg:shrink-0">
              <div className="h-[420px] w-full max-w-[600px] overflow-hidden sm:h-[560px] lg:h-[650px] lg:overflow-visible">
                <div className="flex origin-top justify-center scale-[0.62] sm:scale-[0.84] lg:scale-100">
                  <div className="shrink-0">
                    <Phone />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center gap-11 px-6 py-16 lg:px-[72px] lg:py-[88px]">
            <SectionHead
              eyebrow="KENAPA PERLU"
              title="Usaha makin ramai, pencatatan jangan sampai berantakan."
              sub="Cocok untuk warung makan, bakso & mi ayam, geprek & penyetan, dan kopi & minuman. Empat hal yang paling sering bikin kehilangan duit — dan cara Santosa POS beresin."
            />

            <div className="grid w-full gap-4 md:grid-cols-2">
              {PROBLEMS.map(({ icon: Icon, title, body }) => (
                <div
                  key={title}
                  className="flex items-start gap-4 rounded-[16px] bg-white p-6 outline outline-1 -outline-offset-[0.5px] outline-[#E3E5E9]"
                >
                  <span className="grid h-[44px] w-[44px] shrink-0 place-items-center rounded-[12px] bg-[#FDECEC] text-[#C81E28]">
                    <Icon className="h-[20px] w-[20px]" aria-hidden="true" />
                  </span>
                  <div className="flex flex-col gap-[9px]">
                    <h3 className="text-[16px] font-extrabold tracking-[-0.2px] text-[#16181D]">
                      {title}
                    </h3>
                    <p className="flex items-start gap-2 text-[13px] leading-[20px] font-medium text-[#2A2E38]">
                      <Check
                        className="mt-[3px] h-[13px] w-[13px] shrink-0 text-[#C81E28]"
                        aria-hidden="true"
                      />
                      {body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="fitur" className="scroll-mt-[76px] bg-[#F7F7F8]">
          <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center gap-11 px-6 py-16 lg:px-[72px] lg:py-[88px]">
            <SectionHead
              eyebrow="FITUR"
              title="Semua kebutuhan kasir kedai, dalam satu aplikasi."
              sub="Bukan seribu fitur yang bikin bingung. Fitur yang benar-benar dipakai tiap hari — dan menu kamu tampil dengan foto asli."
            />

            <div className="grid w-full gap-5 md:grid-cols-2">
              {FEATURES.map(({ icon: Icon, title, desc, img, alt, points }) => (
                <div
                  key={title}
                  className="overflow-hidden rounded-[16px] bg-white outline outline-1 -outline-offset-[0.5px] outline-[#E3E5E9]"
                >
                  <img
                    src={img}
                    alt={alt}
                    width={638}
                    height={236}
                    loading="lazy"
                    className="h-[190px] w-full object-cover sm:h-[236px]"
                  />
                  <div className="flex flex-col gap-[10px] px-6 py-6">
                    <h3 className="flex items-center gap-2 text-[18px] font-extrabold tracking-[-0.3px] text-[#16181D]">
                      <Icon
                        className="h-[17px] w-[17px] text-[#C81E28]"
                        aria-hidden="true"
                      />
                      {title}
                    </h3>
                    <p className="text-[13px] leading-[20px] font-medium text-[#5D6370]">
                      {desc}
                    </p>
                    <ul className="mt-1 flex flex-col gap-[9px]">
                      {points.map((point) => (
                        <li
                          key={point}
                          className="flex items-start gap-2 text-[13px] leading-[19px] font-medium text-[#2A2E38]"
                        >
                          <Check
                            className="mt-[3px] h-[13px] w-[13px] shrink-0 text-[#C81E28]"
                            aria-hidden="true"
                          />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid w-full gap-6 border-t border-[#E3E5E9] pt-8 sm:grid-cols-2 lg:grid-cols-4">
              {EXTRAS.map(({ icon: Icon, title, body }) => (
                <div key={title} className="flex flex-col gap-[7px]">
                  <h3 className="flex items-center gap-2 text-[14px] font-extrabold text-[#16181D]">
                    <Icon
                      className="h-4 w-4 text-[#C81E28]"
                      aria-hidden="true"
                    />
                    {title}
                  </h3>
                  <p className="text-[12.5px] leading-[19px] font-medium text-[#5D6370]">
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center gap-10 px-6 pt-16 lg:px-[72px] lg:pt-[88px]">
            <SectionHead
              eyebrow="SETELAH BERLANGGANAN"
              title="Menu kamu tampil seperti katalog profesional."
              sub="Upload foto sekali, lalu dipakai di semua tempat: layar kasir, struk, dan QR menu pelanggan. Foto di bawah ini contoh tampilan menu yang pelanggan lihat setelah warung kamu berlangganan."
            />

            <div className="grid w-full gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {GALLERY.map((item) => (
                <figure
                  key={item.name}
                  className="overflow-hidden rounded-[18px] bg-white outline outline-1 -outline-offset-[0.5px] outline-[#E3E5E9]"
                >
                  <img
                    src={item.img}
                    alt={item.alt}
                    width={419}
                    height={262}
                    loading="lazy"
                    className="h-[262px] w-full object-cover"
                  />
                  <figcaption className="flex flex-col px-4 pb-4 pt-[14px]">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[15px] font-extrabold tracking-[-0.2px] text-[#16181D]">
                        {item.name}
                      </span>
                      <span className="rounded-full bg-[#FDECEC] px-[10px] py-1 text-[10.5px] font-bold text-[#C81E28]">
                        {item.tag}
                      </span>
                    </div>
                    <span className="mt-[3px] text-[15px] font-extrabold text-[#C81E28]">
                      {item.price}
                    </span>
                    <span className="mt-[9px] flex items-center gap-[6px] text-[11px] font-medium text-[#7C8290]">
                      <svg viewBox="0 0 24 24" className="h-[11px] w-[11px] fill-none stroke-current stroke-[1.6]">
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 8v5l3 2" />
                      </svg>
                      Foto asli dari HP · tampil di kasir &amp; QR menu
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>

          <div className="mx-auto mt-14 w-full max-w-[1440px] px-6 pb-16 lg:px-[72px] lg:pb-[88px]">
            <div className="flex flex-col gap-2 border-t border-[#E3E5E9] pt-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-1">
                <p className="text-[11.5px] font-extrabold tracking-[1px] text-[#C81E28]">
                  STOK BAHAN
                </p>
                <h3 className="text-[20px] font-extrabold tracking-[-0.4px] text-[#16181D]">
                  Bahan makanan yang kamu pantau tiap hari.
                </h3>
              </div>
              <p className="text-[12px] font-medium text-[#7C8290]">
                Terpotong otomatis dari resep tiap porsi terjual
              </p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {STOCK.map((item) => (
                <div
                  key={item.name}
                  className="overflow-hidden rounded-[14px] bg-white p-[10px] outline outline-1 -outline-offset-[0.5px] outline-[#E3E5E9]"
                >
                  <img
                    src={item.img}
                    alt={item.name}
                    width={312}
                    height={158}
                    loading="lazy"
                    className="h-[158px] w-full rounded-[9px] object-cover"
                  />
                  <div className="flex flex-col px-1 pb-1 pt-3">
                    <span className="text-[13.5px] font-extrabold text-[#16181D]">
                      {item.name}
                    </span>
                    <span className="text-[11.5px] font-semibold text-[#5D6370]">
                      {item.left}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="cara-kerja" className="scroll-mt-[76px] bg-[#F7F7F8]">
          <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center gap-11 px-6 py-16 lg:px-[72px] lg:py-[88px]">
            <SectionHead
              eyebrow="CARA KERJA"
              title="Dari unduh sampai jualan, satu sore aja."
              sub="Gak perlu training berhari-hari. Kalau bisa pakai WhatsApp, bisa pakai Santosa POS."
            />

            <ol className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map(({ icon: Icon, title, body }, i) => (
                <li
                  key={title}
                  className="flex flex-col gap-3 rounded-[16px] bg-white p-6 outline outline-1 -outline-offset-[0.5px] outline-[#E3E5E9]"
                >
                  <div className="flex items-center justify-between">
                    <span className="grid h-[34px] w-[34px] place-items-center rounded-full bg-[#C81E28] text-[13px] font-extrabold text-white">
                      {i + 1}
                    </span>
                    <Icon
                      className="h-[18px] w-[18px] text-[#B4B9C2]"
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="text-[15px] font-extrabold text-[#16181D]">
                    {title}
                  </h3>
                  <p className="text-[12.5px] leading-[19px] font-medium text-[#5D6370]">
                    {body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="harga" className="scroll-mt-[76px] bg-white">
          <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center gap-11 px-6 py-16 lg:px-[72px] lg:py-[88px]">
            <SectionHead
              eyebrow="HARGA"
              title="Bayar sesuai ukuran usahamu."
              sub="Coba gratis 14 hari, semua fitur kebuka. Setelah itu tinggal pilih yang paling masuk akal."
            />

            <div className="grid w-full gap-5 lg:grid-cols-3">
              {TIERS.map((tier) => (
                <div
                  key={tier.name}
                  className={`flex flex-col justify-between gap-6 rounded-[18px] bg-white p-[26px] ${
                    tier.popular
                      ? "shadow-[0_18px_40px_#C81E281F] outline outline-2 -outline-offset-1 outline-[#C81E28]"
                      : "outline outline-1 -outline-offset-[0.5px] outline-[#E3E5E9]"
                  }`}
                >
                  <div className="flex flex-col gap-4">
                    {tier.popular ? (
                      <span className="w-fit rounded-full bg-[#C81E28] px-[10px] py-1 text-[10px] font-extrabold tracking-[0.6px] text-white">
                        PALING SERING DIPILIH
                      </span>
                    ) : null}
                    <p className="text-[11.5px] font-extrabold tracking-[1px] text-[#C81E28]">
                      {tier.name}
                    </p>
                    <div className="flex flex-wrap items-baseline gap-x-[10px] gap-y-1">
                      <span className="text-[38px] font-extrabold tracking-[-1.6px] text-[#16181D]">
                        {tier.price}
                      </span>
                      <span className="text-[12px] font-semibold text-[#5D6370]">
                        {tier.per}
                      </span>
                    </div>
                    <p className="text-[13px] leading-[20px] font-medium text-[#5D6370]">
                      {tier.desc}
                    </p>
                    <ul className="flex flex-col gap-[10px] pt-2">
                      {tier.features.map((f) => (
                        <li
                          key={f}
                          className="flex items-start gap-2 text-[13px] leading-[19px] font-medium text-[#2A2E38]"
                        >
                          <Check
                            className="mt-[3px] h-[13px] w-[13px] shrink-0 text-[#C81E28]"
                            aria-hidden="true"
                          />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Link
                    href={
                      tier.popular ? "/auth/google" : tier.name === "WARUNG" ? "/auth/google" : WA
                    }
                    className={`rounded-[10px] px-[18px] py-[13px] text-center text-[13.5px] font-bold transition-colors ${
                      tier.popular
                        ? "bg-[#C81E28] text-white hover:bg-[#A8161F]"
                        : "bg-white text-[#16181D] outline outline-[1.5px] -outline-offset-[0.75px] outline-[#D9DBE0] hover:outline-[#16181D]"
                    }`}
                  >
                    {tier.cta}
                  </Link>
                </div>
              ))}
            </div>

            <p className="text-center text-[12px] font-medium text-[#7C8290]">
              Harga belum termasuk pajak · Bisa disesuaikan jumlah outlet &amp;
              kebutuhan khusus
            </p>
          </div>
        </section>

        <section id="faq" className="scroll-mt-[76px] bg-[#F7F7F8]">
          <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center gap-9 px-6 py-16 lg:px-[72px] lg:py-[88px]">
            <SectionHead
              eyebrow="FAQ"
              title="Pertanyaan yang sering diajukan"
            />

            <div className="w-full max-w-[920px] overflow-hidden rounded-[18px] bg-white outline outline-1 -outline-offset-[0.5px] outline-[#E3E5E9]">
              {FAQ.map((item, i) => (
                <details
                  key={item.q}
                  className={`group px-6 [&_summary::-webkit-details-marker]:hidden ${
                    i > 0 ? "border-t border-[#E3E5E9]" : ""
                  }`}
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-[15.5px] font-bold text-[#16181D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C81E28]">
                    {item.q}
                    <ChevronDown
                      className="h-4 w-4 shrink-0 text-[#7C8290] transition-transform group-open:rotate-180"
                      aria-hidden="true"
                    />
                  </summary>
                  <p className="pb-5 pr-8 text-[13.5px] leading-[22px] font-medium text-[#5D6370]">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section id="kontak" className="scroll-mt-[76px] bg-[#F7F7F8]">
          <div className="mx-auto w-full max-w-[1440px] px-6 pb-16 pt-4 lg:px-[72px] lg:pb-[96px] lg:pt-10">
            <div className="relative overflow-hidden rounded-[22px] bg-[linear-gradient(135deg,#A8161F_0%,#C81E28_55%,#D8323B_100%)] px-6 py-12 text-center lg:px-12 lg:py-[60px]">
              <div className="pointer-events-none absolute -left-[120px] top-[100px] h-[360px] w-[360px] rounded-full bg-white opacity-[0.08]" />
              <div className="pointer-events-none absolute -top-[140px] left-[62%] h-[420px] w-[420px] rounded-full bg-white opacity-[0.09]" />

              <div className="relative flex flex-col items-center gap-4">
                <h2 className="text-[28px] font-extrabold tracking-[-1px] text-white sm:text-[34px]">
                  Siap jualan lebih rapi?
                </h2>
                <p className="max-w-[520px] text-[14.5px] leading-[23px] font-medium text-white/85">
                  Coba Santosa POS gratis 14 hari. Tanpa kartu kredit, tanpa
                  instalasi ribet.
                </p>
                <Link
                  href="/auth/google"
                  className="mt-2 inline-flex items-center gap-[9px] rounded-[10px] bg-white px-[26px] py-[14px] text-[14.5px] font-extrabold text-[#C81E28] transition-colors hover:bg-[#FDECEC] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <Sparkles className="h-[17px] w-[17px]" aria-hidden="true" />
                  Coba Gratis Sekarang
                </Link>
                <a
                  href={WA}
                  className="text-[11.5px] font-bold tracking-[0.8px] text-white/75 underline-offset-4 hover:text-white hover:underline"
                >
                  ATAU NGOBROL LANGSUNG: +62 819 2745 3030
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#E3E5E9] bg-white">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-[34px] px-6 pb-7 pt-14 lg:px-[72px]">
          <div className="flex flex-col gap-10 lg:flex-row lg:justify-between">
            <div className="flex max-w-[360px] flex-col gap-[14px]">
              <Brand />
              <p className="text-[13px] leading-[21px] font-medium text-[#5D6370]">
                Kasir untuk warung, kafe, dan toko. Dibuat oleh Santosa Tech
                Indonesia.
              </p>
              <a
                href="mailto:santosatechid@gmail.com"
                className="flex items-center gap-2 text-[13px] font-semibold text-[#16181D] hover:text-[#C81E28]"
              >
                <Mail className="h-4 w-4 text-[#C81E28]" aria-hidden="true" />
                santosatechid@gmail.com
              </a>
            </div>

            <div className="grid gap-10 sm:grid-cols-3 lg:gap-16">
              {FOOTER_LINKS.map((col) => (
                <div key={col.title} className="flex flex-col gap-[14px]">
                  <p className="text-[11px] font-extrabold tracking-[1px] text-[#7C8290]">
                    {col.title}
                  </p>
                  <ul className="flex flex-col gap-[10px]">
                    {col.links.map((l) => (
                      <li key={l.label}>
                        <a
                          href={l.href}
                          className="text-[13px] font-semibold text-[#2A2E38] hover:text-[#C81E28]"
                        >
                          {l.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-[#E3E5E9] pt-6 text-[11.5px] font-medium text-[#7C8290] sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 Santosa POS — bagian dari PT Santosa Tech Indonesia</p>
            <p className="tracking-[0.8px]">JAKARTA TIMUR, INDONESIA</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
