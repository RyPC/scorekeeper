import { StatsClient } from "@/app/(app)/stats/stats-client";
import { scoresForUser } from "@/lib/game-stats";
import { getSessionUserId } from "@/lib/auth-server";
import {
  fetchGamesForUser,
  fetchSports,
  fetchUsersByIds,
} from "@/lib/queries";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ sport?: string }>;
}) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/");

  const sp = await searchParams;
  const sports = await fetchSports();

  const rawSport = sp.sport;
  if (
    rawSport &&
    rawSport !== "all" &&
    !sports.some((s) => s.id === rawSport)
  ) {
    redirect("/stats?sport=all");
  }

  const sportId =
    rawSport && rawSport !== "all" ? rawSport : null;

  const games = await fetchGamesForUser(userId, sportId);

  const opponentIds = [
    ...new Set(
      games.map((g) =>
        g.player1_id === userId ? g.player2_id : g.player1_id
      )
    ),
  ];
  const opponents = await fetchUsersByIds(opponentIds);
  const opponentMap = Object.fromEntries(opponents.map((u) => [u.id, u]));

  let wins = 0;
  let losses = 0;
  let ties = 0;
  let pointsFor = 0;
  let pointsAgainst = 0;

  for (const g of games) {
    const s = scoresForUser(g, userId);
    pointsFor += s.mine;
    pointsAgainst += s.theirs;
    if (s.won) wins++;
    else if (s.lost) losses++;
    else ties++;
  }

  const byOpp: Record<
    string,
    { wins: number; losses: number; ties: number; pf: number; pa: number }
  > = {};

  for (const g of games) {
    const oid =
      g.player1_id === userId ? g.player2_id : g.player1_id;
    if (!byOpp[oid]) {
      byOpp[oid] = { wins: 0, losses: 0, ties: 0, pf: 0, pa: 0 };
    }
    const s = scoresForUser(g, userId);
    byOpp[oid].pf += s.mine;
    byOpp[oid].pa += s.theirs;
    if (s.won) byOpp[oid].wins++;
    else if (s.lost) byOpp[oid].losses++;
    else byOpp[oid].ties++;
  }

  let winCum = 0;
  const chartSeries = games.map((g, i) => {
    const s = scoresForUser(g, userId);
    if (s.won) winCum++;
    return {
      index: i + 1,
      label: `G${i + 1}`,
      cumulativeWins: winCum,
      margin: s.mine - s.theirs,
    };
  });

  const byOpponent = Object.entries(byOpp).map(([id, v]) => ({
    opponent: opponentMap[id],
    ...v,
  }));

  return (
    <StatsClient
      sports={sports}
      sportFilter={sportId ?? "all"}
      totals={{
        games: games.length,
        wins,
        losses,
        ties,
        pointsFor,
        pointsAgainst,
      }}
      byOpponent={byOpponent}
      chartSeries={chartSeries}
    />
  );
}
