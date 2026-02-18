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
  print_with_logo?: boolean;
}

interface ReceiptPreviewProps {
  data: ReceiptData;
  mode?: 'digital' | 'print';
}

const ReceiptPreview = forwardRef<HTMLDivElement, ReceiptPreviewProps>(({ data, mode = 'digital' }, ref) => {
  const date = new Date(data.issued_at);
  const formattedDate = date.toLocaleDateString('pt-MZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const formattedTime = date.toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' });

  const isMpesa = data.payment_method === 'MPESA';
  const showLogo = data.barbershop_logo && (data.print_with_logo !== false);

  if (mode === 'print') {
    return (
      <div ref={ref} className="w-[302px] mx-auto bg-white text-black font-sans p-4" style={{ fontFamily: "'Segoe UI', Arial, sans-serif" }}>
        {/* Logo */}
        {showLogo && (
          <div className="flex justify-center mb-2">
            <img
              src={data.barbershop_logo!}
              alt={data.barbershop_name}
              className="w-12 h-12 object-cover rounded"
              style={{ filter: 'grayscale(1) contrast(2)' }}
            />
          </div>
        )}

        {/* Business Name */}
        <div className="text-center mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wide">
            {data.barbershop_name || 'Estabelecimento'}
          </h2>
          <div className="border-t border-gray-400 mt-2" />
        </div>

        {/* Receipt Number + Date */}
        <div className="text-center mb-3">
          <p className="text-[9px] font-semibold tracking-widest text-gray-500 uppercase">Recibo</p>
          <p className="text-base font-bold mt-0.5">{data.receipt_number}</p>
          <p className="text-[11px] text-gray-600 mt-0.5">{formattedDate} • {formattedTime}</p>
        </div>

        <div className="border-t border-dashed border-gray-300 mb-2" />

        {/* Details */}
        <div className="space-y-1.5 mb-3 text-[12px]">
          <PrintRow label="Cliente" value={data.client_name} />
          <PrintRow label="Serviço" value={data.service_name} />
          <PrintRow label="Profissional" value={data.professional_name} />
        </div>

        <div className="border-t border-dashed border-gray-300 mb-2" />

        {/* Amount */}
        <div className="text-center mb-2">
          <p className="text-[9px] font-semibold tracking-widest text-gray-500 uppercase">Valor pago</p>
          <p className="text-xl font-bold mt-0.5">{data.amount.toLocaleString('pt-MZ')} MT</p>
        </div>

        {/* Payment Method */}
        <div className="flex justify-center mb-2">
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold uppercase border ${
            isMpesa
              ? 'border-green-600 text-green-700 bg-green-50'
              : 'border-orange-600 text-orange-700 bg-orange-50'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isMpesa ? 'bg-green-600' : 'bg-orange-600'}`} />
            {isMpesa ? 'M-Pesa' : 'E-mola'}
          </span>
        </div>

        {/* Transaction Code */}
        {data.transaction_code && (
          <div className="text-center mb-3">
            <p className="text-[9px] font-semibold tracking-widest text-gray-500 uppercase">Código da transação</p>
            <p className="text-[12px] font-mono font-semibold mt-0.5">{data.transaction_code}</p>
          </div>
        )}

        <div className="border-t border-gray-400 mb-2" />

        {/* Footer */}
        <div className="text-center space-y-0.5">
          <p className="text-[11px] text-gray-600">Obrigado pela sua preferência</p>
          <p className="text-[9px] text-gray-400 font-medium tracking-wider">Agenda Smart powered</p>
        </div>
      </div>
    );
  }

  // Digital mode (existing dark premium design)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      ref={ref}
      className="w-full max-w-[340px] mx-auto"
    >
      <div className="bg-[#0B0F14]/90 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 mb-5">
          {showLogo && (
            <img
              src={data.barbershop_logo!}
              alt={data.barbershop_name}
              className="w-14 h-14 rounded-xl object-cover"
            />
          )}
          <h2 className="text-base font-bold text-white tracking-wide uppercase">
            {data.barbershop_name || 'Estabelecimento'}
          </h2>
          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>

        {/* Receipt Info */}
        <div className="text-center mb-5">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-white/40 uppercase">Recibo</p>
          <p className="text-lg font-bold text-white mt-0.5">{data.receipt_number}</p>
          <p className="text-xs text-white/50 mt-1">{formattedDate} • {formattedTime}</p>
        </div>

        <div className="w-full h-px bg-white/[0.06] mb-4" />

        {/* Details */}
        <div className="space-y-3 mb-5">
          <DigitalRow label="Cliente" value={data.client_name} />
          <DigitalRow label="Serviço" value={data.service_name} />
          <DigitalRow label="Profissional" value={data.professional_name} />
        </div>

        <div className="w-full h-px bg-white/[0.06] mb-4" />

        {/* Amount */}
        <div className="text-center mb-4">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-white/40 uppercase">Valor pago</p>
          <p className="text-2xl font-bold text-white mt-1">{data.amount.toLocaleString('pt-MZ')} MT</p>
        </div>

        {/* Payment Badge */}
        <div className="flex justify-center mb-4">
          <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase ${
            isMpesa
              ? 'bg-[#00C853]/15 text-[#00C853] border border-[#00C853]/30'
              : 'bg-[#FF6A00]/15 text-[#FF6A00] border border-[#FF6A00]/30'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isMpesa ? 'bg-[#00C853]' : 'bg-[#FF6A00]'}`} />
            {isMpesa ? 'M-Pesa' : 'E-mola'}
          </span>
        </div>

        {/* Transaction Code */}
        {data.transaction_code && (
          <div className="text-center mb-5">
            <p className="text-[10px] font-semibold tracking-[0.2em] text-white/40 uppercase">Código da transação</p>
            <p className="text-sm font-mono font-semibold text-white/80 mt-1">{data.transaction_code}</p>
          </div>
        )}

        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-4" />

        {/* Footer */}
        <div className="text-center space-y-1">
          <p className="text-xs text-white/50">Obrigado pela sua preferência</p>
          <p className="text-[10px] text-white/30 font-medium tracking-wider">Agenda Smart powered</p>
        </div>
      </div>
    </motion.div>
  );
});

ReceiptPreview.displayName = 'ReceiptPreview';

function PrintRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

function DigitalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-white/50">{label}</span>
      <span className="text-sm font-medium text-white">{value}</span>
    </div>
  );
}

export default ReceiptPreview;
export type { ReceiptData };
