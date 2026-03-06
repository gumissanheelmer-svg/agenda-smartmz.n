
-- ============================================
-- WhatsApp Contacts
-- ============================================
CREATE TABLE public.whatsapp_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  name text,
  phone text NOT NULL UNIQUE,
  country_code text,
  niche text,
  source text,
  language text NOT NULL DEFAULT 'pt',
  opt_in boolean NOT NULL DEFAULT false,
  last_inbound_at timestamptz,
  status text NOT NULL DEFAULT 'new',
  notes text
);

ALTER TABLE public.whatsapp_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin can manage whatsapp_contacts"
  ON public.whatsapp_contacts FOR ALL
  TO authenticated
  USING (public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Block anonymous on whatsapp_contacts"
  ON public.whatsapp_contacts FOR SELECT
  TO authenticated
  USING (false);

-- ============================================
-- WhatsApp Templates
-- ============================================
CREATE TABLE public.whatsapp_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL UNIQUE,
  language text NOT NULL,
  category text NOT NULL,
  body text NOT NULL,
  is_approved boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true
);

ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin can manage whatsapp_templates"
  ON public.whatsapp_templates FOR ALL
  TO authenticated
  USING (public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Block anonymous on whatsapp_templates"
  ON public.whatsapp_templates FOR SELECT
  TO authenticated
  USING (false);

-- ============================================
-- WhatsApp Campaigns
-- ============================================
CREATE TABLE public.whatsapp_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  title text NOT NULL,
  template_id uuid REFERENCES public.whatsapp_templates(id),
  freeform_message text,
  target_filter jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  scheduled_at timestamptz,
  send_mode text NOT NULL DEFAULT 'template'
);

ALTER TABLE public.whatsapp_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin can manage whatsapp_campaigns"
  ON public.whatsapp_campaigns FOR ALL
  TO authenticated
  USING (public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Block anonymous on whatsapp_campaigns"
  ON public.whatsapp_campaigns FOR SELECT
  TO authenticated
  USING (false);

-- ============================================
-- WhatsApp Campaign Messages
-- ============================================
CREATE TABLE public.whatsapp_campaign_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.whatsapp_campaigns(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.whatsapp_contacts(id) ON DELETE CASCADE,
  phone text NOT NULL,
  message_text text NOT NULL,
  template_id uuid REFERENCES public.whatsapp_templates(id),
  status text NOT NULL DEFAULT 'pending',
  sent_at timestamptz,
  response_at timestamptz,
  error_message text
);

ALTER TABLE public.whatsapp_campaign_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin can manage whatsapp_campaign_messages"
  ON public.whatsapp_campaign_messages FOR ALL
  TO authenticated
  USING (public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Block anonymous on whatsapp_campaign_messages"
  ON public.whatsapp_campaign_messages FOR SELECT
  TO authenticated
  USING (false);
