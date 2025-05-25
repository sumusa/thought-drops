-- Add RLS policy to allow anonymous users to mark an echo as claimed
CREATE POLICY "Allow anonymous to mark an echo as claimed"
ON public.echoes
FOR UPDATE
TO anon
USING (is_claimed = false)
WITH CHECK (is_claimed = true); 