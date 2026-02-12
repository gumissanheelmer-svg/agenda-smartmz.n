import { MapPin, Navigation, Scissors } from 'lucide-react';
import { motion } from 'framer-motion';

interface LocationSectionProps {
  name: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  coverImageUrl?: string | null;
  primaryColor?: string;
  onBookNow: () => void;
}

export function LocationSection({
  name,
  address,
  latitude,
  longitude,
  coverImageUrl,
  primaryColor = '#FACC15',
  onBookNow,
}: LocationSectionProps) {
  const hasCoords = latitude != null && longitude != null;
  const mapsUrl = hasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
    : null;
  const embedUrl = hasCoords
    ? `https://www.google.com/maps?q=${latitude},${longitude}&z=16&output=embed`
    : null;

  return (
    <section
      className="relative py-20 md:py-28 px-6 overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #0F0F14 0%, #14141C 100%)',
      }}
    >
      {/* Accent glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-[0.07] blur-[120px] pointer-events-none"
        style={{ background: primaryColor }}
      />

      <div className="max-w-[1200px] mx-auto relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-sm text-white/70">
            <MapPin className="w-4 h-4" />
            Localização
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-display font-extrabold text-white tracking-tight">
            Onde estamos
          </h2>
          <p className="mt-4 text-lg text-[#B8B8C2] max-w-lg mx-auto">
            Venha nos visitar. Estamos prontos para te receber com excelência.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image */}
          <motion.div
            className="rounded-3xl overflow-hidden aspect-[4/3] lg:aspect-auto"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {coverImageUrl ? (
              <img
                src={coverImageUrl}
                alt={name}
                className="w-full h-full object-cover rounded-3xl transition-transform duration-500 hover:scale-[1.02]"
                style={{
                  boxShadow: `0 20px 60px -15px rgba(0,0,0,0.5), 0 0 40px -10px ${primaryColor}22`,
                }}
                loading="lazy"
              />
            ) : (
              <div
                className="w-full h-full min-h-[300px] rounded-3xl flex items-center justify-center"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div className="text-center text-white/40">
                  <MapPin className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">Foto do estabelecimento</p>
                </div>
              </div>
            )}
          </motion.div>

          {/* Info Card */}
          <motion.div
            className="flex flex-col gap-6"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Details card */}
            <div
              className="rounded-[20px] p-7 flex flex-col gap-4"
              style={{
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <h3 className="text-2xl font-display font-bold text-white">{name}</h3>

              {address && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-white/50 mt-0.5 shrink-0" />
                  <p className="text-[#B8B8C2] text-base leading-relaxed">{address}</p>
                </div>
              )}

              {hasCoords && (
                <div className="flex items-center gap-3 text-sm text-white/40">
                  <span>📍 {latitude?.toFixed(4)}, {longitude?.toFixed(4)}</span>
                </div>
              )}

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                {mapsUrl && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-semibold text-sm text-[#111] transition-all duration-300 hover:scale-[1.03] hover:shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}CC)`,
                      boxShadow: `0 4px 20px -4px ${primaryColor}44`,
                    }}
                  >
                    <Navigation className="w-4 h-4" />
                    Traçar rota no Google Maps
                  </a>
                )}
                <button
                  onClick={onBookNow}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-semibold text-sm text-white border border-white/15 bg-white/5 transition-all duration-300 hover:bg-white/10 hover:border-white/25 hover:scale-[1.03]"
                >
                  <Scissors className="w-4 h-4" />
                  Agendar agora
                </button>
              </div>
            </div>

            {/* Map */}
            {embedUrl ? (
              <motion.div
                className="rounded-[20px] overflow-hidden"
                style={{
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 10px 40px -10px rgba(0,0,0,0.4)',
                }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.35 }}
              >
                <iframe
                  src={embedUrl}
                  width="100%"
                  height="220"
                  style={{ border: 0, display: 'block' }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`Mapa - ${name}`}
                />
              </motion.div>
            ) : (
              <div
                className="rounded-[20px] p-6 text-center"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <p className="text-white/40 text-sm">Localização ainda não configurada.</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
