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
  // WhatsApp Sales
  wa_sales_enabled: boolean;
  wa_sales_phone: string | null;
  wa_sales_cta_label: string;
  wa_sales_message_template: string;
  wa_sales_url: string | null;
  // WhatsApp Support
  wa_support_enabled: boolean;
  wa_support_phone: string | null;
  wa_support_tooltip: string;
  wa_support_message: string;
  wa_support_position: string;
  wa_support_url: string | null;
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
  wa_sales_enabled: true,
  wa_sales_phone: null,
  wa_sales_cta_label: 'Configurar meu negócio agora',
  wa_sales_message_template: 'Olá! Quero configurar meu negócio no Agenda Smart. Vim pelo site. Pode me ajudar com a ativação e configuração?',
  wa_sales_url: null,
  wa_support_enabled: true,
  wa_support_phone: null,
  wa_support_tooltip: 'Suporte no WhatsApp',
  wa_support_message: 'Olá! Preciso de suporte no Agenda Smart.',
  wa_support_position: 'bottom-right',
  wa_support_url: null,
  updated_at: '',
};

export async function getLandingSettings(): Promise<LandingSettings> {
  try {
    // Use secure RPC that masks phone numbers
    const { data, error } = await supabase.rpc('get_public_landing_settings');

    if (error || !data || data.length === 0) return DEFAULT_LANDING_SETTINGS;

    const row = data[0];
    return {
      ...DEFAULT_LANDING_SETTINGS,
      hero_title: row.hero_title,
      hero_subtitle: row.hero_subtitle,
      primary_cta_label: row.primary_cta_label,
      secondary_cta_enabled: row.secondary_cta_enabled,
      secondary_cta_label: row.secondary_cta_label,
      vsl_enabled: row.vsl_enabled,
      vsl_title: row.vsl_title,
      vsl_subtitle: row.vsl_subtitle,
      vsl_minutes_label: row.vsl_minutes_label,
      vsl_embed_url: row.vsl_embed_url,
      vsl_cover_image_url: row.vsl_cover_image_url,
      pricing_enabled: row.pricing_enabled,
      pricing_title: row.pricing_title,
      pricing_subtitle: row.pricing_subtitle,
      pricing_discount_label: row.pricing_discount_label,
      currency_code: row.currency_code,
      plans: (row.plans as unknown as Plan[]) || DEFAULT_LANDING_SETTINGS.plans,
      wa_sales_enabled: row.wa_sales_enabled,
      wa_sales_cta_label: row.wa_sales_cta_label,
      // Phone numbers are now pre-built URLs from the RPC
      wa_sales_phone: null, // no longer exposed
      wa_sales_url: row.wa_sales_url || null,
      wa_support_enabled: row.wa_support_enabled,
      wa_support_tooltip: row.wa_support_tooltip,
      wa_support_phone: null, // no longer exposed
      wa_support_position: row.wa_support_position,
      wa_support_url: row.wa_support_url || null,
    } as LandingSettings;
  } catch {
    return DEFAULT_LANDING_SETTINGS;
  }
}
