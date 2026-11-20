"use client";

import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "sonner";

export default function CopyButton({
  value,
  label = "Salin",
  className,
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={className}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          toast.success("Disalin ke clipboard");
        } catch {
          toast.error("Gagal menyalin");
        }
      }}
    >
      <Copy className="size-4" />
      {label}
    </Button>
  );
}
