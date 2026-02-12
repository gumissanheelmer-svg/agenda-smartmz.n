import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Users, Scissors, Clock, TrendingUp, TrendingDown, Wallet, Activity } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subMonths, startOfYear } from 'date-fns';
import { pt } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { useAdminBarbershop } from '@/hooks/useAdminBarbershop';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DashboardStats {
  todayAppointments: number;
  weekAppointments: number;
  monthAppointments: number;
  totalClients: number;
  activeBarbers: number;
  activeServices: number;
  prevWeekAppointments: number;
  prevMonthAppointments: number;
}

interface RevenueData {
  date: string;
  revenue: number;
}

interface BarberRevenue {
  name: string;
  revenue: number;
}

interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
}

type PeriodType = 'daily' | 'weekly' | 'monthly' | 'yearly';

// Animated counter
function CountUp({ target, duration = 1.2 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let start = 0;
    const increment = target / (duration * 60);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [target, duration]);

  return <span ref={ref}>{count}</span>;
}

// Percentage change badge
function ChangeBadge({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return null;
  const pct = previous === 0 ? 100 : Math.round(((current - previous) / previous) * 100);
  const isPositive = pct >= 0;

  return (
    <span className={cn(
      "inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-md",
      isPositive ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10"
    )}>
      {isPositive ? '↑' : '↓'} {Math.abs(pct)}%
    </span>
  );
}

// Mini sparkline
function MiniSparkline({ data, color = "hsl(217, 91%, 60%)" }: { data: number[]; color?: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const h = 32;
  const w = 64;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
  
  return (
    <svg width={w} height={h} className="opacity-60">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Glass card wrapper
function GlassCard({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        "relative rounded-2xl border border-white/[0.06] bg-[hsl(var(--dashboard-glass))]/60 backdrop-blur-sm p-5 overflow-hidden transition-all duration-300 hover:border-white/[0.1] hover:shadow-[0_0_30px_hsl(var(--dashboard-accent)/0.08)] group",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

export default function DashboardOverview() {
  const { user } = useAuth();
  const { barbershop } = useAdminBarbershop();
  const [stats, setStats] = useState<DashboardStats>({
    todayAppointments: 0,
    weekAppointments: 0,
    monthAppointments: 0,
    totalClients: 0,
    activeBarbers: 0,
    activeServices: 0,
    prevWeekAppointments: 0,
    prevMonthAppointments: 0,
  });
  const [recentAppointments, setRecentAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [barbershopId, setBarbershopId] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodType>('daily');
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [barberRevenue, setBarberRevenue] = useState<BarberRevenue[]>([]);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary>({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
  });

  useEffect(() => {
    if (user) fetchBarbershopId();
  }, [user]);

  useEffect(() => {
    if (barbershopId) {
      fetchDashboardData();
      fetchRevenueData();
      fetchBarberRevenue();
      fetchFinancialSummary();
    }
  }, [barbershopId, period]);

  const fetchBarbershopId = async () => {
    const { data } = await supabase
      .from('user_roles')
      .select('barbershop_id')
      .eq('user_id', user?.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (data?.barbershop_id) {
      setBarbershopId(data.barbershop_id);
    } else {
      setIsLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    if (!barbershopId) return;
    setIsLoading(true);
    const today = format(new Date(), 'yyyy-MM-dd');
    const weekStart = format(startOfWeek(new Date(), { locale: pt }), 'yyyy-MM-dd');
    const weekEnd = format(endOfWeek(new Date(), { locale: pt }), 'yyyy-MM-dd');
    const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd');
    const prevWeekStart = format(startOfWeek(subDays(new Date(), 7), { locale: pt }), 'yyyy-MM-dd');
    const prevWeekEnd = format(endOfWeek(subDays(new Date(), 7), { locale: pt }), 'yyyy-MM-dd');
    const prevMonthStart = format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd');
    const prevMonthEnd = format(endOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd');

    const [todayRes, weekRes, monthRes, clientsRes, barbersRes, servicesRes, recentRes, prevWeekRes, prevMonthRes] = await Promise.all([
      supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('barbershop_id', barbershopId).eq('appointment_date', today),
      supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('barbershop_id', barbershopId).gte('appointment_date', weekStart).lte('appointment_date', weekEnd),
      supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('barbershop_id', barbershopId).gte('appointment_date', monthStart).lte('appointment_date', monthEnd),
      supabase.from('appointments').select('client_phone', { count: 'exact', head: true }).eq('barbershop_id', barbershopId),
      supabase.from('barbers').select('id', { count: 'exact', head: true }).eq('barbershop_id', barbershopId).eq('active', true),
      supabase.from('services').select('id', { count: 'exact', head: true }).eq('barbershop_id', barbershopId).eq('active', true),
      supabase.from('appointments').select('*, barber:barbers(name), service:services(name)').eq('barbershop_id', barbershopId).order('created_at', { ascending: false }).limit(5),
      supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('barbershop_id', barbershopId).gte('appointment_date', prevWeekStart).lte('appointment_date', prevWeekEnd),
      supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('barbershop_id', barbershopId).gte('appointment_date', prevMonthStart).lte('appointment_date', prevMonthEnd),
    ]);

    setStats({
      todayAppointments: todayRes.count || 0,
      weekAppointments: weekRes.count || 0,
      monthAppointments: monthRes.count || 0,
      totalClients: clientsRes.count || 0,
      activeBarbers: barbersRes.count || 0,
      activeServices: servicesRes.count || 0,
      prevWeekAppointments: prevWeekRes.count || 0,
      prevMonthAppointments: prevMonthRes.count || 0,
    });

    if (recentRes.data) setRecentAppointments(recentRes.data);
    setIsLoading(false);
  };

  const fetchRevenueData = async () => {
    if (!barbershopId) return;
    let startDate: Date;
    let dateFormat: string;

    switch (period) {
      case 'daily': startDate = subDays(new Date(), 7); dateFormat = 'dd/MM'; break;
      case 'weekly': startDate = subDays(new Date(), 28); dateFormat = 'dd/MM'; break;
      case 'monthly': startDate = subMonths(new Date(), 6); dateFormat = 'MMM'; break;
      case 'yearly': startDate = startOfYear(new Date()); dateFormat = 'MMM'; break;
      default: startDate = subDays(new Date(), 7); dateFormat = 'dd/MM';
    }

    const { data: appointments } = await supabase
      .from('appointments')
      .select('appointment_date, service_id, services(price)')
      .eq('barbershop_id', barbershopId)
      .eq('status', 'completed')
      .gte('appointment_date', format(startDate, 'yyyy-MM-dd'));

    if (!appointments) { setRevenueData([]); return; }

    const revenueByDate: Record<string, number> = {};
    appointments.forEach((apt: any) => {
      const dateKey = format(new Date(apt.appointment_date), dateFormat, { locale: pt });
      const price = apt.services?.price || 0;
      revenueByDate[dateKey] = (revenueByDate[dateKey] || 0) + Number(price);
    });

    setRevenueData(Object.entries(revenueByDate).map(([date, revenue]) => ({ date, revenue })));
  };

  const fetchBarberRevenue = async () => {
    if (!barbershopId) return;
    const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');

    const { data: appointments } = await supabase
      .from('appointments')
      .select('barber_id, barbers(name), services(price)')
      .eq('barbershop_id', barbershopId)
      .eq('status', 'completed')
      .gte('appointment_date', monthStart);

    if (!appointments) { setBarberRevenue([]); return; }

    const revenueByBarber: Record<string, { name: string; revenue: number }> = {};
    appointments.forEach((apt: any) => {
      const barberId = apt.barber_id;
      const barberName = apt.barbers?.name || 'Desconhecido';
      const price = apt.services?.price || 0;
      if (!revenueByBarber[barberId]) revenueByBarber[barberId] = { name: barberName, revenue: 0 };
      revenueByBarber[barberId].revenue += Number(price);
    });

    setBarberRevenue(Object.values(revenueByBarber).sort((a, b) => b.revenue - a.revenue));
  };

  const fetchFinancialSummary = async () => {
    if (!barbershopId) return;
    const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd');

    const [revenueRes, expensesRes] = await Promise.all([
      supabase.from('appointments').select('services(price)').eq('barbershop_id', barbershopId).eq('status', 'completed').gte('appointment_date', monthStart).lte('appointment_date', monthEnd),
      supabase.from('expenses').select('amount').eq('barbershop_id', barbershopId).gte('expense_date', monthStart).lte('expense_date', monthEnd),
    ]);

    const totalRevenue = revenueRes.data?.reduce((sum: number, apt: any) => sum + Number(apt.services?.price || 0), 0) || 0;
    const totalExpenses = expensesRes.data?.reduce((sum: number, exp: any) => sum + Number(exp.amount || 0), 0) || 0;

    setFinancialSummary({ totalRevenue, totalExpenses, netProfit: totalRevenue - totalExpenses });
  };

  const businessType = barbershop?.business_type || 'barbearia';
  const isBarbershop = businessType === 'barbearia';
  const professionalsLabel = isBarbershop ? 'Barbeiros Ativos' : 'Profissionais Ativos';
  const professionalLabel = isBarbershop ? 'Barbeiro' : 'Profissional';
  const businessLabel = isBarbershop ? 'barbearia' : 'negócio';

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN', minimumFractionDigits: 0 }).format(value);

  const sparklineData = revenueData.map(d => d.revenue);

  const statCards = [
    { title: 'Agendamentos Hoje', value: stats.todayAppointments, icon: Calendar, sparkline: sparklineData.slice(-7), color: "hsl(217, 91%, 60%)" },
    { title: 'Esta Semana', value: stats.weekAppointments, icon: Clock, prev: stats.prevWeekAppointments, color: "hsl(142, 76%, 50%)" },
    { title: 'Este Mês', value: stats.monthAppointments, icon: Calendar, prev: stats.prevMonthAppointments, color: "hsl(280, 67%, 60%)" },
    { title: professionalsLabel, value: stats.activeBarbers, icon: Users, color: "hsl(32, 95%, 55%)" },
  ];

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      confirmed: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      cancelled: 'bg-red-500/10 text-red-400 border border-red-500/20',
      completed: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    };
    const labels: Record<string, string> = {
      pending: 'Pendente', confirmed: 'Confirmado', cancelled: 'Cancelado', completed: 'Concluído',
    };
    return <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold ${styles[status]}`}>{labels[status]}</span>;
  };

  const occupancy = stats.activeBarbers > 0 ? Math.min(Math.round((stats.todayAppointments / (stats.activeBarbers * 16)) * 100), 100) : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl border border-white/[0.06] bg-[hsl(var(--dashboard-glass))]/60 p-5">
              <div className="h-20 bg-white/[0.03] animate-pulse rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!barbershopId) {
    return (
      <div className="space-y-6">
        <GlassCard className="text-center py-12">
          <p className="text-muted-foreground">Bem-vindo! Configure seu {businessLabel} para começar.</p>
          <Button className="mt-4" onClick={() => window.location.href = '/register'}>Criar Negócio</Button>
        </GlassCard>
      </div>
    );
  }

  const barColors = ['hsl(217, 91%, 60%)', 'hsl(142, 76%, 50%)', 'hsl(280, 67%, 60%)', 'hsl(32, 95%, 55%)', 'hsl(340, 80%, 55%)'];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <GlassCard key={i} delay={i * 0.08}>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.title}</p>
                <p className="text-3xl font-bold text-foreground font-display">
                  <CountUp target={stat.value} />
                </p>
                {stat.prev !== undefined && <ChangeBadge current={stat.value} previous={stat.prev} />}
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-muted-foreground" />
                </div>
                {stat.sparkline && stat.sparkline.length > 1 && (
                  <MiniSparkline data={stat.sparkline} color={stat.color} />
                )}
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard delay={0.3}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Receita do Mês</p>
              <p className="text-2xl font-bold text-foreground mt-2 font-display">{formatCurrency(financialSummary.totalRevenue)}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
        </GlassCard>
        <GlassCard delay={0.35}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Despesas do Mês</p>
              <p className="text-2xl font-bold text-foreground mt-2 font-display">{formatCurrency(financialSummary.totalExpenses)}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-400" />
            </div>
          </div>
        </GlassCard>
        <GlassCard delay={0.4} className={financialSummary.netProfit >= 0 ? 'border-emerald-500/10' : 'border-red-500/10'}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Lucro Líquido</p>
              <p className={cn("text-2xl font-bold mt-2 font-display", financialSummary.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                {formatCurrency(financialSummary.netProfit)}
              </p>
            </div>
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", financialSummary.netProfit >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10')}>
              <Wallet className={cn("w-5 h-5", financialSummary.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400')} />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Revenue Chart */}
        <GlassCard delay={0.45} className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-foreground font-display">Receitas ao Longo do Tempo</h3>
            <Tabs value={period} onValueChange={(v) => setPeriod(v as PeriodType)}>
              <TabsList className="bg-white/[0.04] border border-white/[0.06] rounded-xl h-8">
                <TabsTrigger value="daily" className="text-[10px] rounded-lg h-6 data-[state=active]:bg-[hsl(var(--dashboard-accent))]/20 data-[state=active]:text-[hsl(var(--dashboard-accent))]">Diário</TabsTrigger>
                <TabsTrigger value="weekly" className="text-[10px] rounded-lg h-6 data-[state=active]:bg-[hsl(var(--dashboard-accent))]/20 data-[state=active]:text-[hsl(var(--dashboard-accent))]">Semanal</TabsTrigger>
                <TabsTrigger value="monthly" className="text-[10px] rounded-lg h-6 data-[state=active]:bg-[hsl(var(--dashboard-accent))]/20 data-[state=active]:text-[hsl(var(--dashboard-accent))]">Mensal</TabsTrigger>
                <TabsTrigger value="yearly" className="text-[10px] rounded-lg h-6 data-[state=active]:bg-[hsl(var(--dashboard-accent))]/20 data-[state=active]:text-[hsl(var(--dashboard-accent))]">Anual</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          {revenueData.length === 0 ? (
            <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
              Nenhum dado de receita disponível.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 100% / 0.04)" />
                <XAxis dataKey="date" stroke="hsl(0 0% 100% / 0.3)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(0 0% 100% / 0.3)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(225, 20%, 12%)',
                    border: '1px solid hsl(0 0% 100% / 0.1)',
                    borderRadius: '12px',
                    color: '#fff',
                    boxShadow: '0 8px 32px hsl(0 0% 0% / 0.4)',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Receita']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(217, 91%, 60%)"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#blueGradient)"
                  animationDuration={1200}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </GlassCard>

        {/* Right Column: Occupancy + Revenue */}
        <div className="space-y-4">
          {/* Occupancy Card */}
          <GlassCard delay={0.5}>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Taxa de Ocupação</h3>
            <div className="flex items-center justify-center">
              <div className="relative w-28 h-28">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(0 0% 100% / 0.06)" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="42"
                    fill="none"
                    stroke="hsl(217, 91%, 60%)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${occupancy * 2.64} 264`}
                    className="transition-all duration-1000 ease-out"
                    style={{ filter: 'drop-shadow(0 0 8px hsl(217, 91%, 60%, 0.4))' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-foreground font-display">{occupancy}%</span>
                </div>
              </div>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-3">
              {occupancy > 70 ? 'Excelente ocupação! 🔥' : occupancy > 30 ? 'Ocupação moderada' : 'Oportunidade de crescer'}
            </p>
          </GlassCard>

          {/* Revenue summary mini */}
          <GlassCard delay={0.55}>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Resumo Financeiro</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Receita</span>
                <span className="text-sm font-semibold text-emerald-400">{formatCurrency(financialSummary.totalRevenue)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Despesas</span>
                <span className="text-sm font-semibold text-red-400">{formatCurrency(financialSummary.totalExpenses)}</span>
              </div>
              <div className="border-t border-white/[0.06] pt-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Lucro</span>
                <span className={cn("text-sm font-bold", financialSummary.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                  {formatCurrency(financialSummary.netProfit)}
                </span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Bottom Grid: Barber Performance + Recent Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard delay={0.6}>
          <h3 className="text-sm font-semibold text-foreground font-display mb-4">Receita por {professionalLabel}</h3>
          {barberRevenue.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
              Nenhum dado disponível.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barberRevenue} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 100% / 0.04)" />
                <XAxis type="number" stroke="hsl(0 0% 100% / 0.3)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                <YAxis dataKey="name" type="category" stroke="hsl(0 0% 100% / 0.3)" fontSize={11} width={80} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(225, 20%, 12%)',
                    border: '1px solid hsl(0 0% 100% / 0.1)',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Receita']}
                />
                <Bar dataKey="revenue" radius={[0, 6, 6, 0]}>
                  {barberRevenue.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </GlassCard>

        <GlassCard delay={0.65}>
          <h3 className="text-sm font-semibold text-foreground font-display mb-4">Agendamentos Recentes</h3>
          <div className="space-y-2">
            {recentAppointments.length === 0 ? (
              <p className="text-muted-foreground text-center py-8 text-sm">Nenhum agendamento ainda.</p>
            ) : (
              recentAppointments.slice(0, 5).map((apt) => (
                <div key={apt.id} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/[0.04] hover:bg-white/[0.04] transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{apt.client_name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {apt.service?.name} • {apt.barber?.name}
                    </p>
                  </div>
                  <div className="text-right ml-3 flex-shrink-0">
                    <p className="text-xs text-foreground">
                      {format(new Date(apt.appointment_date), "dd/MM", { locale: pt })}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{apt.appointment_time}</p>
                  </div>
                  <div className="ml-2 flex-shrink-0">
                    {getStatusBadge(apt.status)}
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
