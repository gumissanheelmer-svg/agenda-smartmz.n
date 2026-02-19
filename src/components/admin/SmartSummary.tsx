import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { Calendar, Zap } from 'lucide-react';

interface DailyMetrics {
  pendingCount: number;
  totalToday: number;
  popularService: string | null;
  occupancyPercentage: number;
}

export function SmartSummary() {
  const { user, barbershopId } = useAuth();
  const [metrics, setMetrics] = useState<DailyMetrics | null>(null);
  const [adminName, setAdminName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!barbershopId || !user) return;

    const fetchData = async () => {
      setLoading(true);

      // Get owner name: barbershop.owner_name > barber_accounts.name > fallback
      let ownerName = '';

      if (barbershopId) {
        const { data: shopData } = await supabase
          .from('barbershops')
          .select('owner_name, name')
          .eq('id', barbershopId)
          .maybeSingle();

        if (shopData?.owner_name) {
          ownerName = shopData.owner_name.split(' ')[0];
        } else {
          // Fallback to barber_accounts name
          const { data: accountData } = await supabase
            .from('barber_accounts')
            .select('name')
            .eq('user_id', user.id)
            .maybeSingle();

          ownerName = accountData?.name?.split(' ')[0] || '';
        }
      }

      setAdminName(ownerName);

      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];

      // Fetch appointments for today
      const { data: appointmentsData } = await supabase
        .from('appointments')
        .select(
          `
          id,
          status,
          service_id,
          services(name)
        `
        )
        .eq('barbershop_id', barbershopId)
        .eq('appointment_date', today);

      if (!appointmentsData) {
        setMetrics({
          pendingCount: 0,
          totalToday: 0,
          popularService: null,
          occupancyPercentage: 0,
        });
        setLoading(false);
        return;
      }

      const pendingCount = appointmentsData.filter(
        (apt) => apt.status === 'pending'
      ).length;

      const totalToday = appointmentsData.length;

      // Find most popular service
      const serviceCounts: Record<string, number> = {};
      appointmentsData.forEach((apt) => {
        const serviceName = (apt.services as any)?.name || 'Serviço';
        serviceCounts[serviceName] = (serviceCounts[serviceName] || 0) + 1;
      });

      const popularService = Object.entries(serviceCounts).sort(
        ([, a], [, b]) => b - a
      )[0]?.[0];

      // Calculate occupancy percentage
      // Assuming a typical barbershop has 8 working hours (480 minutes)
      // with 30-minute slots = 16 possible slots per day
      const maxSlots = 16;
      const occupancyPercentage = Math.min(
        Math.round((totalToday / maxSlots) * 100),
        100
      );

      setMetrics({
        pendingCount,
        totalToday,
        popularService: popularService || null,
        occupancyPercentage,
      });

      setLoading(false);
    };

    fetchData();
  }, [barbershopId, user]);

  if (loading || !metrics) {
    return null;
  }

  // Generate dynamic message
  const getMessage = () => {
    if (metrics.totalToday === 0) {
      return "Nenhum agendamento para hoje. Que tal divulgar sua agenda? 🚀";
    }

    const messages: string[] = [];
    messages.push(
      `Hoje você tem ${metrics.pendingCount} agendamento${metrics.pendingCount !== 1 ? 's' : ''} pendente${metrics.pendingCount !== 1 ? 's' : ''}.`
    );

    if (metrics.occupancyPercentage > 70) {
      messages.push('Agenda quase cheia! Excelente desempenho 👏');
    } else {
      messages.push(
        `${metrics.totalToday} cliente${metrics.totalToday !== 1 ? 's' : ''} agendado${metrics.totalToday !== 1 ? 's' : ''} para hoje.`
      );
    }

    if (metrics.popularService) {
      messages.push(
        `Seu serviço "${metrics.popularService}" está em alta ⭐`
      );
    }

    messages.push(`${metrics.occupancyPercentage}% dos seus horários já estão ocupados.`);

    return messages.join(' ');
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="mb-8 space-y-4"
    >
      {/* Greeting */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-white font-display">
          {adminName ? `Bem-vindo, ${adminName}` : 'Bem-vindo'} 👋
        </h1>
        <p className="text-[#B8C0D4] text-sm">
          Aqui está o desempenho da sua barbearia hoje.
        </p>
      </div>

      {/* Smart Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="relative overflow-hidden rounded-xl border border-border/30 bg-[#121827] p-6 shadow-lg backdrop-blur-sm"
      >
        {/* Background glow effect */}
        <div className="absolute inset-0 -z-10 opacity-0 blur-2xl" />

        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
          </div>

          <div className="flex-1">
            <p className="text-[#E8EDF5] leading-relaxed text-sm font-medium">
              {getMessage()}
            </p>

            {/* Metrics Row */}
            {metrics.totalToday > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg bg-background/50 p-3">
                  <p className="text-xs text-muted-foreground">Pendentes</p>
                  <p className="mt-1 text-lg font-bold text-white">
                    {metrics.pendingCount}
                  </p>
                </div>
                <div className="rounded-lg bg-background/50 p-3">
                  <p className="text-xs text-muted-foreground">Hoje</p>
                  <p className="mt-1 text-lg font-bold text-white">
                    {metrics.totalToday}
                  </p>
                </div>
                <div className="rounded-lg bg-background/50 p-3">
                  <p className="text-xs text-muted-foreground">Ocupação</p>
                  <p className="mt-1 text-lg font-bold text-primary">
                    {metrics.occupancyPercentage}%
                  </p>
                </div>
                {metrics.popularService && (
                  <div className="rounded-lg bg-background/50 p-3">
                    <p className="text-xs text-muted-foreground">Popular</p>
                    <p className="mt-1 truncate text-sm font-bold text-white">
                      {metrics.popularService}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
