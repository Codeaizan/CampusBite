import { createClient } from "@/lib/supabase/server";
import { KioskItemsClient } from "@/components/kiosk/KioskItemsClient";

export default async function KioskItemsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Get kiosk for current owner
  const { data: kiosk } = await supabase
    .from("kiosks")
    .select("id, name, location, is_subscribed")
    .eq("owner_uid", user.id)
    .is("deleted_at", null)
    .single();

  if (!kiosk) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center mb-6">
          <span className="text-4xl">🏪</span>
        </div>
        <h2 className="text-xl font-bold text-on-surface mb-2">
          No Kiosk Found
        </h2>
        <p className="text-on-surface/50 text-sm max-w-xs">
          Contact the admin to set up your kiosk and start managing your items.
        </p>
      </div>
    );
  }

  // Fetch items + categories in parallel
  const [itemsRes, categoriesRes] = await Promise.all([
    supabase
      .from("items")
      .select("id, name, price, image_url, is_veg, is_available, category_id, categories(name)")
      .eq("kiosk_id", kiosk.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase.from("categories").select("id, name").order("name"),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = ((itemsRes.data ?? []) as any[]).map((item) => ({
    id: item.id as string,
    name: item.name as string,
    price: item.price as number | null,
    image_url: item.image_url as string | null,
    is_veg: (item.is_veg as boolean) ?? false,
    is_available: (item.is_available as boolean) ?? true,
    category_id: item.category_id as string | null,
    category_name: (item.categories?.name as string) ?? null,
  }));

  const categories = (categoriesRes.data ?? []) as {
    id: string;
    name: string;
  }[];

  return (
    <KioskItemsClient
      kioskId={kiosk.id}
      kioskName={kiosk.name}
      initialItems={items}
      categories={categories}
    />
  );
}
