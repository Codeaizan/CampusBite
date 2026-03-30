import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudentBottomNav } from "./bottom-nav";

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

  return (
    <div className="flex min-h-[100dvh] flex-col bg-surface-dim">
      <main className="flex-1 pb-24">{children}</main>
      <StudentBottomNav />
    </div>
  );
}
