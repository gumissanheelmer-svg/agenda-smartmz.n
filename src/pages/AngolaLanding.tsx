import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { ArrowRight, MessageCircle, Calendar, Users, Zap, Shield, CheckCircle, Clock, BarChart3, Star, Check } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { FAQSection } from '@/components/landing/FAQSection';
import { useLandingSettings } from '@/hooks/useLandingSettings';

const WA_DEFAULT_PHONE = '244999999999';
const WA_MESSAGE = 'Olá, quero ativar o Agenda Smart na minha barbearia em Angola. Pode me explicar como funciona e os valores?';

const blurFadeUp = {
  hidden: { opacity: 0, y: 40, filter: 'blur(10px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.7, ease: 'easeOut' as const } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
};

const cardReveal = {
  hidden: { opacity: 0, y: 40, filter: 'blur(8px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.6, ease: 'easeOut' as const } }
};

const benefits = [
  { icon: Clock, title: 'Mais Organização', desc: 'Agenda digital no lugar do caderno. Sem confusão de horários, sem clientes perdidos.' },
  { icon: Users, title: 'Mais Clientes', desc: 'Clientes agendam pelo Instagram ou WhatsApp. Seu link funciona 24h, mesmo quando você não está.' },
  { icon: Zap, title: 'Atendimento Moderno', desc: 'Confirmação automática, lembretes e gestão da equipa num único painel.' },
  { icon: Star, title: 'Diferencial Competitivo', desc: 'Seja a barbearia mais profissional de Luanda. Tecnologia que impressiona seus clientes.' },
];

function getWhatsAppUrl(phone: string | null) {
  const num = (phone || WA_DEFAULT_PHONE).replace(/\D/g, '');
  const normalized = num.length === 9 ? '244' + num : num;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(WA_MESSAGE)}`;
}

export default function AngolaLanding() {
  const { settings } = useLandingSettings();
  // Use secure pre-built URL from RPC, fallback to default
  const waUrl = settings.wa_sales_url || getWhatsAppUrl(null);

  return (
    <div className="min-h-screen bg-background overflow-hidden relative">
      <Helmet>
        <title>Agenda Smart Angola – Sistema de Agendamento para Barbearias em Luanda</title>
        <meta name="description" content="Sistema de agendamento online para barbearias em Angola. Clientes agendam pelo Instagram, você organiza seu negócio e aumenta o faturamento." />
      </Helmet>

      <div className="noise-overlay" />

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
        <a href={waUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="default" size="sm" className="shadow-[0_0_20px_hsl(43_74%_49%_/_0.2)]">
            <MessageCircle className="w-4 h-4 mr-1.5" />
            Falar no WhatsApp
          </Button>
        </a>
      </motion.header>

      <main className="relative z-10">
        {/* Hero */}
        <section className="flex flex-col items-center justify-center min-h-[calc(100vh-180px)] px-6 pt-8 pb-20">
          <div className="relative w-full max-w-6xl mx-auto">
            <div className="flex flex-col items-center text-center">
              <motion.div
                className="mb-6 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-xs font-medium text-primary tracking-wide uppercase"
                initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                🇦🇴 LANÇAMENTO ANGOLA – VAGAS LIMITADAS
              </motion.div>

              <motion.h1
                className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-foreground max-w-4xl leading-[0.95] tracking-tight"
                initial="hidden"
                animate="visible"
                variants={blurFadeUp}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                Transforme sua Barbearia em uma{' '}
                <span className="relative">
                  <span className="text-primary">Máquina de Agendamentos</span>
                  <motion.span
                    className="absolute -bottom-2 left-0 right-0 h-[3px] bg-gradient-to-r from-primary via-primary/80 to-transparent rounded-full"
                    initial={{ scaleX: 0, originX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 1 }}
                  />
                </span>{' '}
                em Luanda
              </motion.h1>

              <motion.p
                className="mt-6 text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed"
                initial="hidden"
                animate="visible"
                variants={blurFadeUp}
                transition={{ duration: 0.7, delay: 0.4 }}
              >
                Clientes agendam sozinhos pelo Instagram. Você organiza seu negócio e aumenta seu faturamento.
              </motion.p>

              <motion.div
                className="mt-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
                initial="hidden"
                animate="visible"
                variants={blurFadeUp}
                transition={{ duration: 0.7, delay: 0.6 }}
              >
                <a href={waUrl} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                    <Button variant="hero" size="xl" className="w-full sm:w-auto shadow-[0_0_30px_hsl(43_74%_49%_/_0.25)] hover:shadow-[0_0_50px_hsl(43_74%_49%_/_0.35)] transition-shadow duration-500">
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Configurar Minha Barbearia Agora
                    </Button>
                  </motion.div>
                </a>
              </motion.div>

              <motion.p
                className="mt-3 text-sm text-muted-foreground/70"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                Atendimento pelo WhatsApp. Configuração em minutos.
              </motion.p>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="px-6 -mt-8 mb-16">
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full mx-auto"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
          >
            {[
              { icon: Users, value: 'Luanda', label: 'Mercado inicial' },
              { icon: Calendar, value: '24h', label: 'Agendamento online' },
              { icon: BarChart3, value: '100%', label: 'Suporte em Português' },
            ].map((s) => (
              <motion.div
                key={s.label}
                className="flex items-center gap-3 p-4 rounded-xl bg-card/60 border border-border/30 backdrop-blur-xl"
                variants={cardReveal}
                whileHover={{ y: -4, boxShadow: '0 20px 40px -12px hsl(43 74% 49% / 0.15)', borderColor: 'hsl(43 74% 49% / 0.3)' }}
                transition={{ duration: 0.4 }}
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <s.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground font-display">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Benefits */}
        <section className="py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-xs font-medium text-primary tracking-widest uppercase mb-3 block">Por que usar</span>
              <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight">
                Vantagens para sua barbearia
              </h2>
              <p className="mt-4 text-muted-foreground text-lg max-w-lg mx-auto">
                Ferramentas pensadas para o mercado angolano.
              </p>
            </motion.div>

            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 gap-6"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
            >
              {benefits.map((b, i) => (
                <motion.div
                  key={i}
                  className="group relative flex flex-col p-8 rounded-2xl bg-card/40 border border-border/30 backdrop-blur-sm cursor-default overflow-hidden"
                  variants={cardReveal}
                  whileHover={{ y: -6, borderColor: 'hsl(43 74% 49% / 0.25)', boxShadow: '0 16px 40px -12px hsl(43 74% 49% / 0.1)' }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative z-10">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-colors duration-300">
                      <b.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-display font-semibold text-foreground text-lg mb-2">{b.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Pricing – Single Plan */}
        <section className="py-24 px-6">
          <div className="max-w-md mx-auto">
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-xs font-medium text-primary tracking-widest uppercase mb-3 block">Preço</span>
              <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight">
                Plano único, sem surpresas
              </h2>
            </motion.div>

            <motion.div
              className="relative flex flex-col p-8 rounded-2xl border bg-card/60 border-primary/30 shadow-[0_0_40px_hsl(43_74%_49%_/_0.08)]"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.7 }}
              whileHover={{ y: -6, boxShadow: '0 20px 60px -12px hsl(43 74% 49% / 0.15)' }}
            >
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold bg-primary text-primary-foreground whitespace-nowrap">
                Teste Angola – Vagas Limitadas
              </span>

              <h3 className="font-display font-bold text-xl text-foreground">Plano Profissional</h3>
              <p className="text-sm text-muted-foreground mt-1">Tudo que você precisa para começar</p>

              <div className="mt-6 mb-8">
                <span className="text-4xl font-display font-bold text-foreground">25.000 AOA</span>
                <span className="text-sm text-muted-foreground ml-1">/mês</span>
              </div>

              <ul className="flex-1 space-y-3 mb-8">
                {[
                  'Agendamento online 24h',
                  'Link para Instagram e WhatsApp',
                  'Gestão de profissionais',
                  'Confirmação automática',
                  'Relatórios de desempenho',
                  'Suporte em Português',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <p className="text-xs text-muted-foreground/70 text-center mb-4">
                Configuração personalizada via WhatsApp.
              </p>

              <a href={waUrl} target="_blank" rel="noopener noreferrer" className="w-full">
                <Button variant="default" size="lg" className="w-full">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Quero Começar
                </Button>
              </a>
            </motion.div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 px-6">
          <motion.div
            className="max-w-3xl mx-auto text-center relative"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
          >
            <div className="absolute inset-0 -m-20 bg-gradient-radial from-primary/[0.06] via-transparent to-transparent pointer-events-none" />
            <span className="text-xs font-medium text-primary tracking-widest uppercase mb-4 block">Comece hoje</span>
            <h2 className="relative text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight mb-5">
              Pronto para modernizar sua barbearia?
            </h2>
            <p className="relative text-muted-foreground text-lg mb-10 max-w-lg mx-auto">
              Fale connosco no WhatsApp e configuramos tudo para si em minutos.
            </p>
            <a href={waUrl} target="_blank" rel="noopener noreferrer">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} className="inline-block">
                <Button variant="hero" size="xl" className="shadow-[0_0_30px_hsl(43_74%_49%_/_0.25)] hover:shadow-[0_0_50px_hsl(43_74%_49%_/_0.35)] transition-shadow duration-500">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Configurar Minha Barbearia Agora
                </Button>
              </motion.div>
            </a>
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
        <p>© {new Date().getFullYear()} Agenda Smart Angola. Todos os direitos reservados.</p>
      </motion.footer>
    </div>
  );
}
