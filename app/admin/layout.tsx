import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminShellClient } from "./shell-client";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/x-control-9f3k");
  }

  // Verify role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "super_admin") {
    redirect("/");
  }

  return <AdminShellClient>{children}</AdminShellClient>;
}
