"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/supabase/admin";
import { safePath } from "@/lib/utils";

const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 6;

async function requestMeta() {
  const h = await headers();
  return {
    ip:
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      h.get("x-real-ip") ??
      "127.0.0.1",
    userAgent: h.get("user-agent") ?? "unknown",
  };
}

async function tooManyAttempts(identifier: string) {
  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const { count } = await db()
    .from("login_logs")
    .select("id", { count: "exact", head: true })
    .eq("username", identifier)
    .eq("success", false)
    .gte("created_at", since);
  return (count ?? 0) >= MAX_ATTEMPTS;
}

async function logAttempt(
  identifier: string,
  success: boolean,
  userId?: string | null
) {
  const { ip, userAgent } = await requestMeta();
  await db().from("login_logs").insert({
    user_id: userId ?? null,
    username: identifier,
    ip,
    user_agent: userAgent,
    success,
  });
}

/** Resolves a username OR e-mail to the account e-mail used by Supabase Auth. */
async function resolveEmail(identifier: string): Promise<string | null> {
  const value = identifier.trim();
  if (!value) return null;
  if (value.includes("@")) return value.toLowerCase();

  const { data } = await db()
    .from("profiles")
    .select("email")
    .ilike("username", value)
    .maybeSingle();

  return data?.email ?? null;
}

export async function signIn(formData: FormData) {
  const identifier = String(formData.get("identifier") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safePath(String(formData.get("next") ?? "/my"));

  if (!identifier || !password) {
    redirect(`/login?error=missing&next=${encodeURIComponent(next)}`);
  }

  if (await tooManyAttempts(identifier)) {
    await logAttempt(identifier, false);
    redirect(`/login?error=ratelimit&next=${encodeURIComponent(next)}`);
  }

  const email = await resolveEmail(identifier);
  if (!email) {
    await logAttempt(identifier, false);
    redirect(`/login?error=credentials&next=${encodeURIComponent(next)}`);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    await logAttempt(identifier, false);
    redirect(`/login?error=credentials&next=${encodeURIComponent(next)}`);
  }

  const { ip } = await requestMeta();
  await db()
    .from("profiles")
    .update({ last_login_at: new Date().toISOString(), last_login_ip: ip })
    .eq("id", data.user.id);

  await logAttempt(identifier, true, data.user.id);

  const { data: profile } = await db()
    .from("profiles")
    .select("suspended, role")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profile?.suspended) {
    await supabase.auth.signOut();
    redirect("/login?error=suspended");
  }

  redirect(next);
}

/**
 * Simulated Office365 / SSO sign-in. The university IdP is not reachable from
 * this replica, so when DEMO_SSO is enabled the matching institutional account
 * is signed in with the shared demo password.
 */
export async function ssoSignIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const next = safePath(String(formData.get("next") ?? "/my"));

  if (!email || !email.endsWith("@telkomuniversity.ac.id")) {
    redirect(`/login?error=sso_email&next=${encodeURIComponent(next)}`);
  }

  if (process.env.DEMO_SSO !== "1") {
    redirect(`/login?error=sso_disabled&next=${encodeURIComponent(next)}`);
  }

  const { data: profile } = await db()
    .from("profiles")
    .select("id, suspended")
    .eq("email", email)
    .maybeSingle();

  if (!profile) {
    await logAttempt(email, false);
    redirect(`/login?error=credentials&next=${encodeURIComponent(next)}`);
  }
  if (profile.suspended) {
    redirect(`/login?error=suspended&next=${encodeURIComponent(next)}`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: process.env.DEMO_PASSWORD ?? "password",
  });

  if (error) {
    await logAttempt(email, false);
    redirect(`/login?error=credentials&next=${encodeURIComponent(next)}`);
  }

  await logAttempt(email, true, profile.id);
  redirect(next);
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}
