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

    const { error: teamGameError } = await sb.rpc("create_team_game", {
      p_sport_id: sportId,
      p_game_type: gameType,
      p_player1_id: userId,
      p_player2_id: theirTeam[0],
      p_player1_score: myScore,
      p_player2_score: theirScore,
      p_notes: notes,
      p_team1_ids: myTeam,
      p_team2_ids: theirTeam,
    });

    if (teamGameError) return { error: teamGameError.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/stats");
  return { ok: true as const };
}

export async function getH2HGames(
  friendId: string
): Promise<{ data?: GameRow[]; sportNames?: Record<string, string>; error?: string }> {
  const userId = await getSessionUserId();
  if (!userId) return { error: "Not signed in." };
  const data = await fetchGamesVsFriend(userId, friendId);
  const sportIds = [...new Set(data.map((g) => g.sport_id))];
  const sportNames = await fetchSportNamesForIds(sportIds);
  return { data, sportNames };
}
