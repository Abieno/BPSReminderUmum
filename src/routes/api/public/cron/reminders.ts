import { createFileRoute } from "@tanstack/react-router";

/**
 * Endpoint yang dipanggil job harian Supabase (pg_cron) setiap 08.00 WIB.
 * Wajib menyertakan header `apikey` berisi kunci publik aplikasi.
 * Parameter opsional `?tanggal=YYYY-MM-DD` untuk menjalankan logika
 * pengiriman seolah-olah hari itu (dipakai untuk uji manual).
 */
async function jalankan(request: Request) {
  const expected =
    process.env["SUPABASE_ANON_KEY"] ?? process.env["SUPABASE_PUBLISHABLE_KEY"] ?? "";
  const provided =
    request.headers.get("apikey") ?? request.headers.get("authorization")?.replace("Bearer ", "");
  if (!expected || provided !== expected) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Load server-only reminder code inside the handler so it never enters the browser bundle.
  const { jalankanCronReminder, tanggalHariIniWib, tanggalValid } = await import(
    "@/lib/cron-reminder.server"
  );

  const paramTanggal = new URL(request.url).searchParams.get("tanggal");
  if (paramTanggal !== null && !tanggalValid(paramTanggal)) {
    return Response.json(
      { ok: false, alasan: "Parameter tanggal harus berformat YYYY-MM-DD" },
      { status: 400 },
    );
  }

  const tanggal = paramTanggal ?? tanggalHariIniWib();
  const hasil = await jalankanCronReminder(tanggal);
  return Response.json(hasil);
}

export const Route = createFileRoute("/api/public/cron/reminders")({
  server: {
    handlers: {
      POST: async ({ request }) => jalankan(request),
      GET: async ({ request }) => jalankan(request),
    },
  },
});
