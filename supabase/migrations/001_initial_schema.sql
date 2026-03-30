-- ============================================================
-- CampusBite — Initial Database Schema Migration
-- ============================================================
-- Run this migration against your Supabase project to set up
-- all tables, enums, functions, triggers, RLS policies, and
-- seed data required by the application.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- a) ENUMS
-- ────────────────────────────────────────────────────────────
CREATE TYPE public.user_role AS ENUM ('student', 'kiosk_owner', 'super_admin');
CREATE TYPE public.swipe_direction AS ENUM ('like', 'dislike', 'want_to_try');
CREATE TYPE public.feedback_type AS ENUM ('liked', 'disliked');
CREATE TYPE public.poll_status AS ENUM ('active', 'closed');

-- ────────────────────────────────────────────────────────────
-- b) TABLES
-- ────────────────────────────────────────────────────────────

-- profiles: user profile data, linked to auth.users
CREATE TABLE public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text NOT NULL,
  full_name   text,
  avatar_url  text,
  role        public.user_role NOT NULL DEFAULT 'student',
  kiosk_id    uuid,                       -- set for kiosk_owner users only
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- kiosks: campus food kiosks
CREATE TABLE public.kiosks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  description     text,
  location        text,
  image_url       text,
  owner_id        uuid REFERENCES public.profiles(id),
  is_subscribed   boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz                         -- soft delete; never hard delete
);

-- Add FK from profiles.kiosk_id → kiosks.id (deferred because of circular reference)
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_kiosk_id_fkey
  FOREIGN KEY (kiosk_id) REFERENCES public.kiosks(id);

-- categories: food categories
CREATE TABLE public.categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL UNIQUE,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- items: food items belonging to a kiosk
CREATE TABLE public.items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kiosk_id      uuid NOT NULL REFERENCES public.kiosks(id) ON DELETE CASCADE,
  category_id   uuid REFERENCES public.categories(id),
  name          text NOT NULL,
  description   text,
  price         numeric(10,2),
  image_url     text,
  is_veg        boolean NOT NULL DEFAULT false,
  is_available  boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz                           -- soft delete
);

-- swipes: student swipe interactions on items
CREATE TABLE public.swipes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_id     uuid NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  direction   public.swipe_direction NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT swipes_user_item_unique UNIQUE (user_id, item_id)
);

-- daily_swipe_counts: tracks daily swipe counts per user
CREATE TABLE public.daily_swipe_counts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  swipe_date  date NOT NULL DEFAULT CURRENT_DATE,
  count       integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT daily_swipe_counts_user_date_unique UNIQUE (user_id, swipe_date)
);

-- polls: app-wide polls (only 1 active at a time)
CREATE TABLE public.polls (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question    text NOT NULL,
  options     jsonb NOT NULL DEFAULT '[]'::jsonb,
  status      public.poll_status NOT NULL DEFAULT 'active',
  created_by  uuid REFERENCES public.profiles(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  closed_at   timestamptz
);

-- poll_votes: individual poll votes
CREATE TABLE public.poll_votes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id     uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  option_idx  integer NOT NULL,              -- index into polls.options array
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT poll_votes_poll_user_unique UNIQUE (poll_id, user_id)
);

-- feedback: student feedback on food items
CREATE TABLE public.feedback (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_id     uuid NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  kiosk_id    uuid NOT NULL REFERENCES public.kiosks(id) ON DELETE CASCADE,
  type        public.feedback_type NOT NULL,
  comment     text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- config: app-wide key/value configuration
CREATE TABLE public.config (
  key         text PRIMARY KEY,
  value       jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- c) CONSTRAINTS
-- ────────────────────────────────────────────────────────────

-- Only one poll can have status='active' at a time
-- (partial unique index on a constant expression)
CREATE UNIQUE INDEX polls_single_active_idx
  ON public.polls ((true))
  WHERE status = 'active';

-- ────────────────────────────────────────────────────────────
-- d) WILSON SCORE FUNCTION
-- ────────────────────────────────────────────────────────────

-- Wilson Score lower bound — 95% confidence interval
-- z = 1.96 for 95% confidence
-- Formula: (p + z²/2n − z * sqrt((p(1−p) + z²/4n) / n)) / (1 + z²/n)
CREATE OR REPLACE FUNCTION public.wilson_score(likes integer, total integer)
RETURNS float
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  z   float := 1.96;
  p   float;
  n   float;
BEGIN
  IF total = 0 THEN
    RETURN 0;
  END IF;

  n := total::float;
  p := likes::float / n;

  RETURN (
    (p + (z * z) / (2 * n) - z * sqrt((p * (1 - p) + (z * z) / (4 * n)) / n))
    / (1 + (z * z) / n)
  );
