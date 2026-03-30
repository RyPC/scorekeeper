import { PlayerClient } from "@/app/(app)/players/[id]/player-client";
import { getSessionUserId } from "@/lib/auth-server";
import { scoresForUser } from "@/lib/game-stats";
import { fetchGamesVsFriend, fetchSports, fetchUsersByIds } from "@/lib/queries";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect, notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/");

  const { id: opponentId } = await params;
  if (opponentId === userId) redirect("/dashboard");

  const sb = createServiceClient();
  const [{ data: opponent }, games, sports] = await Promise.all([
    sb.from("users").select("id, username, avatar_url").eq("id", opponentId).single(),
    fetchGamesVsFriend(userId, opponentId),
    fetchSports(),
  ]);

  if (!opponent) notFound();

  const sportMap = Object.fromEntries(sports.map((s) => [s.id, s.name]));

  let wins = 0, losses = 0, ties = 0;
  const bySportMap: Record<string, { name: string; wins: number; losses: number; ties: number }> = {};

  for (const g of games) {
    const s = scoresForUser(g, userId);
    if (s.won) wins++;
    else if (s.lost) losses++;
    else ties++;

    const sportName = sportMap[g.sport_id] ?? "Unknown";
    if (!bySportMap[g.sport_id]) {
      bySportMap[g.sport_id] = { name: sportName, wins: 0, losses: 0, ties: 0 };
    }
    if (s.won) bySportMap[g.sport_id].wins++;
    else if (s.lost) bySportMap[g.sport_id].losses++;
    else bySportMap[g.sport_id].ties++;
  }

  const bySport = Object.values(bySportMap).sort(
    (a, b) => (b.wins + b.losses + b.ties) - (a.wins + a.losses + a.ties)
  );

  const recentGames = [...games]
    .reverse()
    .slice(0, 20)
    .map((g) => {
      const s = scoresForUser(g, userId);
      return {
        id: g.id,
        sportName: sportMap[g.sport_id] ?? "Unknown",
        createdAt: g.created_at,
        myScore: s.mine,
        theirScore: s.theirs,
        result: s.won ? ("W" as const) : s.lost ? ("L" as const) : ("T" as const),
        notes: g.notes ?? null,
      };
    });

  const chartGames = games.map((g) => {
    const s = scoresForUser(g, userId);
    return {
      id: g.id,
      createdAt: g.created_at,
      myScore: s.mine,
      theirScore: s.theirs,
      result: s.won ? ("W" as const) : s.lost ? ("L" as const) : ("T" as const),
    };
  });

  return (
    <PlayerClient
      opponent={opponent}
      record={{ wins, losses, ties }}
      bySport={bySport}
      recentGames={recentGames}
      chartGames={chartGames}
    />
  );
}
