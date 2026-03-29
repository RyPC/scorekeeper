"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { SESSION_COOKIE, createSessionToken } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

async function setSessionCookie(userId: string) {
  const token = await createSessionToken(userId);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function loginAsUser(userId: string) {
  await setSessionCookie(userId);
  redirect("/dashboard");
}

export async function createUser(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const username = String(formData.get("username") ?? "").trim();
  const avatarUrlRaw = String(formData.get("avatar_url") ?? "").trim();
  if (!username) {
    return { error: "Username is required." };
  }

  const sb = createServiceClient();
  const { data, error } = await sb
    .from("users")
    .insert({
      username,
      avatar_url: avatarUrlRaw || null,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "That username is already taken." };
    }
    return { error: error.message };
  }

  await setSessionCookie(data.id);
  revalidatePath("/");
  redirect("/dashboard");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/");
}
