-- ============================================================
-- CampusBite — Atomic Swipe Recording
-- ============================================================

CREATE OR REPLACE FUNCTION public.record_swipe_with_limit(
  p_item_id uuid,
  p_direction public.swipe_direction,
  p_daily_limit integer
)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_today date := current_date;
  v_current_count integer;
  v_limit integer := GREATEST(COALESCE(p_daily_limit, 1), 1);
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'ok', false,
      'reason', 'unauthenticated'
    );
  END IF;

  INSERT INTO public.daily_swipe_counts (user_id, swipe_date, count)
  VALUES (v_user_id, v_today, 0)
  ON CONFLICT (user_id, swipe_date) DO NOTHING;

  SELECT count
  INTO v_current_count
  FROM public.daily_swipe_counts
  WHERE user_id = v_user_id
    AND swipe_date = v_today
  FOR UPDATE;

  IF v_current_count >= v_limit THEN
    RETURN jsonb_build_object(
      'ok', false,
      'reason', 'limit_reached',
      'count', v_current_count
    );
  END IF;

  BEGIN
    INSERT INTO public.swipes (user_id, item_id, direction)
    VALUES (v_user_id, p_item_id, p_direction);
  EXCEPTION
    WHEN unique_violation THEN
      RETURN jsonb_build_object(
        'ok', false,
        'reason', 'already_swiped',
        'count', v_current_count
      );
  END;

  UPDATE public.daily_swipe_counts
  SET
    count = v_current_count + 1,
    updated_at = now()
  WHERE user_id = v_user_id
    AND swipe_date = v_today;

  RETURN jsonb_build_object(
    'ok', true,
    'count', v_current_count + 1
  );
EXCEPTION
  WHEN insufficient_privilege THEN
    RETURN jsonb_build_object(
      'ok', false,
      'reason', 'forbidden'
    );
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'ok', false,
      'reason', 'db_error'
    );
END;
$$;
