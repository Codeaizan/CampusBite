import { createClient } from "@/lib/supabase/server";
import { ProfileClient } from "@/components/student/ProfileClient";
import { normalizeAndFilterAds } from "@/lib/ads";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Parallel fetches
  const [profileRes, swipeStatsRes, adsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, email, avatar_url")
      .eq("id", user.id)
      .single(),

    supabase
      .from("swipes")
      .select("direction")
      .eq("user_id", user.id),

    supabase
      .from("ads")
      .select(
        "id, title, description, image_url, click_url, cta_label, placements, is_active, priority, weight, starts_at, ends_at, created_at"
      )
      .eq("is_active", true)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false }),
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

  const profileAds = normalizeAndFilterAds(adsRes.data, "profile_slot");

  return (
    <ProfileClient
      userId={user.id}
      profile={{
        full_name: profile.full_name ?? "Student",
        email: profile.email ?? user.email ?? "",
        avatar_url: profile.avatar_url ?? null,
      }}
      stats={stats}
      ads={profileAds}
    />
  );
}
