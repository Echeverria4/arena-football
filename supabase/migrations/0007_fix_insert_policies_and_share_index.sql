-- Fix two regressions blocking the share/push flow:
--
-- 1) The INSERT policies from supabase/policies.sql were never applied to
--    this database (only the migration files were run), so authenticated
--    users get 42501 ("row violates row-level security policy") when
--    upserting into tournaments / participants / matches / standings.
--    We recreate them here as creator-or-editor where appropriate.
--
-- 2) tournament_shares has a (tournament_id, access) unique index that does
--    NOT filter on expires_at, so once a share is created (even if later
--    expired), no new share can be issued for the same combo. We replace
--    it with a partial unique index that only enforces uniqueness while
--    expires_at IS NULL (active share). Expired rows can coexist.

-- ---------- 1. Make sure users_select_authenticated exists ---------------
-- current_profile_id() reads from public.users; if RLS denies SELECT,
-- the function returns NULL and every INSERT WITH CHECK against
-- current_profile_id() fails silently.

alter table public.users enable row level security;

drop policy if exists "users_select_authenticated" on public.users;
create policy "users_select_authenticated"
on public.users
for select
to authenticated
using (true);

drop policy if exists "users_insert_own_profile" on public.users;
create policy "users_insert_own_profile"
on public.users
for insert
to authenticated
with check (auth.uid() = auth_user_id);

drop policy if exists "users_update_own_profile" on public.users;
create policy "users_update_own_profile"
on public.users
for update
to authenticated
using (auth.uid() = auth_user_id)
with check (auth.uid() = auth_user_id);

-- ---------- 2. tournaments INSERT policy (was missing) -------------------

alter table public.tournaments enable row level security;

drop policy if exists "tournaments_insert_authenticated" on public.tournaments;
create policy "tournaments_insert_authenticated"
on public.tournaments
for insert
to authenticated
with check (creator_id = public.current_profile_id());

-- ---------- 3. Replace bad unique index on tournament_shares -------------
-- Old index blocks re-issuing a share even after the previous one expired.
-- Drop it and recreate as partial (active rows only).

drop index if exists public.idx_tournament_shares_tournament_access;

create unique index if not exists idx_tournament_shares_tournament_access_active
  on public.tournament_shares (tournament_id, access)
  where expires_at is null;
