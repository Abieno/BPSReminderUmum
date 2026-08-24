CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.unschedule('kirim-reminder-harian') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'kirim-reminder-harian');

SELECT cron.schedule(
  'kirim-reminder-harian',
  '0 1 * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--e9bd9865-74d8-4d15-9be0-ed7fdafbf4ea.lovable.app/api/public/cron/reminders',
    headers := '{"Content-Type": "application/json", "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmeXRibXViY3hxeXdlZWVqcGNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2NjY5MTcsImV4cCI6MjEwMjI0MjkxN30.lu6_nuWZRwR1S0EPh5EOhMzudV1Qoogadq7uHAMBy1Y"}'::jsonb,
    body := '{"source": "pg_cron"}'::jsonb
  );
  $$
);