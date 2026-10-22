import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

let cached: ReturnType<typeof createClient> | null = null;

/**
 * Server-only Supabase client with the service role key.
 * Every query in this app is scoped explicitly in application code after the
 * caller has been authenticated — see src/lib/auth.ts.
 */
export function db() {
  if (!cached) {
    cached = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }
  return cached as ReturnType<typeof createClient<any, "public", any>>;
}

export const BUCKETS = {
  avatars: "avatars",
  materials: "materials",
  submissions: "submissions",
} as const;
