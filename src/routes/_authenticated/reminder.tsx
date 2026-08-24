import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { BellRing, CalendarDays, Plus, Send, Trash2, X, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { kirimReminderManual } from "@/lib/reminder.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { JENIS_LABEL, formatTanggal, sisaHari } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/reminder")({
  head: () => ({
    meta: [
      { title: "Pengingat — SIRENA BPS" },
      {
        name: "description",
        content: "Atur tanggal target dan jadwal pengingat kenaikan pangkat serta KGB untuk tiap pegawai.",
      },
      { property: "og:title", content: "Reminder — SIRENA BPS" },
      { property: "og:description", content: "Atur jadwal pengingat kenaikan pangkat dan KGB." },
    ],
  }),
  component: ReminderPage,
});

const JENIS = ["kenaikan_pangkat", "kenaikan_gaji_berkala"] as const;
type Jenis = (typeof JENIS)[number];

type ReminderRow = {
  id: string;
  jenis: Jenis;
  tanggal: string;
  aktif: boolean;
  reminder_schedules: { id: string; hari_sebelum: number }[];
};

type EmployeeWithReminders = {
  id: string;
  nama: string;
  nip: string;
  jabatan: string;
  unit_kerja: string;
  golongan: string;
  reminders: ReminderRow[];
};

function ReminderPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [sendingReminderId, setSendingReminderId] = useState<string | null>(null);
  const [editor, setEditor] = useState<{
    emp: EmployeeWithReminders;
    jenis: Jenis;
    existing: ReminderRow | undefined;
  } | null>(null);

  const { data: pegawai = [], isLoading } = useQuery({
    queryKey: ["employees-reminders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select(
          "id, nama, nip, jabatan, unit_kerja, golongan, reminders(id, jenis, tanggal, aktif, reminder_schedules(id, hari_sebelum))",
        )
        .order("nama");
      if (error) throw error;
      return data as unknown as EmployeeWithReminders[];
    },
  });

  const kirim = useServerFn(kirimReminderManual);
  const kirimManual = useMutation({
    mutationFn: async (reminderId: string) => {
      setSendingReminderId(reminderId);
      return kirim({ data: { reminderId } });
    },
    onSuccess: (res) => {
      toast.success(`Reminder terkirim ke ${res.tujuan}`);
      qc.invalidateQueries();
    },
    onError: (e: Error) => {
      toast.error(`Gagal mengirim: ${e.message}`);
    },
    onSettled: () => {
      setSendingReminderId(null);
    },
  });

  const filtered = pegawai.filter(
    (p) =>
      !search ||
      p.nama.toLowerCase().includes(search.toLowerCase()) ||
      p.nip.includes(search),
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold md:text-3xl">Pengingat</h1>
        <p className="mt-1 text-muted-foreground">
          Isi terlebih dahulu data pegawai jika ingin menambahkan Pengingat
        </p>
      </header>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Cari pegawai..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="shadow-soft">
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted">
              <BellRing className="size-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-semibold">Belum ada pegawai untuk diingatkan</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Tambahkan data pegawai terlebih dahulu, lalu atur tanggal target kenaikan pangkat dan
              KGB-nya di sini.
            </p>
            <Button asChild>
              <Link to="/pegawai">Ke Data Pegawai</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((emp) => (
            <Card key={emp.id} className="shadow-soft">
              <CardContent className="space-y-4 p-5">
                <div>
                  <p className="text-lg font-semibold">{emp.nama}</p>
                  <p className="text-sm text-muted-foreground">
                    NIP {emp.nip} · {emp.jabatan || "-"} · Gol. {emp.golongan || "-"}
                  </p>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  {JENIS.map((jenis) => {
                    const r = emp.reminders?.find((x) => x.jenis === jenis);
                    return (
                      <div key={jenis} className="rounded-xl border border-border bg-muted/40 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold">{JENIS_LABEL[jenis]}</p>
                          {r ? (
                            <Badge variant={r.aktif ? "default" : "secondary"}>
                              {r.aktif ? "Aktif" : "Nonaktif"}
                            </Badge>
                          ) : (
                            <Badge variant="outline">Belum diatur</Badge>
                          )}
                        </div>
                        {r ? (
                          <div className="mt-3 space-y-2 text-sm">
                            <p className="flex items-center gap-2">
                              <CalendarDays className="size-4 text-primary" />
                              {formatTanggal(r.tanggal)}
                              <span className="text-muted-foreground">
                                ({sisaHari(r.tanggal)} hari lagi)
                              </span>
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {[...(r.reminder_schedules ?? [])]
                                .sort((a, b) => b.hari_sebelum - a.hari_sebelum)
                                .map((s) => (
                                  <Badge key={s.id} variant="secondary">
                                    H-{s.hari_sebelum}
                                  </Badge>
                                ))}
                              {(r.reminder_schedules ?? []).length === 0 && (
                                <span className="text-muted-foreground">Belum ada jadwal</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <p className="mt-3 text-sm text-muted-foreground">
                            Belum ada tanggal target. Atur sekarang agar tidak terlewat.
                          </p>
                        )}
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant={r ? "outline" : "default"}
                            onClick={() => setEditor({ emp, jenis, existing: r })}
                          >
                            <CalendarDays className="size-4" /> {r ? "Ubah" : "Atur"}
                          </Button>
                          {r && (
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={sendingReminderId === r.id}
                              onClick={() => kirimManual.mutate(r.id)}
                            >
                              {sendingReminderId === r.id ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <Send className="size-4" />
                              )}
                              {sendingReminderId === r.id ? "Mengirim..." : "Kirim sekarang"}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {editor && (
        <ReminderEditor
          key={`${editor.emp.id}-${editor.jenis}`}
          emp={editor.emp}
          jenis={editor.jenis}
          existing={editor.existing}
          onClose={() => setEditor(null)}
        />
      )}
    </div>
  );
}

function ReminderEditor({
  emp,
  jenis,
  existing,
  onClose,
}: {
  emp: EmployeeWithReminders;
  jenis: Jenis;
  existing: ReminderRow | undefined;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [tanggal, setTanggal] = useState(existing?.tanggal ?? "");
  const [aktif, setAktif] = useState(existing?.aktif ?? true);
  const [skala, setSkala] = useState<number[]>(
    existing?.reminder_schedules?.length
      ? [...existing.reminder_schedules].map((s) => s.hari_sebelum).sort((a, b) => b - a)
      : [90, 30, 7],
  );
  const [baru, setBaru] = useState("");

  const simpan = useMutation({
    mutationFn: async () => {
      if (!tanggal) throw new Error("Tanggal target wajib diisi");
      if (skala.length === 0) throw new Error("Tambahkan minimal satu jadwal pengingat");

      let reminderId = existing?.id;
      if (reminderId) {
        const { error } = await supabase
          .from("reminders")
          .update({ tanggal, aktif })
          .eq("id", reminderId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("reminders")
          .insert({ employee_id: emp.id, jenis, tanggal, aktif })
          .select("id")
          .single();
        if (error) throw error;
        reminderId = data.id;
      }

      const { error: delErr } = await supabase
        .from("reminder_schedules")
        .delete()
        .eq("reminder_id", reminderId);
      if (delErr) throw delErr;

      const { error: insErr } = await supabase
        .from("reminder_schedules")
        .insert(skala.map((hari_sebelum) => ({ reminder_id: reminderId!, hari_sebelum })));
      if (insErr) throw insErr;
    },
    onSuccess: () => {
      toast.success("Pengaturan reminder disimpan");
      qc.invalidateQueries();
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const hapus = useMutation({
    mutationFn: async () => {
      if (!existing) return;
      const { error } = await supabase.from("reminders").delete().eq("id", existing.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Reminder dihapus");
      qc.invalidateQueries();
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function tambahSkala() {
    const n = Number(baru);
    if (!Number.isInteger(n) || n < 1 || n > 730) {
      toast.error("Isi jumlah hari antara 1 sampai 730");
      return;
    }
    if (skala.includes(n)) {
      toast.error("Jadwal H-" + n + " sudah ada");
      return;
    }
    setSkala((s) => [...s, n].sort((a, b) => b - a));
    setBaru("");
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{JENIS_LABEL[jenis]}</DialogTitle>
          <DialogDescription>
            {emp.nama} · NIP {emp.nip}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="tanggal">Tanggal target (input manual)</Label>
            <Input
              id="tanggal"
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Skala pengingat (hari sebelum tanggal target)</Label>
            <p className="text-xs text-muted-foreground">
              Bebas ditambah atau dikurangi. Contoh: 90, 30, 7 hari sebelum.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {skala.map((h) => (
                <span
                  key={h}
                  className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-foreground"
                >
                  H-{h}
                  <button
                    type="button"
                    aria-label={`Hapus jadwal H-${h}`}
                    onClick={() => setSkala((s) => s.filter((x) => x !== h))}
                    className="rounded-full p-0.5 hover:bg-primary/20"
                  >
                    <X className="size-3.5" />
                  </button>
                </span>
              ))}
              {skala.length === 0 && (
                <span className="text-sm text-muted-foreground">Belum ada jadwal</span>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <Input
                type="number"
                min={1}
                max={730}
                placeholder="misal 14"
                value={baru}
                onChange={(e) => setBaru(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    tambahSkala();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={tambahSkala}>
                <Plus className="size-4" /> Tambah
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border p-3">
            <div>
              <p className="font-medium">Reminder aktif</p>
              <p className="text-xs text-muted-foreground">
                Nonaktifkan untuk berhenti mengirim tanpa menghapus data.
              </p>
            </div>
            <Switch checked={aktif} onCheckedChange={setAktif} />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {existing ? (
            <Button variant="ghost" onClick={() => hapus.mutate()} disabled={hapus.isPending}>
              <Trash2 className="size-4 text-destructive" /> Hapus
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button onClick={() => simpan.mutate()} disabled={simpan.isPending}>
              {simpan.isPending && <Loader2 className="size-4 animate-spin" />} Simpan
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
