-- ScoreKeeper initial schema

create extension if not exists "pgcrypto";

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
  notes text,
  created_at timestamptz not null default now()
);

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

-- RLS: public read for anon (writes via Next.js service role only)
alter table public.users enable row level security;
alter table public.sports enable row level security;
alter table public.games enable row level security;
alter table public.friendships enable row level security;

create policy "users_select_anon" on public.users for select to anon using (true);
create policy "sports_select_anon" on public.sports for select to anon using (true);
create policy "games_select_anon" on public.games for select to anon using (true);
create policy "friendships_select_anon" on public.friendships for select to anon using (true);
