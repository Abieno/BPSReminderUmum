import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { BellRing, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { bukaAkses, cekAkses } from "@/lib/gate.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/unlock")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "SIRENA BPS" },
      {
        name: "description",
        content:
          "Masukkan kata sandi aplikasi untuk membuka SIRENA BPS, sistem reminder kenaikan pangkat dan KGB Bagian Umum.",
      },
      { property: "og:title", content: "Buka Akses — SIRENA BPS" },
      { property: "og:description", content: "Masukkan kata sandi aplikasi SIRENA BPS." },
    ],
  }),
  component: UnlockPage,
});

function UnlockPage() {
  const navigate = useNavigate();
  const buka = useServerFn(bukaAkses);
  const cek = useServerFn(cekAkses);
  const [sandi, setSandi] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    cek().then((r) => {
      if (r.unlocked) navigate({ to: "/dashboard", replace: true });
    });
  }, [cek, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!sandi.trim()) {
      setError("Kata sandi wajib diisi");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { ok } = await buka({ data: { sandi } });
      if (!ok) {
        setError("Kata sandi salah");
        return;
      }
      toast.success("Akses dibuka. Selamat Menggunakan Aplikasi!");
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface-glow px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-brand text-primary-foreground shadow-glow">
            <BellRing className="size-8" />
          </div>
          <h1 className="mt-4 bg-gradient-brand bg-clip-text text-3xl font-extrabold text-transparent">
            SIRENA BPS
          </h1>
          <p className="text-sm text-muted-foreground">
            Sistem Reminder Kenaikan Pangkat &amp; Kenaikan Gaji Berkala
          </p>
        </div>

        <Card className="border-primary/15 shadow-soft backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="size-5 text-primary" /> Kata Sandi Aplikasi
            </CardTitle>
            <CardDescription>
              Masukkan kata sandi akses yang sudah dibuat
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sandi">Kata sandi</Label>
                <Input
                  id="sandi"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={sandi}
                  onChange={(e) => setSandi(e.target.value)}
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
              <Button type="submit" variant="brand" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
                Masuk Aplikasi
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
