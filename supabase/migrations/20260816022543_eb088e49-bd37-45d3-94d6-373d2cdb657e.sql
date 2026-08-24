CREATE TABLE IF NOT EXISTS public.akses_app (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  sandi text NOT NULL DEFAULT 'bpsumum2026',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.akses_app TO service_role;
ALTER TABLE public.akses_app ENABLE ROW LEVEL SECURITY;
INSERT INTO public.akses_app (id, sandi) VALUES (true, 'bpsumum2026') ON CONFLICT (id) DO NOTHING;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reminders TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reminder_schedules TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_settings TO anon;
GRANT SELECT ON public.reminder_logs TO anon;

DROP POLICY IF EXISTS "Admin login kelola pegawai" ON public.employees;
CREATE POLICY "Akses aplikasi kelola pegawai" ON public.employees FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin login kelola reminder" ON public.reminders;
CREATE POLICY "Akses aplikasi kelola reminder" ON public.reminders FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin login kelola jadwal reminder" ON public.reminder_schedules;
CREATE POLICY "Akses aplikasi kelola jadwal reminder" ON public.reminder_schedules FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin login kelola pengaturan" ON public.app_settings;
CREATE POLICY "Akses aplikasi kelola pengaturan" ON public.app_settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin login lihat riwayat" ON public.reminder_logs;
CREATE POLICY "Akses aplikasi lihat riwayat" ON public.reminder_logs FOR SELECT TO anon, authenticated USING (true);