import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const roleRedirects: Record<string, string> = {
  student: "/student/home",
  kiosk_owner: "/kiosk/items",
  super_admin: "/admin/kiosks",
};

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Get the authenticated user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Check if profile exists
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile?.role) {
          // Redirect based on existing role
          const redirect = roleRedirects[profile.role as string] || "/";
          return NextResponse.redirect(`${origin}${next || redirect}`);
        }

        // No profile yet — the trigger should have created one,
        // but if it somehow didn't, insert a student profile
        const { data: newProfile } = await supabase
          .from("profiles")
          .upsert({
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
          })
          .select("role")
          .single();

        const redirect =
          roleRedirects[(newProfile?.role as string) || "student"] ||
          "/student/home";
        return NextResponse.redirect(`${origin}${next || redirect}`);
      }
    }
  }

  // On any error, redirect to student login with error param
  return NextResponse.redirect(
    `${origin}/auth/student?error=auth_failed`
  );
}
