-- =============================================
-- Notification system for admin/owner alerts
-- =============================================

-- 1. Admin notifications (in-app)
CREATE TABLE public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE CASCADE,
  event_type text NOT NULL, -- 'NEW_PENDING' | 'CODE_SUBMITTED'
  title text NOT NULL,
  body text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_admin_notifications_barbershop ON public.admin_notifications(barbershop_id, read, created_at DESC);

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- RLS: Admin/Manager can view own barbershop notifications
CREATE POLICY "Staff can view own barbershop notifications"
  ON public.admin_notifications FOR SELECT
  TO authenticated
  USING (
    is_superadmin(auth.uid()) 
    OR is_barbershop_admin_or_manager(auth.uid(), barbershop_id)
  );

CREATE POLICY "Staff can update own barbershop notifications"
  ON public.admin_notifications FOR UPDATE
  TO authenticated
  USING (
    is_superadmin(auth.uid()) 
    OR is_barbershop_admin_or_manager(auth.uid(), barbershop_id)
  );

-- Block anonymous
CREATE POLICY "Block anonymous select on admin_notifications"
  ON public.admin_notifications FOR SELECT
  TO anon
  USING (false);

-- 2. Notification events (dedup/anti-spam for email)
CREATE TABLE public.notification_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  channel text NOT NULL DEFAULT 'in_app', -- 'in_app' | 'email'
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(appointment_id, event_type, channel)
);

ALTER TABLE public.notification_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Block public access on notification_events"
  ON public.notification_events FOR ALL
  TO anon
  USING (false);

CREATE POLICY "Staff can view notification_events"
  ON public.notification_events FOR SELECT
  TO authenticated
  USING (is_superadmin(auth.uid()));

-- 3. Helper function: create notification + dedup
CREATE OR REPLACE FUNCTION public.create_owner_notification(
  p_barbershop_id uuid,
  p_appointment_id uuid,
  p_event_type text,
  p_title text,
  p_body text,
  p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_notification_id uuid;
  v_already_sent boolean;
BEGIN
  -- Check dedup
  SELECT EXISTS (
    SELECT 1 FROM public.notification_events
    WHERE appointment_id = p_appointment_id
      AND event_type = p_event_type
      AND channel = 'in_app'
  ) INTO v_already_sent;

  IF v_already_sent THEN
    RETURN NULL;
  END IF;

  -- Create notification
  INSERT INTO public.admin_notifications (
    barbershop_id, appointment_id, event_type, title, body, metadata
  ) VALUES (
    p_barbershop_id, p_appointment_id, p_event_type, p_title, p_body, p_metadata
  )
  RETURNING id INTO v_notification_id;

  -- Record event
  INSERT INTO public.notification_events (appointment_id, event_type, channel)
  VALUES (p_appointment_id, p_event_type, 'in_app');

  RETURN v_notification_id;
END;
$$;

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;
