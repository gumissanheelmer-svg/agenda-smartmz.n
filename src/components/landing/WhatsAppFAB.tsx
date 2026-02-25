import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { useLandingSettings } from '@/hooks/useLandingSettings';

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 9) return '258' + digits;
  return digits;
}

export function WhatsAppFAB() {
  const { settings, isLoading } = useLandingSettings();

  if (isLoading) return null;
  if (!settings.wa_support_enabled) return null;

  const phone = settings.wa_support_phone || settings.wa_sales_phone;
  if (!phone) return null;

  const normalized = normalizePhone(phone);
  const url = `https://wa.me/${normalized}?text=${encodeURIComponent(settings.wa_support_message)}`;

  return (
    <motion.div
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2"
      initial={{ opacity: 0, scale: 0.5, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 1.5 }}
    >
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex items-center"
        aria-label={settings.wa_support_tooltip}
      >
        {/* Tooltip */}
        <span className="hidden sm:block mr-3 px-3 py-1.5 rounded-lg bg-card/90 border border-border/50 backdrop-blur-xl text-xs font-medium text-foreground shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
          {settings.wa_support_tooltip}
        </span>

        {/* Button */}
        <motion.div
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
          style={{ background: '#25D366' }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <MessageCircle className="w-6 h-6 text-white" />
        </motion.div>

        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: '#25D366' }} />
      </a>
    </motion.div>
  );
}
