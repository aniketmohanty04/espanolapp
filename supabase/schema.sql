-- ====================================================================
-- ¡Aventura Española! — Supabase Remote Cloud Database Schema
-- Run this script in your Supabase Project's SQL Editor (supabase.com)
-- ====================================================================

-- 1. Create the player_progress table
create table if not exists public.player_progress (
  id text primary key,
  email text unique not null,
  display_name text not null default 'Viajero',
  password_hash text not null,
  progress jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Create index on email for ultra-fast credential lookups
create index if not exists player_progress_email_idx on public.player_progress (lower(email));

-- 3. Enable Row Level Security (RLS)
alter table public.player_progress enable row level security;

-- 4. Set RLS policies allowing the game client (using the public anon key) to read, insert, and update player records
drop policy if exists "Allow game anon select" on public.player_progress;
create policy "Allow game anon select" on public.player_progress
  for select using (true);

drop policy if exists "Allow game anon insert" on public.player_progress;
create policy "Allow game anon insert" on public.player_progress
  for insert with check (true);

drop policy if exists "Allow game anon update" on public.player_progress;
create policy "Allow game anon update" on public.player_progress
  for update using (true);

-- 5. Optional trigger to automatically update 'updated_at' on save
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_player_progress_updated_at on public.player_progress;
create trigger set_player_progress_updated_at
  before update on public.player_progress
  for each row execute procedure public.handle_updated_at();

-- Success check
select '¡Aventura Española cloud schema successfully applied!' as status;
