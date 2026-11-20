"use client";

import { type ReactNode, useEffect } from "react";
import { usePathname } from "next/navigation";

import { jakarta } from "@/components/landing/font";
import InstallButton from "@/components/layout/installButton";
import PosDock from "@/components/pos/PosDock";

export default function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isPos = pathname === "/dashboard";

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("landing-theme");
    return () => root.classList.remove("landing-theme");
  }, []);

  return (
    <div className="bg-background min-h-[100dvh] pb-[calc(62px+env(safe-area-inset-bottom))]">
      {isPos ? (
        children
      ) : (
        <main
          className={`${jakarta.className} mx-auto w-full max-w-8xl p-4 md:p-6 lg:p-8`}
        >
          {children}
        </main>
      )}
      <InstallButton />
      <PosDock />
    </div>
  );
}
