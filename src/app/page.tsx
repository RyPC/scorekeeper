import { LoginScreen } from "@/app/login-screen";
import { getSessionUserId } from "@/lib/auth-server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Home() {
  const sessionUserId = await getSessionUserId();
  if (sessionUserId) {
    redirect("/dashboard");
  }

  const sb = createServiceClient();
  const { data: users } = await sb.from("users").select("*").order("username");

  return <LoginScreen users={users ?? []} />;
}
