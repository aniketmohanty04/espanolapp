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

-- Allow anon and authenticated clients full access through RLS
drop policy if exists "Allow anon rate limit access" on public.gemini_rate_limits;
create policy "Allow anon rate limit access" on public.gemini_rate_limits
  for all using (true) with check (true);

grant all on public.gemini_rate_limits to anon, authenticated, service_role;

-- Atomic Rate Limiting Function
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
as $$
declare
  v_window_start timestamptz;
  v_count int;
  v_now timestamptz := clock_timestamp();
  v_elapsed_seconds int;
begin
  -- Lock the row for this user & API endpoint
  select window_start, request_count
  into v_window_start, v_count
  from public.gemini_rate_limits
  where user_id = p_user_id and api_name = 'gemini'
  for update;

  -- Case A: No previous record exists -> Insert first record
  if not found then
    insert into public.gemini_rate_limits (user_id, api_name, window_start, request_count)
    values (p_user_id, 'gemini', v_now, 1);

    return query select true, 1, p_max_requests - 1, p_window_seconds;
    return;
  end if;

  v_elapsed_seconds := floor(extract(epoch from (v_now - v_window_start)))::int;

  -- Case B: The 60-second window has expired -> Reset window & counter
  if v_elapsed_seconds >= p_window_seconds then
    update public.gemini_rate_limits
    set window_start = v_now,
        request_count = 1
    where user_id = p_user_id and api_name = 'gemini';

    return query select true, 1, p_max_requests - 1, p_window_seconds;
    return;
  end if;

  -- Case C: Window is active and user is within limit -> Increment counter
  if v_count < p_max_requests then
    update public.gemini_rate_limits
    set request_count = request_count + 1
    where user_id = p_user_id and api_name = 'gemini';

    return query select 
      true, 
      v_count + 1, 
      p_max_requests - (v_count + 1), 
      p_window_seconds - v_elapsed_seconds;
    return;
  end if;

  -- Case D: Limit reached (>= 20 calls in current 60s window) -> Block request
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
