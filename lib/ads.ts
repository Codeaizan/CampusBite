export const AD_PLACEMENTS = [
  "swipe_deck",
  "trends_inline",
  "daily_limit",
  "all_caught_up",
  "profile_slot",
  "stats_slot",
  "wishlist_inline",
] as const;

export type AdPlacement = (typeof AD_PLACEMENTS)[number];

export interface AppAd {
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
  created_at: string | null;
}

export type InterleavedEntry<T> =
  | { kind: "content"; item: T }
  | { kind: "ad"; ad: AppAd };

const AD_GAP_PATTERN = [8, 9, 10] as const;

function asDateMs(value: string | null): number | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export function isAdInSchedule(ad: AppAd, nowMs = Date.now()): boolean {
  const startsAt = asDateMs(ad.starts_at);
  const endsAt = asDateMs(ad.ends_at);

  if (startsAt !== null && startsAt > nowMs) return false;
  if (endsAt !== null && endsAt < nowMs) return false;
  return true;
}

export function normalizeAndFilterAds(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rows: any[] | null | undefined,
  placement: AdPlacement,
  nowMs = Date.now()
): AppAd[] {
  return (rows ?? [])
    .map((row) => ({
      id: String(row.id),
      title: String(row.title ?? "Sponsored"),
      description:
        row.description === null || row.description === undefined
          ? null
          : String(row.description),
      image_url: String(row.image_url ?? ""),
      click_url:
        row.click_url === null || row.click_url === undefined
          ? null
          : String(row.click_url),
      cta_label: String(row.cta_label ?? "Learn More"),
      placements: (Array.isArray(row.placements)
        ? row.placements
        : []) as AdPlacement[],
      is_active: Boolean(row.is_active),
      priority: Number(row.priority ?? 0),
      weight: Math.max(1, Number(row.weight ?? 100)),
      starts_at:
        row.starts_at === null || row.starts_at === undefined
          ? null
          : String(row.starts_at),
      ends_at:
        row.ends_at === null || row.ends_at === undefined
          ? null
          : String(row.ends_at),
      created_at:
        row.created_at === null || row.created_at === undefined
          ? null
          : String(row.created_at),
    }))
    .filter(
      (ad) =>
        ad.image_url.length > 0 &&
        ad.is_active &&
        ad.placements.includes(placement) &&
        isAdInSchedule(ad, nowMs)
    );
}

export function pickWeightedAd(ads: AppAd[], slotIndex: number): AppAd | null {
  if (ads.length === 0) return null;

  const totalWeight = ads.reduce((sum, ad) => sum + Math.max(1, ad.weight), 0);
  let cursor = slotIndex % totalWeight;

  for (const ad of ads) {
    cursor -= Math.max(1, ad.weight);
    if (cursor < 0) {
      return ad;
    }
  }

  return ads[slotIndex % ads.length] ?? null;
}

export function interleaveWithAds<T>(
  items: T[],
  ads: AppAd[]
): InterleavedEntry<T>[] {
  if (ads.length === 0 || items.length === 0) {
    return items.map((item) => ({ kind: "content", item }));
  }

  const out: InterleavedEntry<T>[] = [];
  let shownContentCount = 0;
  let nextBreak = 4;
  let gapIndex = 0;
  let adSlotIndex = 0;

  for (const item of items) {
    out.push({ kind: "content", item });
    shownContentCount += 1;

    if (shownContentCount === nextBreak) {
      const ad = pickWeightedAd(ads, adSlotIndex);
      if (ad) {
        out.push({ kind: "ad", ad });
      }
      adSlotIndex += 1;
      nextBreak += AD_GAP_PATTERN[gapIndex % AD_GAP_PATTERN.length];
      gapIndex += 1;
    }
  }

  return out;
}

export function pickTopAd(ads: AppAd[]): AppAd | null {
  if (ads.length === 0) return null;
  return ads[0];
}
