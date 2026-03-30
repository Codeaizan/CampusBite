"use client";

import { useState } from "react";
import {
  Store,
  CheckCircle,
  UtensilsCrossed,
  MousePointerClick,
  Plus,
  Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AddKioskModal } from "./AddKioskModal";

interface Kiosk {
  id: string;
  name: string;
  location: string | null;
  is_subscribed: boolean;
  owner_email: string | null;
}

interface Metrics {
  totalKiosks: number;
  subscribed: number;
  totalItems: number;
  totalSwipes: number;
}

interface AdminKiosksClientProps {
  initialKiosks: Kiosk[];
  metrics: Metrics;
}

export function AdminKiosksClient({
  initialKiosks,
  metrics: initialMetrics,
}: AdminKiosksClientProps) {
  const [kiosks, setKiosks] = useState(initialKiosks);
  const [metrics, setMetrics] = useState(initialMetrics);
  const [showAdd, setShowAdd] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const supabase = createClient();

  const toggleSubscription = async (id: string, current: boolean) => {
    // Optimistic update
    setKiosks((prev) =>
      prev.map((k) => (k.id === id ? { ...k, is_subscribed: !current } : k))
    );

    const { error } = await supabase
      .from("kiosks")
      .update({ is_subscribed: !current })
      .eq("id", id);

    if (error) {
      // Revert
      setKiosks((prev) =>
        prev.map((k) => (k.id === id ? { ...k, is_subscribed: current } : k))
      );
    } else {
      setMetrics((prev) => ({
        ...prev,
        subscribed: prev.subscribed + (current ? -1 : 1),
      }));
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(null);
    const { error } = await supabase
      .from("kiosks")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (!error) {
      setKiosks((prev) => prev.filter((k) => k.id !== id));
      setMetrics((prev) => ({
        ...prev,
        totalKiosks: prev.totalKiosks - 1,
        subscribed:
          prev.subscribed -
          (kiosks.find((k) => k.id === id)?.is_subscribed ? 1 : 0),
      }));
    }
  };

  const handleKioskCreated = async () => {
    setShowAdd(false);
    // Refresh data
    const { data } = await supabase
      .from("kiosks")
      .select("id, name, location, is_subscribed, profiles!owner_id(email)")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setKiosks(data.map((k: any) => ({
        id: k.id,
        name: k.name,
        location: k.location,
        is_subscribed: k.is_subscribed,
        owner_email: k.profiles?.email ?? null,
      })));
      setMetrics((prev) => ({
        ...prev,
        totalKiosks: data.length,
        subscribed: data.filter((k: { is_subscribed: boolean }) => k.is_subscribed).length,
      }));
    }
  };

  const metricCards = [
    {
      label: "Total Kiosks",
      value: metrics.totalKiosks,
      icon: Store,
      badge: `${metrics.totalKiosks} active`,
      badgeColor: "text-primary-container bg-primary-container/10",
    },
    {
      label: "Subscribed",
      value: metrics.subscribed,
      icon: CheckCircle,
      badge:
        metrics.totalKiosks > 0
          ? `${Math.round((metrics.subscribed / metrics.totalKiosks) * 100)}% Rate`
          : "0%",
      badgeColor: "text-[#85cfff]",
    },
    {
      label: "Total Items",
      value: metrics.totalItems,
      icon: UtensilsCrossed,
      badge: "Across all menus",
      badgeColor: "text-on-surface/40",
    },
    {
      label: "Total Swipes",
      value: metrics.totalSwipes.toLocaleString(),
      icon: MousePointerClick,
      badge: "All time",
      badgeColor: "text-primary-container bg-primary-container/10",
    },
  ];

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Bento Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {metricCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="bg-surface-container p-6 rounded-2xl relative overflow-hidden group"
                style={{ boxShadow: "0 0 20px rgba(255, 140, 0, 0.08)" }}
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                  <Icon size={48} />
                </div>
                <p className="text-on-surface/40 text-sm font-medium mb-1">
                  {card.label}
                </p>
                <h3 className="text-3xl font-black text-on-surface">
                  {card.value}
                </h3>
                <div className="mt-4">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold ${card.badgeColor}`}
                  >
                    {card.badge}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Manage Kiosks Section */}
        <div className="space-y-6">
          <div className="flex justify-between items-end px-2">
            <div>
              <h2 className="text-3xl font-bold text-on-surface tracking-tight">
                Manage Kiosks
              </h2>
              <p className="text-on-surface/40 text-sm mt-1">
                Review, authorize and moderate campus food vendors.
              </p>
            </div>
            <button
              onClick={() => setShowAdd(true)}
              className="bg-primary-container text-surface-dim font-bold px-6 py-3 rounded-full flex items-center gap-2 hover:brightness-110 transition-all active:scale-95"
              style={{ boxShadow: "0 8px 20px rgba(255, 140, 0, 0.2)" }}
            >
              <Plus size={18} />
              Add Kiosk
            </button>
          </div>

          {/* Table */}
          {kiosks.length > 0 ? (
            <div
              className="bg-surface-container rounded-[1.5rem] overflow-hidden"
              style={{ border: "1px solid rgba(86, 67, 52, 0.1)" }}
            >
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-bright/10 text-on-surface/40 text-xs uppercase tracking-widest font-bold">
                    <th className="px-8 py-5">Kiosk Name</th>
                    <th className="px-6 py-5">Location</th>
                    <th className="px-6 py-5">Owner Email</th>
                    <th className="px-6 py-5">Subscribed</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {kiosks.map((kiosk) => (
                    <tr
                      key={kiosk.id}
                      className="hover:bg-surface-bright/5 transition-colors"
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-primary-container/10 flex items-center justify-center text-primary-container">
                            <Store size={20} />
                          </div>
                          <span className="font-bold text-on-surface">
                            {kiosk.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-on-surface/40 text-sm">
                        {kiosk.location || "—"}
                      </td>
                      <td className="px-6 py-5 text-on-surface/40 text-sm font-mono">
                        {kiosk.owner_email || "Unassigned"}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() =>
                              toggleSubscription(kiosk.id, kiosk.is_subscribed)
                            }
                            className={`w-10 h-5 rounded-full relative transition-colors ${
                              kiosk.is_subscribed
                                ? "bg-primary-container"
                                : "bg-neutral-700"
                            }`}
                          >
                            <div
                              className={`w-3.5 h-3.5 rounded-full shadow-sm absolute top-[3px] transition-all ${
                                kiosk.is_subscribed
                                  ? "right-[3px] bg-white"
                                  : "left-[3px] bg-neutral-400"
                              }`}
                            />
                          </button>
                          <span
                            className={`text-xs font-bold ${
                              kiosk.is_subscribed
                                ? "text-primary-container"
                                : "text-on-surface/30"
                            }`}
                          >
                            {kiosk.is_subscribed ? "Yes" : "No"}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right relative">
                        {deleting === kiosk.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs text-red-400">
                              Delete?
                            </span>
                            <button
                              onClick={() => handleDelete(kiosk.id)}
                              className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-bold hover:bg-red-500/40 transition-colors"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setDeleting(null)}
                              className="px-3 py-1 bg-surface-bright/40 text-on-surface/60 rounded-full text-xs font-bold hover:bg-surface-bright/60 transition-colors"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleting(kiosk.id)}
                            className="p-2 text-on-surface/30 hover:text-red-400 transition-colors rounded-lg hover:bg-red-400/10"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="bg-surface-bright/5 px-8 py-4 flex items-center justify-between text-xs text-on-surface/30">
                <span>
                  Showing {kiosks.length} of {metrics.totalKiosks} Kiosks
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-on-surface/40">
              <Store size={48} className="mx-auto mb-4 opacity-30" />
              <p className="font-bold text-lg">No kiosks yet</p>
              <p className="text-sm mt-1">
                Click &quot;Add Kiosk&quot; to onboard your first vendor.
              </p>
            </div>
          )}
        </div>
      </div>

      {showAdd && (
        <AddKioskModal
          onClose={() => setShowAdd(false)}
          onCreated={handleKioskCreated}
        />
      )}
    </>
  );
}
