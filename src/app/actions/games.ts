"use server";

import { getSessionUserId } from "@/lib/auth-server";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";

export async function addGame(formData: FormData) {
  const userId = await getSessionUserId();
  if (!userId) {
    return { error: "Not signed in." };
  }

  const sportId = String(formData.get("sport_id") ?? "").trim();
  const opponentId = String(formData.get("opponent_id") ?? "").trim();
  const myScore = Number(formData.get("my_score"));
  const theirScore = Number(formData.get("their_score"));
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!sportId || !opponentId) {
    return { error: "Sport and opponent are required." };
  }
  if (opponentId === userId) {
    return { error: "Pick someone other than yourself." };
  }
  if (!Number.isFinite(myScore) || !Number.isFinite(theirScore)) {
    return { error: "Scores must be numbers." };
  }
  if (!Number.isInteger(myScore) || !Number.isInteger(theirScore)) {
    return { error: "Scores must be whole numbers." };
  }

  const sb = createServiceClient();
  const { error } = await sb.from("games").insert({
    sport_id: sportId,
    player1_id: userId,
    player2_id: opponentId,
    player1_score: myScore,
    player2_score: theirScore,
    notes,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/stats");
  return { ok: true as const };
}
