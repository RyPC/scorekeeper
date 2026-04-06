export type GameType = "1v1" | "2v2" | "3v3" | "4v4" | "5v5";

export type GamePlayerRow = {
  id: string;
  game_id: string;
  user_id: string;
  team: 1 | 2;
};

export type GameRow = {
  id: string;
  sport_id: string;
  player1_id: string;
  player2_id: string;
  player1_score: number;
  player2_score: number;
  game_type: GameType;
  notes: string | null;
  created_at: string;
  game_players?: GamePlayerRow[];
};

function scoresFromSides(
  game: GameRow,
  userId: string
): { mine: number; theirs: number } | null {
  if (game.player1_id === userId) {
    return { mine: game.player1_score, theirs: game.player2_score };
  }
  if (game.player2_id === userId) {
    return { mine: game.player2_score, theirs: game.player1_score };
  }
  return null;
}

export function scoresForUser(
  game: GameRow,
  userId: string
): { mine: number; theirs: number; won: boolean; lost: boolean; tied: boolean } {
  let mine: number;
  let theirs: number;

  if (game.game_type !== "1v1" && game.game_players && game.game_players.length > 0) {
    const membership = game.game_players.find((p) => p.user_id === userId);
    if (membership) {
      if (membership.team === 1) {
        mine = game.player1_score;
        theirs = game.player2_score;
      } else {
        mine = game.player2_score;
        theirs = game.player1_score;
      }
    } else {
      const cap = scoresFromSides(game, userId);
      if (cap) {
        mine = cap.mine;
        theirs = cap.theirs;
      } else {
        mine = 0;
        theirs = 0;
      }
    }
  } else {
    const cap = scoresFromSides(game, userId);
    if (cap) {
      mine = cap.mine;
      theirs = cap.theirs;
    } else {
      mine = 0;
      theirs = 0;
    }
  }

  const won = mine > theirs;
  const lost = mine < theirs;
  const tied = mine === theirs;
  return { mine, theirs, won, lost, tied };
}

/** Returns true if `userId` is on one of the teams in a team game. */
export function isPlayerInGame(game: GameRow, userId: string): boolean {
  if (game.game_type === "1v1") {
    return game.player1_id === userId || game.player2_id === userId;
  }
  if (game.game_players?.some((p) => p.user_id === userId)) return true;
  return game.player1_id === userId || game.player2_id === userId;
}

/** Returns the team number (1 or 2) the user is on, or null if not in the game. */
export function teamForUser(game: GameRow, userId: string): 1 | 2 | null {
  if (game.game_type === "1v1") {
    if (game.player1_id === userId) return 1;
    if (game.player2_id === userId) return 2;
    return null;
  }
  const p = game.game_players?.find((gp) => gp.user_id === userId);
  if (p) return p.team;
  // Roster not loaded or legacy row: captains still map to sides via player1/player2.
  if (game.player1_id === userId) return 1;
  if (game.player2_id === userId) return 2;
  return null;
}

/**
 * True when both users competed on opposite sides (1v1 or team games with roster).
 * Teammates in a team game are not head-to-head opponents.
 */
export function areOpponentsInGame(
  game: GameRow,
  userId: string,
  otherUserId: string
): boolean {
  if (userId === otherUserId) return false;
  if (game.game_type === "1v1") {
    return (
      (game.player1_id === userId && game.player2_id === otherUserId) ||
      (game.player1_id === otherUserId && game.player2_id === userId)
    );
  }
  const a = teamForUser(game, userId);
  const b = teamForUser(game, otherUserId);
  if (a === null || b === null) return false;
  return a !== b;
}

/**
 * User IDs on the opposite side from `userId` for matchup stats (1v1: the other player;
 * team games: everyone on the opposing team from `game_players`, or the other captain if no roster).
 * Empty if `userId` did not play or the game cannot be resolved.
 */
export function opponentUserIdsForGame(game: GameRow, userId: string): string[] {
  if (game.game_type === "1v1") {
    if (game.player1_id === userId) return [game.player2_id];
    if (game.player2_id === userId) return [game.player1_id];
    return [];
  }
  const side = teamForUser(game, userId);
  if (side === null) return [];
  const oppTeam = side === 1 ? 2 : 1;
  if (game.game_players && game.game_players.length > 0) {
    const ids = game.game_players.filter((p) => p.team === oppTeam).map((p) => p.user_id);
    return [...new Set(ids)];
  }
  const oppCaptain = side === 1 ? game.player2_id : game.player1_id;
  return oppCaptain && oppCaptain !== userId ? [oppCaptain] : [];
}

export const GAME_TYPE_LABELS: Record<GameType, string> = {
  "1v1": "1 v 1",
  "2v2": "2 v 2",
  "3v3": "3 v 3",
  "4v4": "4 v 4",
  "5v5": "5 v 5",
};

/** Number of players per team for each game type. */
export const TEAM_SIZE: Record<GameType, number> = {
  "1v1": 1,
  "2v2": 2,
  "3v3": 3,
  "4v4": 4,
  "5v5": 5,
};
