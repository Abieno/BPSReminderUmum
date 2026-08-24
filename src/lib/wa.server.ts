import { buildPesan, sisaHari, normalizeWa, type PesanData } from "@/lib/format";

export type EmployeeInfo = {
  id: string;
  nama: string;
  nip: string;
  jabatan: string;
  golongan: string;
  unit_kerja: string;
};

/** Kirim pesan WhatsApp lewat gateway Fonnte. */
export async function kirimWa(target: string, pesan: string) {
  const token = process.env["FONNTE_TOKEN"];

  console.log("[Fonnte] token tersedia:", Boolean(token));
  console.log("[Fonnte] panjang token:", token?.length ?? 0);
  if (!token) throw new Error("FONNTE_TOKEN belum dikonfigurasi di server");

  const res = await fetch("https://api.fonnte.com/send", {
    method: "POST",
    headers: { Authorization: token, "Content-Type": "application/json" },
    body: JSON.stringify({ target: normalizeWa(target), message: pesan, countryCode: "62" }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Gateway WA error (${res.status}): ${text.slice(0, 200)}`);
  let ok = true;
  try {
    const json = JSON.parse(text) as { status?: boolean; reason?: string };
    if (json.status === false) {
      ok = false;
      throw new Error(json.reason || "Gateway WA menolak pengiriman");
    }
  } catch (e) {
    if (!ok) throw e;
  }
  return text.slice(0, 500);
}

export function susunPesan(
  emp: EmployeeInfo,
  jenis: string,
  tanggal: string,
  today = new Date(),
): { pesan: string; sisa: number } {
  const sisa = sisaHari(tanggal, today);
  const data: PesanData = {
    jenis,
    nama: emp.nama,
    nip: emp.nip,
    jabatan: emp.jabatan,
    golongan: emp.golongan,
    unit_kerja: emp.unit_kerja,
    tanggal,
    sisa,
  };
  return { pesan: buildPesan(data), sisa };
}
