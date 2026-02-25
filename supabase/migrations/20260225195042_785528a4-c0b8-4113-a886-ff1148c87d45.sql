
-- Create landing_settings table (single-row config for marketing site)
CREATE TABLE public.landing_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_key text NOT NULL UNIQUE DEFAULT 'agenda-smart',
  is_enabled boolean NOT NULL DEFAULT true,

  -- Hero / CTA
  hero_title text NOT NULL DEFAULT 'Seu negócio. Automatizado.',
  hero_subtitle text NOT NULL DEFAULT 'Gerencie agendamentos, equipe e pagamentos em uma única plataforma. Seus clientes agendam 24h, você foca no que importa.',
  primary_cta_label text NOT NULL DEFAULT 'Começar Agora — É Grátis',
  secondary_cta_enabled boolean NOT NULL DEFAULT true,
  secondary_cta_label text NOT NULL DEFAULT 'Entrar',

  -- VSL
  vsl_enabled boolean NOT NULL DEFAULT true,
  vsl_title text NOT NULL DEFAULT 'Veja como funciona em 2 minutos',
  vsl_subtitle text NOT NULL DEFAULT 'Uma demonstração rápida do Agenda Smart na prática.',
  vsl_minutes_label integer NOT NULL DEFAULT 2,
  vsl_embed_url text,
  vsl_cover_image_url text,

  -- Pricing
  pricing_enabled boolean NOT NULL DEFAULT true,
  pricing_title text NOT NULL DEFAULT 'Escolha o plano ideal',
  pricing_subtitle text NOT NULL DEFAULT 'Comece grátis. Cresça quando quiser.',
  pricing_discount_label text NOT NULL DEFAULT '-20%',
  currency_code text NOT NULL DEFAULT 'MZN',

  -- Plans JSON
  plans jsonb NOT NULL DEFAULT '[
    {"key":"basic","name":"Básico","tagline":"Para começar","badge":null,"enabled":true,"monthly_price":0,"yearly_price":0,"features":["1 negócio","Link de agendamento","Gestão de serviços","Confirmações"],"cta_label":"Começar"},
    {"key":"pro","name":"Pro","tagline":"Para crescer","badge":"Popular","enabled":true,"monthly_price":1500,"yearly_price":14400,"features":["Tudo do Básico","Relatórios avançados","Suporte prioritário","Recursos Pro"],"cta_label":"Começar"}
  ]'::jsonb,

  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.landing_settings ENABLE ROW LEVEL SECURITY;

-- Superadmin full access
CREATE POLICY "Superadmin can manage landing_settings"
  ON public.landing_settings FOR ALL
  USING (is_superadmin(auth.uid()))
  WITH CHECK (is_superadmin(auth.uid()));

-- Public read for enabled settings
CREATE POLICY "Public can read enabled landing_settings"
  ON public.landing_settings FOR SELECT
  USING (is_enabled = true);

-- Seed default row
INSERT INTO public.landing_settings (site_key) VALUES ('agenda-smart')
ON CONFLICT (site_key) DO NOTHING;
