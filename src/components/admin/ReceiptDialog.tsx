import { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Eye } from 'lucide-react';
import ReceiptPreview from './ReceiptPreview';
import type { ReceiptData } from './ReceiptPreview';
import { useState } from 'react';

interface ReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ReceiptData | null;
}

export default function ReceiptDialog({ open, onOpenChange, data }: ReceiptDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'digital' | 'print'>('digital');

  const handlePrint = () => {
    if (!data) return;
    const printWindow = window.open('', '_blank', 'width=400,height=700');
    if (!printWindow) return;

    const showLogo = data.barbershop_logo && data.print_with_logo !== false;
    const isMpesa = data.payment_method === 'MPESA';
    const date = new Date(data.issued_at);
    const formattedDate = date.toLocaleDateString('pt-MZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const formattedTime = date.toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' });

    printWindow.document.write(`<!DOCTYPE html>
<html><head><title>Recibo ${data.receipt_number}</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Segoe UI', Arial, sans-serif; background: white; color: black; width: 80mm; margin: 0 auto; padding: 4mm; }
.center { text-align: center; }
.logo { width: 12mm; height: 12mm; object-fit: cover; border-radius: 3px; filter: grayscale(1) contrast(2); }
.biz-name { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
.divider { border-top: 1px solid #ccc; margin: 6px 0; }
.divider-dash { border-top: 1px dashed #ddd; margin: 6px 0; }
.label-sm { font-size: 8px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: #888; }
.receipt-num { font-size: 14px; font-weight: 700; margin-top: 2px; }
.date { font-size: 10px; color: #666; margin-top: 2px; }
.row { display: flex; justify-content: space-between; align-items: center; font-size: 11px; margin-bottom: 4px; }
.row-label { color: #777; }
.row-value { font-weight: 500; text-align: right; }
.amount { font-size: 18px; font-weight: 700; margin-top: 2px; }
.badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; text-transform: uppercase; border: 1px solid; }
.badge-mpesa { border-color: #2e7d32; color: #2e7d32; background: #e8f5e9; }
.badge-emola { border-color: #e65100; color: #e65100; background: #fff3e0; }
.dot { width: 5px; height: 5px; border-radius: 50%; display: inline-block; }
.dot-mpesa { background: #2e7d32; }
.dot-emola { background: #e65100; }
.code { font-size: 11px; font-family: monospace; font-weight: 600; margin-top: 2px; }
.footer { font-size: 10px; color: #888; }
.powered { font-size: 8px; color: #bbb; letter-spacing: 1px; }
@media print { body { padding: 2mm; } @page { margin: 0; size: 80mm auto; } }
</style></head><body>
${showLogo ? `<div class="center" style="margin-bottom:6px"><img src="${data.barbershop_logo}" class="logo" /></div>` : ''}
<div class="center"><div class="biz-name">${data.barbershop_name || 'Estabelecimento'}</div></div>
<div class="divider"></div>
<div class="center"><div class="label-sm">Recibo</div><div class="receipt-num">${data.receipt_number}</div><div class="date">${formattedDate} • ${formattedTime}</div></div>
<div class="divider-dash"></div>
<div class="row"><span class="row-label">Cliente</span><span class="row-value">${data.client_name}</span></div>
<div class="row"><span class="row-label">Serviço</span><span class="row-value">${data.service_name}</span></div>
<div class="row"><span class="row-label">Profissional</span><span class="row-value">${data.professional_name}</span></div>
<div class="divider-dash"></div>
<div class="center"><div class="label-sm">Valor pago</div><div class="amount">${data.amount.toLocaleString('pt-MZ')} MT</div></div>
<div class="center" style="margin:6px 0"><span class="badge ${isMpesa ? 'badge-mpesa' : 'badge-emola'}"><span class="dot ${isMpesa ? 'dot-mpesa' : 'dot-emola'}"></span>${isMpesa ? 'M-Pesa' : 'E-mola'}</span></div>
${data.transaction_code ? `<div class="center"><div class="label-sm">Código da transação</div><div class="code">${data.transaction_code}</div></div>` : ''}
<div class="divider" style="margin-top:8px"></div>
<div class="center"><div class="footer">Obrigado pela sua preferência</div><div class="powered">Agenda Smart powered</div></div>
</body></html>`);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 400);
  };

  if (!data) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[hsl(var(--dashboard-bg))] border-white/[0.08]">
        <DialogHeader>
          <DialogTitle className="text-center text-white/80 text-sm font-medium tracking-wider uppercase">
            {viewMode === 'digital' ? 'Pré-visualização do Recibo' : 'Layout de Impressão (80mm)'}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 max-h-[60vh] overflow-y-auto">
          <ReceiptPreview ref={printRef} data={data} mode={viewMode} />
        </div>

        <div className="flex justify-center gap-2 pt-2 pb-1">
          <Button
            variant="outline"
            onClick={() => setViewMode(viewMode === 'digital' ? 'print' : 'digital')}
            className="rounded-xl border-white/10 text-white/70 hover:text-white hover:bg-white/5 gap-2"
          >
            <Eye className="w-4 h-4" />
            {viewMode === 'digital' ? 'Ver layout 80mm' : 'Ver digital'}
          </Button>
          <Button
            onClick={handlePrint}
            className="rounded-xl bg-[hsl(var(--dashboard-accent))] hover:bg-[hsl(var(--dashboard-accent))]/90 text-white shadow-[0_0_20px_hsl(var(--dashboard-accent)/0.3)] hover:shadow-[0_0_30px_hsl(var(--dashboard-accent)/0.4)] transition-all duration-300 gap-2"
          >
            <Printer className="w-4 h-4" />
            Imprimir recibo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
