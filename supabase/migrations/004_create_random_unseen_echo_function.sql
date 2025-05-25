CREATE OR REPLACE FUNCTION get_random_unseen_echo(p_user_id UUID)
RETURNS TABLE (id UUID, content TEXT) -- Defines the structure of the returned row(s)
AS $$
BEGIN
  RETURN QUERY
  SELECT e.id, e.content
  FROM public.echoes e
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.seen_echoes se
    WHERE se.echo_id = e.id AND se.user_id = p_user_id
  )
  ORDER BY random() -- This is the key for randomness
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Optional: Grant execute permission to the 'authenticated' role
-- This allows any authenticated user (including our anonymous ones) to call this function.
-- If you don't grant execute, only superusers or the function owner can call it.
GRANT EXECUTE ON FUNCTION get_random_unseen_echo(UUID) TO authenticated;