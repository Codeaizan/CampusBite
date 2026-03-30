import { createClient } from "@/lib/supabase/server";
import { FeedbackClient } from "@/components/kiosk/FeedbackClient";

export default async function KioskFeedbackPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: kiosk } = await supabase
    .from("kiosks")
    .select("id, name, is_subscribed")
    .eq("owner_uid", user.id)
    .is("deleted_at", null)
    .single();

  if (!kiosk) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <p className="text-on-surface/50">No kiosk found. Contact admin.</p>
      </div>
    );
  }

  // Fetch kiosk items for filter dropdown
  const { data: items } = await supabase
    .from("items")
    .select("id, name")
    .eq("kiosk_id", kiosk.id)
    .is("deleted_at", null)
    .order("name");

  // Fetch feedback
  const { data: feedback } = await supabase
    .from("feedback")
    .select("id, item_id, user_id, type, comment, created_at, items(name, image_url)")
    .eq("kiosk_id", kiosk.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <FeedbackClient
      kioskId={kiosk.id}
      isSubscribed={kiosk.is_subscribed ?? false}
      items={(items ?? []) as { id: string; name: string }[]}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      initialFeedback={((feedback ?? []) as any[]).map((f) => ({
        id: f.id,
        item_id: f.item_id,
        item_name: f.items?.name ?? "Unknown",
        item_image: f.items?.image_url ?? null,
        user_id: f.user_id,
        type: f.type,
        comment: f.comment,
        created_at: f.created_at,
      }))}
    />
  );
}
