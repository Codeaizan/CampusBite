import { createClient } from "@/lib/supabase/server";
import { AdminFeedbackClient } from "@/components/admin/AdminFeedbackClient";

export default async function AdminFeedbackPage() {
  const supabase = await createClient();

  // All queries in parallel — no sequential waterfalls
  const [likesRes, dislikesRes, kiosksRes, feedbackRes] = await Promise.all([
    supabase
      .from("feedback")
      .select("id", { count: "exact", head: true })
      .eq("type", "liked"),
    supabase
      .from("feedback")
      .select("id", { count: "exact", head: true })
      .eq("type", "disliked"),
    supabase.from("kiosks").select("id, name").order("name"),
    supabase
      .from("feedback")
      .select(
        `
        id,
        type,
        comment,
        created_at,
        items(name, image_url),
        kiosks(id, name)
        `
      )
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const metrics = {
    totalLikes: likesRes.count || 0,
    totalDislikes: dislikesRes.count || 0,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formattedFeedback = (feedbackRes.data || []).map((f: any) => ({
    id: f.id,
    type: f.type,
    comment: f.comment,
    created_at: f.created_at,
    items: f.items || { name: "Unknown Item", image_url: null },
    kiosks: f.kiosks || { id: "", name: "Unknown Kiosk" },
  }));

  return (
    <AdminFeedbackClient
      initialFeedback={formattedFeedback}
      kiosks={kiosksRes.data || []}
      metrics={metrics}
    />
  );
}
