import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface UseLiveLocationProps {
  userId: string;
  isEnabled: boolean;
}

export function useLiveLocation({ userId, isEnabled }: UseLiveLocationProps) {
  useEffect(() => {
    if (!isEnabled || typeof navigator === "undefined" || !userId) return;

    let watchId: number;
    let channel: ReturnType<ReturnType<typeof createClient>["channel"]>;

    const initTracking = async () => {
      const supabase = createClient();
      
      // Fetch user profile info optionally if we want pseudoName. For now, ID is fine
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();
      
      // Only track students
      if (profile?.role !== "student") return;

      channel = supabase.channel("campus-presence", {
        config: {
          presence: {
            key: userId,
          },
        },
      });

      channel.on("presence", { event: "sync" }, () => {
        // Connected
      }).subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          // Setup geolocation watcher
          watchId = navigator.geolocation.watchPosition(
            async (position) => {
              const location = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                timestamp: position.timestamp,
              };
              
              await channel.track({
                userId,
                location,
                updatedAt: new Date().toISOString()
              });
            },
            (error) => {
              console.warn("Location tracking error:", error.message);
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0,
            }
          );
        }
      });
    };

    initTracking();

    return () => {
      if (watchId !== undefined && typeof navigator !== "undefined") {
        navigator.geolocation.clearWatch(watchId);
      }
      if (channel) {
        channel.untrack();
      }
    };
  }, [isEnabled, userId]);
}
