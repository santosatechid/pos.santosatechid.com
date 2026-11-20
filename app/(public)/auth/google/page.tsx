"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { GoogleMark } from "@/components/entry/GoogleMark";
import {
  EntryForm,
  EntryHeading,
  EntryScreen,
} from "@/components/entry/Entry";
import { Button } from "@/components/ui/button";
import { signIn } from "@/services/auth/authClients";

export default function GoogleAuthPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const started = useRef(false);

  const start = async () => {
    setLoading(true);
    try {
      await signIn.social({
        provider: "google",
        callbackURL: "/verify-email",
        errorCallbackURL: "/auth/signIn",
      });
    } catch (error) {
      setLoading(false);
      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal memulai login Google",
      );
      router.replace("/auth/signIn");
    }
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void start();
  }, []);

  return (
    <EntryScreen>
      <EntryForm>
        <EntryHeading
          title="Coba gratis dengan Google"
          description="Kami mengarahkan kamu ke login Google, lalu mengirim kode OTP untuk memastikan emailmu benar."
        />

        <div className="flex flex-col items-center gap-5 py-6">
          {loading ? (
            <>
              <Loader2 className="text-primary h-8 w-8 animate-spin" />
              <p className="text-muted-foreground text-sm">
                Menghubungkan ke Google...
              </p>
            </>
          ) : (
            <Button onClick={() => void start()} className="w-full">
              <span className="mr-2">
                <GoogleMark />
              </span>
              Masuk dengan Google
            </Button>
          )}
        </div>
      </EntryForm>
    </EntryScreen>
  );
}
