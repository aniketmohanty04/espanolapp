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

-- ====================================================================
-- 6. Gemini API Rate Limiting: 20 calls / minute / user
-- ====================================================================

create table if not exists public.gemini_rate_limits (
  user_id text not null,
  api_name text not null default 'gemini',
  window_start timestamptz not null default now(),
  request_count int not null default 1,
  primary key (user_id, api_name)
);

alter table public.gemini_rate_limits enable row level security;

-- Revoke direct table manipulation from client roles (access is strictly through the secure RPC function)
revoke all on public.gemini_rate_limits from anon, authenticated;
grant select, insert, update on public.gemini_rate_limits to service_role;

drop policy if exists "Allow anon rate limit access" on public.gemini_rate_limits;
drop policy if exists "Deny direct client access" on public.gemini_rate_limits;
create policy "Deny direct client access" on public.gemini_rate_limits
  for all using (false);

-- Atomic Rate Limiting Function (protected with fixed search_path and server-side limit ceiling)
create or replace function public.check_gemini_rate_limit(
  p_user_id text,
  p_max_requests int default 20,
  p_window_seconds int default 60
)
returns table (
  allowed boolean,
  current_count int,
  remaining_calls int,
  reset_in_seconds int
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_window_start timestamptz;
  v_count int;
  v_now timestamptz := clock_timestamp();
  v_elapsed_seconds int;
  c_max_allowed constant int := 20;
  c_window_min constant int := 60;
begin
  -- Enforce server-side security ceilings on client-provided parameters
  p_max_requests := least(greatest(coalesce(p_max_requests, c_max_allowed), 1), c_max_allowed);
  p_window_seconds := greatest(coalesce(p_window_seconds, c_window_min), c_window_min);

  -- Atomic upsert: handles initial insert and updates concurrently without race conditions
  insert into public.gemini_rate_limits (user_id, api_name, window_start, request_count)
  values (p_user_id, 'gemini', v_now, 1)
  on conflict (user_id, api_name) do update
  set request_count = case
        when floor(extract(epoch from (v_now - public.gemini_rate_limits.window_start)))::int >= p_window_seconds
        then 1
        when public.gemini_rate_limits.request_count < p_max_requests
        then public.gemini_rate_limits.request_count + 1
        else public.gemini_rate_limits.request_count
      end,
      window_start = case
        when floor(extract(epoch from (v_now - public.gemini_rate_limits.window_start)))::int >= p_window_seconds
        then v_now
        else public.gemini_rate_limits.window_start
      end
  returning window_start, request_count into v_window_start, v_count;

  v_elapsed_seconds := floor(extract(epoch from (v_now - v_window_start)))::int;

  -- If within limit, allow request
  if v_count <= p_max_requests then
    return query select 
      true, 
      v_count, 
      p_max_requests - v_count, 
      greatest(1, p_window_seconds - v_elapsed_seconds);
    return;
  end if;

  -- Limit reached: block request and return countdown until reset
  return query select 
    false, 
    v_count, 
    0, 
    greatest(1, p_window_seconds - v_elapsed_seconds);
end;
$$;

-- Grant execution permission to Supabase API roles
grant execute on function public.check_gemini_rate_limit(text, int, int) to anon, authenticated, service_role;

-- Success check
select '¡Aventura Española cloud schema successfully applied!' as status;
