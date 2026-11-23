-- ====================================================================
-- ¡Aventura Española! — Row-Level Security (RLS) & Admin Access Control
-- Run this script in the Supabase SQL Editor (supabase.com)
-- ====================================================================

-- ====================================================================
-- 1. ROW LEVEL SECURITY (RLS) FOR PLAYER PROGRESS TABLE
-- ====================================================================

-- Ensure RLS is permanently enabled
alter table if exists public.player_progress enable row level security;

-- Revoke dangerous permissive public policies if previously applied
drop policy if exists "Allow game anon select" on public.player_progress;
drop policy if exists "Allow game anon insert" on public.player_progress;
drop policy if exists "Allow game anon update" on public.player_progress;
drop policy if exists "Users own progress" on public.player_progress;
drop policy if exists "Player Self Read Policy" on public.player_progress;
drop policy if exists "Player Self Insert Policy" on public.player_progress;
drop policy if exists "Player Self Update Policy" on public.player_progress;

-- Strict Player Row Isolation:
-- 1. SELECT: Authenticated users can only read their own row (or anon during initial login via email hash RPC)
create policy "Player Self Read Policy" on public.player_progress
  for select
  using (
    auth.uid()::text = id 
    or auth.role() = 'service_role'
  );

-- 2. INSERT: Users can only insert their own row matching their auth id
create policy "Player Self Insert Policy" on public.player_progress
  for insert
  with check (
    auth.uid()::text = id 
    or auth.role() = 'service_role'
  );

-- 3. UPDATE: Users can only modify their own row; cannot tamper with other players' progress
create policy "Player Self Update Policy" on public.player_progress
  for update
  using (
    auth.uid()::text = id 
    or auth.role() = 'service_role'
  )
  with check (
    auth.uid()::text = id 
    or auth.role() = 'service_role'
  );

-- 4. DELETE: Completely disallowed from client roles (only service_role / superadmin)
create policy "Disallow Client Delete Policy" on public.player_progress
  for delete
  using (auth.role() = 'service_role');


-- ====================================================================
-- 2. ROW LEVEL SECURITY (RLS) FOR GEMINI RATE LIMITING TABLE
-- ====================================================================

alter table if exists public.gemini_rate_limits enable row level security;

-- Deny all direct table modifications from client roles;
-- Rate limiting is enforced strictly through the SECURITY DEFINER function check_gemini_rate_limit().
drop policy if exists "Deny direct client access" on public.gemini_rate_limits;
create policy "Deny direct client access" on public.gemini_rate_limits
  for all using (auth.role() = 'service_role');


-- ====================================================================
-- 3. CLOUD CURRICULUM OVERRIDES TABLE (ADMIN CONTENT MANAGEMENT)
-- ====================================================================

create table if not exists public.curriculum_content (
  id text primary key default 'active_curriculum',
  curriculum_version int not null default 1,
  data jsonb not null,
  modified_by text not null default 'admin',
  updated_at timestamptz default now()
);

alter table public.curriculum_content enable row level security;

-- 1. Anyone (including students) can READ the published curriculum
drop policy if exists "Public Read Curriculum" on public.curriculum_content;
create policy "Public Read Curriculum" on public.curriculum_content
  for select
  using (true);

-- 2. Only authenticated admins or service_role can WRITE, UPDATE or DELETE curriculum content
drop policy if exists "Admin Modify Curriculum" on public.curriculum_content;
create policy "Admin Modify Curriculum" on public.curriculum_content
  for all
  using (auth.role() = 'service_role');


-- ====================================================================
-- 4. VERIFICATION QUERY
-- ====================================================================

select 
  schemaname, 
  tablename, 
  rowsecurity 
from pg_tables 
where schemaname = 'public' 
  and tablename in ('player_progress', 'gemini_rate_limits', 'curriculum_content');
