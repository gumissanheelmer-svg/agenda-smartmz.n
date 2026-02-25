
-- =============================================
-- 1. Add new columns to barbershops (multi-niche + multi-country)
-- =============================================

-- business_type already exists, but let's ensure defaults
-- country_code, currency_code, timezone, locale, business_settings, brand_settings
ALTER TABLE public.barbershops
  ADD COLUMN IF NOT EXISTS country_code text NOT NULL DEFAULT 'MZ',
  ADD COLUMN IF NOT EXISTS currency_code text NOT NULL DEFAULT 'MZN',
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'Africa/Maputo',
  ADD COLUMN IF NOT EXISTS locale text NOT NULL DEFAULT 'pt-MZ',
  ADD COLUMN IF NOT EXISTS business_settings jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS brand_settings jsonb NOT NULL DEFAULT '{}';

-- =============================================
-- 2. Expand services table
-- =============================================
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS category text NULL,
  ADD COLUMN IF NOT EXISTS requires_deposit boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deposit_amount numeric NULL,
  ADD COLUMN IF NOT EXISTS service_settings jsonb NOT NULL DEFAULT '{}';

-- =============================================
-- 3. Create business_templates table
-- =============================================
CREATE TABLE IF NOT EXISTS public.business_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_type text NOT NULL,
  locale text NOT NULL DEFAULT 'pt-MZ',
  template_services jsonb NOT NULL DEFAULT '[]',
  template_settings jsonb NOT NULL DEFAULT '{}',
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.business_templates ENABLE ROW LEVEL SECURITY;

-- Only superadmin can manage templates
CREATE POLICY "Superadmin can manage business_templates"
  ON public.business_templates FOR ALL
  USING (public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_superadmin(auth.uid()));

-- Anyone authenticated can read enabled templates
CREATE POLICY "Authenticated can read enabled templates"
  ON public.business_templates FOR SELECT
  TO authenticated
  USING (is_enabled = true);

-- Block anonymous
CREATE POLICY "Block anonymous on business_templates"
  ON public.business_templates FOR SELECT
  USING (false);

-- Seed initial templates (pt-MZ)
INSERT INTO public.business_templates (business_type, locale, template_services) VALUES
  ('barbearia', 'pt-MZ', '[
    {"name": "Corte", "price": 250, "duration": 30},
    {"name": "Barba", "price": 150, "duration": 20},
    {"name": "Corte + Barba", "price": 350, "duration": 45}
  ]'::jsonb),
  ('salao', 'pt-MZ', '[
    {"name": "Unhas", "price": 300, "duration": 45},
    {"name": "Sobrancelha", "price": 150, "duration": 20},
    {"name": "Cílios", "price": 500, "duration": 60},
    {"name": "Limpeza Facial", "price": 400, "duration": 40}
  ]'::jsonb),
  ('estetica', 'pt-MZ', '[
    {"name": "Limpeza de Pele", "price": 500, "duration": 60},
    {"name": "Tratamento Facial", "price": 800, "duration": 90},
    {"name": "Massagem", "price": 600, "duration": 60}
  ]'::jsonb),
  ('tattoo_studio', 'pt-MZ', '[
    {"name": "Tattoo Pequena", "price": 1500, "duration": 60, "requires_deposit": true, "deposit_amount": 500},
    {"name": "Tattoo Média", "price": 3000, "duration": 120, "requires_deposit": true, "deposit_amount": 1000},
    {"name": "Tattoo Grande", "price": 5000, "duration": 180, "requires_deposit": true, "deposit_amount": 2000},
    {"name": "Retoque", "price": 800, "duration": 60}
  ]'::jsonb);

-- =============================================
-- 4. Create countries table
-- =============================================
CREATE TABLE IF NOT EXISTS public.countries (
  country_code text PRIMARY KEY,
  name text NOT NULL,
  default_currency_code text NOT NULL,
  default_locale text NOT NULL,
  default_timezone text NOT NULL,
  phone_country_prefix text NULL,
  is_enabled boolean NOT NULL DEFAULT true
);

ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;

-- Superadmin can manage
CREATE POLICY "Superadmin can manage countries"
  ON public.countries FOR ALL
  USING (public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_superadmin(auth.uid()));

-- Anyone can read enabled countries
CREATE POLICY "Anyone can read enabled countries"
  ON public.countries FOR SELECT
  USING (is_enabled = true);

-- Seed countries
INSERT INTO public.countries (country_code, name, default_currency_code, default_locale, default_timezone, phone_country_prefix) VALUES
  ('MZ', 'Moçambique', 'MZN', 'pt-MZ', 'Africa/Maputo', '+258'),
  ('AO', 'Angola', 'AOA', 'pt-AO', 'Africa/Luanda', '+244'),
  ('ZA', 'South Africa', 'ZAR', 'en-ZA', 'Africa/Johannesburg', '+27'),
  ('MW', 'Malawi', 'MWK', 'en-MW', 'Africa/Blantyre', '+265'),
  ('ZM', 'Zambia', 'ZMW', 'en-ZM', 'Africa/Lusaka', '+260'),
  ('ZW', 'Zimbabwe', 'USD', 'en-ZW', 'Africa/Harare', '+263'),
  ('TZ', 'Tanzania', 'TZS', 'en-TZ', 'Africa/Dar_es_Salaam', '+255');
