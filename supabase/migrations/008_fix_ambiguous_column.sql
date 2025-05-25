-- Migration: Fix ambiguous column reference in toggle_echo_reaction function

CREATE OR REPLACE FUNCTION toggle_echo_reaction(
  p_echo_id UUID,
  p_user_id UUID,
  p_reaction_type TEXT
)
RETURNS TABLE(
  is_reacted BOOLEAN,
  new_count INTEGER,
  total_reactions INTEGER,
  previous_reaction_type TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_reaction_type TEXT;
  new_reaction_count INTEGER;
  total_count INTEGER;
BEGIN
  -- Check if user already has a reaction on this echo
  SELECT reaction_type INTO existing_reaction_type
  FROM echo_reactions 
  WHERE user_id = p_user_id AND echo_id = p_echo_id;

  IF existing_reaction_type IS NOT NULL THEN
    -- User already has a reaction
    IF existing_reaction_type = p_reaction_type THEN
      -- Same reaction type - remove it
      DELETE FROM echo_reactions 
      WHERE user_id = p_user_id AND echo_id = p_echo_id;
      
      -- Decrease count for this reaction type
      EXECUTE format('UPDATE echoes SET %I = GREATEST(0, %I - 1) WHERE id = $1', 
                     p_reaction_type || '_count', p_reaction_type || '_count') 
      USING p_echo_id;
      
      is_reacted := FALSE;
      previous_reaction_type := existing_reaction_type;
    ELSE
      -- Different reaction type - update it
      UPDATE echo_reactions 
      SET reaction_type = p_reaction_type, created_at = NOW()
      WHERE user_id = p_user_id AND echo_id = p_echo_id;
      
      -- Decrease count for old reaction type
      EXECUTE format('UPDATE echoes SET %I = GREATEST(0, %I - 1) WHERE id = $1', 
                     existing_reaction_type || '_count', existing_reaction_type || '_count') 
      USING p_echo_id;
      
      -- Increase count for new reaction type
      EXECUTE format('UPDATE echoes SET %I = %I + 1 WHERE id = $1', 
                     p_reaction_type || '_count', p_reaction_type || '_count') 
      USING p_echo_id;
      
      is_reacted := TRUE;
      previous_reaction_type := existing_reaction_type;
    END IF;
  ELSE
    -- No existing reaction - add new one
    INSERT INTO echo_reactions (user_id, echo_id, reaction_type)
    VALUES (p_user_id, p_echo_id, p_reaction_type);
    
    -- Increase count for this reaction type
    EXECUTE format('UPDATE echoes SET %I = %I + 1 WHERE id = $1', 
                   p_reaction_type || '_count', p_reaction_type || '_count') 
    USING p_echo_id;
    
    is_reacted := TRUE;
    previous_reaction_type := NULL;
  END IF;

  -- Get updated count for the current reaction type
  EXECUTE format('SELECT %I FROM echoes WHERE id = $1', p_reaction_type || '_count') 
  INTO new_reaction_count USING p_echo_id;

  -- Update total reactions count
  UPDATE echoes 
  SET total_reactions = like_count + love_count + laugh_count + think_count + sad_count + fire_count
  WHERE id = p_echo_id;

  -- Get updated total count (explicitly reference the table column)
  SELECT e.total_reactions INTO total_count FROM echoes e WHERE e.id = p_echo_id;

  RETURN QUERY SELECT is_reacted, new_reaction_count, total_count, previous_reaction_type;
END;
$$; 