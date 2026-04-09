import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Locale = 'pt' | 'en';

// ── Translation strings ──
const translations = {
  pt: {
    // Header
    'header.login': 'Acessar',
    'header.buy': 'Adquirir',

    // Hero
    'hero.badge': '✦ A PLATAFORMA #1 DE AGENDAMENTO',
    'hero.cta_primary': '🚀 Quero Meu Negócio Automatizado',
    'hero.cta_manual': 'Criar Conta Manualmente',
    'hero.assisted_note': 'Configuramos tudo para você. Só precisa enviar seus dados.',
    'hero.client_note': 'É cliente? Peça o link de agendamento ao seu profissional.',
    'hero.floating.bookings': '+2.400 agendamentos',
    'hero.floating.secure': '100% seguro',
    'hero.floating.setup': 'Setup em 2min',

    // Stats
    'stats.businesses': 'Negócios ativos',
    'stats.bookings': 'Agendamentos/mês',
    'stats.uptime': 'Uptime garantido',

    // Benefits
    'benefits.label': 'Funcionalidades',
    'benefits.title': 'Tudo que você precisa',
    'benefits.subtitle': 'Ferramentas poderosas para automatizar e escalar seu negócio.',
    'benefits.scheduling': 'Agendamento 24h',
    'benefits.scheduling_desc': 'Clientes agendam a qualquer hora, mesmo quando você não está.',
    'benefits.confirmation': 'Confirmação automática',
    'benefits.confirmation_desc': 'Cada agendamento é confirmado na hora, sem esforço manual.',
    'benefits.team': 'Gestão de equipa',
    'benefits.team_desc': 'Cadastre profissionais e distribua a agenda automaticamente.',
    'benefits.services': 'Serviços e preços',
    'benefits.services_desc': 'Configure serviços, duração e preços do seu jeito.',
    'benefits.reports': 'Relatórios simples',
    'benefits.reports_desc': 'Veja o desempenho do negócio com dados claros e diretos.',
    'benefits.link': 'Link na bio pronto',
    'benefits.link_desc': 'Compartilhe seu link de agendamento nas redes sociais.',

    // How it works
    'how.label': 'Passo a passo',
    'how.title': 'Como funciona',
    'how.step1_title': 'Crie seu negócio',
    'how.step1_desc': 'Cadastre-se gratuitamente e configure seu espaço em minutos.',
    'how.step2_title': 'Configure serviços e horários',
    'how.step2_desc': 'Adicione serviços, preços, duração e horários da equipa.',
    'how.step3_title': 'Publique seu link de agendamento',
    'how.step3_desc': 'Compartilhe nas redes sociais, WhatsApp e onde quiser.',
    'how.step4_title': 'Receba clientes automaticamente',
    'how.step4_desc': 'Seus clientes agendam sozinhos, 24h por dia, 7 dias por semana.',

    // Video
    'video.label': 'Demonstração',

    // FAQ
    'faq.label': 'Dúvidas',
    'faq.title': 'Perguntas frequentes',
    'faq.q1': 'Preciso de site?',
    'faq.a1': 'Não! O Agenda Smart gera automaticamente uma página de agendamento para o seu negócio. Basta partilhar o link.',
    'faq.q2': 'Funciona no WhatsApp?',
    'faq.a2': 'Sim. Pode enviar o link de agendamento directamente pelo WhatsApp aos seus clientes.',
    'faq.q3': 'Meus clientes conseguem agendar pelo telemóvel?',
    'faq.a3': 'Sim, a plataforma é 100% responsiva. Funciona perfeitamente em qualquer dispositivo.',
    'faq.q4': 'Posso editar horários?',
    'faq.a4': 'Claro! Pode configurar horários de trabalho, pausas e folgas para cada profissional individualmente.',
    'faq.q5': 'Como partilho o link?',
    'faq.a5': 'Nas definições do seu negócio você encontra o link direto. Copie e cole em qualquer rede social, bio do Instagram, etc.',
    'faq.q6': 'Tem suporte?',
    'faq.a6': 'Sim! Oferecemos suporte por chat e email. Utilizadores Pro têm suporte prioritário.',

    // Final CTA
    'cta.label': 'Comece hoje',
    'cta.title': 'Pronto para transformar seu negócio?',
    'cta.subtitle': 'Crie seu espaço em minutos e comece a receber agendamentos hoje mesmo. Sem compromisso.',

    // Footer
    'footer.rights': 'Todos os direitos reservados.',

    // SEO
    'seo.title': 'Agenda Smart - Sistema de Agendamento para Barbearias e Salões',
    'seo.description': 'Sistema completo de agendamento online para barbearias, salões de beleza e muito mais. Gerencie seus clientes e equipe de forma simples.',
  },
  en: {
    // Header
    'header.login': 'Sign In',
    'header.buy': 'Get Started',

    // Hero
    'hero.badge': '✦ THE #1 SCHEDULING PLATFORM',
    'hero.cta_primary': '🚀 Automate My Business Now',
    'hero.cta_manual': 'Create Account Manually',
    'hero.assisted_note': 'We set everything up for you. Just send your details.',
    'hero.client_note': "You're a client? Ask your professional for the booking link.",
    'hero.floating.bookings': '+2,400 bookings',
    'hero.floating.secure': '100% secure',
    'hero.floating.setup': 'Setup in 2min',

    // Stats
    'stats.businesses': 'Active businesses',
    'stats.bookings': 'Bookings/month',
    'stats.uptime': 'Guaranteed uptime',

    // Benefits
    'benefits.label': 'Features',
    'benefits.title': 'Everything you need',
    'benefits.subtitle': 'Powerful tools to automate and scale your business.',
    'benefits.scheduling': '24/7 Scheduling',
    'benefits.scheduling_desc': 'Clients book anytime, even when you\'re unavailable.',
    'benefits.confirmation': 'Auto Confirmation',
    'benefits.confirmation_desc': 'Every booking is confirmed instantly, no manual effort.',
    'benefits.team': 'Team Management',
    'benefits.team_desc': 'Add professionals and distribute the schedule automatically.',
    'benefits.services': 'Services & Pricing',
    'benefits.services_desc': 'Configure services, duration and prices your way.',
    'benefits.reports': 'Simple Reports',
    'benefits.reports_desc': 'See your business performance with clear, direct data.',
    'benefits.link': 'Ready Bio Link',
    'benefits.link_desc': 'Share your booking link on social media.',

    // How it works
    'how.label': 'Step by step',
    'how.title': 'How it works',
    'how.step1_title': 'Create your business',
    'how.step1_desc': 'Sign up for free and set up your space in minutes.',
    'how.step2_title': 'Configure services & hours',
    'how.step2_desc': 'Add services, prices, duration and team schedules.',
    'how.step3_title': 'Share your booking link',
    'how.step3_desc': 'Share on social media, WhatsApp and wherever you want.',
    'how.step4_title': 'Receive clients automatically',
    'how.step4_desc': 'Your clients book by themselves, 24/7, 365 days a year.',

    // Video
    'video.label': 'Demo',

    // FAQ
    'faq.label': 'FAQ',
    'faq.title': 'Frequently asked questions',
    'faq.q1': 'Do I need a website?',
    'faq.a1': 'No! Agenda Smart automatically generates a booking page for your business. Just share the link.',
    'faq.q2': 'Does it work with WhatsApp?',
    'faq.a2': 'Yes. You can send your booking link directly via WhatsApp to your clients.',
    'faq.q3': 'Can my clients book on mobile?',
    'faq.a3': 'Yes, the platform is 100% responsive. It works perfectly on any device.',
    'faq.q4': 'Can I edit schedules?',
    'faq.a4': 'Of course! You can configure work hours, breaks and days off for each professional individually.',
    'faq.q5': 'How do I share my link?',
    'faq.a5': 'In your business settings you\'ll find the direct link. Copy and paste it on any social media, Instagram bio, etc.',
    'faq.q6': 'Is there support?',
    'faq.a6': 'Yes! We offer support via chat and email. Pro users get priority support.',

    // Final CTA
    'cta.label': 'Start today',
    'cta.title': 'Ready to transform your business?',
    'cta.subtitle': 'Set up your space in minutes and start receiving bookings today. No commitment.',

    // Footer
    'footer.rights': 'All rights reserved.',

    // SEO
    'seo.title': 'Agenda Smart - Scheduling System for Barbershops & Salons',
    'seo.description': 'Complete online scheduling system for barbershops, beauty salons and more. Manage your clients and team easily.',
  },
} as const;

type TranslationKey = keyof typeof translations.pt;

// ── Context ──
interface I18nContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

function detectLocale(): Locale {
  // Check localStorage first
  const saved = localStorage.getItem('agenda-smart-locale');
  if (saved === 'pt' || saved === 'en') return saved;

  // Detect from browser
  const lang = navigator.language || (navigator as any).userLanguage || 'pt';
  return lang.startsWith('pt') ? 'pt' : 'en';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem('agenda-smart-locale', l);
  };

  const t = (key: TranslationKey): string => {
    return translations[locale]?.[key] || translations.pt[key] || key;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

export function LanguageToggle() {
  const { locale, setLocale } = useI18n();

  return (
    <button
      onClick={() => setLocale(locale === 'pt' ? 'en' : 'pt')}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-border/30 bg-card/40 backdrop-blur-sm text-foreground hover:bg-card/60 transition-colors duration-200"
      aria-label="Change language"
    >
      {locale === 'pt' ? '🇬🇧 EN' : '🇵🇹 PT'}
    </button>
  );
}
