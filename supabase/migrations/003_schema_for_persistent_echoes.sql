-- !! VERIFY THESE POLICY NAMES AGAINST YOUR SUPABASE DASHBOARD !!
DROP POLICY IF EXISTS "Allow anonymous read for revealed and unclaimed echoes" ON public.echoes;
DROP POLICY IF EXISTS "Allow anonymous to mark an echo as claimed" ON public.echoes;
DROP POLICY IF EXISTS "TEMP Allow anon to mark echo claimed" ON public.echoes;
-- Add any other policies that depend on is_claimed or reveal_at here

-- 1. Modify the 'echoes' table
-- Drop the 'is_claimed' column
ALTER TABLE public.echoes
DROP COLUMN IF EXISTS is_claimed;

-- Drop the 'reveal_at' column
ALTER TABLE public.echoes
DROP COLUMN IF EXISTS reveal_at;

-- If you decided to remove likes_count, uncomment the next line:
-- ALTER TABLE public.echoes DROP COLUMN IF EXISTS likes_count;


-- 2. Create the 'seen_echoes' table
CREATE TABLE public.seen_echoes (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- References the user from Supabase Auth
  echo_id UUID NOT NULL REFERENCES public.echoes(id) ON DELETE CASCADE,
  seen_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  PRIMARY KEY (user_id, echo_id) -- Ensures a user can only see an echo once
);

-- Optional: Add comments for clarity
COMMENT ON TABLE public.seen_echoes IS 'Tracks which user has seen which echo.';
COMMENT ON COLUMN public.seen_echoes.user_id IS 'The ID of the user who has seen the echo.';
COMMENT ON COLUMN public.seen_echoes.echo_id IS 'The ID of the echo that was seen.';
COMMENT ON COLUMN public.seen_echoes.seen_at IS 'Timestamp of when the user saw the echo.';

-- 3. Update RLS Policies (Important!)

-- First, let's remove the old RLS policies on 'echoes' that are no longer relevant
DROP POLICY IF EXISTS "Allow anonymous read for revealed and unclaimed echoes" ON public.echoes;
DROP POLICY IF EXISTS "Allow anonymous to mark an echo as claimed" ON public.echoes;
-- The "Allow anonymous inserts" policy for echoes can remain if you want anyone to be able to submit echoes.
-- If you want only authenticated (even if anonymous) users to submit, we can change its 'TO anon' to 'TO authenticated'.
-- For now, let's assume 'anon' can still insert. If not, we adjust.

-- New RLS Policy for 'echoes': Allow any authenticated user to read any echo.
-- We'll filter "seen" echoes in the application query, not with RLS on the echoes table directly for this read model.
CREATE POLICY "Allow authenticated users to read all echoes"
ON public.echoes
FOR SELECT
TO authenticated -- 'authenticated' applies to any logged-in user, including anonymous ones
USING (true);

-- RLS Policies for the new 'seen_echoes' table:
ALTER TABLE public.seen_echoes ENABLE ROW LEVEL SECURITY;

-- Allow a user to insert a record into seen_echoes for THEMSELVES for an echo they've seen.
CREATE POLICY "Allow users to insert their own seen echoes"
ON public.seen_echoes
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid()); -- auth.uid() returns the ID of the currently logged-in user

-- Allow users to read their OWN seen_echoes records (e.g., if you want to show a history, though not planned for MVP)
CREATE POLICY "Allow users to read their own seen echoes records"
ON public.seen_echoes
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Generally, users should not be able to update or delete from seen_echoes directly.
