import { motion } from 'framer-motion';

const steps = [
  { num: '01', title: 'Crie seu negócio', desc: 'Cadastre-se gratuitamente e configure seu espaço em minutos.' },
  { num: '02', title: 'Configure serviços e horários', desc: 'Adicione serviços, preços, duração e horários da equipa.' },
  { num: '03', title: 'Publique seu link de agendamento', desc: 'Compartilhe nas redes sociais, WhatsApp e onde quiser.' },
  { num: '04', title: 'Receba clientes automaticamente', desc: 'Seus clientes agendam sozinhos, 24h por dia, 7 dias por semana.' },
];

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

const itemReveal = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } }
};

export function HowItWorks() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-xs font-medium text-primary tracking-widest uppercase mb-3 block">Passo a passo</span>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight">
            Como funciona
          </h2>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          {steps.map((s) => (
            <motion.div
              key={s.num}
              className="group relative p-8 rounded-2xl bg-card/40 border border-border/30 backdrop-blur-sm text-center"
              variants={itemReveal}
              whileHover={{
                y: -6,
                borderColor: 'hsl(43 74% 49% / 0.25)',
                boxShadow: '0 16px 40px -12px hsl(43 74% 49% / 0.1)',
              }}
              transition={{ duration: 0.4 }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
              <span className="relative z-10 text-4xl font-display font-bold text-primary/30 group-hover:text-primary/50 transition-colors duration-300">{s.num}</span>
              <h3 className="relative z-10 mt-4 font-display font-semibold text-foreground text-lg">{s.title}</h3>
              <p className="relative z-10 mt-2 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
