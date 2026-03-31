import { createClient } from "@/lib/supabase/server";
import { HomeClient } from "@/components/student/HomeClient";
import type { FoodItem } from "@/components/student/FoodCard";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function StudentHomePage({ searchParams }: Props) {
  const supabase = await createClient();
  const resolvedParams = await searchParams;
  const kiosk_id = resolvedParams?.kiosk_id as string | undefined;

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null; // Layout handles redirect
  }

  // Parallel data fetches
  const [
    swipedResult,
    dailyCountResult,
    configResult,
    itemsResult,
    activePollResult,
  ] = await Promise.all([
    // 1. Get already-swiped item IDs
    supabase
      .from("swipes")
      .select("item_id")
      .eq("user_id", user.id),

    // 2. Get today's swipe count
    supabase
      .from("daily_swipe_counts")
      .select("count")
      .eq("user_id", user.id)
      .eq("swipe_date", new Date().toISOString().split("T")[0])
      .single(),

    // 3. Get daily swipe limit config
    supabase
      .from("config")
      .select("value")
      .eq("key", "daily_swipe_limit")
      .single(),

    // 4. Get all available items with kiosk info (filtered if returning from QR code)
    (async () => {
      let q = supabase
        .from("items")
        .select(
          "id, name, price, image_url, is_veg, kiosk_id, kiosks(name, location)"
        )
        .eq("is_available", true)
        .is("deleted_at", null);
      
      if (kiosk_id) {
        q = q.eq("kiosk_id", kiosk_id);
      }
      
      return await q;
    })(),

    // 5. Check for active poll
    supabase
      .from("polls")
      .select("id")
      .eq("status", "active")
      .limit(1)
      .single(),
  ]);

  // Process swiped IDs
  const swipedIds = new Set(
    (swipedResult.data ?? []).map((s) => s.item_id as string)
  );

  // Daily count
  const dailyCount = (dailyCountResult.data?.count as number) ?? 0;

  // Daily limit
  const limitConfig = configResult.data?.value as { value?: number } | null;
  const dailyLimit = limitConfig?.value ?? 50;

  // Filter items: remove already swiped
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawItems = (itemsResult.data ?? []) as any[];

  const filteredItems: FoodItem[] = rawItems
    .filter((item) => !swipedIds.has(item.id))
    .map((item) => ({
      id: item.id as string,
      name: item.name as string,
      price: (item.price as number) ?? null,
      image_url: (item.image_url as string) ?? null,
      is_veg: (item.is_veg as boolean) ?? false,
      kiosk_name: (item.kiosks?.name as string) ?? "Unknown Kiosk",
      kiosk_location: (item.kiosks?.location as string) ?? null,
    }));

  // Check active poll
  const hasActivePoll = !!activePollResult.data?.id;

  // Check if user voted on active poll
  let activePollNotVoted = hasActivePoll;
  if (hasActivePoll && activePollResult.data?.id) {
    const { data: voteCheck } = await supabase
      .from("poll_votes")
      .select("id")
      .eq("poll_id", activePollResult.data.id)
      .eq("user_id", user.id)
      .limit(1)
      .single();

    activePollNotVoted = !voteCheck;
  }

  return (
    <HomeClient
      items={filteredItems}
      userId={user.id}
      dailyCount={dailyCount}
      dailyLimit={dailyLimit}
      hasActivePoll={activePollNotVoted}
    />
  );
}
