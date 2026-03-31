import { LiveMapClient } from "@/components/admin/LiveMapClient";

export const metadata = {
  title: "Live Campus Map | Super Admin",
  description: "Real-time location of active students on campus.",
};

export default function LiveMapPage() {
  return (
    <div className="flex-1 p-8 h-[calc(100vh-theme(spacing.8))] overflow-hidden flex flex-col">
      <LiveMapClient />
    </div>
  );
}
