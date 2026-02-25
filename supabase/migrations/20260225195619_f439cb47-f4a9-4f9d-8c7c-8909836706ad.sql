
-- Add WhatsApp sales & support fields to landing_settings
ALTER TABLE public.landing_settings
  ADD COLUMN wa_sales_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN wa_sales_phone text,
  ADD COLUMN wa_sales_cta_label text NOT NULL DEFAULT 'Configurar meu negócio agora',
  ADD COLUMN wa_sales_message_template text NOT NULL DEFAULT 'Olá! Quero configurar meu negócio no Agenda Smart. Vim pelo site. Pode me ajudar com a ativação e configuração?',
  ADD COLUMN wa_support_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN wa_support_phone text,
  ADD COLUMN wa_support_tooltip text NOT NULL DEFAULT 'Suporte no WhatsApp',
  ADD COLUMN wa_support_message text NOT NULL DEFAULT 'Olá! Preciso de suporte no Agenda Smart.',
  ADD COLUMN wa_support_position text NOT NULL DEFAULT 'bottom-right';
