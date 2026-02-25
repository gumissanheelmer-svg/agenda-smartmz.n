import { motion } from 'framer-motion';
import { Clock, CheckCircle, Users, Tag, BarChart3, Link2 } from 'lucide-react';

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

const cardReveal = {
  hidden: { opacity: 0, y: 40, filter: 'blur(8px)' },
  visible: {
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: 0.6, ease: 'easeOut' as const }
  }
};

const benefits = [
  { icon: Clock, title: 'Agendamento 24h', desc: 'Clientes agendam a qualquer hora, mesmo quando você não está.' },
  { icon: CheckCircle, title: 'Confirmação automática', desc: 'Cada agendamento é confirmado na hora, sem esforço manual.' },
  { icon: Users, title: 'Gestão de equipa', desc: 'Cadastre profissionais e distribua a agenda automaticamente.' },
  { icon: Tag, title: 'Serviços e preços', desc: 'Configure serviços, duração e preços do seu jeito.' },
  { icon: BarChart3, title: 'Relatórios simples', desc: 'Veja o desempenho do negócio com dados claros e diretos.' },
  { icon: Link2, title: 'Link na bio pronto', desc: 'Compartilhe seu link de agendamento nas redes sociais.' },
];

export function BenefitsGrid() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
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
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
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
              whileHover={{
                y: -6,
                borderColor: 'hsl(43 74% 49% / 0.25)',
                boxShadow: '0 16px 40px -12px hsl(43 74% 49% / 0.1)',
              }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
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
  );
}
