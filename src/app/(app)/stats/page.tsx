import { StatsClient } from "@/app/(app)/stats/stats-client";
import { getSessionUserId } from "@/lib/auth-server";
import {
  fetchAllGames,
  fetchAllUsers,
  fetchFriendsForUser,
  fetchGamesForUser,
  fetchSports,
} from "@/lib/queries";
import {
  calculateRatings,
  getPlayerRating,
  parseSportGameTypeKey,
  rankPlayers,
  type PlayerRating,
} from "@/lib/ratings";
import { redirect } from "next/navigation";

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

type SportModeRating = PlayerRating & {
  key: string;
  sportId: string;
  sportName: string;
  gameType: "1v1" | "2v2" | "3v3" | "4v4" | "5v5";
};

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/");

  const [sports, games, allGames, allUsers, friends] = await Promise.all([
    fetchSports(),
    fetchGamesForUser(userId, null),
    fetchAllGames(),
    fetchAllUsers(),
    fetchFriendsForUser(userId),
  ]);
  const userMap = Object.fromEntries(allUsers.map((u) => [u.id, u]));
  const sportMap = Object.fromEntries(sports.map((sport) => [sport.id, sport.name]));
  const ratings = calculateRatings(allGames);
  const overallRating = getPlayerRating(ratings.overall, userId);
  const modeRatings: SportModeRating[] = Object.entries(ratings.bySportGameType)
    .map(([key, table]) => {
      const { sportId, gameType } = parseSportGameTypeKey(key);
      return {
        key,
        sportId,
        sportName: sportMap[sportId] ?? "Unknown",
        gameType,
        ...getPlayerRating(table, userId),
      };
    })
    .filter((entry) => entry.games > 0)
    .sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      if (a.sportName !== b.sportName) return a.sportName.localeCompare(b.sportName);
      return a.gameType.localeCompare(b.gameType);
    });
  const overallRank = rankPlayers(ratings.overall).find((entry) => entry.userId === userId)?.rank ?? null;

  const buildLeaderboard = (table: Record<string, PlayerRating>): LeaderboardEntry[] =>
    rankPlayers(table)
      .filter(({ rating }) => rating.games > 0)
      .slice(0, 12)
      .map(({ userId: ratedUserId, rank, rating }) => ({
        userId: ratedUserId,
        user: userMap[ratedUserId] ?? null,
        rank,
        rating,
      }));

  const leaderboards = {
    overall: buildLeaderboard(ratings.overall),
    ...Object.fromEntries(
      Object.entries(ratings.bySportGameType).map(([key, table]) => [key, buildLeaderboard(table)])
    ),
  };

  return (
    <StatsClient
      sports={sports}
      games={games}
      userMap={userMap}
      userId={userId}
      overallRating={overallRating}
      modeRatings={modeRatings}
      overallRank={overallRank}
      leaderboards={leaderboards}
      friendIds={friends.map((friend) => friend.id)}
    />
  );
}
