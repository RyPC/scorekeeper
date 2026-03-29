import { FriendsClient } from "@/app/(app)/friends/friends-client";
import { getSessionUserId } from "@/lib/auth-server";
import { fetchAllUsersExcept, fetchFriendsForUser } from "@/lib/queries";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function FriendsPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/");

  const friends = await fetchFriendsForUser(userId);
  const others = await fetchAllUsersExcept(userId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Friends</h1>
        <p className="mt-1 text-sm text-muted">
          Manage who you can pick as an opponent.
        </p>
      </div>
      <FriendsClient friends={friends} otherUsers={others} />
    </div>
  );
}
