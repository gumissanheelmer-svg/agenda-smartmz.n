import { supabase } from '@/integrations/supabase/client';

export interface Plan {
  key: string;
  name: string;
  tagline: string;
  badge: string | null;
  enabled: boolean;
  monthly_price: number;
  yearly_price: number;
  features: string[];
  cta_label: string;
}

export interface LandingSettings {
  id: string;
  site_key: string;
  is_enabled: boolean;
  hero_title: string;
  hero_subtitle: string;
  primary_cta_label: string;
  secondary_cta_enabled: boolean;
  secondary_cta_label: string;
  vsl_enabled: boolean;
  vsl_title: string;
  vsl_subtitle: string;
  vsl_minutes_label: number;
  vsl_embed_url: string | null;
  vsl_cover_image_url: string | null;
  pricing_enabled: boolean;
  pricing_title: string;
  pricing_subtitle: string;
  pricing_discount_label: string;
  currency_code: string;
  plans: Plan[];
  updated_at: string;
}

export const DEFAULT_LANDING_SETTINGS: LandingSettings = {
  id: '',
  site_key: 'agenda-smart',
  is_enabled: true,
  hero_title: 'Seu negócio. Automatizado.',
  hero_subtitle: 'Gerencie agendamentos, equipe e pagamentos em uma única plataforma. Seus clientes agendam 24h, você foca no que importa.',
  primary_cta_label: 'Começar Agora — É Grátis',
  secondary_cta_enabled: true,
  secondary_cta_label: 'Entrar',
  vsl_enabled: true,
  vsl_title: 'Veja como funciona em 2 minutos',
  vsl_subtitle: 'Uma demonstração rápida do Agenda Smart na prática.',
  vsl_minutes_label: 2,
  vsl_embed_url: null,
  vsl_cover_image_url: null,
  pricing_enabled: true,
  pricing_title: 'Escolha o plano ideal',
  pricing_subtitle: 'Comece grátis. Cresça quando quiser.',
  pricing_discount_label: '-20%',
  currency_code: 'MZN',
  plans: [
    { key: 'basic', name: 'Básico', tagline: 'Para começar', badge: null, enabled: true, monthly_price: 0, yearly_price: 0, features: ['1 negócio', 'Link de agendamento', 'Gestão de serviços', 'Confirmações'], cta_label: 'Começar' },
    { key: 'pro', name: 'Pro', tagline: 'Para crescer', badge: 'Popular', enabled: true, monthly_price: 1500, yearly_price: 14400, features: ['Tudo do Básico', 'Relatórios avançados', 'Suporte prioritário', 'Recursos Pro'], cta_label: 'Começar' },
  ],
  updated_at: '',
};

export async function getLandingSettings(): Promise<LandingSettings> {
  try {
    const { data, error } = await supabase
      .from('landing_settings')
      .select('*')
      .eq('site_key', 'agenda-smart')
      .single();

    if (error || !data) return DEFAULT_LANDING_SETTINGS;

    return {
      ...data,
      plans: (data.plans as unknown as Plan[]) || DEFAULT_LANDING_SETTINGS.plans,
    } as LandingSettings;
  } catch {
    return DEFAULT_LANDING_SETTINGS;
  }
}
