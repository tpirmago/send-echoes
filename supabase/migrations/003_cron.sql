-- ─────────────────────────────────────────────────────────────
-- Send Echoes – pg_cron job for unlock notifications
-- Run this in: Supabase Dashboard → SQL Editor
-- Requires: pg_cron extension (enabled by default on Supabase)
-- ─────────────────────────────────────────────────────────────

-- Enable pg_cron (safe to run even if already enabled)
create extension if not exists pg_cron;

-- Schedule: call the Edge Function every 15 minutes
-- Replace <PROJECT_REF> with your Supabase project ref (e.g. abcdefghijklmnop)
-- Replace <ANON_KEY> with your anon public key (safe to use here — function is protected by service role internally)
select cron.schedule(
  'send-echo-notifications',          -- job name
  '*/15 * * * *',                     -- every 15 minutes
  $$
  select net.http_post(
    url    := 'https://<PROJECT_REF>.supabase.co/functions/v1/send-echo-notifications',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer <ANON_KEY>"}'::jsonb,
    body   := '{}'::jsonb
  );
  $$
);
