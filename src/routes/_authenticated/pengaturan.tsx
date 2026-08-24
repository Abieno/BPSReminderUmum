import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Eye, EyeOff, KeyRound, Loader2, Lock, Phone, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { isValidWa, normalizeWa } from "@/lib/format";
import { gantiSandi, lihatSandi } from "@/lib/gate.functions";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/_authenticated/pengaturan")({
  head: () => ({
    meta: [
      { title: "Pengaturan — SIRENA BPS" },
      {
        name: "description",
        content: "Atur nomor WhatsApp tujuan reminder Bagian Umum dan koneksi WhatsApp Gateway.",
      },
      { property: "og:title", content: "Pengaturan — SIRENA BPS" },
      { property: "og:description", content: "Pengaturan nomor WA tujuan dan gateway WhatsApp." },
    ],
  }),
  component: PengaturanPage,
});

function PengaturanPage() {
  const qc = useQueryClient();
  const [wa, setWa] = useState("");
  const [error, setError] = useState("");

  const { data } = useQuery({
    queryKey: ["app-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("*")
        .eq("id", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (data?.wa_admin) setWa(data.wa_admin);
  }, [data?.wa_admin]);

  const simpan = useMutation({
    mutationFn: async (nomor: string) => {
      const { error } = await supabase
        .from("app_settings")
        .upsert({ id: true, wa_admin: nomor, gateway_provider: "fonnte" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Nomor WhatsApp tujuan tersimpan");
      qc.invalidateQueries({ queryKey: ["app-settings"] });
    },
    onError: (e: Error) => toast.error(`Gagal menyimpan: ${e.message}`),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidWa(wa)) {
      setError("Format nomor WhatsApp tidak valid (contoh: 081234567890)");
      return;
    }
    setError("");
    simpan.mutate(normalizeWa(wa));
  }

  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold md:text-3xl">Pengaturan</h1>
      </header>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="size-5 text-primary" /> Nomor WhatsApp Tujuan Pengingat
          </CardTitle>
          <CardDescription>
            Masukkan nomor yang akan dijadikan tujuan untuk mengirim pesan pengingatnya
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wa">Nomor WhatsApp Tujuan</Label>
              <Input
                id="wa"
                inputMode="tel"
                placeholder="081234567890"
                value={wa}
                onChange={(e) => setWa(e.target.value)}
              />
              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Akan disimpan dalam format internasional: {wa ? normalizeWa(wa) : "62..."}
                </p>
              )}
            </div>
            <Button type="submit" disabled={simpan.isPending}>
              {simpan.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Simpan
            </Button>
          </form>
        </CardContent>
      </Card>

      <SandiCard />

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="size-5 text-primary" /> WhatsApp Gateway
          </CardTitle>
          <CardDescription>Provider yang digunakan "Fonnte"</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <ShieldCheck className="size-4" />
            <AlertTitle>API key tersimpan aman di server</AlertTitle>
            <AlertDescription>
              Setting terlebih dahulu nomor yang akan dijadikan sumber chat di "FONNTE"
            </AlertDescription>
          </Alert>
          <p className="text-sm text-muted-foreground">
            Pengecekan tanggal jatuh tempo berjalan otomatis setiap hari pukul 08.00 WIB, lalu
            mengirim pesan ke nomor tujuan yang telah diisi di atas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function SandiCard() {
  const ambil = useServerFn(lihatSandi);
  const ganti = useServerFn(gantiSandi);
  const qc = useQueryClient();
  const [tampil, setTampil] = useState(false);
  const [baru, setBaru] = useState("");
  const [err, setErr] = useState("");

  const { data } = useQuery({
    queryKey: ["sandi-akses"],
    queryFn: () => ambil(),
  });

  const simpan = useMutation({
    mutationFn: (sandi: string) => ganti({ data: { sandi } }),
    onSuccess: () => {
      toast.success("Kata sandi akses diperbarui");
      setBaru("");
      qc.invalidateQueries({ queryKey: ["sandi-akses"] });
    },
    onError: (e: Error) => toast.error(`Gagal menyimpan: ${e.message}`),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (baru.trim().length < 6) {
      setErr("Kata sandi minimal 6 karakter");
      return;
    }
    setErr("");
    simpan.mutate(baru.trim());
  }

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="size-5 text-primary" /> Kata Sandi Akses Aplikasi
        </CardTitle>
        <CardDescription>
          Aplikasi tidak memakai akun login, Aplikasi hanya menggunakan kata sandi yang telah ditentukan
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-xl bg-gradient-brand-soft p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Kata sandi saat ini
          </p>
          <div className="mt-1 flex items-center gap-3">
            <span className="font-mono text-lg font-bold">
              {tampil ? (data?.sandi ?? "—") : "••••••••"}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setTampil((v) => !v)}
              aria-label={tampil ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            >
              {tampil ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              {tampil ? "Sembunyikan" : "Lihat"}
            </Button>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="sandi-baru">Ganti kata sandi</Label>
            <Input
              id="sandi-baru"
              type="text"
              placeholder="Minimal 6 karakter"
              value={baru}
              onChange={(e) => setBaru(e.target.value)}
            />
            {err && <p className="text-sm text-destructive">{err}</p>}
          </div>
          <Button type="submit" variant="brand" disabled={simpan.isPending}>
            {simpan.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Simpan kata sandi
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
