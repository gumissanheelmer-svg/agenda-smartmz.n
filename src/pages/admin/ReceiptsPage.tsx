import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAdminBarbershop } from '@/hooks/useAdminBarbershop';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Printer, FileText, Receipt } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import ReceiptDialog from '@/components/admin/ReceiptDialog';
import type { ReceiptData } from '@/components/admin/ReceiptPreview';

export default function ReceiptsPage() {
  const { barbershop, barbershopId } = useAdminBarbershop();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch receipts
  const { data: receipts, isLoading } = useQuery({
    queryKey: ['receipts', barbershopId],
    queryFn: async () => {
      if (!barbershopId) return [];
      const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .eq('barbershop_id', barbershopId)
        .order('issued_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!barbershopId,
  });

  // Fetch completed appointments without receipts (for issuing)
  const { data: completedAppointments } = useQuery({
    queryKey: ['completed-appointments-no-receipt', barbershopId],
    queryFn: async () => {
      if (!barbershopId) return [];

      // Get appointments with payment confirmations
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
          id, client_name, appointment_date, appointment_time, status,
          barber_id, service_id
        `)
        .eq('barbershop_id', barbershopId)
        .eq('status', 'completed')
        .order('appointment_date', { ascending: false })
        .limit(50);
      if (error) throw error;
      if (!appointments?.length) return [];

      // Get existing receipt appointment_ids
      const { data: existingReceipts } = await supabase
        .from('receipts')
        .select('appointment_id')
        .eq('barbershop_id', barbershopId);
      
      const receiptAppIds = new Set((existingReceipts || []).map(r => r.appointment_id));
      const pendingAppts = appointments.filter(a => !receiptAppIds.has(a.id));
      if (!pendingAppts.length) return [];

      // Fetch related data
      const barberIds = [...new Set(pendingAppts.map(a => a.barber_id))];
      const serviceIds = [...new Set(pendingAppts.map(a => a.service_id))];

      const [barbersRes, servicesRes, paymentsRes] = await Promise.all([
        supabase.from('barbers').select('id, name').in('id', barberIds),
        supabase.from('services').select('id, name, price').in('id', serviceIds),
        supabase.from('payment_confirmations')
          .select('appointment_id, payment_method, transaction_code, amount_expected')
          .in('appointment_id', pendingAppts.map(a => a.id))
          .eq('status', 'accepted'),
      ]);

      const barbersMap = Object.fromEntries((barbersRes.data || []).map(b => [b.id, b]));
      const servicesMap = Object.fromEntries((servicesRes.data || []).map(s => [s.id, s]));
      const paymentsMap = Object.fromEntries((paymentsRes.data || []).map(p => [p.appointment_id, p]));

      return pendingAppts
        .filter(a => paymentsMap[a.id]) // Only those with accepted payment
        .map(a => {
          const barber = barbersMap[a.barber_id];
          const service = servicesMap[a.service_id];
          const payment = paymentsMap[a.id];
          return {
            appointment_id: a.id,
            client_name: a.client_name,
            service_name: service?.name || 'Serviço',
            professional_name: barber?.name || 'Profissional',
            amount: payment?.amount_expected || service?.price || 0,
            payment_method: (payment?.payment_method || '').toUpperCase() as 'MPESA' | 'EMOLA',
            transaction_code: payment?.transaction_code || null,
            date: a.appointment_date,
          };
        })
        .filter(a => a.payment_method === 'MPESA' || a.payment_method === 'EMOLA');
    },
    enabled: !!barbershopId,
  });

  // Issue receipt mutation
  const issueReceipt = useMutation({
    mutationFn: async (appt: typeof completedAppointments extends (infer T)[] | undefined ? T : never) => {
      if (!barbershopId || !user) throw new Error('Missing data');
      const insertData = {
        barbershop_id: barbershopId,
        appointment_id: appt.appointment_id,
        client_name: appt.client_name,
        service_name: appt.service_name,
        professional_name: appt.professional_name,
        amount: appt.amount,
        payment_method: appt.payment_method,
        transaction_code: appt.transaction_code,
        issued_by: user.id,
        receipt_number: 'TEMP', // auto-generated by trigger
      };
      const { data, error } = await supabase
        .from('receipts')
        .insert(insertData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['completed-appointments-no-receipt'] });
      toast({ title: '✅ Recibo emitido', description: data.receipt_number });
      viewReceipt(data);
    },
    onError: () => {
      toast({ title: '❌ Erro ao emitir recibo', variant: 'destructive' });
    },
  });

  const viewReceipt = (receipt: any) => {
    setSelectedReceipt({
      receipt_number: receipt.receipt_number,
      issued_at: receipt.issued_at,
      client_name: receipt.client_name,
      service_name: receipt.service_name,
      professional_name: receipt.professional_name,
      amount: Number(receipt.amount),
      payment_method: receipt.payment_method,
      transaction_code: receipt.transaction_code,
      barbershop_name: barbershop?.name,
      barbershop_logo: barbershop?.logo_url,
      print_with_logo: (barbershop as any)?.print_with_logo !== false,
    });
    setDialogOpen(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[hsl(var(--dashboard-accent))]/10">
            <Receipt className="w-5 h-5 text-[hsl(var(--dashboard-accent))]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Recibos</h1>
            <p className="text-sm text-white/50">Gerencie os recibos emitidos</p>
          </div>
        </div>
      </div>

      {/* Pending receipts */}
      {completedAppointments && completedAppointments.length > 0 && (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
          <h2 className="text-sm font-semibold text-white/70 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Atendimentos concluídos sem recibo ({completedAppointments.length})
          </h2>
          <div className="space-y-2">
            {completedAppointments.map((appt) => (
              <div
                key={appt.appointment_id}
                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-colors"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-white">{appt.client_name}</span>
                  <span className="text-xs text-white/40">
                    {appt.service_name} • {appt.professional_name} • {Number(appt.amount).toLocaleString('pt-MZ')} MT
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    appt.payment_method === 'MPESA'
                      ? 'bg-[#00C853]/15 text-[#00C853]'
                      : 'bg-[#FF6A00]/15 text-[#FF6A00]'
                  }`}>
                    {appt.payment_method === 'MPESA' ? 'M-Pesa' : 'E-mola'}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => issueReceipt.mutate(appt)}
                    disabled={issueReceipt.isPending}
                    className="rounded-lg text-xs bg-[hsl(var(--dashboard-accent))] hover:bg-[hsl(var(--dashboard-accent))]/90 text-white"
                  >
                    Emitir recibo
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Receipts table */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-white/40 text-sm">Carregando recibos...</div>
        ) : !receipts?.length ? (
          <div className="p-8 text-center text-white/40 text-sm">Nenhum recibo emitido</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/[0.06] hover:bg-transparent">
                <TableHead className="text-white/50">Nº</TableHead>
                <TableHead className="text-white/50">Cliente</TableHead>
                <TableHead className="text-white/50">Valor</TableHead>
                <TableHead className="text-white/50">Método</TableHead>
                <TableHead className="text-white/50">Data</TableHead>
                <TableHead className="text-white/50 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receipts.map((receipt) => (
                <TableRow key={receipt.id} className="border-white/[0.06] hover:bg-white/[0.03]">
                  <TableCell className="font-mono text-sm text-white/80">{receipt.receipt_number}</TableCell>
                  <TableCell className="text-white/80">{receipt.client_name}</TableCell>
                  <TableCell className="text-white/80">{Number(receipt.amount).toLocaleString('pt-MZ')} MT</TableCell>
                  <TableCell>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      receipt.payment_method === 'MPESA'
                        ? 'bg-[#00C853]/15 text-[#00C853]'
                        : 'bg-[#FF6A00]/15 text-[#FF6A00]'
                    }`}>
                      {receipt.payment_method === 'MPESA' ? 'M-Pesa' : 'E-mola'}
                    </span>
                  </TableCell>
                  <TableCell className="text-white/50 text-sm">
                    {new Date(receipt.issued_at).toLocaleDateString('pt-MZ')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => viewReceipt(receipt)} className="text-white/50 hover:text-white" title="Ver recibo">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { viewReceipt(receipt); }} className="text-white/50 hover:text-white" title="Imprimir recibo">
                        <Printer className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <ReceiptDialog open={dialogOpen} onOpenChange={setDialogOpen} data={selectedReceipt} />
    </motion.div>
  );
}
