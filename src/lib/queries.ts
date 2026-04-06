import { areOpponentsInGame, type GameRow } from "@/lib/game-stats";
import { createServiceClient } from "@/lib/supabase/service";

export async function fetchSports() {
  const sb = createServiceClient();
  const { data } = await sb.from("sports").select("*").order("name");
  return data ?? [];
}

/** Shapes a raw Supabase game row (with nested game_players) into GameRow. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toGameRow(raw: any): GameRow {
  const { game_players, ...rest } = raw;
  const gp = Array.isArray(game_players) ? game_players : undefined;
  return {
    ...rest,
    game_type: rest.game_type ?? "1v1",
    // Empty array is truthy in JS; treat as missing so team logic falls back to captains.
    game_players: gp && gp.length > 0 ? gp : undefined,
  } as GameRow;
}

const IN_CHUNK = 120;

/**
 * Game IDs where the user appears as player1/2 (captain or 1v1) or on the `game_players` roster.
 * Team games list non-captains only in `game_players`, so captain-only filters miss them.
 */
async function collectGameIdsForUser(
  sb: ReturnType<typeof createServiceClient>,
  userId: string,
  sportId: string | null
): Promise<string[]> {
  const ids = new Set<string>();

  let capQ = sb.from("games").select("id").or(`player1_id.eq.${userId},player2_id.eq.${userId}`);
  if (sportId) capQ = capQ.eq("sport_id", sportId);
  const { data: capRows, error: capErr } = await capQ;
  if (capErr) console.error(capErr);
  for (const row of capRows ?? []) ids.add(row.id);

  const { data: rosterRows, error: rosterErr } = await sb
    .from("game_players")
    .select("game_id")
    .eq("user_id", userId);
  if (rosterErr) console.error(rosterErr);

  let rosterGameIds = [...new Set((rosterRows ?? []).map((r) => r.game_id))];

  if (sportId && rosterGameIds.length > 0) {
    const inSport: string[] = [];
    for (let i = 0; i < rosterGameIds.length; i += IN_CHUNK) {
      const chunk = rosterGameIds.slice(i, i + IN_CHUNK);
      const { data: rows, error: fErr } = await sb
        .from("games")
        .select("id")
        .in("id", chunk)
        .eq("sport_id", sportId);
      if (fErr) console.error(fErr);
      for (const r of rows ?? []) inSport.push(r.id);
    }
    rosterGameIds = inSport;
  }

  for (const id of rosterGameIds) ids.add(id);

  return [...ids];
}

async function fetchGamesByIdsOrdered(
  sb: ReturnType<typeof createServiceClient>,
  ids: string[],
  ascending: boolean
): Promise<GameRow[]> {
  if (ids.length === 0) return [];
  const rows: GameRow[] = [];
  for (let i = 0; i < ids.length; i += IN_CHUNK) {
    const chunk = ids.slice(i, i + IN_CHUNK);
    const { data, error } = await sb.from("games").select("*, game_players(*)").in("id", chunk);
    if (error) {
      console.error(error);
      continue;
    }
    rows.push(...(data ?? []).map(toGameRow));
  }
  const byId = new Map<string, GameRow>();
  for (const g of rows) {
    byId.set(g.id, g);
  }
  const deduped = [...byId.values()];
  deduped.sort((a, b) => {
    const ta = new Date(a.created_at).getTime();
    const tb = new Date(b.created_at).getTime();
    return ascending ? ta - tb : tb - ta;
  });
  return deduped;
}

export async function fetchGamesForUserSport(userId: string, sportId: string) {
  const sb = createServiceClient();
  const ids = await collectGameIdsForUser(sb, userId, sportId);
  if (ids.length === 0) return [] as GameRow[];
  const rows = await fetchGamesByIdsOrdered(sb, ids, false);
  return rows.slice(0, 20);
}

export async function fetchUsersByIds(ids: string[]) {
  if (ids.length === 0) return [];
  const sb = createServiceClient();
  const { data } = await sb.from("users").select("*").in("id", ids);
  return data ?? [];
}

/**
 * Friends in either direction: rows you created (you → them) or they created (them → you).
 */
export async function fetchFriendsForUser(userId: string) {
  const sb = createServiceClient();

  const { data: outgoing } = await sb
    .from("friendships")
    .select("friend_id")
    .eq("user_id", userId);

  const { data: incoming } = await sb
    .from("friendships")
    .select("user_id")
    .eq("friend_id", userId);

  const friendIds = new Set<string>();
  for (const row of outgoing ?? []) {
    friendIds.add(row.friend_id);
  }
  for (const row of incoming ?? []) {
    friendIds.add(row.user_id);
  }

  const ids = [...friendIds];
  if (ids.length === 0) return [];
  return fetchUsersByIds(ids);
}

export async function fetchAllUsersExcept(userId: string) {
  const sb = createServiceClient();
  const { data } = await sb.from("users").select("*").order("username");
  return (data ?? []).filter((u) => u.id !== userId);
}

/** All games where both users faced each other (1v1 or opposing teams), chronological. */
export async function fetchGamesVsFriend(
  userId: string,
  friendId: string
): Promise<GameRow[]> {
  const sb = createServiceClient();
  const ids = await collectGameIdsForUser(sb, userId, null);
  if (ids.length === 0) return [];
  const rows = await fetchGamesByIdsOrdered(sb, ids, true);
  return rows.filter((g) => areOpponentsInGame(g, userId, friendId));
}

/** All games for a user, optionally filtered by sport (null = every sport). */
export async function fetchGamesForUser(userId: string, sportId: string | null) {
  const sb = createServiceClient();
  const ids = await collectGameIdsForUser(sb, userId, sportId);
  if (ids.length === 0) return [] as GameRow[];
  return fetchGamesByIdsOrdered(sb, ids, true);
}
