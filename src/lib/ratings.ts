import { GAME_TYPE_LABELS, type GameRow, type GameType } from "@/lib/game-stats";

const BASE_RATING = 1000;
const BASE_K = 28;
const MIN_REPEAT_FACTOR = 0.2;

export type PlayerRating = {
  rating: number;
  games: number;
  wins: number;
  losses: number;
  ties: number;
};

export type RatingsSnapshot = {
  overall: Record<string, PlayerRating>;
  byGameType: Record<GameType, Record<string, PlayerRating>>;
  bySportGameType: Record<string, Record<string, PlayerRating>>;
};

type MutableContext = {
  ratings: Map<string, PlayerRating>;
  pairCounts: Map<string, number>;
};

function createContext(): MutableContext {
  return {
    ratings: new Map<string, PlayerRating>(),
    pairCounts: new Map<string, number>(),
  };
}

function createPlayerRating(): PlayerRating {
  return {
    rating: BASE_RATING,
    games: 0,
    wins: 0,
    losses: 0,
    ties: 0,
  };
}

function getOrCreateRating(context: MutableContext, userId: string): PlayerRating {
  let rating = context.ratings.get(userId);
  if (!rating) {
    rating = createPlayerRating();
    context.ratings.set(userId, rating);
  }
  return rating;
}

function resolveTeams(game: GameRow): [string[], string[]] | null {
  if (game.game_type === "1v1") {
    return [[game.player1_id], [game.player2_id]];
  }

  if (game.game_players && game.game_players.length > 0) {
    const team1 = [...new Set(game.game_players.filter((p) => p.team === 1).map((p) => p.user_id))];
    const team2 = [...new Set(game.game_players.filter((p) => p.team === 2).map((p) => p.user_id))];
    if (team1.length > 0 && team2.length > 0) {
      return [team1, team2];
    }
  }

  if (game.player1_id && game.player2_id) {
    return [[game.player1_id], [game.player2_id]];
  }

  return null;
}

function averageRating(context: MutableContext, userIds: string[]): number {
  let total = 0;
  for (const userId of userIds) {
    total += getOrCreateRating(context, userId).rating;
  }
  return total / userIds.length;
}

function pairKey(a: string, b: string): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

function repeatFactor(context: MutableContext, team1: string[], team2: string[]): number {
  const priorCounts: number[] = [];
  for (const a of team1) {
    for (const b of team2) {
      priorCounts.push(context.pairCounts.get(pairKey(a, b)) ?? 0);
    }
  }

  if (priorCounts.length === 0) return 1;

  const averagePrior = priorCounts.reduce((sum, count) => sum + count, 0) / priorCounts.length;
  return Math.max(MIN_REPEAT_FACTOR, 1 / Math.sqrt(averagePrior + 1));
}

function incrementPairCounts(context: MutableContext, team1: string[], team2: string[]) {
  for (const a of team1) {
    for (const b of team2) {
      const key = pairKey(a, b);
      context.pairCounts.set(key, (context.pairCounts.get(key) ?? 0) + 1);
    }
  }
}

function applyResult(rating: PlayerRating, outcome: number) {
  rating.games += 1;
  if (outcome === 1) rating.wins += 1;
  else if (outcome === 0) rating.losses += 1;
  else rating.ties += 1;
}

function applyGameToContext(context: MutableContext, game: GameRow) {
  const teams = resolveTeams(game);
  if (!teams) return;

  const [team1, team2] = teams;
  if (team1.length === 0 || team2.length === 0) return;

  const rating1 = averageRating(context, team1);
  const rating2 = averageRating(context, team2);
  const expected1 = 1 / (1 + 10 ** ((rating2 - rating1) / 400));

  const actual1 =
    game.player1_score > game.player2_score ? 1 : game.player1_score < game.player2_score ? 0 : 0.5;
  const actual2 = 1 - actual1;
  const delta = BASE_K * repeatFactor(context, team1, team2) * (actual1 - expected1);
  const team1Delta = delta / team1.length;
  const team2Delta = (-delta) / team2.length;

  for (const userId of team1) {
    const rating = getOrCreateRating(context, userId);
    rating.rating += team1Delta;
    applyResult(rating, actual1);
  }

  for (const userId of team2) {
    const rating = getOrCreateRating(context, userId);
    rating.rating += team2Delta;
    applyResult(rating, actual2);
  }

  incrementPairCounts(context, team1, team2);
}

