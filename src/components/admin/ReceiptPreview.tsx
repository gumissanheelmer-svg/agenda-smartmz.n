import { forwardRef } from 'react';
import { motion } from 'framer-motion';

interface ReceiptData {
  receipt_number: string;
  issued_at: string;
  client_name: string;
  service_name: string;
  professional_name: string;
  amount: number;
  payment_method: 'MPESA' | 'EMOLA';
  transaction_code?: string | null;
  barbershop_name?: string;
  barbershop_logo?: string | null;
}

interface ReceiptPreviewProps {
  data: ReceiptData;
}

const ReceiptPreview = forwardRef<HTMLDivElement, ReceiptPreviewProps>(({ data }, ref) => {
  const date = new Date(data.issued_at);
  const formattedDate = date.toLocaleDateString('pt-MZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const formattedTime = date.toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' });

  const isMpesa = data.payment_method === 'MPESA';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      ref={ref}
      className="w-full max-w-[340px] mx-auto"
    >
      {/* Receipt Card */}
      <div className="bg-[#0B0F14]/90 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)] print:bg-white print:text-black print:border-gray-200 print:shadow-none">
        
        {/* Header */}
        <div className="flex flex-col items-center gap-3 mb-5">
          {data.barbershop_logo && (
            <img
              src={data.barbershop_logo}
              alt={data.barbershop_name}
              className="w-14 h-14 rounded-xl object-cover print:w-12 print:h-12"
            />
          )}
          <h2 className="text-base font-bold text-white tracking-wide uppercase print:text-black">
            {data.barbershop_name || 'Estabelecimento'}
          </h2>
          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent print:via-gray-300" />
        </div>

        {/* Receipt Info */}
        <div className="text-center mb-5">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-white/40 uppercase print:text-gray-500">
            Recibo
          </p>
          <p className="text-lg font-bold text-white mt-0.5 print:text-black">
            {data.receipt_number}
          </p>
          <p className="text-xs text-white/50 mt-1 print:text-gray-500">
            {formattedDate} • {formattedTime}
          </p>
        </div>

        <div className="w-full h-px bg-white/[0.06] mb-4 print:bg-gray-200" />

        {/* Details */}
        <div className="space-y-3 mb-5">
          <Row label="Cliente" value={data.client_name} />
          <Row label="Serviço" value={data.service_name} />
          <Row label="Profissional" value={data.professional_name} />
        </div>

        <div className="w-full h-px bg-white/[0.06] mb-4 print:bg-gray-200" />

        {/* Amount */}
        <div className="text-center mb-4">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-white/40 uppercase print:text-gray-500">
            Valor pago
          </p>
          <p className="text-2xl font-bold text-white mt-1 print:text-black">
            {data.amount.toLocaleString('pt-MZ')} MT
          </p>
        </div>

        {/* Payment Badge */}
        <div className="flex justify-center mb-4">
          <span
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase ${
              isMpesa
                ? 'bg-[#00C853]/15 text-[#00C853] border border-[#00C853]/30 print:bg-green-50 print:text-green-700 print:border-green-300'
                : 'bg-[#FF6A00]/15 text-[#FF6A00] border border-[#FF6A00]/30 print:bg-orange-50 print:text-orange-700 print:border-orange-300'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isMpesa ? 'bg-[#00C853]' : 'bg-[#FF6A00]'}`} />
            {isMpesa ? 'M-Pesa' : 'E-mola'}
          </span>
        </div>

        {/* Transaction Code */}
        {data.transaction_code && (
          <div className="text-center mb-5">
            <p className="text-[10px] font-semibold tracking-[0.2em] text-white/40 uppercase print:text-gray-500">
              Código da transação
            </p>
            <p className="text-sm font-mono font-semibold text-white/80 mt-1 print:text-black">
              {data.transaction_code}
            </p>
          </div>
        )}

        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-4 print:via-gray-300" />

        {/* Footer */}
        <div className="text-center space-y-1">
          <p className="text-xs text-white/50 print:text-gray-500">
            Obrigado pela sua preferência
          </p>
          <p className="text-[10px] text-white/30 font-medium tracking-wider print:text-gray-400">
            Agenda Smart powered
          </p>
        </div>
      </div>
    </motion.div>
  );
});

ReceiptPreview.displayName = 'ReceiptPreview';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-white/50 print:text-gray-500">{label}</span>
      <span className="text-sm font-medium text-white print:text-black">{value}</span>
    </div>
  );
}

export default ReceiptPreview;
export type { ReceiptData };
