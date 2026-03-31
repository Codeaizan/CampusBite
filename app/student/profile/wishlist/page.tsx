import { createClient } from "@/lib/supabase/server";
import { WishlistClient } from "@/components/student/WishlistClient";

export default async function WishlistPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch all want_to_try swipes with their items and corresponding kiosks
  const { data: rawSwipes } = await supabase
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
    .order("created_at", { ascending: false });

  // Map deep related data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = (rawSwipes || []).map((swipe: any) => ({
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

  return <WishlistClient initialItems={items} userId={user.id} />;
}
