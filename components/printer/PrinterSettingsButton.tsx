"use client";

import { useState } from "react";
import {
  Bluetooth,
  Check,
  Loader2,
  Printer,
  TriangleAlert,
  Unplug,
} from "lucide-react";
import { toast } from "sonner";

import QrisDialogContent from "@/components/qris/QrisDialogContent";
import { Dialog } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useGetClient } from "@/hooks/clients/useClients";
import { useReceiptPrinter } from "@/hooks/printer/useReceiptPrinter";
import { buildReceiptBytes } from "@/lib/printer/escpos";
import { loadReceiptLogo } from "@/lib/printer/image";

export default function PrinterSettingsButton() {
  const [open, setOpen] = useState(false);
  const [printing, setPrinting] = useState(false);
  const {
    supported,
    status,
    deviceName,
    error,
    autoPrint,
    setAutoPrint,
    connect,
    disconnect,
    print,
  } = useReceiptPrinter();
  const { data: client } = useGetClient();

  const busy = status === "connecting" || status === "printing" || printing;
  const connected = status === "connected" || status === "printing";

  const statusLabel =
    status === "connected"
      ? "Terhubung"
      : status === "printing"
        ? "Mencetak..."
        : status === "connecting"
          ? "Menghubungkan..."
          : status === "error"
            ? "Gagal"
            : "Belum terhubung";

  const handleConnect = async () => {
    const ok = await connect();
    if (ok) toast.success("Printer terhubung.");
    else toast.error("Gagal menghubungkan printer.");
  };

  const handleTestPrint = async () => {
    setPrinting(true);
    try {
      const logo =
        (await loadReceiptLogo(client?.logoUrl)) ??
        (await loadReceiptLogo("/Logo.svg"));
      const bytes = buildReceiptBytes({
        store: {
          name: client?.name ?? "Toko Contoh",
          address: client?.address ?? "Jl. Contoh No. 1, Jakarta",
          phone: client?.phone ?? "0812-0000-0000",
          logo,
        },
        order: {
          id: "TEST-0001",
          createdAt: new Date().toISOString(),
          orderType: "takeaway",
          paymentMethod: "cash",
          receiptNumber: 1,
          receiptCode: "TES001",
          cashier: "Tes Kasir",
          customerName: "Pelanggan Tes",
          items: [
            { name: "Nasi Goreng Spesial", qty: 1, unitPrice: 25000 },
            { name: "Es Teh Manis", qty: 2, unitPrice: 5000 },
          ],
          total: 35000,
        },
        footer: "TES PRINTER 58MM",
      });

      const ok = await print(bytes);
      if (ok) toast.success("Tes cetak dikirim ke printer.");
      else toast.error("Tes cetak gagal. Cek koneksi printer.");
    } finally {
      setPrinting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Pengaturan printer struk"
        className="relative grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#F2F3F5] text-[#5D6370] transition-colors hover:bg-[#E3E5E9]"
      >
        <Printer className="h-4 w-4" />
        <span
          className={`absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ${
            connected ? "bg-[#15803D]" : "bg-[#C81E28]"
          }`}
        />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <QrisDialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-md">
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-extrabold tracking-[0.5px] text-[#C81E28]">
                PRINTER STRUK
              </p>
              <p className="text-[18px] font-extrabold tracking-[-0.4px] text-[#16181D]">
                Bluetooth 58mm
              </p>
            </div>

            {!supported ? (
              <div className="flex gap-2 rounded-[10px] bg-[#FDECEC] p-3 text-[11.5px] leading-[18px] font-medium text-[#A8161F]">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Browser ini belum mendukung Web Bluetooth. Pakai Chrome di
                  Android lewat HTTPS. Safari/iOS tidak didukung.
                </span>
              </div>
            ) : null}

            <div className="flex items-center justify-between rounded-[10px] bg-[#F5F6F8] px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold tracking-[0.4px] text-[#5D6370]">
                  STATUS
                </p>
                <p className="truncate text-[12.5px] font-bold text-[#16181D]">
                  {deviceName ?? statusLabel}
                </p>
              </div>
              <span
                className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[9px] font-extrabold ${
                  connected
                    ? "bg-[#EAF7EE] text-[#15803D]"
                    : "bg-white text-[#7C8290]"
                }`}
              >
                {connected ? (
                  <Check className="h-3 w-3" />
                ) : status === "connecting" ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Bluetooth className="h-3 w-3" />
                )}
                {statusLabel.toUpperCase()}
              </span>
            </div>

            {error ? (
              <p className="text-[11.5px] font-medium text-[#C81E28]">{error}</p>
            ) : null}

            <div className="flex gap-2">
              <button
                type="button"
                disabled={!supported || busy}
                onClick={() => void handleConnect()}
                className="flex h-10 flex-1 items-center justify-center gap-2 rounded-[10px] bg-[#C81E28] text-[12px] font-bold text-white transition-colors hover:bg-[#A8161F] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {status === "connecting" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Bluetooth className="h-4 w-4" />
                )}
                {connected ? "Ganti printer" : "Hubungkan"}
              </button>
              <button
                type="button"
                disabled={!connected || busy}
                onClick={disconnect}
                className="flex h-10 items-center justify-center gap-2 rounded-[10px] bg-[#F2F3F5] px-3 text-[12px] font-bold text-[#5D6370] transition-colors hover:bg-[#E3E5E9] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Unplug className="h-4 w-4" />
                Putuskan
              </button>
            </div>

            <div className="flex items-center justify-between rounded-[10px] border border-[#E3E5E9] px-3 py-2.5">
              <div>
                <p className="text-[12px] font-bold text-[#16181D]">
                  Cetak otomatis
                </p>
                <p className="text-[10.5px] font-medium text-[#7C8290]">
                  Struk dikirim begitu pembayaran lunas.
                </p>
              </div>
              <Switch checked={autoPrint} onCheckedChange={setAutoPrint} />
            </div>

            <button
              type="button"
              disabled={!connected || busy}
              onClick={() => void handleTestPrint()}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-[10px] border border-[#E3E5E9] bg-white text-[12px] font-bold text-[#16181D] transition-colors hover:bg-[#F5F6F8] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {printing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Printer className="h-4 w-4" />
              )}
              {printing ? "Mengirim..." : "Tes cetak"}
            </button>

            <p className="text-[10.5px] leading-[16px] font-medium text-[#7C8290]">
              Printer harus Bluetooth LE (BLE) dengan dukungan ESC/POS. Printer
              Bluetooth Classic yang sudah dipasangkan di HP tidak muncul di
              browser.
            </p>
          </div>
        </QrisDialogContent>
      </Dialog>
    </>
  );
}
