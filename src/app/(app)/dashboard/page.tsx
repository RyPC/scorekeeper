import { DashboardClient } from "@/app/(app)/dashboard/dashboard-client";
import { getSessionUserId } from "@/lib/auth-server";
import {
  fetchFriendsForUser,
  fetchGamesForUser,
  fetchSports,
  fetchUsersByIds,
} from "@/lib/queries";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/");

  const sb = createServiceClient();
  const { data: me } = await sb.from("users").select("*").eq("id", userId).single();
  if (!me) redirect("/");

  const [sports, games, friends] = await Promise.all([
    fetchSports(),
    fetchGamesForUser(userId, null),
    fetchFriendsForUser(userId),
  ]);

  const opponentIds = [
    ...new Set(
      games.map((g) => (g.player1_id === userId ? g.player2_id : g.player1_id))
    ),
  ];
  const opponents = await fetchUsersByIds(opponentIds);
  const opponentMap = Object.fromEntries(opponents.map((u) => [u.id, u]));

  return (
    <DashboardClient
      currentUser={me}
      sports={sports}
      games={games}
      opponentMap={opponentMap}
      friends={friends}
    />
  );
}