END;
$$;

-- ────────────────────────────────────────────────────────────
-- e) HELPER FUNCTIONS (SECURITY DEFINER)
-- ────────────────────────────────────────────────────────────

-- get_my_role(): returns the current user's role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- get_my_kiosk_id(): returns the current user's kiosk_id
CREATE OR REPLACE FUNCTION public.get_my_kiosk_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT kiosk_id FROM public.profiles WHERE id = auth.uid();
$$;

-- is_my_kiosk_subscribed(): returns whether user's kiosk is subscribed
CREATE OR REPLACE FUNCTION public.is_my_kiosk_subscribed()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(k.is_subscribed, false)
  FROM public.profiles p
  LEFT JOIN public.kiosks k ON k.id = p.kiosk_id
  WHERE p.id = auth.uid();
$$;

-- within_feedback_rate_limit(): true if user has fewer than 3 feedback rows in last 1 hour
CREATE OR REPLACE FUNCTION public.within_feedback_rate_limit()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    SELECT count(*) FROM public.feedback
    WHERE user_id = auth.uid()
      AND created_at > now() - interval '1 hour'
  ) < 3;
$$;

-- ────────────────────────────────────────────────────────────
-- f) TRIGGER: auto-create profiles row on new user signup
-- ────────────────────────────────────────────────────────────

-- ⚠️  Change this constant to your super admin email address
-- so that the first admin account gets the correct role automatically.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  super_admin_email CONSTANT text := 'admin@campusbite.com';
  new_role public.user_role;
BEGIN
  -- Determine role based on email
  IF NEW.email = super_admin_email THEN
    new_role := 'super_admin';
  ELSE
    new_role := 'student';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', NEW.raw_user_meta_data ->> 'picture', ''),
    new_role
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ────────────────────────────────────────────────────────────
-- g) ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────

-- Enable RLS on every table
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kiosks            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swipes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_swipe_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polls             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config            ENABLE ROW LEVEL SECURITY;

-- ─── profiles ───────────────────────────────────────────────

-- Users can read their own profile
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- Super admin can read all profiles
CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR SELECT USING (public.get_my_role() = 'super_admin');

-- Super admin can update all profiles
CREATE POLICY "profiles_update_admin" ON public.profiles
  FOR UPDATE USING (public.get_my_role() = 'super_admin');

-- Super admin can insert profiles (for creating kiosk owner accounts)
CREATE POLICY "profiles_insert_admin" ON public.profiles
  FOR INSERT WITH CHECK (public.get_my_role() = 'super_admin');

-- ─── kiosks ─────────────────────────────────────────────────

-- All authenticated users can read non-deleted kiosks
CREATE POLICY "kiosks_select_all" ON public.kiosks
  FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND deleted_at IS NULL
  );

-- Kiosk owners can read their own kiosk (even if soft-deleted, for admin purposes)
CREATE POLICY "kiosks_select_own" ON public.kiosks
  FOR SELECT USING (owner_id = auth.uid());

-- Kiosk owners can update their own kiosk
CREATE POLICY "kiosks_update_own" ON public.kiosks
  FOR UPDATE USING (owner_id = auth.uid());

-- Super admin: full access to kiosks
CREATE POLICY "kiosks_all_admin" ON public.kiosks
  FOR ALL USING (public.get_my_role() = 'super_admin');

-- ─── categories ─────────────────────────────────────────────

-- All authenticated users can read categories
CREATE POLICY "categories_select_all" ON public.categories
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Super admin can manage categories
CREATE POLICY "categories_all_admin" ON public.categories
  FOR ALL USING (public.get_my_role() = 'super_admin');

-- ─── items ──────────────────────────────────────────────────

-- Students can read available, non-deleted items
CREATE POLICY "items_select_students" ON public.items
  FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND is_available = true
    AND deleted_at IS NULL
  );

-- Kiosk owners can read all their own items (including unavailable/deleted)
CREATE POLICY "items_select_own" ON public.items
  FOR SELECT USING (kiosk_id = public.get_my_kiosk_id());

-- Kiosk owners can insert items into their own kiosk
CREATE POLICY "items_insert_own" ON public.items
  FOR INSERT WITH CHECK (kiosk_id = public.get_my_kiosk_id());

-- Kiosk owners can update their own items
CREATE POLICY "items_update_own" ON public.items
  FOR UPDATE USING (kiosk_id = public.get_my_kiosk_id());

-- Kiosk owners can delete their own items
CREATE POLICY "items_delete_own" ON public.items
  FOR DELETE USING (kiosk_id = public.get_my_kiosk_id());

