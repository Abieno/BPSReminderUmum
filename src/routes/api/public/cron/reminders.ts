import { createFileRoute } from "@tanstack/react-router";

import { kirimWa, susunPesan } from "@/lib/wa.server";

function tanggalWib(): string {
  return new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
}

async function jalankan(request: Request) {
  const expected =
    process.env["SUPABASE_ANON_KEY"] ?? process.env["SUPABASE_PUBLISHABLE_KEY"] ?? "";
  const provided =
    request.headers.get("apikey") ?? request.headers.get("authorization")?.replace("Bearer ", "");
  if (!expected || provided !== expected) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: settings } = await supabaseAdmin
    .from("app_settings")
    .select("wa_admin")
    .eq("id", true)
    .maybeSingle();
  const tujuan = settings?.wa_admin?.trim();
  if (!tujuan) return Response.json({ ok: false, reason: "Nomor WA tujuan belum diatur" });

  const hariIni = tanggalWib();
  const today = new Date(`${hariIni}T00:00:00Z`);

  const { data: reminders, error } = await supabaseAdmin
    .from("reminders")
    .select(
      "id, jenis, tanggal, employee_id, reminder_schedules(hari_sebelum), employees(id, nama, nip, jabatan, golongan, unit_kerja)",
    )
    .eq("aktif", true);
  if (error) return Response.json({ ok: false, reason: error.message }, { status: 500 });

  let terkirim = 0;
  let gagal = 0;

  for (const r of reminders ?? []) {
    const emp = r.employees;
    if (!emp) continue;
    const target = Date.parse(`${r.tanggal}T00:00:00Z`);
    for (const s of r.reminder_schedules ?? []) {
      const kirimPada = new Date(target - s.hari_sebelum * 86400000).toISOString().slice(0, 10);
      if (kirimPada !== hariIni) continue;

      const { count } = await supabaseAdmin
        .from("reminder_logs")
        .select("id", { count: "exact", head: true })
        .eq("reminder_id", r.id)
        .eq("hari_sebelum", s.hari_sebelum)
        .eq("tanggal_kirim", hariIni)
        .eq("status", "berhasil");
      if ((count ?? 0) > 0) continue;

      const { pesan } = susunPesan(emp, r.jenis, r.tanggal, today);
      try {
        await kirimWa(tujuan, pesan);
        terkirim++;
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
          error: e instanceof Error ? e.message : "Gagal mengirim",
          manual: false,
        });
      }
    }
  }

  return Response.json({ ok: true, tanggal: hariIni, terkirim, gagal });
}

export const Route = createFileRoute("/api/public/cron/reminders")({
  server: {
    handlers: {
      POST: async ({ request }) => jalankan(request),
      GET: async ({ request }) => jalankan(request),
    },
  },
});
