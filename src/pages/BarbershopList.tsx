import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { 
  Scissors, Calendar, Users, MessageSquare, ArrowRight, 
  BarChart3, Shield, Zap, ChevronRight 
} from 'lucide-react';
import { useEffect, useRef } from 'react';

// ── Animation Variants ──────────────────────────────────────
const blurFadeUp = {
  hidden: { opacity: 0, y: 40, filter: 'blur(10px)' },
  visible: { 
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: 0.7, ease: 'easeOut' as const }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 }
  }
};

const cardReveal = {
  hidden: { opacity: 0, y: 50, filter: 'blur(8px)' },
  visible: { 
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: 0.6, ease: 'easeOut' as const }
  }
};

// ── Count-Up Component ──────────────────────────────────────
function CountUp({ target, suffix = '' }: { target: number; suffix?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));

  useEffect(() => {
    if (isInView) {
      animate(count, target, { duration: 2, ease: 'easeOut' });
    }
  }, [isInView, target, count]);

  return (
    <span ref={ref} className="tabular-nums">
      <motion.span>{rounded}</motion.span>{suffix}
    </span>
  );
}

// ── Floating Badge ──────────────────────────────────────────
function FloatingBadge({ children, delay = 0, x = 0, y = 0 }: { 
  children: React.ReactNode; delay?: number; x?: number; y?: number 
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

// ── Stat Card for Hero ──────────────────────────────────────
function StatCard({ icon: Icon, value, label }: { 
  icon: React.ElementType; value: string; label: string 
}) {
  return (
    <motion.div 
      className="flex items-center gap-3 p-4 rounded-xl bg-card/60 border border-border/30 backdrop-blur-xl"
      variants={cardReveal}
      whileHover={{ 
        y: -4,
        boxShadow: '0 20px 40px -12px hsl(43 74% 49% / 0.15)',
        borderColor: 'hsl(43 74% 49% / 0.3)',
      }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <p className="text-lg font-semibold text-foreground font-display">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </motion.div>
  );
}

export default function BarbershopList() {
  return (
    <div className="min-h-screen bg-background overflow-hidden relative">
      <Helmet>
        <title>Agendou - Sistema de Agendamento para Barbearias e Salões</title>
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
          <Link to="/register">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground transition-colors duration-300">
              Criar Meu Negócio
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="default" size="sm" className="shadow-[0_0_20px_hsl(43_74%_49%_/_0.2)]">
              Entrar
            </Button>
          </Link>
        </div>
      </motion.header>

      {/* Hero Section */}
      <main className="relative z-10">
        <section className="flex flex-col items-center justify-center min-h-[calc(100vh-180px)] px-6 pt-8 pb-20">
          <div className="relative w-full max-w-6xl mx-auto">
            
            {/* Floating badges around hero */}
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

            {/* Center content */}
            <div className="flex flex-col items-center text-center">
              {/* Badge */}
              <motion.div
                className="mb-6 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-xs font-medium text-primary tracking-wide uppercase"
                initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                ✦ A plataforma #1 de agendamento
              </motion.div>

              <motion.h1 
                className="text-5xl md:text-7xl lg:text-8xl font-display font-bold text-foreground max-w-4xl leading-[0.95] tracking-tight"
                initial="hidden"
                animate="visible"
                variants={blurFadeUp}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                Seu negócio.{' '}
                <span className="relative">
                  <span className="text-primary">Automatizado.</span>
                  <motion.span 
                    className="absolute -bottom-2 left-0 right-0 h-[3px] bg-gradient-to-r from-primary via-primary/80 to-transparent rounded-full"
                    initial={{ scaleX: 0, originX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 1 }}
                  />
                </span>
              </motion.h1>

              <motion.p 
                className="mt-6 text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed"
                initial="hidden"
                animate="visible"
                variants={blurFadeUp}
                transition={{ duration: 0.7, delay: 0.4 }}
              >
                Gerencie agendamentos, equipe e pagamentos em uma única plataforma. Seus clientes agendam 24h, você foca no que importa.
              </motion.p>

              <motion.div 
                className="mt-10 flex flex-col sm:flex-row gap-4"
                initial="hidden"
                animate="visible"
                variants={blurFadeUp}
                transition={{ duration: 0.7, delay: 0.6 }}
              >
                <Link to="/register">
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative"
                  >
                    <div className="absolute inset-0 rounded-xl bg-primary/20 blur-xl transition-all duration-500 group-hover:bg-primary/30" />
                    <Button variant="hero" size="xl" className="relative shadow-[0_0_30px_hsl(43_74%_49%_/_0.25)] hover:shadow-[0_0_50px_hsl(43_74%_49%_/_0.35)] transition-shadow duration-500">
                      Começar Agora — É Grátis
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </motion.div>
                </Link>
              </motion.div>

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

          {/* Stats row */}
          <motion.div 
            className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
          >
            <StatCard icon={Users} value="500+" label="Negócios ativos" />
            <StatCard icon={Calendar} value="12k+" label="Agendamentos/mês" />
            <StatCard icon={BarChart3} value="99.9%" label="Uptime garantido" />
          </motion.div>
        </section>

        {/* Features */}
        <section className="py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <motion.div
              className="text-center mb-16"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              variants={blurFadeUp}
            >
              <span className="text-xs font-medium text-primary tracking-widest uppercase mb-3 block">Funcionalidades</span>
              <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight">
                Tudo que você precisa
              </h2>
              <p className="mt-4 text-muted-foreground text-lg max-w-lg mx-auto">
                Ferramentas poderosas para automatizar e escalar seu negócio.
              </p>
            </motion.div>
            
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
            >
              {[
                { icon: Calendar, title: "Agendamento 24h", desc: "Clientes agendam a qualquer hora, mesmo quando você não está disponível." },
                { icon: Users, title: "Gestão de Equipe", desc: "Cadastre profissionais e distribua agendamentos de forma automática." },
                { icon: Scissors, title: "Serviços Personalizados", desc: "Configure serviços, preços e duração exatamente como quiser." },
                { icon: MessageSquare, title: "Link Exclusivo", desc: "Seu negócio com link próprio para compartilhar com todos os clientes." }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  className="group relative flex flex-col p-8 rounded-2xl bg-card/40 border border-border/30 backdrop-blur-sm cursor-default overflow-hidden"
                  variants={cardReveal}
                  whileHover={{ 
                    y: -6, 
                    borderColor: 'hsl(43 74% 49% / 0.25)',
                  }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                >
                  {/* Hover glow */}
                  <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative z-10">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-colors duration-300">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-display font-semibold text-foreground text-lg mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Social proof / Numbers */}
        <section className="py-24 px-6">
          <motion.div 
            className="max-w-4xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
          >
            <motion.div className="text-center mb-16" variants={blurFadeUp}>
              <span className="text-xs font-medium text-primary tracking-widest uppercase mb-3 block">Resultados</span>
              <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight">
                Números que falam
              </h2>
            </motion.div>

            <motion.div 
              className="grid grid-cols-2 md:grid-cols-4 gap-8"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
            >
              {[
                { value: 500, suffix: '+', label: 'Negócios' },
                { value: 12000, suffix: '+', label: 'Agendamentos' },
                { value: 98, suffix: '%', label: 'Satisfação' },
                { value: 24, suffix: '/7', label: 'Disponível' },
              ].map((stat, i) => (
                <motion.div key={i} className="text-center" variants={cardReveal}>
                  <p className="text-4xl md:text-5xl font-display font-bold text-foreground">
                    <CountUp target={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* CTA */}
        <section className="py-24 px-6">
          <motion.div 
            className="max-w-3xl mx-auto text-center relative"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
          >
            {/* Background glow */}
            <div className="absolute inset-0 -m-20 bg-gradient-radial from-primary/[0.06] via-transparent to-transparent pointer-events-none" />
            
            <motion.span 
              className="text-xs font-medium text-primary tracking-widest uppercase mb-4 block"
              variants={blurFadeUp}
            >
              Comece hoje
            </motion.span>
            <motion.h2 
              className="relative text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight mb-5"
              variants={blurFadeUp}
            >
              Pronto para transformar seu negócio?
            </motion.h2>
            <motion.p 
              className="relative text-muted-foreground text-lg mb-10 max-w-lg mx-auto"
              variants={blurFadeUp}
            >
              Crie seu espaço em minutos e comece a receber agendamentos hoje mesmo. Sem compromisso.
            </motion.p>
            <motion.div variants={blurFadeUp}>
              <Link to="/register">
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-block"
                >
                  <Button variant="hero" size="xl" className="shadow-[0_0_30px_hsl(43_74%_49%_/_0.25)] hover:shadow-[0_0_50px_hsl(43_74%_49%_/_0.35)] transition-shadow duration-500">
                    Começar Agora — É Grátis
                    <ChevronRight className="w-5 h-5 ml-1" />
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <motion.footer 
        className="relative z-10 py-10 text-center text-sm text-muted-foreground/60 border-t border-border/20"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <p>© {new Date().getFullYear()} Agendou. Todos os direitos reservados.</p>
      </motion.footer>
    </div>
  );
}
