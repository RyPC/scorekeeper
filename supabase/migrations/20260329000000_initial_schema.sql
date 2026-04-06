-- ScoreKeeper initial schema

create extension if not exists "pgcrypto";

create type public.game_type_players as enum (
  '1v1',
  '2v2',
  '3v3',
  '4v4',
  '5v5'
);

-- users
create table public.users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- sports
create table public.sports (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- games
create table public.games (
  id uuid primary key default gen_random_uuid(),
  sport_id uuid not null references public.sports (id) on delete cascade,
  player1_id uuid not null references public.users (id) on delete cascade,
  player2_id uuid not null references public.users (id) on delete cascade,
  player1_score integer not null,
  player2_score integer not null,
  game_type public.game_type_players not null default '1v1',
  notes text,
  created_at timestamptz not null default now()
);

-- game rosters for team modes
create table public.game_players (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  team smallint not null,
  user_id uuid not null default gen_random_uuid (),
  game_id uuid not null default gen_random_uuid (),
  constraint game_players_pkey primary key (id),
  constraint game_players_game_id_fkey foreign KEY (game_id) references games (id) on update CASCADE on delete CASCADE,
  constraint game_players_user_id_fkey foreign KEY (user_id) references users (id) on update CASCADE on delete CASCADE
) TABLESPACE pg_default;
-- friendships
create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  friend_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, friend_id),
  check (user_id <> friend_id)
);

create index idx_games_sport_id on public.games (sport_id);
create index idx_games_player1_id on public.games (player1_id);
create index idx_games_player2_id on public.games (player2_id);
create index idx_games_created_at on public.games (created_at desc);
create index idx_games_game_type on public.games (game_type);
create index idx_game_players_game_id on public.game_players (game_id);
create index idx_game_players_user_id on public.game_players (user_id);
create index idx_game_players_game_id_team on public.game_players (game_id, team);

create or replace function public.create_team_game(
  p_sport_id uuid,
  p_game_type public.game_type_players,
  p_player1_id uuid,
  p_player2_id uuid,
  p_player1_score integer,
  p_player2_score integer,
  p_notes text,
  p_team1_ids uuid[],
  p_team2_ids uuid[]
)
returns uuid
language plpgsql
as $$
declare
  v_expected_team_size integer;
  v_game_id uuid;
begin
  if p_game_type = '1v1' then
    raise exception 'create_team_game cannot be used for 1v1 games';
  end if;

  v_expected_team_size := case p_game_type
    when '2v2' then 2
    when '3v3' then 3
    when '4v4' then 4
    when '5v5' then 5
    else null
  end;

  if v_expected_team_size is null then
    raise exception 'Unsupported game type: %', p_game_type;
  end if;

  if coalesce(array_length(p_team1_ids, 1), 0) <> v_expected_team_size then
    raise exception 'Team 1 must contain exactly % players', v_expected_team_size;
  end if;

  if coalesce(array_length(p_team2_ids, 1), 0) <> v_expected_team_size then
    raise exception 'Team 2 must contain exactly % players', v_expected_team_size;
  end if;

  if p_team1_ids[1] is distinct from p_player1_id then
    raise exception 'Team 1 captain must be the first Team 1 player';
  end if;

  if p_team2_ids[1] is distinct from p_player2_id then
    raise exception 'Team 2 captain must be the first Team 2 player';
  end if;

  if exists (
    select 1
    from (
      select unnest(p_team1_ids) as user_id
      union all
      select unnest(p_team2_ids) as user_id
    ) players
    group by user_id
    having count(*) > 1
  ) then
    raise exception 'A player cannot be on both teams or appear twice';
  end if;

  insert into public.games (
    sport_id,
    game_type,
    player1_id,
    player2_id,
    player1_score,
    player2_score,
    notes
  )
  values (
    p_sport_id,
    p_game_type,
    p_player1_id,
    p_player2_id,
    p_player1_score,
    p_player2_score,
    p_notes
  )
  returning id into v_game_id;

  insert into public.game_players (game_id, user_id, team)
  select v_game_id, unnest(p_team1_ids), 1
  union all
  select v_game_id, unnest(p_team2_ids), 2;

  return v_game_id;
end;
$$;

-- RLS: public read for anon (writes via Next.js service role only)
alter table public.users enable row level security;
alter table public.sports enable row level security;
alter table public.games enable row level security;
alter table public.game_players enable row level security;
alter table public.friendships enable row level security;

create policy "users_select_anon" on public.users for select to anon using (true);
create policy "sports_select_anon" on public.sports for select to anon using (true);
create policy "games_select_anon" on public.games for select to anon using (true);
create policy "game_players_select_anon" on public.game_players for select to anon using (true);
create policy "friendships_select_anon" on public.friendships for select to anon using (true);
