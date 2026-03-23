create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('player', 'organizer', 'admin');
  end if;

  if not exists (select 1 from pg_type where typname = 'tournament_format') then
    create type public.tournament_format as enum ('league', 'groups', 'knockout', 'groups_knockout');
  end if;

  if not exists (select 1 from pg_type where typname = 'tournament_status') then
    create type public.tournament_status as enum ('draft', 'open', 'in_progress', 'finished');
  end if;

  if not exists (select 1 from pg_type where typname = 'match_status') then
    create type public.match_status as enum ('pending', 'in_progress', 'finished');
  end if;

  if not exists (select 1 from pg_type where typname = 'video_approval_status') then
    create type public.video_approval_status as enum ('pending', 'approved', 'rejected');
  end if;

  if not exists (select 1 from pg_type where typname = 'trophy_category') then
    create type public.trophy_category as enum (
      'champion',
      'runner_up',
      'top_scorer',
      'best_defense',
      'best_goal',
      'highlight_organizer',
      'win_streak'
    );
  end if;
end $$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  name text not null,
  whatsapp_name text not null,
  whatsapp_number text not null,
  email text not null unique,
  avatar_url text,
  gamertag text,
  favorite_team text,
  role public.app_role not null default 'player',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cover_url text,
  format public.tournament_format not null,
  status public.tournament_status not null default 'draft',
  rules text,
  creator_id uuid not null references public.users(id) on delete cascade,
  start_date date,
  allow_videos boolean not null default false,
  allow_goal_award boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tournament_participants (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  team_name text not null,
  team_badge_url text,
  stadium_image_url text,
  group_name text,
  is_organizer boolean not null default false,
  created_at timestamptz not null default now(),
  unique (tournament_id, user_id)
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  round integer not null,
  phase text not null,
  home_participant_id uuid not null references public.tournament_participants(id) on delete cascade,
  away_participant_id uuid not null references public.tournament_participants(id) on delete cascade,
  home_goals integer,
  away_goals integer,
  room_creator_participant_id uuid references public.tournament_participants(id),
  deadline_at timestamptz,
  status public.match_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint matches_distinct_participants check (home_participant_id <> away_participant_id)
);

create table if not exists public.standings (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  participant_id uuid not null references public.tournament_participants(id) on delete cascade,
  played integer not null default 0,
  points integer not null default 0,
  wins integer not null default 0,
  draws integer not null default 0,
  losses integer not null default 0,
  goals_for integer not null default 0,
  goals_against integer not null default 0,
  goal_difference integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (tournament_id, participant_id)
);

create table if not exists public.match_results (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  submitted_by_user_id uuid not null references public.users(id) on delete cascade,
  home_goals integer not null,
  away_goals integer not null,
  approved_by_creator boolean not null default false,
  submitted_at timestamptz not null default now()
);

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  match_id uuid references public.matches(id) on delete set null,
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text,
  video_url text not null,
  thumbnail_url text,
  approval_status public.video_approval_status not null default 'pending',
  votes_count integer not null default 0,
  is_goal_award_winner boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.trophies (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references public.tournaments(id) on delete set null,
  user_id uuid not null references public.users(id) on delete cascade,
  category public.trophy_category not null,
  title text not null,
  image_url text,
  awarded_at timestamptz not null default now()
);

create or replace function public.current_profile_id()
returns uuid
language sql
stable
as $$
  select u.id
  from public.users u
  where u.auth_user_id = auth.uid()
  limit 1
$$;

create or replace function public.is_tournament_creator(target_tournament_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.tournaments t
    where t.id = target_tournament_id
      and t.creator_id = public.current_profile_id()
  )
$$;

create or replace function public.is_tournament_member(target_tournament_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.tournament_participants tp
    where tp.tournament_id = target_tournament_id
      and tp.user_id = public.current_profile_id()
  )
$$;

create or replace function public.set_match_room_creator()
returns trigger
language plpgsql
as $$
begin
  if new.room_creator_participant_id is null then
    new.room_creator_participant_id = new.home_participant_id;
  end if;

  return new;
end;
$$;

drop trigger if exists users_touch_updated_at on public.users;
create trigger users_touch_updated_at
before update on public.users
for each row execute function public.touch_updated_at();

drop trigger if exists tournaments_touch_updated_at on public.tournaments;
create trigger tournaments_touch_updated_at
before update on public.tournaments
for each row execute function public.touch_updated_at();

drop trigger if exists matches_touch_updated_at on public.matches;
create trigger matches_touch_updated_at
before update on public.matches
for each row execute function public.touch_updated_at();

drop trigger if exists matches_set_room_creator on public.matches;
create trigger matches_set_room_creator
before insert or update on public.matches
for each row execute function public.set_match_room_creator();

create index if not exists idx_tournaments_creator_id on public.tournaments (creator_id);
create index if not exists idx_tournament_participants_tournament_id on public.tournament_participants (tournament_id);
create index if not exists idx_matches_tournament_id on public.matches (tournament_id);
create index if not exists idx_match_results_match_id on public.match_results (match_id);
create index if not exists idx_videos_tournament_id on public.videos (tournament_id);
create index if not exists idx_trophies_user_id on public.trophies (user_id);
