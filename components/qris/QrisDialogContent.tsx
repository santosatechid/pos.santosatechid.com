"use client";

import { jakarta } from "@/components/landing/font";
import { DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/shadcn/utils";
import { type ComponentProps } from "react";

/** Dialog rendered through a portal, so the landing theme class must ride along. */
export default function QrisDialogContent({
  className,
  ...props
}: ComponentProps<typeof DialogContent>) {
  return (
    <DialogContent
      {...props}
      className={cn("landing-theme", jakarta.className, className)}
    />
  );
}
