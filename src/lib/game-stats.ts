export type GameRow = {
  id: string;
  sport_id: string;
  player1_id: string;
  player2_id: string;
  player1_score: number;
  player2_score: number;
  notes: string | null;
  created_at: string;
};

export function scoresForUser(
  game: GameRow,
  userId: string
): { mine: number; theirs: number; won: boolean; lost: boolean; tied: boolean } {
  let mine: number;
  let theirs: number;
  if (game.player1_id === userId) {
    mine = game.player1_score;
    theirs = game.player2_score;
  } else if (game.player2_id === userId) {
    mine = game.player2_score;
    theirs = game.player1_score;
  } else {
    mine = 0;
    theirs = 0;
  }
  const won = mine > theirs;
  const lost = mine < theirs;
  const tied = mine === theirs;
  return { mine, theirs, won, lost, tied };
}
