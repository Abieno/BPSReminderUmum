export const JENIS_LABEL: Record<string, string> = {
  kenaikan_pangkat: "Kenaikan Pangkat",
  kenaikan_gaji_berkala: "Kenaikan Gaji Berkala (KGB)",
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

  let sisaText: string;

  if (d.sisa > 1) {
    sisaText = `${d.sisa} hari lagi`;
  } else if (d.sisa === 1) {
    sisaText = "1 hari lagi";
  } else if (d.sisa === 0) {
    sisaText = "HARI INI";
  } else {
    sisaText = `terlewat ${Math.abs(d.sisa)} hari`;
  }

  const baris = [
    `🔔 *${judul}*`,
    "",
    `👤 *Nama*`,
    `${d.nama}`,
    "",
    `🪪 *NIP*`,
    `${d.nip}`,
    "",
    `💼 *Jabatan*`,
    `${d.jabatan || "-"}`,
  ];

  if (d.jenis === "kenaikan_pangkat") {
    baris.push(
      "",
      `🏷️ *Golongan*`,
      `${d.golongan || "-"}`,
    );
  }

  if (d.unit_kerja) {
    baris.push(
      "",
      `🏢 *Unit Kerja*`,
      `${d.unit_kerja}`,
    );
  }

  baris.push(
    "",
    `📅 *Tanggal Target*`,
    `${formatTanggal(d.tanggal)}`,
    "",
    `⏳ *Sisa Waktu*`,
    `*${sisaText}*`,
    "",
    "━━━━━━━━━━━━━━━━━━━━",
    "",
    "Terima kasih — SIRENA BPS",
  );

  return baris.join("\n");
}