import { AppShell } from "@/components/AppShell";
import { getSessionUserId } from "@/lib/auth-server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await getSessionUserId();
  if (!userId) {
    redirect("/");
  }

  const sb = createServiceClient();
  const { data: user } = await sb
    .from("users")
    .select("id, username, avatar_url")
    .eq("id", userId)
    .single();

  if (!user) {
    redirect("/");
  }

  return <AppShell user={user}>{children}</AppShell>;
}
