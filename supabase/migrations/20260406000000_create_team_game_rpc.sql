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
