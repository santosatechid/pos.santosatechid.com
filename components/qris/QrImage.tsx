"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useEffect, useState } from "react";

import { toQrDataUrl } from "./qr";

export default function QrImage({
  value,
  downloadName = "qris.png",
  width = 512,
}: {
  value: string;
  downloadName?: string;
  width?: number;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    toQrDataUrl(value, width)
      .then((dataUrl) => {
        if (active) setSrc(dataUrl);
      })
      .catch((caught) => {
        if (active) {
          setError(caught instanceof Error ? caught.message : "Gagal membuat QR");
        }
      });
    return () => {
      active = false;
    };
  }, [value, width]);

  if (error) {
    return <p className="text-destructive text-sm">{error}</p>;
  }

  if (!src) {
    return (
      <div className="bg-muted mx-auto h-64 w-64 animate-pulse rounded-xl" />
    );
  }

  return (
    <div className="space-y-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="QR code"
        className="mx-auto h-auto w-full max-w-72 rounded-xl bg-white p-2"
      />
      <Button asChild variant="outline" className="w-full">
        <a href={src} download={downloadName}>
          <Download className="size-4" />
          Unduh QR
        </a>
      </Button>
    </div>
  );
}
