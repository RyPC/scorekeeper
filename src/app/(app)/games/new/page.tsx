import { GameForm } from "@/app/(app)/games/new/game-form";
import { getSessionUserId } from "@/lib/auth-server";
import { fetchAllUsersExcept, fetchSports } from "@/lib/queries";
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
  const opponents = await fetchAllUsersExcept(userId);

  let sportId = sp.sport ?? null;
  if (sports.length > 0) {
    const valid = sportId && sports.some((s) => s.id === sportId);
    if (!valid) {
      sportId = sports[0].id;
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Log game</h1>
        <p className="mt-1 text-sm text-muted">
          Pick anyone with an account. You are always player one. Add people on{" "}
          <a href="/friends" className="text-primary underline">
            Friends
          </a>{" "}
          to highlight them on your dashboard.
        </p>
      </div>
      <GameForm sports={sports} opponents={opponents} initialSportId={sportId} />
    </div>
  );
}
