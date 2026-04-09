import { useRef, useEffect } from 'react';
import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion';
import { Users, Calendar, BarChart3 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

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

function CountUp({ target, suffix = '' }: { target: number; suffix?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));

  useEffect(() => {
    if (isInView) animate(count, target, { duration: 2, ease: 'easeOut' });
  }, [isInView, target, count]);

  return (
    <span ref={ref} className="tabular-nums">
      <motion.span>{rounded}</motion.span>{suffix}
    </span>
  );
}

function StatCard({ icon: Icon, value, label }: {
  icon: React.ElementType; value: string; label: string;
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

export function StatsRow() {
  const { t } = useI18n();

  return (
    <section className="px-6 -mt-8 mb-16">
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full mx-auto"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
      >
        <StatCard icon={Users} value="500+" label={t('stats.businesses')} />
        <StatCard icon={Calendar} value="12k+" label={t('stats.bookings')} />
        <StatCard icon={BarChart3} value="99.9%" label={t('stats.uptime')} />
      </motion.div>
    </section>
  );
}

export { CountUp };
