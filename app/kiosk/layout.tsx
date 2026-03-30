import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { KioskShellClient } from "./shell-client";

export default async function KioskLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/kiosk");
  }

  // Verify role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, kiosk_id")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "kiosk_owner") {
    redirect("/");
  }

  // Fetch kiosk name
  let kioskName = "My Kiosk";
  if (profile?.kiosk_id) {
    const { data: kiosk } = await supabase
      .from("kiosks")
      .select("name")
      .eq("id", profile.kiosk_id)
      .single();
    if (kiosk?.name) {
      kioskName = kiosk.name;
    }
  }

  return <KioskShellClient kioskName={kioskName}>{children}</KioskShellClient>;
}
