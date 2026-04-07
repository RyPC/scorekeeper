"use client";

import { UserAvatar } from "@/components/UserAvatar";
import { GAME_TYPE_LABELS } from "@/lib/game-stats";
import { type PlayerRating } from "@/lib/ratings";
import { type ReactNode, useMemo, useState } from "react";

type SportModeRating = PlayerRating & {
  key: string;
  sportId: string;
  sportName: string;
  gameType: "1v1" | "2v2" | "3v3" | "4v4" | "5v5";
};

type LeaderboardEntry = {
  userId: string;
  user: {
    id: string;
    username: string;
    avatar_url: string | null;
  } | null;
  rank: number;
  rating: PlayerRating;
};

function ratingTypeText(entry: SportModeRating): string {
  return `${GAME_TYPE_LABELS[entry.gameType]} in ${entry.sportName}`;
}

function SportIcon({ sportName }: { sportName: string }) {
  const normalizedSport = sportName.trim().toLowerCase();

  if (normalizedSport === "basketball") {
    return <text className="text-lg">🏀</text>;
  }

  if (normalizedSport === "pickleball") {
    return <text className="text-lg">🥒</text>;
  }

  return null;
}

function ratingTypeContent(entry: SportModeRating): ReactNode {
  const normalizedSport = entry.sportName.trim().toLowerCase();
  if (normalizedSport === "basketball" || normalizedSport === "pickleball") {
    return (
      <>
        <SportIcon sportName={entry.sportName} /> {GAME_TYPE_LABELS[entry.gameType]}
      </>
    );
  }

  return ratingTypeText(entry);
}

