import { createClient } from "@/lib/supabase/server";
import { ChangeEmailForm } from "@/components/kiosk/ChangeEmailForm";
import { Settings } from "lucide-react";

export default async function KioskSettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", user.id)
    .single();

  const currentEmail = profile?.email ?? user.email ?? "";

  return (
    <div className="px-6 space-y-8 pb-8">
      {/* Header */}
      <section className="pt-2 space-y-1">
        <div className="flex items-center gap-3">
          <Settings size={22} className="text-blue-500" />
          <h2 className="text-2xl font-bold tracking-tight text-on-surface">
            Account Settings
          </h2>
        </div>
        <p className="text-on-surface/50 text-sm pl-[34px]">
          Manage your account credentials
        </p>
      </section>

      {/* Change Email */}
      <ChangeEmailForm currentEmail={currentEmail} userId={user.id} />

      {/* Account Info */}
      <div className="rounded-3xl p-6 space-y-4 bg-surface-container">
        <h3 className="font-bold text-on-surface">Account Info</h3>
        <div className="space-y-3">
          <div className="bg-surface-container-highest/30 rounded-xl p-4 space-y-1">
            <p className="text-[10px] text-on-surface/40 uppercase tracking-widest font-bold">
              Name
            </p>
            <p className="text-on-surface text-sm">
              {profile?.full_name ?? "Kiosk Owner"}
            </p>
          </div>
          <div className="bg-surface-container-highest/30 rounded-xl p-4 space-y-1">
            <p className="text-[10px] text-on-surface/40 uppercase tracking-widest font-bold">
              User ID
            </p>
            <p className="text-on-surface/50 font-mono text-xs truncate">
              {user.id}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
