import { GameForm } from "@/app/(app)/games/new/game-form";
import { getSessionUserId } from "@/lib/auth-server";
import { fetchAllUsersExcept, fetchSports } from "@/lib/queries";
import Link from "next/link";
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
          <span className="text-foreground">Opponent</span> can be{" "}
          <strong className="font-medium text-foreground">anyone with an account</strong>—you
          don&apos;t have to add them as a friend first.{" "}
          <span className="text-foreground">Friends</span> are for your home screen
          shortcuts and head-to-head summaries. You are always player one. Manage
          friends on{" "}
          <Link href="/friends" className="text-primary underline underline-offset-2">
            Friends
          </Link>
          .
        </p>
      </div>
      <GameForm
        sports={sports}
        opponents={opponents}
        currentUserId={userId}
        initialSportId={sportId}
      />
    </div>
  );
}
