import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { kirimWa, susunPesan } from "@/lib/wa.server";

const schema = z.object({ reminderId: z.string().uuid() });

/** Kirim reminder manual (tombol "Kirim sekarang") ke nomor WA Bagian Umum. */
export const kirimReminderManual = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    await (await import("@/lib/gate.server")).requireUnlocked();
    const { supabaseAdmin: supabase } = await import("@/integrations/supabase/client.server");

    const { data: reminder, error } = await supabase
      .from("reminders")
      .select("id, jenis, tanggal, employee_id, employees(id, nama, nip, jabatan, golongan, unit_kerja)")
      .eq("id", data.reminderId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!reminder || !reminder.employees) throw new Error("Reminder tidak ditemukan");

    const { data: settings } = await supabase
      .from("app_settings")
      .select("wa_admin")
      .eq("id", true)
      .maybeSingle();
    const tujuan = settings?.wa_admin?.trim();
    if (!tujuan) throw new Error("Nomor WhatsApp Bagian Umum belum diatur di halaman Pengaturan");

    const emp = reminder.employees;
    const { pesan, sisa } = susunPesan(emp, reminder.jenis, reminder.tanggal);

    const supabaseAdmin = supabase;
    try {
      await kirimWa(tujuan, pesan);
      await supabaseAdmin.from("reminder_logs").insert({
        employee_id: emp.id,
        reminder_id: reminder.id,
        employee_nama: emp.nama,
        jenis: reminder.jenis,
        hari_sebelum: sisa,
        no_wa: tujuan,
        pesan,
        status: "berhasil",
        manual: true,
      });
      return { ok: true as const, tujuan };
    } catch (e) {
      const message = e instanceof Error ? e.message : "Gagal mengirim";
      await supabaseAdmin.from("reminder_logs").insert({
        employee_id: emp.id,
        reminder_id: reminder.id,
        employee_nama: emp.nama,
        jenis: reminder.jenis,
        hari_sebelum: sisa,
        no_wa: tujuan,
        pesan,
        status: "gagal",
        error: message,
        manual: true,
      });
      throw new Error(message);
    }
  });
