"use server";

import { getSessionUserId } from "@/lib/auth-server";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";

export async function addFriend(friendId: string) {
  const userId = await getSessionUserId();
  if (!userId) {
    return { error: "Not signed in." };
  }
  if (friendId === userId) {
    return { error: "You cannot add yourself." };
  }

  const sb = createServiceClient();
  const { error } = await sb.from("friendships").insert({
    user_id: userId,
    friend_id: friendId,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Already friends." };
    }
    return { error: error.message };
  }

  revalidatePath("/friends");
  revalidatePath("/dashboard");
  revalidatePath("/games/new");
  return { ok: true as const };
}

export async function removeFriend(friendId: string) {
  const userId = await getSessionUserId();
  if (!userId) {
    return { error: "Not signed in." };
  }

  const sb = createServiceClient();

  const { error } = await sb
    .from("friendships")
    .delete()
    .or(
      `and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`
    );

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/friends");
  revalidatePath("/dashboard");
  revalidatePath("/games/new");
  return { ok: true as const };
}
