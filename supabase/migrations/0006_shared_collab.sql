-- ==========================================================================
-- 0006_shared_collab.sql
--
-- Real-time tournament collaboration foundation.
--
-- Adds the schema + RLS so moderators can share tournaments with editors
-- and viewers, and changes propagate via Supabase Realtime.
--
-- Changes in this migration:
--   1. `tournament_collaborators` table — grants a user editor/viewer access
--      to a specific tournament (beyond being the creator or a participant).
--   2. RLS helpers `is_tournament_editor`, `has_tournament_access`,
--      `can_edit_tournament`.
--   3. Updated RLS on tournaments/participants/matches/standings/videos to
--      include editors. DELETE on tournaments stays creator-only.
--   4. `tournament_participants.user_id` becomes nullable (participants can
--      be local team names without a linked user account).
--   5. `claim_tournament_share(share_key)` RPC — lets an authenticated user
--      self-grant access by presenting a valid share link.
--   6. Supabase Realtime enabled on the collaboration tables.
--
-- Idempotent: safe to run multiple times.
-- ==========================================================================

-- ---------- 1. tournament_collaborators table -----------------------------

create table if not exists public.tournament_collaborators (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  access text not null check (access in ('editor', 'viewer')),
  granted_via text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tournament_id, user_id)
);

create index if not exists idx_tournament_collaborators_tournament_id
  on public.tournament_collaborators (tournament_id);

create index if not exists idx_tournament_collaborators_user_id
  on public.tournament_collaborators (user_id);

drop trigger if exists tournament_collaborators_touch_updated_at
  on public.tournament_collaborators;
create trigger tournament_collaborators_touch_updated_at
before update on public.tournament_collaborators
for each row execute function public.touch_updated_at();

-- ---------- 2. RLS helper functions ---------------------------------------

create or replace function public.is_tournament_editor(target_tournament_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.tournament_collaborators tc
    where tc.tournament_id = target_tournament_id
      and tc.user_id = public.current_profile_id()
      and tc.access = 'editor'
  )
$$;

create or replace function public.has_tournament_access(target_tournament_id uuid)
returns boolean
language sql
stable
as $$
  select
    public.is_tournament_creator(target_tournament_id)
    or public.is_tournament_member(target_tournament_id)
    or exists (
      select 1
      from public.tournament_collaborators tc
      where tc.tournament_id = target_tournament_id
        and tc.user_id = public.current_profile_id()
    )
$$;

create or replace function public.can_edit_tournament(target_tournament_id uuid)
returns boolean
language sql
stable
as $$
  select
    public.is_tournament_creator(target_tournament_id)
    or public.is_tournament_editor(target_tournament_id)
$$;

-- ---------- 3. tournament_participants.user_id nullable -------------------

-- Participants in the app are often just a team name + phone, not a real
-- registered user. Relax the FK so we can persist them alongside account-based
-- participants.
alter table public.tournament_participants
  alter column user_id drop not null;

-- ---------- 4. RLS on tournament_collaborators ----------------------------

alter table public.tournament_collaborators enable row level security;

drop policy if exists "collaborators_select_with_access" on public.tournament_collaborators;
create policy "collaborators_select_with_access"
on public.tournament_collaborators
for select
to authenticated
using (public.has_tournament_access(tournament_id));

-- Only the tournament creator can INSERT/UPDATE/DELETE collaborator rows
-- directly. Editors/viewers self-grant via `claim_tournament_share` (below),
-- which runs as SECURITY DEFINER and bypasses this policy.
drop policy if exists "collaborators_manage_creator_only"
  on public.tournament_collaborators;
create policy "collaborators_manage_creator_only"
on public.tournament_collaborators
for all
to authenticated
using (public.is_tournament_creator(tournament_id))
with check (public.is_tournament_creator(tournament_id));

-- ---------- 5. Updated RLS on tournament-related tables -------------------

-- tournaments
drop policy if exists "tournaments_select_member_or_creator" on public.tournaments;
drop policy if exists "tournaments_select_with_access" on public.tournaments;
create policy "tournaments_select_with_access"
on public.tournaments
for select
to authenticated
using (public.has_tournament_access(id));

drop policy if exists "tournaments_update_creator_only" on public.tournaments;
drop policy if exists "tournaments_update_creator_or_editor" on public.tournaments;
create policy "tournaments_update_creator_or_editor"
on public.tournaments
for update
to authenticated
using (public.can_edit_tournament(id))
with check (public.can_edit_tournament(id));

-- DELETE on tournaments is creator-only. Editors cannot remove an active
-- tournament (explicit product requirement).
drop policy if exists "tournaments_delete_creator_only" on public.tournaments;
create policy "tournaments_delete_creator_only"
on public.tournaments
for delete
to authenticated
using (public.is_tournament_creator(id));

