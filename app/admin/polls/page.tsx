import { createClient } from "@/lib/supabase/server";
import { AdminPollsClient } from "@/components/admin/AdminPollsClient";

export default async function AdminPollsPage() {
  const supabase = await createClient();

  // Fetch active poll AND past polls in parallel
  const [activeRes, pastPollsRes] = await Promise.all([
    supabase
      .from("polls")
      .select("*")
      .eq("status", "active")
      .single(),
    supabase
      .from("polls")
      .select("*")
      .eq("status", "closed")
      .order("closed_at", { ascending: false })
      .limit(20),
  ]);

  const activePoll = activeRes.data;
  const pastPolls = pastPollsRes.data || [];

  // Fetch votes for active + past polls in parallel
  const [activeVotesRes, pastVotesRes] = await Promise.all([
    activePoll
      ? supabase
          .from("poll_votes")
          .select("poll_id, option_idx")
          .eq("poll_id", activePoll.id)
      : Promise.resolve({ data: null }),
    pastPolls.length > 0
      ? supabase
          .from("poll_votes")
          .select("poll_id, option_idx")
          .in("poll_id", pastPolls.map((p) => p.id))
      : Promise.resolve({ data: null }),
  ]);

  // Process active votes
  let activeVotes: Record<number, number> = {};
  if (activeVotesRes.data) {
    activeVotes = activeVotesRes.data.reduce((acc: Record<number, number>, vote: { option_idx: number }) => {
      acc[vote.option_idx] = (acc[vote.option_idx] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
  }

  // Process past votes
  const pastVotes: Record<string, Record<number, number>> = {};
  if (pastVotesRes.data) {
    pastVotesRes.data.forEach((vote: { poll_id: string; option_idx: number }) => {
      if (!pastVotes[vote.poll_id]) pastVotes[vote.poll_id] = {};
      pastVotes[vote.poll_id][vote.option_idx] =
        (pastVotes[vote.poll_id][vote.option_idx] || 0) + 1;
    });
  }

  return (
    <AdminPollsClient
      initialActivePoll={activePoll}
      initialActiveVotes={activeVotes}
      initialPastPolls={pastPolls}
      initialPastVotes={pastVotes}
    />
  );
}
