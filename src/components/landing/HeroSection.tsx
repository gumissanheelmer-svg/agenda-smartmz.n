import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar, Shield, Zap, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLandingSettings } from '@/hooks/useLandingSettings';

const blurFadeUp = {
  hidden: { opacity: 0, y: 40, filter: 'blur(10px)' },
  visible: {
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: 0.7, ease: 'easeOut' as const }
  }
};

function FloatingBadge({ children, delay = 0, x = 0, y = 0 }: {
  children: React.ReactNode; delay?: number; x?: number; y?: number;
}) {
  return (
    <motion.div
      className="absolute hidden lg:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card/80 border border-border/50 backdrop-blur-xl text-sm text-foreground shadow-lg"
      style={{ left: x, top: y }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: 1, scale: 1,
        y: [0, -8, 0],
      }}
      transition={{
        opacity: { duration: 0.5, delay },
        scale: { duration: 0.5, delay },
        y: { duration: 6, repeat: Infinity, ease: 'easeInOut', delay: delay + 0.5 }
      }}
    >
      {children}
    </motion.div>
  );
}

export function HeroSection() {
  const { settings } = useLandingSettings();

  // Split title on period to highlight second part
  const titleParts = settings.hero_title.split('.');
  const firstPart = titleParts[0] ? titleParts[0] + '.' : settings.hero_title;
  const highlightPart = titleParts[1]?.trim() || '';

  return (
    <section className="flex flex-col items-center justify-center min-h-[calc(100vh-180px)] px-6 pt-8 pb-20">
      <div className="relative w-full max-w-6xl mx-auto">
        <FloatingBadge delay={1} x={-40} y={80}>
          <Calendar className="w-4 h-4 text-primary" />
          <span>+2.400 agendamentos</span>
        </FloatingBadge>
        <FloatingBadge delay={1.3} x={-20} y={280}>
          <Shield className="w-4 h-4 text-primary" />
          <span>100% seguro</span>
        </FloatingBadge>
        <FloatingBadge delay={1.6} x={undefined} y={120}>
          <Zap className="w-4 h-4 text-primary" />
          <span>Setup em 2min</span>
        </FloatingBadge>

        <div className="flex flex-col items-center text-center">
          <motion.div
            className="mb-6 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-xs font-medium text-primary tracking-wide uppercase"
            initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            ✦ A PLATAFORMA #1 DE AGENDAMENTO
          </motion.div>

          <motion.h1
            className="text-5xl md:text-7xl lg:text-8xl font-display font-bold text-foreground max-w-4xl leading-[0.95] tracking-tight"
            initial="hidden"
            animate="visible"
            variants={blurFadeUp}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {highlightPart ? (
              <>
                {firstPart}{' '}
                <span className="relative">
                  <span className="text-primary">{highlightPart}</span>
                  <motion.span
                    className="absolute -bottom-2 left-0 right-0 h-[3px] bg-gradient-to-r from-primary via-primary/80 to-transparent rounded-full"
                    initial={{ scaleX: 0, originX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 1 }}
                  />
                </span>
              </>
            ) : (
              settings.hero_title
            )}
          </motion.h1>

          <motion.p
            className="mt-6 text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed"
            initial="hidden"
            animate="visible"
            variants={blurFadeUp}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            {settings.hero_subtitle}
          </motion.p>

          <motion.div
            className="mt-10 flex flex-col items-center gap-4 w-full sm:w-auto"
            initial="hidden"
            animate="visible"
            variants={blurFadeUp}
            transition={{ duration: 0.7, delay: 0.6 }}
          >
            {/* Primary CTA — always WhatsApp assisted setup */}
            {settings.wa_sales_enabled && settings.wa_sales_phone ? (
              <a
                href={`https://wa.me/${settings.wa_sales_phone.replace(/\D/g, '').length === 9 ? '258' + settings.wa_sales_phone.replace(/\D/g, '') : settings.wa_sales_phone.replace(/\D/g, '')}?text=${encodeURIComponent(settings.wa_sales_message_template)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto"
              >
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                  <Button variant="hero" size="xl" className="w-full sm:w-auto shadow-[0_0_30px_hsl(43_74%_49%_/_0.25)] hover:shadow-[0_0_50px_hsl(43_74%_49%_/_0.35)] transition-shadow duration-500">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Quero Minha Agenda Configurada
                  </Button>
                </motion.div>
              </a>
            ) : (
              <Link to="/register" className="w-full sm:w-auto">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                  <Button variant="hero" size="xl" className="w-full sm:w-auto shadow-[0_0_30px_hsl(43_74%_49%_/_0.25)] hover:shadow-[0_0_50px_hsl(43_74%_49%_/_0.35)] transition-shadow duration-500">
                    Quero Minha Agenda Configurada
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </motion.div>
              </Link>
            )}

            {/* Secondary row: manual + login */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Link to="/register">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-sm">
                  Criar Conta Manualmente
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
              {settings.secondary_cta_enabled && (
                <Link to="/login">
                  <Button variant="outline" size="sm" className="text-sm">
                    {settings.secondary_cta_label}
                  </Button>
                </Link>
              )}
            </div>
          </motion.div>

          {settings.wa_sales_enabled && settings.wa_sales_phone && (
            <motion.p
              className="mt-3 text-sm text-muted-foreground/70"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              Configuramos tudo por si. Só precisa nos chamar no WhatsApp.
            </motion.p>
          )}

          <motion.p
            className="mt-5 text-sm text-muted-foreground/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.9 }}
          >
            É cliente? Peça o link de agendamento ao seu profissional.
          </motion.p>
        </div>
      </div>
    </section>
  );
}
