import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';

import { HeroSection } from '@/components/landing/HeroSection';
import { StatsRow } from '@/components/landing/StatsRow';
import { BenefitsGrid } from '@/components/landing/BenefitsGrid';
import { VideoSection } from '@/components/landing/VideoSection';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { PricingSection } from '@/components/landing/PricingSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { FinalCTA } from '@/components/landing/FinalCTA';
import { WhatsAppFAB } from '@/components/landing/WhatsAppFAB';
import { useReferral } from '@/hooks/useReferral';
import { useLandingSettings } from '@/hooks/useLandingSettings';

const DEFAULT_WA_MESSAGE = `Olá! Quero que vocês configurem o meu negócio no Agenda Smart.

Nome do negócio:
Cidade/País:
Tipo de negócio (Barbearia/Salão/Estética/Tatuagem):
Meu WhatsApp:`;

function buildWhatsAppLink(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, '');
  const normalized = digits.length === 9 ? '258' + digits : digits;
  const isMobile = typeof window !== 'undefined' &&
    (window.innerWidth < 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
  const encoded = encodeURIComponent(message);
  return isMobile
    ? `https://wa.me/${normalized}?text=${encoded}`
    : `https://web.whatsapp.com/send?phone=${normalized}&text=${encoded}`;
}

export default function BarbershopList() {
  useReferral();
  const { settings } = useLandingSettings();

  const waPhone = settings.wa_sales_phone;
  const waMessage = settings.wa_sales_message_template || DEFAULT_WA_MESSAGE;
  const waEnabled = settings.wa_sales_enabled && !!waPhone;

  return (
    <div className="min-h-screen bg-background overflow-hidden relative">
      <Helmet>
        <title>Agenda Smart - Sistema de Agendamento para Barbearias e Salões</title>
        <meta name="description" content="Sistema completo de agendamento online para barbearias, salões de beleza e muito mais. Gerencie seus clientes e equipe de forma simples." />
      </Helmet>

      {/* Noise overlay */}
      <div className="noise-overlay" />

      {/* Radial gradient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] bg-gradient-radial from-primary/[0.07] via-transparent to-transparent" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-gradient-radial from-primary/[0.04] via-transparent to-transparent" />
      </div>

      {/* Header */}
      <motion.header
        className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <Logo size="sm" />
        <div className="flex items-center gap-3">
          {waEnabled ? (
            <a
              href={buildWhatsAppLink(waPhone!, waMessage)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground transition-colors duration-300">
                <MessageCircle className="w-4 h-4 mr-1.5" />
                Configurar Meu Negócio
              </Button>
            </a>
          ) : (
            <Link to="/register">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground transition-colors duration-300">
                Configurar Meu Negócio
              </Button>
            </Link>
          )}
          <Link to="/login">
            <Button variant="default" size="sm" className="shadow-[0_0_20px_hsl(43_74%_49%_/_0.2)]">
              Entrar
            </Button>
          </Link>
        </div>
      </motion.header>

      {/* Sections */}
      <main className="relative z-10">
        <HeroSection />
        <StatsRow />
        <BenefitsGrid />
        <VideoSection />
        <HowItWorks />
        <PricingSection />
        <FAQSection />
        <FinalCTA />
      </main>

      {/* WhatsApp floating support */}
      <WhatsAppFAB />

      {/* Footer */}
      <motion.footer
        className="relative z-10 py-10 text-center text-sm text-muted-foreground/60 border-t border-border/20"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <p>© {new Date().getFullYear()} Agenda Smart. Todos os direitos reservados.</p>
      </motion.footer>
    </div>
  );
}
