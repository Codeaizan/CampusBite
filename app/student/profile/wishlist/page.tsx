import { createClient } from "@/lib/supabase/server";
import { WishlistClient } from "@/components/student/WishlistClient";
import { normalizeAndFilterAds } from "@/lib/ads";

export default async function WishlistPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [swipesRes, adsRes] = await Promise.all([
    // Fetch all want_to_try swipes with their items and corresponding kiosks
    supabase
      .from("swipes")
      .select(
        `
        id,
        items (
          id,
          name,
          price,
          image_url,
          is_veg,
          kiosks (
            id,
            name,
            location
          )
        )
      `
      )
      .eq("user_id", user.id)
      .eq("direction", "want_to_try")
      .order("created_at", { ascending: false }),
    supabase
      .from("ads")
      .select(
        "id, title, description, image_url, click_url, cta_label, placements, is_active, priority, weight, starts_at, ends_at, created_at"
      )
      .eq("is_active", true)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  // Map deep related data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = (swipesRes.data || []).map((swipe: any) => ({
    swipe_id: swipe.id,
    item_id: swipe.items.id,
    name: swipe.items.name,
    price: swipe.items.price,
    image_url: swipe.items.image_url,
    is_veg: swipe.items.is_veg,
    kiosk_id: swipe.items.kiosks?.id ?? "",
    kiosk_name: swipe.items.kiosks?.name ?? "Unknown",
    kiosk_location: swipe.items.kiosks?.location ?? "Unknown Location",
  }));

  const wishlistAds = normalizeAndFilterAds(adsRes.data, "wishlist_inline");

  return <WishlistClient initialItems={items} userId={user.id} ads={wishlistAds} />;
}
