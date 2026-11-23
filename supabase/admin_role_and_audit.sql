-- ====================================================================
-- ¡Aventura Española! — Role-Based Admin Access & Immutable Audit Log
-- Execute in Supabase SQL Editor (supabase.com)
-- ====================================================================

-- 1. Add `role` column to player_progress table with default 'user'
alter table if exists public.player_progress 
  add column if not exists role text not null default 'user' 
  check (role in ('user', 'admin'));

-- Index on email and role for fast, secure lookup
create index if not exists player_progress_role_idx on public.player_progress (lower(email), role);

-- 2. Trigger to prevent clients from elevating their own role during self-updates
create or replace function public.protect_player_role()
returns trigger as $$
begin
  -- If executed directly by DBA in Supabase SQL Editor (postgres or supabase_admin), allow it
  if current_user in ('postgres', 'supabase_admin') then
    return new;
  end if;

  -- If executed by backend service_role API, allow it
  if auth.role() = 'service_role' then
    return new;
  end if;

  -- If executed by client (anon or authenticated user via PostgREST), preserve existing role
  new.role = old.role;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists enforce_player_role_immutability on public.player_progress;
create trigger enforce_player_role_immutability
  before update on public.player_progress
  for each row execute procedure public.protect_player_role();

-- 3. Create append-only audit_log table
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id text not null,
  action text not null,
  target_table text,
  target_id text,
  timestamp timestamptz not null default clock_timestamp(),
  metadata jsonb not null default '{}'::jsonb
);

-- Index for searching audit logs by actor and action
create index if not exists audit_log_actor_idx on public.audit_log (actor_id);
create index if not exists audit_log_action_idx on public.audit_log (action);
create index if not exists audit_log_timestamp_idx on public.audit_log (timestamp desc);

-- 4. Enable Row Level Security (RLS) on all tables
alter table public.player_progress enable row level security;
alter table public.gemini_rate_limits enable row level security;
alter table public.audit_log enable row level security;

-- 5. Strict RLS Policies for audit_log (Immutable: NO updates or deletes allowed)
drop policy if exists "Disallow public updates on audit_log" on public.audit_log;
drop policy if exists "Disallow public deletes on audit_log" on public.audit_log;
drop policy if exists "Disallow public select on audit_log" on public.audit_log;
drop policy if exists "Allow service role audit" on public.audit_log;

-- Only service_role (the backend API) can read or insert audit records
create policy "Allow service role audit write" on public.audit_log
  for insert
  with check (auth.role() = 'service_role');

create policy "Allow service role audit read" on public.audit_log
  for select
  using (auth.role() = 'service_role');

-- Revoke client permissions
revoke update, delete on public.audit_log from anon, authenticated;

-- 6. Strict Player Progress RLS Policies (Player isolation)
drop policy if exists "Users own progress select" on public.player_progress;
create policy "Users own progress select" on public.player_progress
  for select
  using (
    auth.uid()::text = id 
    or auth.role() = 'service_role'
  );

drop policy if exists "Users own progress update" on public.player_progress;
create policy "Users own progress update" on public.player_progress
  for update
  using (
    auth.uid()::text = id 
    or auth.role() = 'service_role'
  )
  with check (
    auth.uid()::text = id 
    or auth.role() = 'service_role'
  );

drop policy if exists "Users own progress insert" on public.player_progress;
create policy "Users own progress insert" on public.player_progress
  for insert
  with check (
    auth.uid()::text = id 
    or auth.role() = 'service_role'
  );

-- ====================================================================
-- HOW TO CREATE THE FIRST ADMIN (RUN MANUALLY IN SUPABASE SQL EDITOR)
-- ====================================================================
-- Replace 'admin@aventura.es' with your designated administrator email:
--
-- UPDATE public.player_progress 
-- SET role = 'admin' 
-- WHERE lower(email) = lower('admin@aventura.es');
--
-- To verify admin role:
-- SELECT id, email, display_name, role, created_at 
-- FROM public.player_progress 
-- WHERE role = 'admin';
