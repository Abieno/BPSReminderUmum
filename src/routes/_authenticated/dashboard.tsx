import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, BellRing, CalendarClock, Send } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { JENIS_LABEL, formatTanggal, sisaHari } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — SIRENA BPS" },
      {
        name: "description",
        content: "Ringkasan jumlah pegawai, reminder aktif, dan agenda kenaikan pangkat & KGB 30 hari ke depan.",
      },
      { property: "og:title", content: "Dashboard — SIRENA BPS" },
      { property: "og:description", content: "Ringkasan reminder kepegawaian Bagian Umum BPS." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const [employees, reminders, logs] = await Promise.all([
        supabase.from("employees").select("id", { count: "exact", head: true }),
        supabase
          .from("reminders")
          .select("id, jenis, tanggal, aktif, employees(nama, nip, jabatan)")
          .eq("aktif", true)
          .order("tanggal", { ascending: true }),
        supabase
          .from("reminder_logs")
          .select("id", { count: "exact", head: true })
          .gte("tanggal_kirim", new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)),
      ]);
      if (reminders.error) throw reminders.error;
      return {
        totalPegawai: employees.count ?? 0,
        totalKirim30Hari: logs.count ?? 0,
        reminders: reminders.data ?? [],
      };
    },
  });

  const mendatang = (data?.reminders ?? [])
    .map((r) => ({ ...r, sisa: sisaHari(r.tanggal) }))
    .filter((r) => r.sisa >= 0 && r.sisa <= 30);

  const stats = [
    { label: "Total Pegawai", value: data?.totalPegawai ?? 0, icon: Users },
    { label: "Reminder Aktif", value: data?.reminders.length ?? 0, icon: BellRing },
    { label: "Terjadwal (30H)", value: mendatang.length, icon: CalendarClock },
    { label: "Chat Sukses (30H)", value: data?.totalKirim30Hari ?? 0, icon: Send },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold md:text-3xl">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Ringkasan Sistem Informasi SIRENA BPS
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="shadow-soft">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <s.icon className="size-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                {isLoading ? (
                  <Skeleton className="mt-1 h-7 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{s.value}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="size-5 text-primary" /> Agenda 30 Hari ke Depan
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : mendatang.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                <CalendarClock className="size-7 text-muted-foreground" />
              </div>
              <p className="font-medium">Belum ada agenda dalam 30 hari ke depan</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Santai dulu. Tambahkan pegawai dan atur tanggal target agar agenda muncul di sini.
              </p>
              <Button asChild variant="outline">
                <Link to="/reminder">Atur reminder</Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {mendatang.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-semibold">{r.employees?.nama}</p>
                    <p className="text-sm text-muted-foreground">
                      {JENIS_LABEL[r.jenis]} · {formatTanggal(r.tanggal)}
                    </p>
                  </div>
                  <Badge variant={r.sisa <= 7 ? "destructive" : "secondary"}>
                    {r.sisa} hari lagi
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
