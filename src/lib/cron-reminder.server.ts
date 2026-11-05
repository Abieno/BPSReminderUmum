import { JENIS_LABEL, type CronDetail, type HasilCron } from "@/lib/format";
import { kirimWa, susunPesan, type EmployeeInfo } from "@/lib/wa.server";

export type { CronDetail, HasilCron };

/** Tanggal hari ini menurut WIB (UTC+7), format YYYY-MM-DD. */
export function tanggalHariIniWib(): string {
  return new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
}

export function tanggalValid(iso: string | null | undefined): boolean {
  return (
    typeof iso === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(iso) &&
    !Number.isNaN(Date.parse(`${iso}T00:00:00Z`))
  );
}

/**
 * Jalankan pengiriman reminder untuk "hari" tertentu (format YYYY-MM-DD).
 * Dipakai oleh endpoint cron harian DAN tombol uji di halaman Pengaturan,
 * sehingga keduanya selalu menjalankan logika yang identik.
 *
 * Aturan pengiriman per jadwal (reminder_schedules):
 * - Dikirim saat tanggal target dikurangi hari_sebelum <= hari berjalan.
 * - Jadwal yang terlewat (misal saat aplikasi mati) dikirim sekali terlambat.
 * - Anti dobel: setiap pasangan (reminder, jadwal H-x) hanya dikirim
 *   satu kali selamanya, ditandai log otomatis berstatus berhasil.
 */
export async function jalankanCronReminder(hariIni: string): Promise<HasilCron> {
  const kosong: HasilCron = {
    ok: false,
    tanggal: hariIni,
    terkirim: 0,
    gagal: 0,
    sudahTerkirimSebelumnya: 0,
  };

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: settings } = await supabaseAdmin
    .from("app_settings")
    .select("wa_admin")
    .eq("id", true)
    .maybeSingle();
  const tujuan = settings?.wa_admin?.trim();
  if (!tujuan) {
    return { ...kosong, alasan: "Nomor WhatsApp tujuan belum diatur di halaman Pengaturan" };
  }

  const { data: reminders, error } = await supabaseAdmin
    .from("reminders")
    .select(
      "id, jenis, tanggal, employee_id, reminder_schedules(hari_sebelum), employees(id, nama, nip, jabatan, golongan, unit_kerja)",
    )
    .eq("aktif", true);
  if (error) return { ...kosong, alasan: error.message };

  // Jadwal otomatis yang pernah berhasil dikirim (anti dobel, termasuk catch-up).
  const { data: logs } = await supabaseAdmin
    .from("reminder_logs")
    .select("reminder_id, hari_sebelum")
    .eq("status", "berhasil")
    .eq("manual", false);
  const sudah = new Set((logs ?? []).map((l) => `${l.reminder_id}|${l.hari_sebelum}`));

  const today = new Date(`${hariIni}T00:00:00Z`);
  const detail: CronDetail[] = [];
  let terkirim = 0;
  let gagal = 0;
  let sudahAda = 0;

  for (const r of reminders ?? []) {
    const emp = r.employees as EmployeeInfo | null;
    if (!emp) continue;
    const target = Date.parse(`${r.tanggal}T00:00:00Z`);
    for (const s of r.reminder_schedules ?? []) {
      const kirimPada = new Date(target - s.hari_sebelum * 86400000).toISOString().slice(0, 10);
      if (kirimPada > hariIni) continue; // belum waktunya
      if (sudah.has(`${r.id}|${s.hari_sebelum}`)) {
        sudahAda++;
        continue;
      }

      const { pesan } = susunPesan(emp, r.jenis, r.tanggal, today);
      const jenis = JENIS_LABEL[r.jenis] ?? r.jenis;
      const jadwal =
        kirimPada === hariIni
          ? `H-${s.hari_sebelum}`
          : `H-${s.hari_sebelum} (terlewat sejak ${kirimPada})`;

      try {
        await kirimWa(tujuan, pesan);
        terkirim++;
        detail.push({ nama: emp.nama, jenis, jadwal, status: "terkirim" });
        await supabaseAdmin.from("reminder_logs").insert({
          employee_id: emp.id,
          reminder_id: r.id,
          employee_nama: emp.nama,
          jenis: r.jenis,
          hari_sebelum: s.hari_sebelum,
          tanggal_kirim: hariIni,
          no_wa: tujuan,
          pesan,
          status: "berhasil",
          manual: false,
        });
      } catch (e) {
        gagal++;
        const err = e instanceof Error ? e.message : "Gagal mengirim";
        detail.push({ nama: emp.nama, jenis, jadwal, status: "gagal", error: err });
        await supabaseAdmin.from("reminder_logs").insert({
          employee_id: emp.id,
          reminder_id: r.id,
          employee_nama: emp.nama,
          jenis: r.jenis,
          hari_sebelum: s.hari_sebelum,
          tanggal_kirim: hariIni,
          no_wa: tujuan,
          pesan,
          status: "gagal",
          error: err,
          manual: false,
        });
      }
    }
  }

  return {
    ok: true,
    tanggal: hariIni,
    terkirim,
    gagal,
    sudahTerkirimSebelumnya: sudahAda,
    detail,
  };
}
