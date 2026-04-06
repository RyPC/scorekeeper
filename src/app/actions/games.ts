"use server";

import { getSessionUserId } from "@/lib/auth-server";
import type { GameRow, GameType } from "@/lib/game-stats";
import { TEAM_SIZE } from "@/lib/game-stats";
import { fetchGamesVsFriend } from "@/lib/queries";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";

const VALID_GAME_TYPES = new Set<GameType>(["1v1", "2v2", "3v3", "4v4", "5v5"]);

export async function addGame(formData: FormData) {
  const userId = await getSessionUserId();
  if (!userId) {
    return { error: "Not signed in." };
  }

  const sportId = String(formData.get("sport_id") ?? "").trim();
  const gameType = String(formData.get("game_type") ?? "1v1").trim() as GameType;
  const myScore = Number(formData.get("my_score"));
  const theirScore = Number(formData.get("their_score"));
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!sportId) {
    return { error: "Sport is required." };
  }
  if (!VALID_GAME_TYPES.has(gameType)) {
    return { error: "Invalid game type." };
  }
  if (!Number.isFinite(myScore) || !Number.isFinite(theirScore)) {
    return { error: "Scores must be numbers." };
  }
  if (!Number.isInteger(myScore) || !Number.isInteger(theirScore)) {
    return { error: "Scores must be whole numbers." };
  }

  const teamSize = TEAM_SIZE[gameType];
  const sb = createServiceClient();

  if (gameType === "1v1") {
    const opponentId = String(formData.get("opponent_id") ?? "").trim();
    if (!opponentId) {
      return { error: "Opponent is required." };
    }
    if (opponentId === userId) {
      return { error: "Pick someone other than yourself." };
    }

    const { error } = await sb.from("games").insert({
      sport_id: sportId,
      game_type: "1v1",
      player1_id: userId,
      player2_id: opponentId,
      player1_score: myScore,
      player2_score: theirScore,
      notes,
    });

    if (error) return { error: error.message };
  } else {
    // Team game: collect teammate and opponent IDs from form.
    // my_team_[1..teamSize-1] = teammates (current user is slot 0)
    // their_team_[0..teamSize-1] = opponents
    const myTeam: string[] = [userId];
    for (let i = 1; i < teamSize; i++) {
      const id = String(formData.get(`my_team_${i}`) ?? "").trim();
      if (!id) return { error: `Select all ${teamSize} players for your team.` };
      myTeam.push(id);
    }

    const theirTeam: string[] = [];
    for (let i = 0; i < teamSize; i++) {
      const id = String(formData.get(`their_team_${i}`) ?? "").trim();
      if (!id) return { error: `Select all ${teamSize} players for the opposing team.` };
      theirTeam.push(id);
    }

    const allPlayers = [...myTeam, ...theirTeam];
    if (new Set(allPlayers).size !== allPlayers.length) {
      return { error: "A player cannot be on both teams or appear twice." };
    }

    // team captains stored in player1_id / player2_id for backwards-compat queries
    const { data: gameRow, error: gameError } = await sb
      .from("games")
      .insert({
        sport_id: sportId,
        game_type: gameType,
        player1_id: userId,
        player2_id: theirTeam[0],
        player1_score: myScore,
        player2_score: theirScore,
        notes,
      })
      .select("id")
      .single();

    if (gameError || !gameRow) return { error: gameError?.message ?? "Failed to create game." };

    const rosterRows = [
      ...myTeam.map((uid) => ({ game_id: gameRow.id, user_id: uid, team: 1 })),
      ...theirTeam.map((uid) => ({ game_id: gameRow.id, user_id: uid, team: 2 })),
    ];

    const { error: rosterError } = await sb.from("game_players").insert(rosterRows);
    if (rosterError) return { error: rosterError.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/stats");
  return { ok: true as const };
}

export async function getH2HGames(
  friendId: string
): Promise<{ data?: GameRow[]; error?: string }> {
  const userId = await getSessionUserId();
  if (!userId) return { error: "Not signed in." };
  const data = await fetchGamesVsFriend(userId, friendId);
  return { data };
}
