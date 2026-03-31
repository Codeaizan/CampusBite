import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudentBottomNav } from "./bottom-nav";
import { GlobalBanner } from "@/components/student/GlobalBanner";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/student");
  }

  const { data: config } = await supabase
    .from("config")
    .select("value")
    .eq("key", "broadcast_message")
    .single();
    
  const broadcastMessage = config?.value?.message ?? "";

  return (
    <div className="flex min-h-[100dvh] flex-col bg-surface-dim relative">
      <GlobalBanner message={broadcastMessage} />
      <main className="flex-1 pb-24">{children}</main>
      <StudentBottomNav />
    </div>
  );
}
