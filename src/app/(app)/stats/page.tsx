import { StatsClient } from "@/app/(app)/stats/stats-client";
import { getSessionUserId } from "@/lib/auth-server";
import {
  fetchGamesForUser,
  fetchSports,
  fetchUsersByIds,
} from "@/lib/queries";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/");

  const [sports, games] = await Promise.all([
    fetchSports(),
    fetchGamesForUser(userId, null),
  ]);

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
    <StatsClient
      sports={sports}
      games={games}
      userMap={userMap}
      userId={userId}
    />
  );
}
