export const JENIS_LABEL: Record<string, string> = {
  kenaikan_pangkat: "Kenaikan Pangkat",
  kenaikan_gaji_berkala: "Kenaikan Gaji Berkala (KGB)",
};
export type CronDetail = {
  nama: string;
  jenis: string;
  jadwal: string;
  status: "terkirim" | "gagal" | "sudah-ada";
  error?: string;
};

export type HasilCron = {
  ok: boolean;
  tanggal: string;
  terkirim: number;
  gagal: number;
  sudahTerkirimSebelumnya: number;
  alasan?: string;
  detail?: CronDetail[];
};

export function formatTanggal(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

/** Selisih hari dari hari ini (WIB) menuju tanggal target. */
export function sisaHari(iso: string, today = new Date()): number {
  const target = Date.parse(`${iso}T00:00:00Z`);
  const now = Date.parse(`${today.toISOString().slice(0, 10)}T00:00:00Z`);
  return Math.round((target - now) / 86400000);
}

/** Normalisasi nomor WA Indonesia ke format 62xxxxxxxxx. */
export function normalizeWa(input: string): string {
  const digits = input.replace(/[^0-9]/g, "");
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("8")) return `62${digits}`;
  return digits;
}

export function isValidWa(input: string): boolean {
  const n = normalizeWa(input);
  return /^62[0-9]{8,13}$/.test(n);
}

export type PesanData = {
  jenis: string;
  nama: string;
  nip: string;
  jabatan: string;
  golongan?: string;
  unit_kerja?: string;
  tanggal: string;
  sisa: number;
};

export function buildPesan(d: PesanData): string {
  const judul =
    d.jenis === "kenaikan_pangkat"
      ? "PENGINGAT KENAIKAN PANGKAT"
      : "PENGINGAT KENAIKAN GAJI BERKALA (KGB)";
  const baris = [
    `*${judul}*`,
    "",
    `Nama    : ${d.nama}`,
    `NIP     : ${d.nip}`,
    `Jabatan : ${d.jabatan || "-"}`,
  ];
  if (d.jenis === "kenaikan_pangkat") baris.push(`Golongan: ${d.golongan || "-"}`);
  if (d.unit_kerja) baris.push(`Unit    : ${d.unit_kerja}`);
  baris.push(
    `Tanggal target: ${formatTanggal(d.tanggal)}`,
    `Sisa waktu    : ${d.sisa} hari lagi`,
    "",
    "Mohon segera disiapkan berkas dan prosesnya. — Bagian Umum BPS",
  );
  return baris.join("\n");
}
