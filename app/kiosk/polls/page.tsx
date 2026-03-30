import { createClient } from "@/lib/supabase/server";
import { PollsClient } from "@/components/kiosk/PollsClient";

export default async function KioskPollsPage() {
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

  // Fetch active poll + history
  const [activePollRes, historyRes] = await Promise.all([
    supabase
      .from("polls")
      .select("id, question, options, status, created_at")
      .eq("kiosk_id", kiosk.id)
      .eq("status", "active")
      .limit(1)
      .single(),
    supabase
      .from("polls")
      .select("id, question, options, status, created_at")
      .eq("kiosk_id", kiosk.id)
      .eq("status", "closed")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  // Get vote counts for active poll
  let activeVotes: { option_index: number; count: number }[] = [];
  if (activePollRes.data?.id) {
    const { data: votes } = await supabase
      .from("poll_votes")
      .select("option_index")
      .eq("poll_id", activePollRes.data.id);

    // Aggregate
    const countMap = new Map<number, number>();
    for (const v of votes ?? []) {
      countMap.set(v.option_index, (countMap.get(v.option_index) ?? 0) + 1);
    }
    activeVotes = Array.from(countMap.entries()).map(([idx, count]) => ({
      option_index: idx,
      count,
    }));
  }

  // Get vote counts for history polls
  const historyPolls = historyRes.data ?? [];
  const historyWithVotes = [];
  for (const poll of historyPolls) {
    const { data: votes } = await supabase
      .from("poll_votes")
      .select("option_index")
      .eq("poll_id", poll.id);
    const countMap = new Map<number, number>();
    for (const v of votes ?? []) {
      countMap.set(v.option_index, (countMap.get(v.option_index) ?? 0) + 1);
    }
    historyWithVotes.push({
      ...poll,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      options: poll.options as any[],
      votes: Array.from(countMap.entries()).map(([idx, count]) => ({
        option_index: idx,
        count,
      })),
    });
  }

  return (
    <PollsClient
      kioskId={kiosk.id}
      isSubscribed={kiosk.is_subscribed ?? false}
      activePoll={
        activePollRes.data
          ? {
              id: activePollRes.data.id,
              question: activePollRes.data.question,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              options: activePollRes.data.options as any[],
              votes: activeVotes,
            }
          : null
      }
      historyPolls={historyWithVotes}
    />
  );
}