-- Super admin: full access to items
CREATE POLICY "items_all_admin" ON public.items
  FOR ALL USING (public.get_my_role() = 'super_admin');

-- ─── swipes ─────────────────────────────────────────────────

-- Students can read their own swipes
CREATE POLICY "swipes_select_own" ON public.swipes
  FOR SELECT USING (user_id = auth.uid());

-- Students can insert their own swipes
CREATE POLICY "swipes_insert_own" ON public.swipes
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND public.get_my_role() = 'student'
  );

-- Students can delete their own swipes (for history reset)
CREATE POLICY "swipes_delete_own" ON public.swipes
  FOR DELETE USING (user_id = auth.uid());

-- Kiosk owners can read swipes on their items (for stats)
CREATE POLICY "swipes_select_kiosk" ON public.swipes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.items
      WHERE items.id = swipes.item_id
        AND items.kiosk_id = public.get_my_kiosk_id()
    )
  );

-- Super admin: full access to swipes
CREATE POLICY "swipes_all_admin" ON public.swipes
  FOR ALL USING (public.get_my_role() = 'super_admin');

-- ─── daily_swipe_counts ─────────────────────────────────────

-- Students can read their own daily counts
CREATE POLICY "daily_swipe_counts_select_own" ON public.daily_swipe_counts
  FOR SELECT USING (user_id = auth.uid());

-- Students can insert/update their own daily counts
CREATE POLICY "daily_swipe_counts_insert_own" ON public.daily_swipe_counts
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "daily_swipe_counts_update_own" ON public.daily_swipe_counts
  FOR UPDATE USING (user_id = auth.uid());

-- Super admin: full access
CREATE POLICY "daily_swipe_counts_all_admin" ON public.daily_swipe_counts
  FOR ALL USING (public.get_my_role() = 'super_admin');

-- ─── polls ──────────────────────────────────────────────────

-- All authenticated users can read polls
CREATE POLICY "polls_select_all" ON public.polls
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Super admin can manage polls
CREATE POLICY "polls_all_admin" ON public.polls
  FOR ALL USING (public.get_my_role() = 'super_admin');

-- ─── poll_votes ─────────────────────────────────────────────

-- Students can read their own votes
CREATE POLICY "poll_votes_select_own" ON public.poll_votes
  FOR SELECT USING (user_id = auth.uid());

-- Students can cast votes
CREATE POLICY "poll_votes_insert_own" ON public.poll_votes
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND public.get_my_role() = 'student'
  );

-- Kiosk owners can read all votes on polls (for subscribed owners' poll results)
CREATE POLICY "poll_votes_select_kiosk" ON public.poll_votes
  FOR SELECT USING (
    public.get_my_role() = 'kiosk_owner'
    AND public.is_my_kiosk_subscribed()
  );

-- Super admin: full access
CREATE POLICY "poll_votes_all_admin" ON public.poll_votes
  FOR ALL USING (public.get_my_role() = 'super_admin');

-- ─── feedback ───────────────────────────────────────────────

-- Students can insert feedback (rate limited: max 3 per hour)
CREATE POLICY "feedback_insert_student" ON public.feedback
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND public.get_my_role() = 'student'
    AND public.within_feedback_rate_limit()
  );

-- Students can read their own feedback
CREATE POLICY "feedback_select_own" ON public.feedback
  FOR SELECT USING (user_id = auth.uid());

-- Subscribed kiosk owners can read feedback for their kiosk
CREATE POLICY "feedback_select_kiosk" ON public.feedback
  FOR SELECT USING (
    kiosk_id = public.get_my_kiosk_id()
    AND public.is_my_kiosk_subscribed()
  );

-- Super admin: full access
CREATE POLICY "feedback_all_admin" ON public.feedback
  FOR ALL USING (public.get_my_role() = 'super_admin');

-- ─── config ─────────────────────────────────────────────────

-- All authenticated users can read config
CREATE POLICY "config_select_all" ON public.config
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Super admin can manage config
CREATE POLICY "config_all_admin" ON public.config
  FOR ALL USING (public.get_my_role() = 'super_admin');

-- ────────────────────────────────────────────────────────────
-- h) SEED DATA
-- ────────────────────────────────────────────────────────────

-- Default configuration
INSERT INTO public.config (key, value)
VALUES ('daily_swipe_limit', '{"value": 50}'::jsonb);

-- Default categories
INSERT INTO public.categories (name) VALUES
  ('North Indian'),
  ('South Indian'),
  ('Continental'),
  ('Asian'),
  ('Drinks/Desserts');
