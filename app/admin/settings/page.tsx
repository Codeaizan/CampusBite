import { createClient } from "@/lib/supabase/server";
import { AdminSettingsClient } from "@/components/admin/AdminSettingsClient";

export default async function AdminSettingsPage() {
  const supabase = await createClient();

  // Fetch daily swipe limit configuration
  const { data: config } = await supabase
    .from("config")
    .select("value")
    .eq("key", "daily_swipe_limit")
    .single();

  const initialDailyLimit = config?.value?.limit ?? 50;

  // Fetch categories
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("name", { ascending: true });

  return (
    <AdminSettingsClient
      initialDailyLimit={initialDailyLimit}
      initialCategories={categories ?? []}
    />
  );
}