-- tournament_participants
drop policy if exists "participants_select_member_or_creator" on public.tournament_participants;
drop policy if exists "participants_select_with_access" on public.tournament_participants;
create policy "participants_select_with_access"
on public.tournament_participants
for select
to authenticated
using (public.has_tournament_access(tournament_id));

drop policy if exists "participants_manage_creator_only" on public.tournament_participants;
drop policy if exists "participants_manage_creator_or_editor" on public.tournament_participants;
create policy "participants_manage_creator_or_editor"
on public.tournament_participants
for all
to authenticated
using (public.can_edit_tournament(tournament_id))
with check (public.can_edit_tournament(tournament_id));

-- matches
drop policy if exists "matches_select_member_or_creator" on public.matches;
drop policy if exists "matches_select_with_access" on public.matches;
create policy "matches_select_with_access"
on public.matches
for select
to authenticated
using (public.has_tournament_access(tournament_id));

drop policy if exists "matches_manage_creator_only" on public.matches;
drop policy if exists "matches_manage_creator_or_editor" on public.matches;
create policy "matches_manage_creator_or_editor"
on public.matches
for all
to authenticated
using (public.can_edit_tournament(tournament_id))
with check (public.can_edit_tournament(tournament_id));

-- standings
drop policy if exists "standings_select_member_or_creator" on public.standings;
drop policy if exists "standings_select_with_access" on public.standings;
create policy "standings_select_with_access"
on public.standings
for select
to authenticated
using (public.has_tournament_access(tournament_id));

drop policy if exists "standings_manage_creator_only" on public.standings;
drop policy if exists "standings_manage_creator_or_editor" on public.standings;
create policy "standings_manage_creator_or_editor"
on public.standings
for all
to authenticated
using (public.can_edit_tournament(tournament_id))
with check (public.can_edit_tournament(tournament_id));

-- videos
drop policy if exists "videos_select_member_or_creator" on public.videos;
drop policy if exists "videos_select_with_access" on public.videos;
create policy "videos_select_with_access"
on public.videos
for select
to authenticated
using (public.has_tournament_access(tournament_id));

drop policy if exists "videos_insert_member" on public.videos;
drop policy if exists "videos_insert_with_access" on public.videos;
create policy "videos_insert_with_access"
on public.videos
for insert
to authenticated
with check (
  user_id = public.current_profile_id()
  and public.has_tournament_access(tournament_id)
);

drop policy if exists "videos_update_creator_only" on public.videos;
drop policy if exists "videos_update_creator_or_editor" on public.videos;
create policy "videos_update_creator_or_editor"
on public.videos
for update
to authenticated
using (public.can_edit_tournament(tournament_id))
with check (public.can_edit_tournament(tournament_id));

-- ---------- 6. RPC: claim_tournament_share --------------------------------

-- Allows an authenticated user to self-grant access by presenting a valid
-- share_key. Runs as SECURITY DEFINER so it can INSERT into
-- tournament_collaborators (which would otherwise be blocked by RLS for
-- non-creators).
create or replace function public.claim_tournament_share(p_share_key text)
returns public.tournament_collaborators
language plpgsql
security definer
set search_path = public
as $$
declare
  v_share public.tournament_shares%rowtype;
  v_profile_id uuid;
  v_result public.tournament_collaborators%rowtype;
begin
  v_profile_id := public.current_profile_id();

  if v_profile_id is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select * into v_share
  from public.tournament_shares
  where share_key = p_share_key
    and (expires_at is null or expires_at > now())
  limit 1;

  if v_share.id is null then
    raise exception 'share_not_found' using errcode = '42704';
  end if;

  insert into public.tournament_collaborators (
    tournament_id, user_id, access, granted_via
  )
  values (
    v_share.tournament_id, v_profile_id, v_share.access,
    'share_key:' || p_share_key
  )
  on conflict (tournament_id, user_id) do update set
    -- Upgrade viewer -> editor when a stronger share is claimed.
    -- Never downgrade an existing editor.
    access = case
      when public.tournament_collaborators.access = 'viewer'
        and excluded.access = 'editor'
      then 'editor'
      else public.tournament_collaborators.access
    end,
    updated_at = now()
  returning * into v_result;

  return v_result;
end;
$$;

revoke all on function public.claim_tournament_share(text) from public;
grant execute on function public.claim_tournament_share(text) to authenticated;

-- ---------- 7. Enable Realtime publication --------------------------------

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'tournaments'
  ) then
    alter publication supabase_realtime add table public.tournaments;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'tournament_participants'
  ) then
    alter publication supabase_realtime add table public.tournament_participants;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'matches'
  ) then
    alter publication supabase_realtime add table public.matches;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'standings'
  ) then
    alter publication supabase_realtime add table public.standings;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'videos'
  ) then
    alter publication supabase_realtime add table public.videos;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'tournament_collaborators'
  ) then
    alter publication supabase_realtime add table public.tournament_collaborators;
  end if;
end $$;
