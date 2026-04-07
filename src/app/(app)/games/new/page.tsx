import { GameForm } from "@/app/(app)/games/new/game-form";
import { getSessionUserId } from "@/lib/auth-server";
import { fetchAllUsersExcept, fetchRecentOpponentsForUser, fetchSports } from "@/lib/queries";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function NewGamePage({
  searchParams,
}: {
  searchParams: Promise<{ sport?: string }>;
}) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/");

  const sp = await searchParams;
  const sports = await fetchSports();
  const [opponents, recentOpponents] = await Promise.all([
    fetchAllUsersExcept(userId),
    fetchRecentOpponentsForUser(userId),
  ]);

  let sportId = sp.sport ?? null;
  if (sports.length > 0) {
    const valid = sportId && sports.some((s) => s.id === sportId);
    if (!valid) {
      sportId = sports[0].id;
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Log game</h1>
      <GameForm sports={sports} opponents={opponents} recentOpponents={recentOpponents} currentUserId={userId} initialSportId={sportId} />
    </div>
  );
}
