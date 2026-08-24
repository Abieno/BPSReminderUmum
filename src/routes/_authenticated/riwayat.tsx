import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { History, Search, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { hapusRiwayat as hapusRiwayatServer } from "@/lib/riwayat.function";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { JENIS_LABEL, formatTanggal } from "@/lib/format";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/riwayat")({
  head: () => ({
    meta: [
      { title: "Riwayat Pengiriman — SIRENA BPS" },
      {
        name: "description",
        content: "Log riwayat pengiriman pesan WhatsApp reminder kenaikan pangkat dan KGB pegawai BPS.",
      },
      { property: "og:title", content: "Riwayat Pengiriman — SIRENA BPS" },
      { property: "og:description", content: "Log pengiriman reminder WhatsApp." },
    ],
  }),
  component: RiwayatPage,
});

function RiwayatPage() {
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const qc = useQueryClient();
  const hapusRiwayatServerFn = useServerFn(hapusRiwayatServer);

  const hapusRiwayat = useMutation({
    mutationFn: async (id: string) => {
      setDeletingId(id);

      return await hapusRiwayatServerFn({
        data: { id },
      });
    },

    onSuccess: () => {
      toast.success("Riwayat berhasil dihapus dari database");
      qc.invalidateQueries({ queryKey: ["reminder-logs"] });
    },

    onError: (error: Error) => {
      toast.error(`Gagal menghapus riwayat: ${error.message}`);
    },

    onSettled: () => {
      setDeletingId(null);
    },
  });

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["reminder-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reminder_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data;
    },
  });

  const filtered = logs.filter(
    (l) => !search || l.employee_nama.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold md:text-3xl">Riwayat Pesan Terkirim</h1>
        <p className="mt-1 text-muted-foreground">
          Catatan setiap pesan pengingat yang dikirim, otomatis maupun manual.
        </p>
      </header>

      <Card className="shadow-soft">
        <CardContent className="space-y-4 p-5">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Cari nama pegawai..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                <History className="size-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-semibold">Belum ada riwayat pengiriman</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Setiap pesan yang terkirim akan tercatat rapi di sini lengkap dengan statusnya.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                <TableRow>
                  <TableHead>Tanggal Kirim</TableHead>
                  <TableHead>Pegawai</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead>H-</TableHead>
                  <TableHead>Tujuan WA</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
                <TableBody>
                  {filtered.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatTanggal(l.tanggal_kirim)}
                      </TableCell>
                      <TableCell className="font-medium">{l.employee_nama}</TableCell>
                      <TableCell>{JENIS_LABEL[l.jenis]}</TableCell>
                      <TableCell>{l.hari_sebelum ?? "-"}</TableCell>
                      <TableCell className="whitespace-nowrap">{l.no_wa}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{l.manual ? "Manual" : "Otomatis"}</Badge>
                      </TableCell>
                      <TableCell>
                        {l.status === "berhasil" ? (
                          <Badge>Berhasil</Badge>
                        ) : (
                          <Badge variant="destructive" title={l.error ?? undefined}>
                            Gagal
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          disabled={deletingId === l.id}
                          onClick={() => {
                            const yakin = window.confirm(
                              `Hapus riwayat pengiriman untuk ${l.employee_nama}?\n\nData ini akan dihapus permanen dari Supabase.`
                            );

                            if (yakin) {
                              hapusRiwayat.mutate(l.id);
                            }
                          }}
                        >
                          {deletingId === l.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Trash2 className="size-4" />
                          )}

                          {deletingId === l.id ? "Menghapus..." : "Hapus"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
