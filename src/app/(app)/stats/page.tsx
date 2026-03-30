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

  const opponentIds = [
    ...new Set(
      games.map((g) => (g.player1_id === userId ? g.player2_id : g.player1_id))
    ),
  ];
  const opponents = await fetchUsersByIds(opponentIds);
  const opponentMap = Object.fromEntries(opponents.map((u) => [u.id, u]));

  return (
    <StatsClient
      sports={sports}
      games={games}
      opponentMap={opponentMap}
      userId={userId}
    />
  );
}
