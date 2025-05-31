-- Advanced deduplication system for echoes
-- This migration adds fuzzy matching and similarity detection

-- Function to calculate Levenshtein distance (edit distance)
CREATE OR REPLACE FUNCTION levenshtein_distance(s1 TEXT, s2 TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  len1 INTEGER := length(s1);
  len2 INTEGER := length(s2);
  matrix INTEGER[][];
  i INTEGER;
  j INTEGER;
  cost INTEGER;
BEGIN
  -- Handle edge cases
  IF len1 = 0 THEN RETURN len2; END IF;
  IF len2 = 0 THEN RETURN len1; END IF;
  
  -- Initialize matrix
  FOR i IN 0..len1 LOOP
    matrix[i][0] := i;
  END LOOP;
  
  FOR j IN 0..len2 LOOP
    matrix[0][j] := j;
  END LOOP;
  
  -- Fill matrix
  FOR i IN 1..len1 LOOP
    FOR j IN 1..len2 LOOP
      IF substring(s1, i, 1) = substring(s2, j, 1) THEN
        cost := 0;
      ELSE
        cost := 1;
      END IF;
      
      matrix[i][j] := LEAST(
        matrix[i-1][j] + 1,      -- deletion
        matrix[i][j-1] + 1,      -- insertion
        matrix[i-1][j-1] + cost  -- substitution
      );
    END LOOP;
  END LOOP;
  
  RETURN matrix[len1][len2];
END;
$$;

-- Function to calculate similarity percentage
CREATE OR REPLACE FUNCTION text_similarity(s1 TEXT, s2 TEXT)
RETURNS FLOAT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  max_len INTEGER;
  distance INTEGER;
BEGIN
  -- Normalize texts (lowercase, trim, remove extra spaces)
  s1 := regexp_replace(lower(trim(s1)), '\s+', ' ', 'g');
  s2 := regexp_replace(lower(trim(s2)), '\s+', ' ', 'g');
  
  max_len := GREATEST(length(s1), length(s2));
  
  -- Handle identical strings
  IF s1 = s2 THEN RETURN 1.0; END IF;
  
  -- Handle empty strings
  IF max_len = 0 THEN RETURN 1.0; END IF;
  
  distance := levenshtein_distance(s1, s2);
  
  -- Return similarity as percentage (1.0 = identical, 0.0 = completely different)
  RETURN 1.0 - (distance::FLOAT / max_len::FLOAT);
END;
$$;

-- Function to check for similar content (not just exact duplicates)
CREATE OR REPLACE FUNCTION check_similar_content(
  content_text TEXT,
  similarity_threshold FLOAT DEFAULT 0.85
)
RETURNS TABLE(
  is_similar BOOLEAN,
  similar_echo_id UUID,
  similarity_score FLOAT,
  existing_content TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  normalized_content TEXT;
  echo_record RECORD;
  max_similarity FLOAT := 0.0;
  best_match RECORD;
BEGIN
  -- Normalize the input content
  normalized_content := regexp_replace(lower(trim(content_text)), '\s+', ' ', 'g');
  
  -- Check against existing echoes
  FOR echo_record IN 
    SELECT id, content 
    FROM echoes 
    WHERE length(content) BETWEEN length(content_text) * 0.7 AND length(content_text) * 1.3
    ORDER BY created_at DESC
    LIMIT 1000  -- Limit to recent echoes for performance
  LOOP
    DECLARE
      current_similarity FLOAT;
    BEGIN
      current_similarity := text_similarity(normalized_content, echo_record.content);
      
      IF current_similarity > max_similarity THEN
        max_similarity := current_similarity;
        best_match := echo_record;
      END IF;
    END;
  END LOOP;
  
  -- Return results
  IF max_similarity >= similarity_threshold THEN
    RETURN QUERY SELECT 
      true,
      best_match.id,
      max_similarity,
      best_match.content;
  ELSE
    RETURN QUERY SELECT 
      false,
      NULL::UUID,
      max_similarity,
      NULL::TEXT;
  END IF;
END;
$$;

-- Function to get content suggestions when duplicate/similar content is detected
CREATE OR REPLACE FUNCTION get_content_suggestions(
  original_content TEXT,
  mood_name TEXT DEFAULT NULL
)
RETURNS TABLE(suggestion TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  suggestions TEXT[] := ARRAY[
    'Try expressing this thought from a different angle or perspective',
    'What specific details or emotions could you add to make this unique?',
    'Consider sharing what led to this thought or feeling',
    'How might you phrase this in your own words?',
    'What personal experience connects to this idea?'
  ];
  mood_suggestions TEXT[];
BEGIN
  -- Add mood-specific suggestions
  CASE mood_name
    WHEN 'reflective' THEN
      mood_suggestions := ARRAY[
        'What lesson or insight does this reflection reveal?',
        'How has your perspective on this changed over time?',
        'What would you tell someone else experiencing this?'
      ];
    WHEN 'hopeful' THEN
      mood_suggestions := ARRAY[
        'What specific action or possibility gives you hope?',
        'How does this hope feel different from past experiences?',
        'What small step could you take toward this hope?'
      ];
    WHEN 'melancholy' THEN
      mood_suggestions := ARRAY[
        'What beauty do you find within this sadness?',
        'How does this feeling connect you to others?',
        'What comfort would you offer to your past self?'
      ];
    WHEN 'creative' THEN
      mood_suggestions := ARRAY[
        'What unexpected metaphor could capture this idea?',
        'How would you express this through a different sense?',
        'What if this thought was a color, sound, or texture?'
      ];
    ELSE
      mood_suggestions := ARRAY[]::TEXT[];
  END CASE;
  
  -- Return combined suggestions
  FOR i IN 1..array_length(suggestions, 1) LOOP
    RETURN QUERY SELECT suggestions[i];
  END LOOP;
  
  FOR i IN 1..array_length(mood_suggestions, 1) LOOP
    RETURN QUERY SELECT mood_suggestions[i];
  END LOOP;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION levenshtein_distance(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION text_similarity(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_similar_content(TEXT, FLOAT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_content_suggestions(TEXT, TEXT) TO authenticated; 