import { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import ReceiptPreview from './ReceiptPreview';
import type { ReceiptData } from './ReceiptPreview';

interface ReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ReceiptData | null;
}

export default function ReceiptDialog({ open, onOpenChange, data }: ReceiptDialogProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!receiptRef.current) return;
    const printWindow = window.open('', '_blank', 'width=400,height=700');
    if (!printWindow) return;

    const html = receiptRef.current.innerHTML;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Recibo</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
            background: white; color: black; padding: 8mm;
            max-width: 80mm;
          }
          .bg-\\[\\#0B0F14\\]\\/90 { background: white !important; }
          .text-white, .text-white\\/80 { color: black !important; }
          .text-white\\/50, .text-white\\/40, .text-white\\/30 { color: #666 !important; }
          .border-white\\/\\[0\\.08\\] { border-color: #ddd !important; }
          .bg-gradient-to-r { background: #eee !important; }
          .backdrop-blur-xl { backdrop-filter: none !important; }
          .shadow-\\[0_8px_32px_rgba\\(0\\,0\\,0\\,0\\.4\\)\\] { box-shadow: none !important; }
          .bg-\\[\\#00C853\\]\\/15 { background: #e8f5e9 !important; }
          .text-\\[\\#00C853\\] { color: #2e7d32 !important; }
          .bg-\\[\\#FF6A00\\]\\/15 { background: #fff3e0 !important; }
          .text-\\[\\#FF6A00\\] { color: #e65100 !important; }
          @media print { body { padding: 2mm; } }
        </style>
      </head>
      <body>${html}</body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  };

  if (!data) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[hsl(var(--dashboard-bg))] border-white/[0.08]">
        <DialogHeader>
          <DialogTitle className="text-center text-white/80 text-sm font-medium tracking-wider uppercase">
            Pré-visualização do Recibo
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <ReceiptPreview ref={receiptRef} data={data} />
        </div>

        <div className="flex justify-center pt-2 pb-1">
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
