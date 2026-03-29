import { DashboardClient } from "@/app/(app)/dashboard/dashboard-client";
import { scoresForUser, type GameRow } from "@/lib/game-stats";
import { getSessionUserId } from "@/lib/auth-server";
import {
  fetchFriendsForUser,
  fetchGamesForUserSport,
  fetchSports,
  fetchUsersByIds,
} from "@/lib/queries";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ sport?: string }>;
}) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/");

  const sp = await searchParams;
  const sb = createServiceClient();

  const { data: me } = await sb.from("users").select("*").eq("id", userId).single();
  if (!me) {
    redirect("/");
  }

  const sports = await fetchSports();

  if (sports.length > 0) {
    const valid = sp.sport && sports.some((s) => s.id === sp.sport);
    if (!valid) {
      redirect(`/dashboard?sport=${sports[0].id}`);
    }
  }

  const sportId =
    sp.sport && sports.some((s) => s.id === sp.sport)
      ? sp.sport
      : sports[0]?.id ?? null;

  let games: GameRow[] = [];
  if (sportId) {
    games = await fetchGamesForUserSport(userId, sportId);
  }

  const opponentIds = [
    ...new Set(
      games.map((g) => (g.player1_id === userId ? g.player2_id : g.player1_id))
    ),
  ];
  const opponents = await fetchUsersByIds(opponentIds);
  const opponentMap = Object.fromEntries(opponents.map((u) => [u.id, u]));

  const friends = await fetchFriendsForUser(userId);

  const headToHead = friends.map((f) => {
    let wins = 0;
    let losses = 0;
    for (const g of games) {
      const other = g.player1_id === userId ? g.player2_id : g.player1_id;
      if (other !== f.id) continue;
      const s = scoresForUser(g, userId);
      if (s.won) wins++;
      else if (s.lost) losses++;
    }
    return { friend: f, wins, losses, played: wins + losses };
  });

  return (
    <DashboardClient
      currentUser={me}
      sports={sports}
      sportId={sportId}
      games={games}
      opponentMap={opponentMap}
      headToHead={headToHead}
    />
  );
}
