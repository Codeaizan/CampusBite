import { createClient } from "@/lib/supabase/server";
import { TrendsClient } from "@/components/student/TrendsClient";
import { normalizeAndFilterAds } from "@/lib/ads";

// Cache this page for 30 seconds
export const revalidate = 30;

export default async function TrendsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [categoriesRes, priceRes, adsRes] = await Promise.all([
    supabase.from("categories").select("id, name").order("name"),
    supabase
      .from("items")
      .select("price")
      .eq("is_available", true)
      .is("deleted_at", null)
      .order("price", { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from("ads")
      .select(
        "id, title, description, image_url, click_url, cta_label, placements, is_active, priority, weight, starts_at, ends_at, created_at"
      )
      .eq("is_active", true)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  const maxPrice = (priceRes.data?.price as number) ?? 500;
  const trendAds = normalizeAndFilterAds(adsRes.data, "trends_inline");

  return (
    <TrendsClient
      categories={(categoriesRes.data ?? []) as { id: string; name: string }[]}
      maxPrice={maxPrice}
      userId={user.id}
      ads={trendAds}
    />
  );
}
