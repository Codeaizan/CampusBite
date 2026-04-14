import { createClient } from "@/lib/supabase/server";
import { AdminAdsClient } from "@/components/admin/AdminAdsClient";
import type { AdPlacement } from "@/lib/ads";

interface AdminAd {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  click_url: string | null;
  cta_label: string;
  placements: AdPlacement[];
  is_active: boolean;
  priority: number;
  weight: number;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
}

export default async function AdminAdsPage() {
  const supabase = await createClient();

  const [adsRes, impressionsRes, clicksRes] = await Promise.all([
    supabase
      .from("ads")
      .select(
        "id, title, description, image_url, click_url, cta_label, placements, is_active, priority, weight, starts_at, ends_at, created_at"
      )
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("ad_events")
      .select("id", { count: "exact", head: true })
      .eq("event_type", "impression"),
    supabase
      .from("ad_events")
      .select("id", { count: "exact", head: true })
      .eq("event_type", "click"),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ads: AdminAd[] = (adsRes.data ?? []).map((row: any) => ({
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    image_url: row.image_url as string,
    click_url: (row.click_url as string | null) ?? null,
    cta_label: (row.cta_label as string) ?? "Learn More",
    placements: (row.placements as AdPlacement[]) ?? [],
    is_active: (row.is_active as boolean) ?? false,
    priority: (row.priority as number) ?? 0,
    weight: (row.weight as number) ?? 100,
    starts_at: (row.starts_at as string | null) ?? null,
    ends_at: (row.ends_at as string | null) ?? null,
    created_at: (row.created_at as string) ?? new Date().toISOString(),
  }));

  const impressions = impressionsRes.count ?? 0;
  const clicks = clicksRes.count ?? 0;

  return (
    <AdminAdsClient
      initialAds={ads}
      metrics={{
        totalAds: ads.length,
        activeAds: ads.filter((ad) => ad.is_active).length,
        impressions,
        clicks,
      }}
    />
  );
}
