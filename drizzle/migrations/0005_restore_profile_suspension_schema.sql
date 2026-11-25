CREATE TABLE IF NOT EXISTS public.user_bans (
  user_id uuid PRIMARY KEY,
  banned_until timestamptz NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON public.user_bans FROM anon, authenticated;
GRANT SELECT ON public.user_bans TO authenticated;
GRANT ALL ON public.user_bans TO service_role;
ALTER TABLE public.user_bans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can see their own suspension" ON public.user_bans;
CREATE POLICY "Users can see their own suspension"
ON public.user_bans FOR SELECT TO authenticated
USING (user_id = auth.uid());
