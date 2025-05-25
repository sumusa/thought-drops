-- Migration: 005_add_likes_functionality.sql

-- 1. Create the 'user_echo_likes' table
CREATE TABLE public.user_echo_likes (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  echo_id UUID NOT NULL REFERENCES public.echoes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  PRIMARY KEY (user_id, echo_id) -- Ensures a user can only like an echo once
);

COMMENT ON TABLE public.user_echo_likes IS 'Tracks which user has liked which echo.';

-- 2. RLS Policies for 'user_echo_likes' table
ALTER TABLE public.user_echo_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to insert their own likes"
ON public.user_echo_likes
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow users to read their own likes" -- For checking if already liked
ON public.user_echo_likes
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Allow users to delete their own likes" -- For unliking
ON public.user_echo_likes
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- 3. Create database function to toggle like status and update count
CREATE OR REPLACE FUNCTION toggle_like_echo(p_echo_id UUID, p_user_id UUID)
RETURNS TABLE (is_liked BOOLEAN, new_likes_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER -- Important for functions that modify data based on user actions but need elevated permissions temporarily
AS $$
DECLARE
  v_is_liked BOOLEAN;
  v_new_likes_count INTEGER;
BEGIN
  -- Check if the user has already liked this echo
  SELECT EXISTS (
    SELECT 1
    FROM public.user_echo_likes
    WHERE user_id = p_user_id AND echo_id = p_echo_id
  ) INTO v_is_liked;

  IF v_is_liked THEN
    -- User has liked it, so unlike: delete the record and decrement count
    DELETE FROM public.user_echo_likes
    WHERE user_id = p_user_id AND echo_id = p_echo_id;

    UPDATE public.echoes
    SET likes_count = likes_count - 1
    WHERE id = p_echo_id
    RETURNING likes_count INTO v_new_likes_count;

    v_is_liked := FALSE;
  ELSE
    -- User has not liked it, so like: insert the record and increment count
    INSERT INTO public.user_echo_likes (user_id, echo_id)
    VALUES (p_user_id, p_echo_id);

    UPDATE public.echoes
    SET likes_count = likes_count + 1
    WHERE id = p_echo_id
    RETURNING likes_count INTO v_new_likes_count;

    v_is_liked := TRUE;
  END IF;

  RETURN QUERY SELECT v_is_liked, v_new_likes_count;
END;
$$;

COMMENT ON FUNCTION toggle_like_echo(UUID, UUID) IS 'Toggles a user''s like for an echo and updates the likes_count.';

-- 4. Grant execute permission for the function
GRANT EXECUTE ON FUNCTION toggle_like_echo(UUID, UUID) TO authenticated; 