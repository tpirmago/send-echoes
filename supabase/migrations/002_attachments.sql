-- ─────────────────────────────────────────────────────────────
-- Send Echoes – attachments schema
-- Run this in: Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────────

-- Attachment metadata table
create table public.echo_attachments (
  id         uuid default gen_random_uuid() primary key,
  echo_id    uuid references public.echoes(id) on delete cascade not null,
  file_path  text not null,
  file_name  text not null,
  file_size  bigint,
  mime_type  text,
  created_at timestamptz default now()
);

alter table public.echo_attachments enable row level security;

-- Only the echo owner can read/insert/delete attachments
create policy "Own attachments – read" on public.echo_attachments
  for select using (
    exists (
      select 1 from public.echoes
      where echoes.id = echo_attachments.echo_id
        and echoes.user_id = auth.uid()
    )
  );

create policy "Own attachments – insert" on public.echo_attachments
  for insert with check (
    exists (
      select 1 from public.echoes
      where echoes.id = echo_attachments.echo_id
        and echoes.user_id = auth.uid()
    )
  );

create policy "Own attachments – delete" on public.echo_attachments
  for delete using (
    exists (
      select 1 from public.echoes
      where echoes.id = echo_attachments.echo_id
        and echoes.user_id = auth.uid()
    )
  );

-- ── Storage bucket + policies ─────────────────────────────────
-- Create the bucket (private by default)
insert into storage.buckets (id, name, public)
values ('echo-attachments', 'echo-attachments', false)
on conflict (id) do nothing;

-- Users can upload to their own folder: {user_id}/{echo_id}/...
create policy "Storage – upload own files" on storage.objects
  for insert with check (
    bucket_id = 'echo-attachments'
    and auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- Users can read their own files
create policy "Storage – read own files" on storage.objects
  for select using (
    bucket_id = 'echo-attachments'
    and auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- Users can delete their own files
create policy "Storage – delete own files" on storage.objects
  for delete using (
    bucket_id = 'echo-attachments'
    and auth.uid()::text = (string_to_array(name, '/'))[1]
  );
