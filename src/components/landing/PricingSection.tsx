import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

const plans = [
  {
    name: 'Básico',
    ideal: 'Para começar',
    monthly: 0,
    annual: 0,
    features: ['1 negócio', 'Link de agendamento', 'Gestão de serviços', 'Confirmações'],
    highlighted: false,
  },
  {
    name: 'Pro',
    ideal: 'Para crescer',
    monthly: 1500,
    annual: 1200,
    features: ['Tudo do Básico', 'Relatórios avançados', 'Suporte prioritário', 'Recursos Pro'],
    highlighted: true,
  },
];

export function PricingSection() {
  const [annual, setAnnual] = useState(false);

  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-xs font-medium text-primary tracking-widest uppercase mb-3 block">Preços</span>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight">
            Escolha o plano ideal
          </h2>
          <p className="mt-4 text-muted-foreground text-lg max-w-lg mx-auto">
            Comece grátis. Cresça quando quiser.
          </p>
        </motion.div>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-3 mb-14">
          <span className={`text-sm font-medium transition-colors ${!annual ? 'text-foreground' : 'text-muted-foreground'}`}>Mensal</span>
          <button
            onClick={() => setAnnual(!annual)}
            className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${annual ? 'bg-primary' : 'bg-muted'}`}
            aria-label="Alternar plano anual"
          >
            <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-foreground transition-transform duration-300 ${annual ? 'translate-x-7' : ''}`} />
          </button>
          <span className={`text-sm font-medium transition-colors ${annual ? 'text-foreground' : 'text-muted-foreground'}`}>
            Anual <span className="text-primary text-xs ml-1">-20%</span>
          </span>
        </div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7 }}
        >
          {plans.map((plan) => {
            const price = annual ? plan.annual : plan.monthly;
            return (
              <motion.div
                key={plan.name}
                className={`relative flex flex-col p-8 rounded-2xl border backdrop-blur-sm ${
                  plan.highlighted
                    ? 'bg-card/60 border-primary/30 shadow-[0_0_40px_hsl(43_74%_49%_/_0.08)]'
                    : 'bg-card/40 border-border/30'
                }`}
                whileHover={{
                  y: -6,
                  boxShadow: plan.highlighted
                    ? '0 20px 60px -12px hsl(43 74% 49% / 0.15)'
                    : '0 16px 40px -12px hsl(0 0% 0% / 0.3)',
                }}
                transition={{ duration: 0.4 }}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold bg-primary text-primary-foreground">
                    Popular
                  </span>
                )}
                <h3 className="font-display font-bold text-xl text-foreground">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{plan.ideal}</p>

                <div className="mt-6 mb-8">
                  <span className="text-4xl font-display font-bold text-foreground">
                    {price === 0 ? 'Grátis' : `${price} MT`}
                  </span>
                  {price > 0 && <span className="text-sm text-muted-foreground ml-1">/mês</span>}
                </div>

                <ul className="flex-1 space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link to="/register" className="w-full">
                  <Button
                    variant={plan.highlighted ? 'default' : 'outline'}
                    size="lg"
                    className="w-full"
                  >
                    Começar
                  </Button>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
