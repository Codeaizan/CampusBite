import { createClient } from "@/lib/supabase/server";
import { AdminPollsClient } from "@/components/admin/AdminPollsClient";

export default async function AdminPollsPage() {
  const supabase = await createClient();

  // 1. Fetch active poll
  const { data: activePoll } = await supabase
    .from("polls")
    .select("*")
    .eq("status", "active")
    .single();

  // 2. Fetch active poll votes
  let activeVotes: Record<number, number> = {};
  if (activePoll) {
    const { data: votes } = await supabase
      .from("poll_votes")
      .select("option_idx")
      .eq("poll_id", activePoll.id);

    activeVotes = (votes || []).reduce((acc, vote) => {
      acc[vote.option_idx] = (acc[vote.option_idx] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
  }

  // 3. Fetch past polls
  const { data: pastPolls } = await supabase
    .from("polls")
    .select("*")
    .eq("status", "closed")
    .order("closed_at", { ascending: false })
    .limit(20);

  // 4. Fetch past polls votes
  const pastVotes: Record<string, Record<number, number>> = {};
  if (pastPolls && pastPolls.length > 0) {
    const pastIds = pastPolls.map((p) => p.id);
    const { data: pVotes } = await supabase
      .from("poll_votes")
      .select("poll_id, option_idx")
      .in("poll_id", pastIds);

    (pVotes || []).forEach((vote) => {
      if (!pastVotes[vote.poll_id]) pastVotes[vote.poll_id] = {};
      pastVotes[vote.poll_id][vote.option_idx] =
        (pastVotes[vote.poll_id][vote.option_idx] || 0) + 1;
    });
  }

  return (
    <AdminPollsClient
      initialActivePoll={activePoll}
      initialActiveVotes={activeVotes}
      initialPastPolls={pastPolls || []}
      initialPastVotes={pastVotes}
    />
  );
}
