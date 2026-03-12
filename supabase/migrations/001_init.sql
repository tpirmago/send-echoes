-- ─────────────────────────────────────────────────────────────
-- Send Echoes – initial schema
-- Run this in: Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────────

-- Profiles (mirrors auth.users, created via trigger)
create table public.profiles (
  id         uuid references auth.users on delete cascade primary key,
  email      text,
  created_at timestamptz default now()
);

-- Echoes
create table public.echoes (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid references public.profiles(id) on delete cascade not null,
  type            text not null check (
                    type in ('myself','memory','goals','family','voice','public')
                  ),
  title           text not null,
  content         text,
  recipient_email text,
  unlock_at       timestamptz not null,
  is_unlocked     boolean default false not null,
  is_public       boolean default false not null,
  sphere_color    text,
  created_at      timestamptz default now()
);

-- Notification log (used by the Edge Function in Phase 4)
create table public.echo_notifications (
  id         uuid default gen_random_uuid() primary key,
  echo_id    uuid references public.echoes(id) on delete cascade not null,
  type       text not null check (type in ('unlock_owner','unlock_recipient')),
  email      text not null,
  status     text default 'pending' check (status in ('pending','sent','failed')),
  sent_at    timestamptz
);

-- ── Row-Level Security ───────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.echoes   enable row level security;

-- Profiles: users manage their own row
create policy "Own profile – read"   on public.profiles for select using (auth.uid() = id);
create policy "Own profile – update" on public.profiles for update using (auth.uid() = id);

-- Echoes: users manage their own echoes
create policy "Own echoes – read"   on public.echoes for select using (auth.uid() = user_id);
create policy "Own echoes – insert" on public.echoes for insert with check (auth.uid() = user_id);
create policy "Own echoes – delete" on public.echoes for delete using (auth.uid() = user_id);

-- Public echoes are visible to everyone (once unlocked)
create policy "Public echoes – read" on public.echoes
  for select using (is_public = true and is_unlocked = true);

-- ── Auto-create profile on sign-up ──────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
