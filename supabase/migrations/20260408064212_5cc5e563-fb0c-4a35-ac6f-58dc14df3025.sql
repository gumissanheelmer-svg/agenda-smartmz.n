
-- Security events audit log table
CREATE TABLE public.security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  event_type text NOT NULL,
  user_id uuid NULL,
  email text NULL,
  ip_address text NULL,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- RLS
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Only superadmin can read
CREATE POLICY "Superadmin can read security_events"
  ON public.security_events FOR SELECT
  TO authenticated
  USING (public.is_superadmin(auth.uid()));

-- Block anonymous
CREATE POLICY "Block anonymous on security_events"
  ON public.security_events FOR SELECT
  TO anon
  USING (false);

-- Index for lockout queries
CREATE INDEX idx_security_events_email_type_created
  ON public.security_events (email, event_type, created_at DESC);

CREATE INDEX idx_security_events_ip_created
  ON public.security_events (ip_address, created_at DESC);
