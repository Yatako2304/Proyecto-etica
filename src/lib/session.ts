import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { isAdminEmail } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type SessionUser = {
  id: string;
  email: string;
  alias: string;
  isAdmin: boolean;
};

/** Usuario actual (o null). Se cachea por request. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("alias")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email,
    alias: profile?.alias ?? user.email.split("@")[0],
    isAdmin: isAdminEmail(user.email),
  };
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (!user.isAdmin) redirect("/explorar");
  return user;
}
