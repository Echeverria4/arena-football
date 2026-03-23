insert into public.users (
  id,
  auth_user_id,
  name,
  whatsapp_name,
  whatsapp_number,
  email,
  gamertag,
  favorite_team,
  role
) values
  (
    '11111111-1111-1111-1111-111111111111',
    null,
    'Matheus',
    'Matheus Arena',
    '+5511999990000',
    'matheus@arena.com',
    'ArenaLegend',
    'Barcelona',
    'organizer'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    null,
    'Bruno',
    'Bruno eFootball',
    '+5511988880000',
    'bruno@arena.com',
    'B10Master',
    'Manchester City',
    'player'
  )
on conflict (id) do nothing;

insert into public.tournaments (
  id,
  name,
  format,
  status,
  rules,
  creator_id,
  start_date,
  allow_videos,
  allow_goal_award
) values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Arena Football Master Series',
  'groups_knockout',
  'in_progress',
  'Mandante cria a sala. Resultados finais podem ser corrigidos apenas pelo criador.',
  '11111111-1111-1111-1111-111111111111',
  '2026-04-04',
  true,
  true
)
on conflict (id) do nothing;

insert into public.tournament_participants (
  id,
  tournament_id,
  user_id,
  team_name,
  group_name,
  is_organizer
) values
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    'Barcelona',
    'Grupo A',
    true
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '22222222-2222-2222-2222-222222222222',
    'Manchester City',
    'Grupo A',
    false
  )
on conflict (tournament_id, user_id) do nothing;

insert into public.matches (
  id,
  tournament_id,
  round,
  phase,
  home_participant_id,
  away_participant_id,
  deadline_at,
  status
) values (
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  1,
  'Fase de grupos',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
  '2026-04-06 23:59:00+00',
  'pending'
)
on conflict (id) do nothing;

insert into public.standings (
  id,
  tournament_id,
  participant_id,
  played,
  points,
  wins,
  draws,
  losses,
  goals_for,
  goals_against,
  goal_difference
) values
  (
    'dddddddd-dddd-dddd-dddd-ddddddddddd1',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    0, 0, 0, 0, 0, 0, 0, 0
  ),
  (
    'dddddddd-dddd-dddd-dddd-ddddddddddd2',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
    0, 0, 0, 0, 0, 0, 0, 0
  )
on conflict (tournament_id, participant_id) do nothing;

insert into public.videos (
  id,
  tournament_id,
  match_id,
  user_id,
  title,
  description,
  video_url,
  approval_status,
  votes_count,
  is_goal_award_winner
) values (
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  '22222222-2222-2222-2222-222222222222',
  'Chute colocado no angulo',
  'Gol enviado para o concurso do lance mais bonito.',
  'https://example.com/video.mp4',
  'approved',
  18,
  false
)
on conflict (id) do nothing;

insert into public.trophies (
  id,
  tournament_id,
  user_id,
  category,
  title
) values (
  'ffffffff-ffff-ffff-ffff-ffffffffffff',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  'champion',
  'Campeao da Summer Cup 2025'
)
on conflict (id) do nothing;
