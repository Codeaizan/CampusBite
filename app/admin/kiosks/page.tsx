import { createClient } from "@/lib/supabase/server";
import { AdminKiosksClient } from "@/components/admin/AdminKiosksClient";

export default async function AdminKiosksPage() {
  const supabase = await createClient();

  // Fetch kiosks with owner profile
  const { data: rawKiosks } = await supabase
    .from("kiosks")
    .select("id, name, location, is_subscribed, profiles!owner_id(email)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const kiosks = (rawKiosks ?? []).map((k: any) => ({
    id: k.id as string,
    name: k.name as string,
    location: k.location as string | null,
    is_subscribed: k.is_subscribed as boolean,
    owner_email: (k.profiles?.email as string) ?? null,
  }));

  // Fetch metrics
  const [itemsRes, swipesRes] = await Promise.all([
    supabase
      .from("items")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null),
    supabase
      .from("swipes")
      .select("id", { count: "exact", head: true }),
  ]);

  const metrics = {
    totalKiosks: kiosks.length,
    subscribed: kiosks.filter((k) => k.is_subscribed).length,
    totalItems: itemsRes.count ?? 0,
    totalSwipes: swipesRes.count ?? 0,
  };

  return <AdminKiosksClient initialKiosks={kiosks} metrics={metrics} />;
}
