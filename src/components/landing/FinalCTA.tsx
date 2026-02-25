import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FinalCTA() {
  return (
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
          Pronto para transformar seu negócio?
        </h2>
        <p className="relative text-muted-foreground text-lg mb-10 max-w-lg mx-auto">
          Crie seu espaço em minutos e comece a receber agendamentos hoje mesmo. Sem compromisso.
        </p>
        <Link to="/register">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} className="inline-block">
            <Button variant="hero" size="xl" className="w-full sm:w-auto shadow-[0_0_30px_hsl(43_74%_49%_/_0.25)] hover:shadow-[0_0_50px_hsl(43_74%_49%_/_0.35)] transition-shadow duration-500">
              Começar Agora — É Grátis
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </motion.div>
        </Link>
      </motion.div>
    </section>
  );
}
