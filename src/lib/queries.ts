import type { GameRow } from "@/lib/game-stats";
import { createServiceClient } from "@/lib/supabase/service";

export async function fetchSports() {
  const sb = createServiceClient();
  const { data } = await sb.from("sports").select("*").order("name");
  return data ?? [];
}

export async function fetchGamesForUserSport(userId: string, sportId: string) {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("games")
    .select("*")
    .eq("sport_id", sportId)
    .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error(error);
    return [] as GameRow[];
  }
  return (data ?? []) as GameRow[];
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

/** All games for a user, optionally filtered by sport (null = every sport). */
export async function fetchGamesForUser(userId: string, sportId: string | null) {
  const sb = createServiceClient();
  let q = sb
    .from("games")
    .select("*")
    .or(`player1_id.eq.${userId},player2_id.eq.${userId}`);
  if (sportId) {
    q = q.eq("sport_id", sportId);
  }
  const { data, error } = await q.order("created_at", { ascending: true });
  if (error) {
    console.error(error);
    return [] as GameRow[];
  }
  return (data ?? []) as GameRow[];
}
