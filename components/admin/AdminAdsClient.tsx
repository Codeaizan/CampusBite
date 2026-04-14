"use client";

import { useMemo, useState } from "react";
import {
  Megaphone,
  MousePointerClick,
  Eye,
  Trash2,
  Plus,
  CheckCircle2,
  PauseCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AD_PLACEMENTS, type AdPlacement } from "@/lib/ads";

interface AdminAd {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  click_url: string | null;
  cta_label: string;
  placements: AdPlacement[];
  is_active: boolean;
  priority: number;
  weight: number;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
}

interface Metrics {
  totalAds: number;
  activeAds: number;
  impressions: number;
  clicks: number;
}

interface AdminAdsClientProps {
  initialAds: AdminAd[];
  metrics: Metrics;
}

const placementLabels: Partial<Record<AdPlacement, string>> = {
  swipe_deck: "Swipe Deck",
  trends_inline: "Trends Inline",
  daily_limit: "Daily Limit",
  all_caught_up: "All Caught Up",
  profile_slot: "Profile Slot",
  wishlist_inline: "Wishlist Inline",
};

const creatablePlacements = AD_PLACEMENTS.filter(
  (placement) => placement !== "stats_slot"
);

function parseDateTime(value: string): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

export function AdminAdsClient({ initialAds, metrics }: AdminAdsClientProps) {
  const supabase = createClient();

  const [ads, setAds] = useState<AdminAd[]>(initialAds);
  const [stats, setStats] = useState<Metrics>(metrics);
  const [saving, setSaving] = useState(false);
  const [busyAdId, setBusyAdId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [clickUrl, setClickUrl] = useState("");
  const [ctaLabel, setCtaLabel] = useState("Learn More");
  const [selectedPlacements, setSelectedPlacements] = useState<AdPlacement[]>([]);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [priority, setPriority] = useState(0);
  const [weight, setWeight] = useState(100);
  const [isActive, setIsActive] = useState(true);

  const ctr = useMemo(() => {
    if (stats.impressions === 0) return 0;
    return (stats.clicks / stats.impressions) * 100;
  }, [stats.clicks, stats.impressions]);

  const clearForm = () => {
    setTitle("");
    setDescription("");
    setImageUrl("");
    setClickUrl("");
    setCtaLabel("Learn More");
    setSelectedPlacements([]);
    setStartsAt("");
    setEndsAt("");
    setPriority(0);
    setWeight(100);
    setIsActive(true);
  };

  const handlePlacementToggle = (placement: AdPlacement) => {
    setSelectedPlacements((prev) =>
      prev.includes(placement)
        ? prev.filter((p) => p !== placement)
        : [...prev, placement]
    );
  };

  const handleCreateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!title.trim() || !imageUrl.trim()) {
      setFormError("Title and image URL are required.");
      return;
    }

    if (selectedPlacements.length === 0) {
      setFormError("Select at least one placement.");
      return;
    }

    const startsAtIso = parseDateTime(startsAt);
    const endsAtIso = parseDateTime(endsAt);
    if (startsAtIso && endsAtIso && startsAtIso >= endsAtIso) {
      setFormError("End time must be later than start time.");
      return;
    }

    setSaving(true);

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      image_url: imageUrl.trim(),
      click_url: clickUrl.trim() || null,
      cta_label: ctaLabel.trim() || "Learn More",
      placements: selectedPlacements,
      is_active: isActive,
      priority,
      weight: Math.max(1, weight),
      starts_at: startsAtIso,
      ends_at: endsAtIso,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("ads")
      .insert(payload)
      .select(
        "id, title, description, image_url, click_url, cta_label, placements, is_active, priority, weight, starts_at, ends_at, created_at"
      )
      .single();

    if (error || !data) {
      setFormError(error?.message ?? "Could not create ad.");
      setSaving(false);
      return;
    }

    const newAd: AdminAd = {
      id: data.id,
      title: data.title,
      description: data.description,
      image_url: data.image_url,
      click_url: data.click_url,
      cta_label: data.cta_label,
      placements: data.placements as AdPlacement[],
      is_active: data.is_active,
      priority: data.priority,
      weight: data.weight,
      starts_at: data.starts_at,
      ends_at: data.ends_at,
      created_at: data.created_at,
    };

    setAds((prev) => [newAd, ...prev]);
    setStats((prev) => ({
      ...prev,
      totalAds: prev.totalAds + 1,
      activeAds: prev.activeAds + (newAd.is_active ? 1 : 0),
    }));
    setFormSuccess("Ad created successfully.");
    clearForm();
    setSaving(false);
  };

  const handleToggleActive = async (ad: AdminAd) => {
    const nextValue = !ad.is_active;
    setBusyAdId(ad.id);

    const { error } = await supabase
      .from("ads")
      .update({ is_active: nextValue, updated_at: new Date().toISOString() })
      .eq("id", ad.id);

    if (!error) {
      setAds((prev) =>
        prev.map((row) =>
          row.id === ad.id ? { ...row, is_active: nextValue } : row
        )
      );
      setStats((prev) => ({
        ...prev,
        activeAds: prev.activeAds + (nextValue ? 1 : -1),
      }));
    }

    setBusyAdId(null);
  };

  const handleDelete = async (ad: AdminAd) => {
    setBusyAdId(ad.id);

    const { error } = await supabase.from("ads").delete().eq("id", ad.id);
    if (!error) {
      setAds((prev) => prev.filter((row) => row.id !== ad.id));
      setStats((prev) => ({
        ...prev,
        totalAds: Math.max(0, prev.totalAds - 1),
        activeAds: Math.max(0, prev.activeAds - (ad.is_active ? 1 : 0)),
      }));
    }

    setBusyAdId(null);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tighter text-on-surface">
            Ads Manager
          </h2>
          <p className="text-on-surface/40 text-sm mt-2">
            Create and control sponsored cards across student experiences.
          </p>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-surface-container rounded-2xl p-5">
          <p className="text-xs uppercase tracking-widest text-on-surface/40 font-bold">Total Ads</p>
          <p className="text-3xl font-black text-on-surface mt-2">{stats.totalAds}</p>
        </div>
        <div className="bg-surface-container rounded-2xl p-5">
          <p className="text-xs uppercase tracking-widest text-on-surface/40 font-bold">Active Ads</p>
          <p className="text-3xl font-black text-primary-container mt-2">{stats.activeAds}</p>
        </div>
        <div className="bg-surface-container rounded-2xl p-5">
          <p className="text-xs uppercase tracking-widest text-on-surface/40 font-bold">Impressions</p>
          <p className="text-3xl font-black text-on-surface mt-2">{stats.impressions}</p>
        </div>
        <div className="bg-surface-container rounded-2xl p-5">
          <p className="text-xs uppercase tracking-widest text-on-surface/40 font-bold">CTR</p>
          <p className="text-3xl font-black text-blue-400 mt-2">{ctr.toFixed(2)}%</p>
          <p className="text-on-surface/40 text-xs mt-1">{stats.clicks} clicks</p>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-5 bg-surface-container rounded-3xl p-6">
          <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <Plus size={20} className="text-primary-container" />
            Create New Ad
          </h3>

          <form onSubmit={handleCreateAd} className="space-y-4 mt-5">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ad title"
              className="w-full rounded-xl bg-surface-container-highest/50 px-4 py-3 text-sm text-on-surface placeholder:text-on-surface/30"
            />

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              rows={3}
              className="w-full rounded-xl bg-surface-container-highest/50 px-4 py-3 text-sm text-on-surface placeholder:text-on-surface/30 resize-none"
            />

            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Image URL"
              className="w-full rounded-xl bg-surface-container-highest/50 px-4 py-3 text-sm text-on-surface placeholder:text-on-surface/30"
            />

            <input
              value={clickUrl}
              onChange={(e) => setClickUrl(e.target.value)}
              placeholder="Click URL (optional)"
              className="w-full rounded-xl bg-surface-container-highest/50 px-4 py-3 text-sm text-on-surface placeholder:text-on-surface/30"
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                value={ctaLabel}
                onChange={(e) => setCtaLabel(e.target.value)}
                placeholder="CTA label"
                className="rounded-xl bg-surface-container-highest/50 px-4 py-3 text-sm text-on-surface placeholder:text-on-surface/30"
              />

              <label className="flex items-center gap-2 rounded-xl bg-surface-container-highest/50 px-4 py-3 text-sm text-on-surface">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                Active now
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="rounded-xl bg-surface-container-highest/50 px-4 py-3 text-sm text-on-surface"
              />
              <input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="rounded-xl bg-surface-container-highest/50 px-4 py-3 text-sm text-on-surface"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value || 0))}
                placeholder="Priority"
                className="rounded-xl bg-surface-container-highest/50 px-4 py-3 text-sm text-on-surface"
              />
              <input
                type="number"
                min={1}
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value || 1))}
                placeholder="Weight"
                className="rounded-xl bg-surface-container-highest/50 px-4 py-3 text-sm text-on-surface"
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-widest text-on-surface/40 font-bold">Placements</p>
              <div className="grid grid-cols-2 gap-2">
                {creatablePlacements.map((placement) => (
                  <label
                    key={placement}
                    className="flex items-center gap-2 rounded-xl bg-surface-container-highest/50 px-3 py-2 text-xs text-on-surface"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPlacements.includes(placement)}
                      onChange={() => handlePlacementToggle(placement)}
                    />
                    {placementLabels[placement] ?? "Hidden Placement"}
                  </label>
                ))}
              </div>
            </div>

            {formError && (
              <p className="text-xs text-red-300 bg-red-400/10 rounded-xl px-3 py-2">{formError}</p>
            )}
            {formSuccess && (
              <p className="text-xs text-green-300 bg-green-400/10 rounded-xl px-3 py-2">{formSuccess}</p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-full bg-primary-container text-surface-dim font-bold py-3 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create Ad"}
            </button>
          </form>
        </div>

        <div className="xl:col-span-7 space-y-6">
          <div className="bg-surface-container rounded-3xl p-6">
            <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
              <Megaphone size={20} className="text-blue-400" />
              Running Ads
            </h3>

            <div className="space-y-4 mt-5 max-h-[780px] overflow-y-auto pr-2">
              {ads.length === 0 && (
                <div className="text-center py-14 text-on-surface/40">No ads created yet.</div>
              )}

              {ads.map((ad) => {
                const isBusy = busyAdId === ad.id;

                return (
                  <article key={ad.id} className="rounded-2xl bg-surface-container-highest/30 p-4">
                    <div className="flex gap-4">
                      <div className="relative w-28 h-20 rounded-xl overflow-hidden shrink-0 bg-surface-container-highest">
                        <img
                          src={ad.image_url}
                          alt={ad.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <h4 className="font-bold text-on-surface truncate">{ad.title}</h4>
                          {ad.is_active ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-green-500/10 text-green-400">
                              <CheckCircle2 size={12} /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-neutral-500/20 text-neutral-300">
                              <PauseCircle size={12} /> Paused
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-on-surface/50 line-clamp-2">
                          {ad.description || "No description provided."}
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {ad.placements
                            .filter((placement) => placement !== "stats_slot")
                            .map((placement) => (
                            <span
                              key={`${ad.id}-${placement}`}
                              className="text-[10px] font-bold px-2 py-1 rounded-full bg-blue-500/10 text-blue-300"
                            >
                              {placementLabels[placement] ?? "Hidden Placement"}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-on-surface/40">
                          <span>Priority {ad.priority}</span>
                          <span>Weight {ad.weight}</span>
                          {ad.click_url && (
                            <span className="inline-flex items-center gap-1">
                              <MousePointerClick size={11} /> Clickable
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <Eye size={11} /> {new Date(ad.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => handleToggleActive(ad)}
                            disabled={isBusy}
                            className="px-3 py-1.5 rounded-full text-xs font-bold bg-blue-500 text-white hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                          >
                            {ad.is_active ? "Pause" : "Activate"}
                          </button>
                          <button
                            onClick={() => handleDelete(ad)}
                            disabled={isBusy}
                            className="px-3 py-1.5 rounded-full text-xs font-bold bg-red-500/90 text-white hover:bg-red-500 active:scale-95 transition-all disabled:opacity-50 inline-flex items-center gap-1"
                          >
                            <Trash2 size={12} /> Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="bg-surface-container rounded-3xl p-6">
            <h3 className="text-lg font-bold text-on-surface">Creative Specs</h3>
            <div className="mt-3 text-sm text-on-surface/60 space-y-1">
              <p>Swipe deck card: 1080 x 1440 (3:4)</p>
              <p>Inline feed card: 1200 x 675 (16:9)</p>
              <p>Spotlight card: 1080 x 1350 (4:5)</p>
              <p>Recommended format: WebP under 400 KB, with clear Sponsored labeling.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
