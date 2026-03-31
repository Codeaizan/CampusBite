import { createClient } from "@/lib/supabase/server";
import { AdminSettingsClient } from "@/components/admin/AdminSettingsClient";

export default async function AdminSettingsPage() {
  const supabase = await createClient();

  // Fetch daily swipe limit configuration
  const { data: limitConfig } = await supabase
    .from("config")
    .select("value")
    .eq("key", "daily_swipe_limit")
    .single();

  const initialDailyLimit = limitConfig?.value?.limit ?? 50;

  // Fetch broadcast message
  const { data: broadcastConfig } = await supabase
    .from("config")
    .select("value")
    .eq("key", "broadcast_message")
    .single();

  const initialBroadcastMessage = broadcastConfig?.value?.message ?? "";

  // Fetch categories
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("name", { ascending: true });

  return (
    <AdminSettingsClient
      initialDailyLimit={initialDailyLimit}
      initialBroadcastMessage={initialBroadcastMessage}
      initialCategories={categories ?? []}
    />
  );
}
