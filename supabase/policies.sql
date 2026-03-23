alter table public.users enable row level security;
alter table public.tournaments enable row level security;
alter table public.tournament_participants enable row level security;
alter table public.matches enable row level security;
alter table public.standings enable row level security;
alter table public.match_results enable row level security;
alter table public.videos enable row level security;
alter table public.trophies enable row level security;

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

drop policy if exists "tournaments_select_member_or_creator" on public.tournaments;
create policy "tournaments_select_member_or_creator"
on public.tournaments
for select
to authenticated
using (
  public.is_tournament_creator(id)
  or public.is_tournament_member(id)
);

drop policy if exists "tournaments_insert_authenticated" on public.tournaments;
create policy "tournaments_insert_authenticated"
on public.tournaments
for insert
to authenticated
with check (creator_id = public.current_profile_id());

drop policy if exists "tournaments_update_creator_only" on public.tournaments;
create policy "tournaments_update_creator_only"
on public.tournaments
for update
to authenticated
using (public.is_tournament_creator(id))
with check (public.is_tournament_creator(id));

drop policy if exists "participants_select_member_or_creator" on public.tournament_participants;
create policy "participants_select_member_or_creator"
on public.tournament_participants
for select
to authenticated
using (
  public.is_tournament_creator(tournament_id)
  or public.is_tournament_member(tournament_id)
);

drop policy if exists "participants_manage_creator_only" on public.tournament_participants;
create policy "participants_manage_creator_only"
on public.tournament_participants
for all
to authenticated
using (public.is_tournament_creator(tournament_id))
with check (public.is_tournament_creator(tournament_id));

drop policy if exists "matches_select_member_or_creator" on public.matches;
create policy "matches_select_member_or_creator"
on public.matches
for select
to authenticated
using (
  public.is_tournament_creator(tournament_id)
  or public.is_tournament_member(tournament_id)
);

drop policy if exists "matches_manage_creator_only" on public.matches;
create policy "matches_manage_creator_only"
on public.matches
for all
to authenticated
using (public.is_tournament_creator(tournament_id))
with check (public.is_tournament_creator(tournament_id));

drop policy if exists "standings_select_member_or_creator" on public.standings;
create policy "standings_select_member_or_creator"
on public.standings
for select
to authenticated
using (
  public.is_tournament_creator(tournament_id)
  or public.is_tournament_member(tournament_id)
);

drop policy if exists "standings_manage_creator_only" on public.standings;
create policy "standings_manage_creator_only"
on public.standings
for all
to authenticated
using (public.is_tournament_creator(tournament_id))
with check (public.is_tournament_creator(tournament_id));

drop policy if exists "match_results_select_member_or_creator" on public.match_results;
create policy "match_results_select_member_or_creator"
on public.match_results
for select
to authenticated
using (
  exists (
    select 1
    from public.matches m
    where m.id = match_id
      and (
        public.is_tournament_creator(m.tournament_id)
        or public.is_tournament_member(m.tournament_id)
      )
  )
);

drop policy if exists "match_results_insert_participant" on public.match_results;
create policy "match_results_insert_participant"
on public.match_results
for insert
to authenticated
with check (
  submitted_by_user_id = public.current_profile_id()
  and exists (
    select 1
    from public.matches m
    join public.tournament_participants home_participant on home_participant.id = m.home_participant_id
    join public.tournament_participants away_participant on away_participant.id = m.away_participant_id
    where m.id = match_id
      and (
        home_participant.user_id = public.current_profile_id()
        or away_participant.user_id = public.current_profile_id()
      )
  )
);

drop policy if exists "match_results_update_creator_only" on public.match_results;
create policy "match_results_update_creator_only"
on public.match_results
for update
to authenticated
using (
  exists (
    select 1
    from public.matches m
    where m.id = match_id
      and public.is_tournament_creator(m.tournament_id)
  )
)
with check (
  exists (
    select 1
    from public.matches m
    where m.id = match_id
      and public.is_tournament_creator(m.tournament_id)
  )
);

drop policy if exists "videos_select_member_or_creator" on public.videos;
create policy "videos_select_member_or_creator"
on public.videos
for select
to authenticated
using (
  public.is_tournament_creator(tournament_id)
  or public.is_tournament_member(tournament_id)
);

drop policy if exists "videos_insert_member" on public.videos;
create policy "videos_insert_member"
on public.videos
for insert
to authenticated
with check (
  user_id = public.current_profile_id()
  and public.is_tournament_member(tournament_id)
);

drop policy if exists "videos_update_creator_only" on public.videos;
create policy "videos_update_creator_only"
on public.videos
for update
to authenticated
using (public.is_tournament_creator(tournament_id))
with check (public.is_tournament_creator(tournament_id));

drop policy if exists "trophies_select_authenticated" on public.trophies;
create policy "trophies_select_authenticated"
on public.trophies
for select
to authenticated
using (true);

drop policy if exists "trophies_manage_creator_only" on public.trophies;
create policy "trophies_manage_creator_only"
on public.trophies
for all
to authenticated
using (
  tournament_id is not null
  and public.is_tournament_creator(tournament_id)
)
with check (
  tournament_id is not null
  and public.is_tournament_creator(tournament_id)
);
