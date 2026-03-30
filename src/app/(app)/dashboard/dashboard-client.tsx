"use client";

import { FriendH2HModal } from "@/components/FriendH2HModal";
import { UserAvatar } from "@/components/UserAvatar";
import { scoresForUser, type GameRow } from "@/lib/game-stats";
import { format } from "date-fns";
import Link from "next/link";
import { useMemo, useState } from "react";

type UserRow = {
  id: string;
  username: string;
  avatar_url: string | null;
};

type Props = {
  currentUser: UserRow;
  sports: { id: string; name: string; created_at: string }[];
  games: GameRow[];
  opponentMap: Record<string, UserRow>;
  friends: UserRow[];
};

export function DashboardClient({
  currentUser,
  sports,
  games,
  opponentMap,
  friends,
}: Props) {
  const [h2hFriend, setH2hFriend] = useState<UserRow | null>(null);

  // Sports that have at least one game
  const sportsWithGames = useMemo(() => {
    const sportIdsWithGames = new Set(games.map((g) => g.sport_id));
    return sports.filter((s) => sportIdsWithGames.has(s.id));
  }, [sports, games]);

  const [selectedSportId, setSelectedSportId] = useState<string | null>(
    () => sportsWithGames[0]?.id ?? null
  );

  // Keep selectedSportId valid if sportsWithGames changes
  const activeSportId =
    selectedSportId && sportsWithGames.some((s) => s.id === selectedSportId)
      ? selectedSportId
      : sportsWithGames[0]?.id ?? null;

  const currentSportName = useMemo(
    () => sports.find((s) => s.id === activeSportId)?.name ?? null,
    [sports, activeSportId]
  );

  const filteredGames = useMemo(
    () => (activeSportId ? games.filter((g) => g.sport_id === activeSportId) : games),
    [games, activeSportId]
  );

  const headToHead = useMemo(() => {
    return friends
      .map((f) => {
        let wins = 0;
        let losses = 0;
        for (const g of filteredGames) {
          const other = g.player1_id === currentUser.id ? g.player2_id : g.player1_id;
          if (other !== f.id) continue;
          const s = scoresForUser(g, currentUser.id);
          if (s.won) wins++;
          else if (s.lost) losses++;
        }
        return { friend: f, wins, losses, played: wins + losses };
      })
      .filter((h) => h.played > 0);
  }, [friends, filteredGames, currentUser.id]);

  const recentGames = filteredGames.slice(0, 10);

  return (
    <div className="flex flex-col gap-10">
      <section className="overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-card via-card to-primary/[0.07] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
        {/* User header */}
        <div className="flex min-w-0 gap-4">
          <UserAvatar
            username={currentUser.username}
            avatarUrl={currentUser.avatar_url}
            size="lg"
          />
          <div className="min-w-0">
            <p className="text-sm text-muted">Welcome back</p>
            <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-foreground">
              {currentUser.username}
            </h1>
          </div>
        </div>

        {/* Sport slider + Head-to-head */}
        <div className="mt-5 border-t border-white/10 pt-5">
          {sportsWithGames.length > 0 ? (
            <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none">
              {sportsWithGames.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedSportId(s.id)}
                  className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                    activeSportId === s.id
                      ? "bg-primary text-[#121212]"
                      : "border border-white/15 text-muted hover:border-white/30 hover:text-foreground"
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          ) : null}

          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Head-to-head{currentSportName ? ` · ${currentSportName}` : ""}
          </p>

          {headToHead.length === 0 ? (
            <p className="mt-3 text-sm text-muted">
              {friends.length === 0
                ? "Add friends to see your records against them."
                : sportsWithGames.length === 0
                  ? "Log a game to see head-to-head records."
                  : "No games against friends in this sport yet."}
            </p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {headToHead.map(({ friend, wins, losses, played }) => {
                const winRate = wins / played;
                return (
                  <li key={friend.id}>
                    <button
                      type="button"
                      onClick={() => setH2hFriend(friend)}
                      className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-background/50 px-3 py-3 text-left transition hover:border-white/20 hover:bg-white/5 active:scale-[0.99]"
                    >
                      <UserAvatar
                        username={friend.username}
                        avatarUrl={friend.avatar_url}
                        size="sm"
                      />
                      <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                        {friend.username}
                      </span>
                      <div className="flex items-center gap-3">
                        <div className="flex items-baseline gap-1 tabular-nums">
                          <span className="text-lg font-bold text-emerald-400">{wins}</span>
                          <span className="text-xs text-muted">–</span>
                          <span className="text-lg font-bold text-rose-400">{losses}</span>
                        </div>
                        <div className="hidden w-14 sm:block">
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                            <div
                              className="h-full rounded-full bg-emerald-400/70"
                              style={{ width: `${winRate * 100}%` }}
                            />
                          </div>
                        </div>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted/50" aria-hidden><path d="m9 18 6-6-6-6"/></svg>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Log game */}
        <div className="mt-5 border-t border-white/10 pt-5">
          <Link
            href={activeSportId ? `/games/new?sport=${activeSportId}` : "/games/new"}
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-primary px-6 py-3.5 text-center text-base font-semibold text-[#121212] shadow-lg shadow-primary/20 transition hover:bg-primary-hover active:scale-[0.99] sm:max-w-xs"
          >
            Log game
          </Link>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold tracking-tight">Recent games</h2>
        <p className="mt-1 text-sm text-muted">
          Last results{currentSportName ? ` for ${currentSportName}` : ""}.
        </p>
        {recentGames.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-white/15 bg-card/30 px-4 py-8 text-center text-sm text-muted">
            Nothing logged yet. Hit <span className="text-foreground">Log game</span> when
            you play next.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {recentGames.map((g) => {
              const oppId =
                g.player1_id === currentUser.id ? g.player2_id : g.player1_id;
              const opp = opponentMap[oppId];
              const s = scoresForUser(g, currentUser.id);
              return (
                <li
                  key={g.id}
                  className="rounded-xl border border-white/10 bg-card px-4 py-3 transition hover:border-white/20"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        vs {opp?.username ?? "Unknown"}
                      </p>
                      <p className="text-xs text-muted">
                        {format(new Date(g.created_at), "MMM d, yyyy · h:mm a")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold tabular-nums text-foreground">
                        {s.mine} – {s.theirs}
                      </p>
                      <p className="text-xs text-muted">
                        {s.tied ? "Tie" : s.won ? "Win" : "Loss"}
                      </p>
                    </div>
                  </div>
                  {g.notes ? (
                    <p className="mt-2 text-xs text-muted line-clamp-2">{g.notes}</p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <FriendH2HModal
        friend={h2hFriend}
        userId={currentUser.id}
        onClose={() => setH2hFriend(null)}
      />
    </div>
  );
}
