import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Users, Crown, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface Plan {
  id: string;
  key: string;
  name: string;
  price: number;
  yearly_price: number;
  currency: string;
  country_code: string;
  max_professionals: number;
  features: string[];
  badge: string | null;
}

const PLAN_ICONS: Record<string, typeof Zap> = {
  basic: Zap,
  pro: Crown,
  premium: Users,
};

export function PricingSection() {
  const [annual, setAnnual] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [country, setCountry] = useState<'MZ' | 'INTL'>('MZ');

  useEffect(() => {
    fetchPlans();
  }, [country]);

  const fetchPlans = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('country_code', country)
      .eq('active', true)
      .order('price');

    if (!error && data) {
      setPlans(data.map(p => ({
        ...p,
        features: (p.features as unknown as string[]) || [],
      })));
    }
    setIsLoading(false);
  };

  if (isLoading) return null;
  if (plans.length === 0) return null;

  const currency = plans[0]?.currency || 'MZN';

  const formatPrice = (price: number) => {
    if (price === 0) return 'Grátis';
    if (currency === 'MZN') return `${price} MT`;
    if (currency === 'USD') return `$${price}`;
    return `${currency} ${price}`;
  };

  const formatProfessionals = (max: number) => {
    if (max === -1) return country === 'MZ' ? 'Ilimitados' : 'Unlimited';
    if (max === 1) return `1 ${country === 'MZ' ? 'profissional' : 'professional'}`;
    return `${country === 'MZ' ? 'Até' : 'Up to'} ${max} ${country === 'MZ' ? 'profissionais' : 'professionals'}`;
  };

  return (
    <section id="pricing" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-xs font-medium text-primary tracking-widest uppercase mb-3 block">
            {country === 'MZ' ? 'Preços' : 'Pricing'}
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight">
            {country === 'MZ' ? 'Escolha o plano ideal' : 'Choose your plan'}
          </h2>
          <p className="mt-4 text-muted-foreground text-lg max-w-lg mx-auto">
            {country === 'MZ' 
              ? 'Comece pequeno. Cresça quando quiser.' 
              : 'Start small. Scale when you need.'}
          </p>
        </motion.div>

        {/* Country Toggle */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <button
            onClick={() => setCountry('MZ')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              country === 'MZ' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            🇲🇿 Moçambique (MZN)
          </button>
          <button
            onClick={() => setCountry('INTL')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              country === 'INTL' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            🌍 International (USD)
          </button>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-3 mb-14">
          <span className={`text-sm font-medium transition-colors ${!annual ? 'text-foreground' : 'text-muted-foreground'}`}>
            {country === 'MZ' ? 'Mensal' : 'Monthly'}
          </span>
          <button
            onClick={() => setAnnual(!annual)}
            className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${annual ? 'bg-primary' : 'bg-muted'}`}
            aria-label="Toggle annual billing"
          >
            <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-foreground transition-transform duration-300 ${annual ? 'translate-x-7' : ''}`} />
          </button>
          <span className={`text-sm font-medium transition-colors ${annual ? 'text-foreground' : 'text-muted-foreground'}`}>
            {country === 'MZ' ? 'Anual' : 'Annual'}{' '}
            <span className="text-primary text-xs ml-1">-17%</span>
          </span>
        </div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7 }}
        >
          {plans.map((plan) => {
            const price = annual ? Math.round((plan.yearly_price / 12) * 100) / 100 : plan.price;
            const highlighted = !!plan.badge;
            const Icon = PLAN_ICONS[plan.key] || Zap;

            return (
              <motion.div
                key={plan.id}
                className={`relative flex flex-col p-8 rounded-2xl border backdrop-blur-sm ${
                  highlighted
                    ? 'bg-card/60 border-primary/30 shadow-[0_0_40px_hsl(var(--primary)_/_0.08)] scale-[1.02]'
                    : 'bg-card/40 border-border/30'
                }`}
                whileHover={{
                  y: -6,
                  boxShadow: highlighted
                    ? '0 20px 60px -12px hsl(var(--primary) / 0.15)'
                    : '0 16px 40px -12px hsl(0 0% 0% / 0.3)',
                }}
                transition={{ duration: 0.4 }}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold bg-primary text-primary-foreground">
                    {plan.badge}
                  </span>
                )}

                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-5 h-5 text-primary" />
                  <h3 className="font-display font-bold text-xl text-foreground">{plan.name}</h3>
                </div>

                <p className="text-sm text-muted-foreground mb-6">
                  {formatProfessionals(plan.max_professionals)}
                </p>

                <div className="mb-8">
                  <span className="text-4xl font-display font-bold text-foreground">
                    {formatPrice(price)}
                  </span>
                  {price > 0 && (
                    <span className="text-sm text-muted-foreground ml-1">
                      /{country === 'MZ' ? 'mês' : 'mo'}
                    </span>
                  )}
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
                    {country === 'MZ' ? 'Começar' : 'Get Started'}
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
