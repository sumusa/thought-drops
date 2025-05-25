CREATE TABLE public.echoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  content TEXT NOT NULL,
  reveal_at TIMESTAMPTZ NOT NULL,
  is_claimed BOOLEAN DEFAULT false NOT NULL,
  likes_count INTEGER DEFAULT 0 NOT NULL
);

COMMENT ON TABLE public.echoes IS 'Stores anonymous thought drops that are revealed after a delay.';

ALTER TABLE public.echoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous inserts"
ON public.echoes
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anonymous read for revealed and unclaimed echoes"
ON public.echoes
FOR SELECT
TO anon
USING (reveal_at <= now() AND is_claimed = false);