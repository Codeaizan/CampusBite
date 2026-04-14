-- ============================================================
-- CampusBite — Ads System
-- ============================================================

CREATE TYPE public.ad_placement AS ENUM (
  'swipe_deck',
  'trends_inline',
  'daily_limit',
  'all_caught_up',
  'profile_slot',
  'stats_slot',
  'wishlist_inline'
);

CREATE TYPE public.ad_event_type AS ENUM ('impression', 'click');

CREATE TABLE public.ads (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  description text,
  image_url   text NOT NULL,
  click_url   text,
  cta_label   text NOT NULL DEFAULT 'Learn More',
  placements  public.ad_placement[] NOT NULL CHECK (cardinality(placements) > 0),
  is_active   boolean NOT NULL DEFAULT true,
  priority    integer NOT NULL DEFAULT 0,
  weight      integer NOT NULL DEFAULT 100 CHECK (weight > 0),
  starts_at   timestamptz,
  ends_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CHECK (starts_at IS NULL OR ends_at IS NULL OR starts_at < ends_at)
);

CREATE TABLE public.ad_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id       uuid NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  placement   public.ad_placement NOT NULL,
  event_type  public.ad_event_type NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ads_active_priority_idx
  ON public.ads (is_active, priority DESC, created_at DESC);

CREATE INDEX ads_placements_gin_idx
  ON public.ads USING GIN (placements);

CREATE INDEX ad_events_ad_created_idx
  ON public.ad_events (ad_id, created_at DESC);

CREATE INDEX ad_events_user_created_idx
  ON public.ad_events (user_id, created_at DESC);

CREATE INDEX ad_events_event_created_idx
  ON public.ad_events (event_type, created_at DESC);

ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_events ENABLE ROW LEVEL SECURITY;

-- Ads are visible to all authenticated users.
CREATE POLICY "ads_select_authenticated" ON public.ads
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Super admin can fully manage ads.
CREATE POLICY "ads_all_admin" ON public.ads
  FOR ALL
  USING (public.get_my_role() = 'super_admin')
  WITH CHECK (public.get_my_role() = 'super_admin');

-- Any authenticated user can log their own ad interactions.
CREATE POLICY "ad_events_insert_own" ON public.ad_events
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
  );

-- Super admin can read ad analytics.
CREATE POLICY "ad_events_select_admin" ON public.ad_events
  FOR SELECT USING (public.get_my_role() = 'super_admin');

-- Super admin can fully manage event rows if needed.
CREATE POLICY "ad_events_all_admin" ON public.ad_events
  FOR ALL
  USING (public.get_my_role() = 'super_admin')
  WITH CHECK (public.get_my_role() = 'super_admin');
