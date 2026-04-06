import { PlayerClient } from "@/app/(app)/players/[id]/player-client";
import { getSessionUserId } from "@/lib/auth-server";
import { fetchGamesVsFriend, fetchSports } from "@/lib/queries";
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

  return (
    <PlayerClient
      opponent={opponent}
      currentUserId={userId}
      allGames={games}
      sportMap={sportMap}
    />
  );
}
