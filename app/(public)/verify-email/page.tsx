"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";

import {
  EntryField,
  EntryForm,
  EntryHeading,
  EntryScreen,
} from "@/components/entry/Entry";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "@/services/auth/authClients";

type Phase = "checking" | "form" | "error";

export default function VerifyEmailPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [phase, setPhase] = useState<Phase>("checking");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  const requestOtp = async (initial: boolean) => {
    setSending(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/otp/start", { method: "POST" });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body?.message ?? "Gagal mengirim kode verifikasi");
      }

      if (body.required === false) {
        router.replace(body.next || "/dashboard");
        return;
      }

      setMaskedEmail(body.email ?? "");
      setPhase("form");
      setCooldown(60);
      if (!initial) {
        toast.success(
          body.throttled
            ? "Kode sebelumnya masih berlaku. Cek email kamu."
            : "Kode baru sudah dikirim.",
        );
      }
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Gagal mengirim kode";
      setError(message);
      setPhase("error");
      toast.error(message);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (isPending) return;
    if (!session?.user) {
      router.replace("/auth/signIn");
      return;
    }
    if (started.current) return;
    started.current = true;
    void requestOtp(true);
  }, [isPending, session?.user, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(
      () => setCooldown((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => clearInterval(timer);
  }, [cooldown]);

  const verify = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(otp)) {
      toast.error("Masukkan kode 6 digit.");
      return;
    }

    setVerifying(true);
    try {
      const response = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp }),
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body?.message ?? "Kode tidak valid");
      }
      toast.success("Email terverifikasi.");
      router.replace(body.next || "/dashboard");
    } catch (caught) {
      toast.error(
        caught instanceof Error ? caught.message : "Verifikasi gagal",
      );
    } finally {
      setVerifying(false);
    }
  };

  return (
    <EntryScreen>
      <EntryForm>
        <EntryHeading
          title="Verifikasi email"
          description="Kode 6 digit dikirim ke email Google kamu. Masukkan untuk melanjutkan."
        />

        <div className="flex flex-col gap-5">
          <div className="border-border bg-muted/40 flex items-center gap-3 rounded-xl border p-4">
            <span className="bg-primary/10 text-primary grid h-10 w-10 place-items-center rounded-full">
              <MailCheck className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">
                {maskedEmail || "Memeriksa email..."}
              </p>
              <p className="text-muted-foreground text-xs">
                Kode berlaku 5 menit.
              </p>
            </div>
          </div>

          {phase === "error" ? (
            <div className="space-y-3">
              <p className="text-destructive text-sm">
                {error ?? "Gagal mengirim kode."}
              </p>
              <Button
                className="w-full"
                disabled={sending}
                onClick={() => void requestOtp(false)}
              >
                {sending ? "Mengirim..." : "Coba kirim ulang"}
              </Button>
            </div>
          ) : phase === "checking" ? (
            <div className="flex items-center justify-center gap-2 py-4">
              <Loader2 className="text-primary h-5 w-5 animate-spin" />
              <span className="text-muted-foreground text-sm">
                Menyiapkan kode...
              </span>
            </div>
          ) : (
            <form onSubmit={verify} className="space-y-4">
              <EntryField label="Kode OTP" htmlFor="otp">
                <Input
                  id="otp"
                  value={otp}
                  onChange={(event) =>
                    setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="000000"
                  className="h-14 text-center font-mono text-2xl tracking-[0.5em]"
                />
              </EntryField>

              <Button type="submit" className="w-full" disabled={verifying}>
                {verifying ? "Memverifikasi..." : "Verifikasi email"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                disabled={sending || cooldown > 0}
                onClick={() => void requestOtp(false)}
              >
                {cooldown > 0
                  ? `Kirim ulang dalam ${cooldown}s`
                  : "Kirim ulang kode"}
              </Button>
            </form>
          )}
        </div>
      </EntryForm>
    </EntryScreen>
  );
}
