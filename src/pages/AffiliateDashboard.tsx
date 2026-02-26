import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Copy, Link2, Users, DollarSign, TrendingUp, CheckCircle, Building2, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AffiliateInfo {
  id: string;
  name: string;
  email: string | null;
  referral_code: string | null;
  commission_percentage: number;
  commission_fixed: number;
  total_earnings: number;
  active: boolean;
}

interface Referral {
  id: string;
  business_id: string;
  business_name?: string;
  status: string;
  commission_amount: number;
  created_at: string;
  lead_name?: string | null;
  lead_phone?: string | null;
}

interface Commission {
  id: string;
  business_name?: string;
  amount_total: number;
  commission_amount: number;
  commission_currency: string;
  status: string;
  created_at: string;
  paid_at: string | null;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function AffiliateDashboard() {
  const navigate = useNavigate();
  const { user, isLoading, signOut } = useAuth();
  const { toast } = useToast();
  const [affiliate, setAffiliate] = useState<AffiliateInfo | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (user) fetchAffiliateData();
  }, [user]);

  const fetchAffiliateData = async () => {
    if (!user) return;
    setIsDataLoading(true);

    try {
      const { data: affData, error: affError } = await supabase
        .from('affiliates_agenda')
        .select('id, name, email, referral_code, commission_percentage, commission_fixed, total_earnings, active')
        .eq('user_id', user.id)
        .maybeSingle();

      if (affError || !affData) {
        navigate('/login');
        return;
      }

      setAffiliate(affData as AffiliateInfo);

      // Fetch referrals
      const { data: refData } = await supabase
        .from('affiliate_referrals')
        .select('id, business_id, status, commission_amount, created_at, lead_name, lead_phone')
        .eq('affiliate_id', affData.id)
        .order('created_at', { ascending: false });

      if (refData && refData.length > 0) {
        const businessIds = refData.map(r => r.business_id);
        const { data: businesses } = await supabase
          .from('barbershops')
          .select('id, name')
          .in('id', businessIds);

        setReferrals(refData.map(r => ({
          ...r,
          business_name: businesses?.find(b => b.id === r.business_id)?.name || 'Desconhecido'
        })));
      } else {
        setReferrals([]);
      }

      // Fetch commissions
      const { data: commData } = await supabase
        .from('affiliate_commissions')
        .select('id, business_id, amount_total, commission_amount, commission_currency, status, created_at, paid_at')
        .eq('affiliate_id', affData.id)
        .order('created_at', { ascending: false });

      if (commData && commData.length > 0) {
        const businessIds = [...new Set(commData.map(c => c.business_id))];
        const { data: businesses } = await supabase
          .from('barbershops')
          .select('id, name')
          .in('id', businessIds);

        setCommissions(commData.map(c => ({
          ...c,
          business_name: businesses?.find(b => b.id === c.business_id)?.name || 'Desconhecido'
        })));
      } else {
        setCommissions([]);
      }
    } catch (err) {
      console.error('Error fetching affiliate data:', err);
    } finally {
      setIsDataLoading(false);
    }
  };

  const copyReferralLink = () => {
    if (!affiliate?.referral_code) return;
    const link = `${window.location.origin}/?ref=${affiliate.referral_code}`;
    navigator.clipboard.writeText(link);
    toast({ title: 'Link copiado!' });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (isLoading || isDataLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-center">
          <Logo size="lg" />
          <p className="text-muted-foreground mt-4">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!affiliate) return null;

  const referralLink = `${window.location.origin}/?ref=${affiliate.referral_code || ''}`;
  const convertedCount = referrals.filter(r => r.status === 'converted' || r.status === 'paid').length;
  const pendingCommission = commissions.filter(c => c.status === 'pending' || c.status === 'approved').reduce((s, c) => s + Number(c.commission_amount), 0);
  const paidCommission = commissions.filter(c => c.status === 'paid').reduce((s, c) => s + Number(c.commission_amount), 0);
  const todayLeads = referrals.filter(r => {
    const today = new Date().toISOString().slice(0, 10);
    return r.created_at.slice(0, 10) === today;
  }).length;

  const getStatusBadge = (status: string) => {
    const map: Record<string, { className: string; label: string }> = {
      lead: { className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'Lead' },
      converted: { className: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Convertido' },
      activated: { className: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Ativado' },
      paid: { className: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Pago' },
      cancelled: { className: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Cancelado' },
      pending: { className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'Pendente' },
      approved: { className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: 'Aprovada' },
      rejected: { className: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Rejeitada' },
    };
    const s = map[status] || { className: '', label: status };
    return <Badge className={s.className}>{s.label}</Badge>;
  };

  return (
    <>
      <Helmet>
        <title>Painel do Afiliado - Agenda Smart</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-50">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Link2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-bold text-foreground">Painel do Afiliado</h1>
                <p className="text-xs text-muted-foreground">{affiliate.name}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6">
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            {/* Referral Link */}
            <motion.div variants={item}>
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Seu Link de Indicação</CardTitle>
                  <CardDescription>Compartilhe para indicar novos negócios</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input value={referralLink} readOnly className="bg-background/50 font-mono text-sm" />
                    <Button onClick={copyReferralLink} variant="outline" className="shrink-0">
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar
                    </Button>
                  </div>
                  {affiliate.referral_code && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Código: <span className="font-mono font-bold text-primary">{affiliate.referral_code}</span>
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <motion.div variants={item}>
                <Card className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Leads Hoje</p>
                        <p className="text-2xl font-bold">{todayLeads}</p>
                      </div>
                      <Clock className="h-8 w-8 text-primary opacity-60" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div variants={item}>
                <Card className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Ativados</p>
                        <p className="text-2xl font-bold text-green-400">{convertedCount}</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-500 opacity-60" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div variants={item}>
                <Card className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Comissão Pendente</p>
                        <p className="text-2xl font-bold text-yellow-400">{pendingCommission.toLocaleString('pt-BR')} MT</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-yellow-500 opacity-60" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div variants={item}>
                <Card className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Comissão Paga</p>
                        <p className="text-2xl font-bold text-emerald-400">{paidCommission.toLocaleString('pt-BR')} MT</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-emerald-500 opacity-60" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Tabs: Leads + Commissions */}
            <motion.div variants={item}>
              <Tabs defaultValue="leads">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="leads">Meus Leads ({referrals.length})</TabsTrigger>
                  <TabsTrigger value="commissions">Minhas Comissões ({commissions.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="leads">
                  <Card className="border-border/50">
                    <CardContent className="pt-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Negócio</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead className="text-right">Comissão</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {referrals.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center text-muted-foreground py-12">
                                <Building2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
                                <p>Nenhuma indicação ainda</p>
                                <p className="text-sm mt-1">Compartilhe seu link!</p>
                              </TableCell>
                            </TableRow>
                          ) : (
                            referrals.map((ref) => (
                              <TableRow key={ref.id}>
                                <TableCell className="font-medium">{ref.business_name}</TableCell>
                                <TableCell className="text-muted-foreground">
                                  {format(new Date(ref.created_at), "dd/MM/yyyy", { locale: pt })}
                                </TableCell>
                                <TableCell className="text-center">{getStatusBadge(ref.status)}</TableCell>
                                <TableCell className="text-right font-medium">
                                  {Number(ref.commission_amount).toLocaleString('pt-BR')} MT
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="commissions">
                  <Card className="border-border/50">
                    <CardContent className="pt-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Negócio</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Comissão</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead>Pago em</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {commissions.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                                <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-40" />
                                <p>Nenhuma comissão registrada</p>
                              </TableCell>
                            </TableRow>
                          ) : (
                            commissions.map((c) => (
                              <TableRow key={c.id}>
                                <TableCell className="font-medium">{c.business_name}</TableCell>
                                <TableCell>{Number(c.amount_total).toLocaleString('pt-BR')} {c.commission_currency}</TableCell>
                                <TableCell className="font-medium text-primary">{Number(c.commission_amount).toLocaleString('pt-BR')} {c.commission_currency}</TableCell>
                                <TableCell className="text-center">{getStatusBadge(c.status)}</TableCell>
                                <TableCell className="text-muted-foreground">
                                  {c.paid_at ? format(new Date(c.paid_at), "dd/MM/yyyy", { locale: pt }) : '—'}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>

            {/* Commission Info */}
            <motion.div variants={item}>
              <Card className="border-border/50 bg-muted/30">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <DollarSign className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Sobre suas comissões</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Fixa: {affiliate.commission_fixed.toLocaleString('pt-BR')} MT por venda •
                        Percentual: {affiliate.commission_percentage}% •
                        Processadas pelo SuperAdmin após conversão.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </main>
      </div>
    </>
  );
}
