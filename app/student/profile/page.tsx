import { createClient } from "@/lib/supabase/server";
import { ProfileClient } from "@/components/student/ProfileClient";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Parallel fetches
  const [profileRes, swipeStatsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, email, avatar_url")
      .eq("id", user.id)
      .single(),

    supabase
      .from("swipes")
      .select("direction")
      .eq("user_id", user.id),
  ]);

  const profile = profileRes.data ?? {
    full_name: "Student",
    email: user.email ?? "",
    avatar_url: null,
  };

  // Count swipe stats
  const swipes = swipeStatsRes.data ?? [];
  const stats = {
    liked: swipes.filter((s) => s.direction === "like").length,
    disliked: swipes.filter((s) => s.direction === "dislike").length,
    want_to_try: swipes.filter((s) => s.direction === "want_to_try").length,
  };

  return (
    <ProfileClient
      userId={user.id}
      profile={{
        full_name: profile.full_name ?? "Student",
        email: profile.email ?? user.email ?? "",
        avatar_url: profile.avatar_url ?? null,
      }}
      stats={stats}
    />
  );
}
