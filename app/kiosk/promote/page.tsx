import { createClient } from "@/lib/supabase/server";
import { PromoteClient } from "@/components/kiosk/PromoteClient";

export default async function PromotePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // We need the Kiosk ID to generate the QR code
  const { data: profile } = await supabase
    .from("profiles")
    .select("kiosk_id")
    .eq("id", user.id)
    .single();

  const kioskId = profile?.kiosk_id;

  if (!kioskId) {
    return (
      <div className="px-6 space-y-8 pb-8 text-center text-on-surface/50 mt-20">
        <p>You do not have a kiosk assigned yet.</p>
      </div>
    );
  }

  // Get Kiosk Name
  const { data: kiosk } = await supabase
    .from("kiosks")
    .select("name")
    .eq("id", kioskId)
    .single();

  return (
    <PromoteClient
      kioskId={kioskId}
      kioskName={kiosk?.name ?? "Your Kiosk"}
    />
  );
}
