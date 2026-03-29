"use server";

import { getSessionUserId } from "@/lib/auth-server";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";

export async function createSport(formData: FormData) {
  const userId = await getSessionUserId();
  if (!userId) {
    return { error: "Not signed in." };
  }

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return { error: "Sport name is required." };
  }

  const sb = createServiceClient();
  const { data, error } = await sb
    .from("sports")
    .insert({ name, created_by: userId })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/stats");
  return { ok: true as const, sportId: data.id };
}
