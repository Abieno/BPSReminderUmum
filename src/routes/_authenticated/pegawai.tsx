import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { isValidWa, normalizeWa, formatTanggal } from "@/lib/format";

type Employee = Database["public"]["Tables"]["employees"]["Row"];

const GOLONGAN = [
  "I/a", "I/b", "I/c", "I/d",
  "II/a", "II/b", "II/c", "II/d",
  "III/a", "III/b", "III/c", "III/d",
  "IV/a", "IV/b", "IV/c", "IV/d", "IV/e",
];

export const Route = createFileRoute("/_authenticated/pegawai")({
  head: () => ({
    meta: [
      { title: "Data Pegawai — SIRENA BPS" },
      {
        name: "description",
        content: "Direktori data kedinasan pegawai BPS: nama, NIP, jabatan, unit kerja, golongan, dan Terhitung Mulai Tanggal.",
      },
      { property: "og:title", content: "Data Pegawai — SIRENA BPS" },
      { property: "og:description", content: "Kelola direktori pegawai Bagian Umum BPS." },
    ],
  }),
  component: PegawaiPage,
});

const schema = z.object({
  nama: z.string().trim().min(3, "Nama minimal 3 karakter").max(120),

  nip: z
    .string()
    .trim()
    .regex(/^[0-9]{8,25}$/, "NIP harus angka (8–25 digit)"),

  jabatan: z
    .string()
    .trim()
    .min(2, "Jabatan wajib diisi")
    .max(120),

  unit_kerja: z
    .string()
    .trim()
    .min(2, "Unit kerja wajib diisi")
    .max(120),

  golongan: z
    .string()
    .trim()
    .min(1, "Golongan wajib dipilih"),

  tmt: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "TMT wajib diisi dengan tanggal yang valid",
    ),

  no_wa: z
    .string()
    .trim()
    .refine(
      (v) => v === "" || isValidWa(v),
      "Format nomor WA tidak valid (contoh: 081234567890)",
    ),
});

type FormValues = z.infer<typeof schema>;

const EMPTY: FormValues = {
  nama: "",
  nip: "",
  jabatan: "",
  unit_kerja: "",
  golongan: "",
  tmt: "",
  no_wa: "",
};

function PegawaiPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterUnit, setFilterUnit] = useState("semua");
  const [filterStatus, setFilterStatus] = useState("semua");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [values, setValues] = useState<FormValues>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hapus, setHapus] = useState<Employee | null>(null);

  const { data: pegawai = [], isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase.from("employees").select("*").order("nama");
      if (error) throw error;
      return data;
    },
  });

  const units = useMemo(
    () => Array.from(new Set(pegawai.map((p) => p.unit_kerja).filter(Boolean))).sort(),
    [pegawai],
  );

  const filtered = pegawai.filter((p) => {
    const q = search.toLowerCase();

    const cocok =
      !q ||
      p.nama.toLowerCase().includes(q) ||
      p.nip.includes(q);

    const unitOk =
      filterUnit === "semua" ||
      p.unit_kerja === filterUnit;

    return cocok && unitOk;
  });

  const simpan = useMutation({
    mutationFn: async (v: FormValues) => {
      const payload = { ...v, no_wa: v.no_wa ? normalizeWa(v.no_wa) : "" };
      if (editing) {
        const { error } = await supabase.from("employees").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("employees").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Data pegawai diperbarui" : "Pegawai berhasil ditambahkan");
      qc.invalidateQueries();
      setDialogOpen(false);
    },
    onError: (e: Error) =>
      toast.error(
        e.message.includes("duplicate") ? "NIP sudah terdaftar" : `Gagal menyimpan: ${e.message}`,
      ),
  });

  const hapusMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("employees").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pegawai dihapus");
      qc.invalidateQueries();
      setHapus(null);
    },
    onError: (e: Error) => toast.error(`Gagal menghapus: ${e.message}`),
  });

  function buka(emp?: Employee) {
  setEditing(emp ?? null);
  setErrors({});

    setValues(
      emp
        ? {
            nama: emp.nama,
            nip: emp.nip,
            jabatan: emp.jabatan,
            unit_kerja: emp.unit_kerja,
            golongan: emp.golongan,
            tmt: emp.tmt ?? "",
            no_wa: emp.no_wa ?? "",
          }
        : EMPTY,
    );

    setDialogOpen(true);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const fe = parsed.error.flatten().fieldErrors;
      setErrors(
        Object.fromEntries(Object.entries(fe).map(([k, v]) => [k, (v as string[])[0] ?? ""])),
      );
      toast.error("Periksa kembali isian yang ditandai merah");
      return;
    }
    setErrors({});
    simpan.mutate(parsed.data);
  }

  function set<K extends keyof FormValues>(key: K, val: FormValues[K]) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Data Pegawai</h1>
          <p className="mt-1 text-muted-foreground">
            Pastikan identitas pegawai sudah benar
          </p>
        </div>
        <Button onClick={() => buka()}>
          <Plus className="size-4" /> Tambah Pegawai
        </Button>
      </header>

      <Card className="shadow-soft">
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-wrap gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Cari nama atau NIP..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={filterUnit} onValueChange={setFilterUnit}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Unit kerja" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua unit kerja</SelectItem>
                {units.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                <Users className="size-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-semibold">
                {pegawai.length === 0 ? "Belum ada data pegawai" : "Tidak ada hasil"}
              </p>
              <p className="max-w-sm text-sm text-muted-foreground">
                {pegawai.length === 0
                  ? "Yuk mulai dengan menambahkan pegawai pertama. Cukup isi identitas kedinasannya saja."
                  : "Coba ubah kata kunci pencarian atau filter yang dipakai."}
              </p>
              {pegawai.length === 0 && (
                <Button onClick={() => buka()}>
                  <Plus className="size-4" /> Tambah Pegawai
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>NIP</TableHead>
                    <TableHead>Jabatan</TableHead>
                    <TableHead>Unit Kerja</TableHead>
                    <TableHead>Gol.</TableHead>
                    <TableHead>TMT</TableHead>
                    <TableHead>No. WA</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.nama}</TableCell>
                      <TableCell className="whitespace-nowrap">{p.nip}</TableCell>
                      <TableCell>{p.jabatan || "-"}</TableCell>
                      <TableCell>{p.unit_kerja || "-"}</TableCell>
                      <TableCell>{p.golongan || "-"}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {p.tmt ? formatTanggal(p.tmt) : "-"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{p.no_wa || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Edit ${p.nama}`}
                            onClick={() => buka(p)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Hapus ${p.nama}`}
                            onClick={() => setHapus(p)}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Pegawai" : "Tambah Pegawai"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <Field label="Nama lengkap (dengan gelar)" error={errors["nama"]}>
              <Input
                value={values.nama}
                onChange={(e) => set("nama", e.target.value)}
                placeholder="Dra. Siti Aminah, M.Si."
              />
            </Field>
            <Field label="NIP" error={errors["nip"]}>
              <Input
                value={values.nip}
                onChange={(e) => set("nip", e.target.value)}
                placeholder="198503122010012001"
                inputMode="numeric"
              />
            </Field>
            <Field label="Jabatan" error={errors["jabatan"]}>
              <Input
                value={values.jabatan}
                onChange={(e) => set("jabatan", e.target.value)}
                placeholder="Statistisi Ahli Muda"
              />
            </Field>
            <Field label="Tim Kerja/Subbagian" error={errors["unit_kerja"]}>
              <Input
                value={values.unit_kerja}
                onChange={(e) => set("unit_kerja", e.target.value)}
                placeholder="Bagian Umum"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Golongan / pangkat"
                error={errors["golongan"]}
              >
                <Select
                  value={values.golongan}
                  onValueChange={(v) => set("golongan", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih golongan" />
                  </SelectTrigger>

                  <SelectContent>
                    {GOLONGAN.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field
                label="Terhitung Mulai Tanggal (TMT)"
                error={errors["tmt"]}
              >
                <Input
                  type="date"
                  value={values.tmt}
                  onChange={(e) => set("tmt", e.target.value)}
                />
              </Field>
            </div>
            <Field
              label="Nomor WhatsApp pegawai (opsional)"
              error={errors["no_wa"]}
            >
              <Input
                value={values.no_wa}
                onChange={(e) => set("no_wa", e.target.value)}
                placeholder="081234567890"
                inputMode="tel"
              />
            </Field>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={simpan.isPending}>
                {simpan.isPending && <Loader2 className="size-4 animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!hapus} onOpenChange={(o) => !o && setHapus(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus pegawai ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Data <strong>{hapus?.nama}</strong> beserta reminder terkait akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => hapus && hapusMutation.mutate(hapus.id)}>
              Ya, hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string | undefined;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
