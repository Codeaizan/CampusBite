import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const roleRedirects: Record<string, string> = {
  student: "/student/home",
  kiosk_owner: "/kiosk/items",
  super_admin: "/admin/kiosks",
};

function buildErrorRedirect(
  origin: string,
  error: string,
  description?: string
) {
  const params = new URLSearchParams({ error });
  if (description) {
    params.set("error_description", description);
  }
  return NextResponse.redirect(`${origin}/auth/student?${params.toString()}`);
}

function sanitizeNextPath(next: string | null): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return null;
  }
  return next;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = sanitizeNextPath(searchParams.get("next"));
  const oauthError = searchParams.get("error");
  const oauthErrorDescription = searchParams.get("error_description");

  if (oauthError) {
    return buildErrorRedirect(
      origin,
      "oauth_callback_failed",
      oauthErrorDescription || oauthError
    );
  }

  if (!code) {
    return buildErrorRedirect(origin, "auth_failed");
  }

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error("OAuth code exchange failed:", exchangeError.message);
    return buildErrorRedirect(origin, "oauth_callback_failed", exchangeError.message);
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("Failed to load authenticated user:", userError?.message);
    return buildErrorRedirect(origin, "auth_failed");
  }

  const { data: profile, error: profileReadError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileReadError) {
    console.error("Failed to read profile after OAuth login:", profileReadError.message);
    return buildErrorRedirect(origin, "auth_failed");
  }

  if (profile?.role) {
    const redirect = roleRedirects[profile.role as string] || "/";
    return NextResponse.redirect(`${origin}${next || redirect}`);
  }

  // Trigger fallback: create profile with service role if auth trigger did not.
  const adminClient = createAdminClient();
  const { data: newProfile, error: profileUpsertError } = await adminClient
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email: user.email || "",
        full_name:
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          "",
        avatar_url:
          user.user_metadata?.avatar_url ||
          user.user_metadata?.picture ||
          "",
        role: "student",
      },
      { onConflict: "id" }
    )
    .select("role")
    .single();

  if (profileUpsertError) {
    console.error("Failed to create missing profile after OAuth login:", profileUpsertError.message);
    return buildErrorRedirect(origin, "profile_sync_failed", profileUpsertError.message);
  }

  const redirect =
    roleRedirects[(newProfile?.role as string) || "student"] || "/student/home";
  return NextResponse.redirect(`${origin}${next || redirect}`);
}