export function RatingsSection({
  userId,
  overallRating,
  modeRatings,
  overallRank,
  leaderboards,
  friendIds,
}: {
  userId: string;
  overallRating: PlayerRating;
  modeRatings: SportModeRating[];
  overallRank: number | null;
  leaderboards: Record<string, LeaderboardEntry[]>;
  friendIds: string[];
}) {
  const [selectedRatingSportId, setSelectedRatingSportId] = useState<string | null>(null);
  const [selectedRatingGameType, setSelectedRatingGameType] = useState<
    SportModeRating["gameType"] | null
  >(null);
  const [friendsOnlyRatings, setFriendsOnlyRatings] = useState(false);
  const friendIdSet = useMemo(() => new Set(friendIds), [friendIds]);

  const ratingSports = useMemo(
    () =>
      [...new Map(modeRatings.map((entry) => [entry.sportId, entry.sportName])).entries()].map(
        ([sportId, sportName]) => ({ sportId, sportName })
      ),
    [modeRatings]
  );

  const gameTypesForSelectedRatingSport = useMemo(() => {
    if (!selectedRatingSportId) return [] as SportModeRating["gameType"][];
    const gameTypes = modeRatings
      .filter((entry) => entry.sportId === selectedRatingSportId)
      .map((entry) => entry.gameType);
    return [...new Set(gameTypes)].sort();
  }, [modeRatings, selectedRatingSportId]);

  const activeRatingView =
    !selectedRatingSportId || !selectedRatingGameType
      ? "overall"
      : modeRatings.find(
            (entry) =>
              entry.sportId === selectedRatingSportId && entry.gameType === selectedRatingGameType
          )?.key ?? "overall";

  const leaderboard = useMemo(
    () => leaderboards[activeRatingView] ?? [],
    [activeRatingView, leaderboards]
  );

  const visibleLeaderboard = useMemo(() => {
    if (!friendsOnlyRatings) return leaderboard;

    const allowedUserIds = new Set([...friendIds, userId]);
    return leaderboard
      .filter((entry) => allowedUserIds.has(entry.userId))
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
  }, [friendIds, friendsOnlyRatings, leaderboard, userId]);

  return (
    <section className="rounded-xl border border-white/10 bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Ratings</h2>
          <p className="mt-1 text-sm text-muted">
            Elo-style ratings with reduced movement for repeated matchups.
          </p>
        </div>
        {overallRank ? (
          <span className="rounded-full border border-white/10 bg-background/60 px-3 py-1 text-xs text-muted">
            Rank #{overallRank}
          </span>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-primary/20 bg-primary/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Overall</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">
            {overallRating.rating}
          </p>
          <p className="mt-1 text-xs text-muted">
            {overallRating.wins}-{overallRating.losses}
            {overallRating.ties > 0 ? `-${overallRating.ties}` : ""} across {overallRating.games}{" "}
            games
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-background/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Best formats</p>
          {modeRatings.length === 0 ? (
            <p className="mt-2 text-sm text-muted">Play a game to establish format ratings.</p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {modeRatings.slice(0, 3).map((entry) => (
                <div
                  key={entry.key}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-card px-3 py-1.5 text-xs text-foreground"
                >
                  <span className="inline-flex items-center gap-1.5 text-muted">
                    {ratingTypeContent(entry)}
                  </span>
                  <span className="font-semibold tabular-nums text-foreground">{entry.rating}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-5">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Leaderboard view
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedRatingSportId(null);
                setSelectedRatingGameType(null);
              }}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                selectedRatingSportId === null
                  ? "bg-primary text-[#121212]"
                  : "border border-white/15 text-muted hover:border-white/30 hover:text-foreground"
              }`}
            >
              Overall
            </button>
            {ratingSports.map((sport) => (
              <button
                key={sport.sportId}
                type="button"
                onClick={() => {
                  setSelectedRatingSportId(sport.sportId);
                  setSelectedRatingGameType((prev) => {
                    const available = modeRatings
                      .filter((entry) => entry.sportId === sport.sportId)
                      .map((entry) => entry.gameType)
                      .sort();
                    return prev && available.includes(prev) ? prev : (available[0] ?? null);
                  });
                }}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  selectedRatingSportId === sport.sportId
                    ? "bg-primary text-[#121212]"
                    : "border border-white/15 text-muted hover:border-white/30 hover:text-foreground"
                }`}
              >
                {sport.sportName}
              </button>
            ))}
            {/* <button
              type="button"
              onClick={() => setFriendsOnlyRatings((value) => !value)}
              aria-pressed={friendsOnlyRatings}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                friendsOnlyRatings
                  ? "bg-white text-[#121212]"
                  : "border border-white/15 text-muted hover:border-white/30 hover:text-foreground"
              }`}
            >
              Friends only {friendsOnlyRatings ? "on" : "off"}
            </button> */}
          </div>

          {selectedRatingSportId ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {gameTypesForSelectedRatingSport.map((gameType) => (
                <button
                  key={gameType}
                  type="button"
                  onClick={() => setSelectedRatingGameType(gameType)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                    selectedRatingGameType === gameType
                      ? "bg-white text-[#121212]"
                      : "border border-white/15 text-muted hover:border-white/30 hover:text-foreground"
                  }`}
                >
                  {GAME_TYPE_LABELS[gameType]}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <ul className="mt-4 flex flex-col gap-3">
          {visibleLeaderboard.length === 0 ? (
            <li className="rounded-xl border border-dashed border-white/15 px-4 py-6 text-sm text-muted">
              {friendsOnlyRatings
                ? "No friend ratings available for this format yet."
                : "No ratings available for this format yet."}
            </li>
          ) : (
            visibleLeaderboard.map(({ user, userId: ratedUserId, rank, rating }) => {
              const isCurrentUser = ratedUserId === userId;
              const isFriend = friendIdSet.has(ratedUserId);

              return (
                <li
                  key={ratedUserId}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
                    isCurrentUser
                      ? "border border-primary/40 bg-primary/10"
                      : "border border-white/10 bg-background/40"
                  }`}
                >
                  <span
                    className={`w-8 text-sm font-semibold tabular-nums ${
                      isCurrentUser ? "text-primary" : "text-muted"
                    }`}
                  >
                    #{rank}
                  </span>
                {user ? (
                  <UserAvatar username={user.username} avatarUrl={user.avatar_url} size="sm" />
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate font-medium text-foreground">
                    <span className="truncate">{user?.username ?? "Unknown"}</span>
                    {isCurrentUser ? (
                      <span className="rounded-full border border-primary/30 bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                        You
                      </span>
                    ) : null}
                    {isFriend ? (
                      <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                        Friend
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-muted">
                    {rating.wins}-{rating.losses}
                    {rating.ties > 0 ? `-${rating.ties}` : ""} in {rating.games} games
                  </p>
                </div>
                <span
                  className={`text-lg font-semibold tabular-nums ${
                    isCurrentUser ? "text-primary" : "text-foreground"
                  }`}
                >
                  {rating.rating}
                </span>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </section>
  );
}
