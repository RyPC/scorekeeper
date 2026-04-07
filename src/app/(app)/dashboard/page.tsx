import { DashboardClient } from "@/app/(app)/dashboard/dashboard-client";
import { getSessionUserId } from "@/lib/auth-server";
import {
  fetchAllGames,
  fetchFriendsForUser,
  fetchGamesForUser,
  fetchSports,
  fetchUsersByIds,
} from "@/lib/queries";
import {
  calculateRatingChangesForPlayer,
  calculateRatings,
  getPlayerRating,
  parseSportGameTypeKey,
} from "@/lib/ratings";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/");

  const sb = createServiceClient();
  const { data: me } = await sb.from("users").select("*").eq("id", userId).single();
  if (!me) redirect("/");

  const [sports, games, friends, allGames] = await Promise.all([
    fetchSports(),
    fetchGamesForUser(userId, null),
    fetchFriendsForUser(userId),
    fetchAllGames(),
  ]);

  const sportMap = Object.fromEntries(sports.map((sport) => [sport.id, sport.name]));
  const ratings = calculateRatings(allGames);
  const ratingChanges = calculateRatingChangesForPlayer(allGames, userId);
  const overallRating = getPlayerRating(ratings.overall, userId);
  const bestMode = Object.entries(ratings.bySportGameType)
    .map(([key, table]) => {
      const { sportId, gameType } = parseSportGameTypeKey(key);
      return {
        sportId,
        sportName: sportMap[sportId] ?? "Unknown",
        gameType,
        ...getPlayerRating(table, userId),
      };
    })
    .filter((entry) => entry.games > 0)
    .sort((a, b) => b.rating - a.rating)[0] ?? null;

  const playerIdSet = new Set<string>();
  for (const g of games) {
    playerIdSet.add(g.player1_id);
    playerIdSet.add(g.player2_id);
    if (g.game_players) {
      for (const p of g.game_players) {
        playerIdSet.add(p.user_id);
      }
    }
  }
  const players = await fetchUsersByIds([...playerIdSet]);
  const userMap = Object.fromEntries(players.map((u) => [u.id, u]));

  return (
    <DashboardClient
      currentUser={me}
      sports={sports}
      games={games}
      userMap={userMap}
      friends={friends}
      overallRating={overallRating}
      bestMode={bestMode}
      ratingChanges={ratingChanges}
    />
  );
}
