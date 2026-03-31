import { createClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client with the SERVICE_ROLE key.
 * This bypasses RLS and has admin-level access.
 * ONLY use in server-side API routes — NEVER expose to the client.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
