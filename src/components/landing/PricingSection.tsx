import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLandingSettings } from '@/hooks/useLandingSettings';

export function PricingSection() {
  const [annual, setAnnual] = useState(false);
  const { settings, isLoading } = useLandingSettings();

  if (isLoading) return null;
  if (!settings.pricing_enabled) return null;

  const enabledPlans = settings.plans.filter((p) => p.enabled);
  if (enabledPlans.length === 0) return null;

  const formatPrice = (price: number) => {
    if (price === 0) return 'Grátis';
    if (settings.currency_code === 'MZN') return `${price} MT`;
    return `${settings.currency_code} ${price}`;
  };

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
            {settings.pricing_title}
          </h2>
          <p className="mt-4 text-muted-foreground text-lg max-w-lg mx-auto">
            {settings.pricing_subtitle}
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
            Anual <span className="text-primary text-xs ml-1">{settings.pricing_discount_label}</span>
          </span>
        </div>

        <motion.div
          className={`grid grid-cols-1 ${enabledPlans.length > 1 ? 'md:grid-cols-2' : 'max-w-md mx-auto'} gap-8`}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7 }}
        >
          {enabledPlans.map((plan) => {
            const price = annual ? Math.round(plan.yearly_price / 12) : plan.monthly_price;
            const highlighted = !!plan.badge;
            return (
              <motion.div
                key={plan.key}
                className={`relative flex flex-col p-8 rounded-2xl border backdrop-blur-sm ${
                  highlighted
                    ? 'bg-card/60 border-primary/30 shadow-[0_0_40px_hsl(43_74%_49%_/_0.08)]'
                    : 'bg-card/40 border-border/30'
                }`}
                whileHover={{
                  y: -6,
                  boxShadow: highlighted
                    ? '0 20px 60px -12px hsl(43 74% 49% / 0.15)'
                    : '0 16px 40px -12px hsl(0 0% 0% / 0.3)',
                }}
                transition={{ duration: 0.4 }}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold bg-primary text-primary-foreground">
                    {plan.badge}
                  </span>
                )}
                <h3 className="font-display font-bold text-xl text-foreground">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{plan.tagline}</p>

                <div className="mt-6 mb-8">
                  <span className="text-4xl font-display font-bold text-foreground">
                    {formatPrice(price)}
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
                    variant={highlighted ? 'default' : 'outline'}
                    size="lg"
                    className="w-full"
                  >
                    {plan.cta_label}
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
