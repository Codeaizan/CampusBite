import { createClient } from "@/lib/supabase/server";
import { ProfileClient } from "@/components/student/ProfileClient";
import { normalizeAndFilterAds } from "@/lib/ads";

const HEATMAP_HOUR_LABELS = ["11am", "12pm", "1pm", "2pm", "3pm", "4pm", "5pm"];
const SHOW_HEATMAP_IN_PROFILE = false;

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

  const hourCounts = new Array(7).fill(0);
  if (SHOW_HEATMAP_IN_PROFILE) {
    const { data: heatmapRows } = await supabase
      .from("swipes")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(2000);

    for (const swipe of heatmapRows ?? []) {
      const hour = new Date(swipe.created_at).getHours();
      if (hour >= 11 && hour <= 17) {
        hourCounts[hour - 11] += 1;
      }
    }
  }

  const heatmap = {
    hourLabels: HEATMAP_HOUR_LABELS,
    hourCounts,
    maxHourCount: Math.max(...hourCounts, 1),
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
      ads={profileAds}
      showHeatmap={SHOW_HEATMAP_IN_PROFILE}
      heatmap={heatmap}
    />
  );
}