function applyGameToContextWithDeltas(
  context: MutableContext,
  game: GameRow
): Map<string, number> {
  const deltas = new Map<string, number>();
  const teams = resolveTeams(game);
  if (!teams) return deltas;

  const [team1, team2] = teams;
  if (team1.length === 0 || team2.length === 0) return deltas;

  const rating1 = averageRating(context, team1);
  const rating2 = averageRating(context, team2);
  const expected1 = 1 / (1 + 10 ** ((rating2 - rating1) / 400));

  const actual1 =
    game.player1_score > game.player2_score ? 1 : game.player1_score < game.player2_score ? 0 : 0.5;
  const actual2 = 1 - actual1;
  const delta = BASE_K * repeatFactor(context, team1, team2) * (actual1 - expected1);
  const team1Delta = delta / team1.length;
  const team2Delta = (-delta) / team2.length;

  for (const userId of team1) {
    const rating = getOrCreateRating(context, userId);
    rating.rating += team1Delta;
    applyResult(rating, actual1);
    deltas.set(userId, Math.round(team1Delta));
  }

  for (const userId of team2) {
    const rating = getOrCreateRating(context, userId);
    rating.rating += team2Delta;
    applyResult(rating, actual2);
    deltas.set(userId, Math.round(team2Delta));
  }

  incrementPairCounts(context, team1, team2);
  return deltas;
}

function finalizeContext(context: MutableContext): Record<string, PlayerRating> {
  return Object.fromEntries(
    [...context.ratings.entries()].map(([userId, rating]) => [
      userId,
      {
        ...rating,
        rating: Math.round(rating.rating),
      },
    ])
  );
}

export function sportGameTypeKey(sportId: string, gameType: GameType): string {
  return `${sportId}::${gameType}`;
}

export function parseSportGameTypeKey(key: string): { sportId: string; gameType: GameType } {
  const [sportId, gameType] = key.split("::");
  return {
    sportId,
    gameType: gameType as GameType,
  };
}

export function calculateRatings(games: GameRow[]): RatingsSnapshot {
  const chronologicalGames = [...games].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const overallContext = createContext();
  const byGameTypeContext: Record<GameType, MutableContext> = {
    "1v1": createContext(),
    "2v2": createContext(),
    "3v3": createContext(),
    "4v4": createContext(),
    "5v5": createContext(),
  };
  const bySportGameTypeContext = new Map<string, MutableContext>();

  for (const game of chronologicalGames) {
    applyGameToContext(overallContext, game);
    applyGameToContext(byGameTypeContext[game.game_type], game);
    const key = sportGameTypeKey(game.sport_id, game.game_type);
    let context = bySportGameTypeContext.get(key);
    if (!context) {
      context = createContext();
      bySportGameTypeContext.set(key, context);
    }
    applyGameToContext(context, game);
  }

  return {
    overall: finalizeContext(overallContext),
    byGameType: {
      "1v1": finalizeContext(byGameTypeContext["1v1"]),
      "2v2": finalizeContext(byGameTypeContext["2v2"]),
      "3v3": finalizeContext(byGameTypeContext["3v3"]),
      "4v4": finalizeContext(byGameTypeContext["4v4"]),
      "5v5": finalizeContext(byGameTypeContext["5v5"]),
    },
    bySportGameType: Object.fromEntries(
      [...bySportGameTypeContext.entries()].map(([key, context]) => [key, finalizeContext(context)])
    ),
  };
}

export function calculateRatingChangesForPlayer(
  games: GameRow[],
  userId: string
): Record<string, number> {
  const chronologicalGames = [...games].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const context = createContext();
  const changes: Record<string, number> = {};

  for (const game of chronologicalGames) {
    const deltas = applyGameToContextWithDeltas(context, game);
    const delta = deltas.get(userId);
    if (delta !== undefined) {
      changes[game.id] = delta;
    }
  }

  return changes;
}

export function getPlayerRating(
  ratings: Record<string, PlayerRating>,
  userId: string
): PlayerRating {
  return ratings[userId] ?? createPlayerRating();
}

export function rankPlayers(ratings: Record<string, PlayerRating>): Array<{
  userId: string;
  rank: number;
  rating: PlayerRating;
}> {
  return Object.entries(ratings)
    .sort(([, a], [, b]) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return a.losses - b.losses;
    })
    .map(([userId, rating], index) => ({
      userId,
      rank: index + 1,
      rating,
    }));
}

export const RATED_GAME_TYPES: GameType[] = ["1v1", "2v2", "3v3", "4v4", "5v5"];
export const RATED_GAME_TYPE_LABELS = GAME_TYPE_LABELS;
