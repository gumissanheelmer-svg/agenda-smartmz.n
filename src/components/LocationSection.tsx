import { MapPin, Navigation, Copy, Scissors, ImageIcon, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import useEmblaCarousel from 'embla-carousel-react';
import { useCallback, useEffect, useState } from 'react';

interface LocationSectionProps {
  name: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  coverImageUrl?: string | null;
  primaryColor?: string;
  city?: string | null;
  galleryImages?: string[];
  galleryVideos?: string[];
  mediaFeaturedUrl?: string | null;
  mediaFeaturedType?: string | null;
  onBookNow: () => void;
}

const floatAnimation = {
  y: [0, -6, 0],
  transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' as const },
};

const glassStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  border: '1px solid rgba(255,255,255,0.10)',
};

export function LocationSection({
  name,
  address,
  latitude,
  longitude,
  coverImageUrl,
  primaryColor = '#D6B15E',
  city,
  galleryImages = [],
  galleryVideos = [],
  mediaFeaturedUrl,
  mediaFeaturedType,
  onBookNow,
}: LocationSectionProps) {
  const { toast } = useToast();
  const hasCoords = typeof latitude === 'number' && typeof longitude === 'number' &&
    !isNaN(latitude) && !isNaN(longitude) &&
    latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
  
  // Generate directions URLs with fallback
  const lat = hasCoords ? Number(latitude) : null;
  const lng = hasCoords ? Number(longitude) : null;

  const directionsUrl = hasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`
    : null;
  const pinUrl = hasCoords
    ? `https://www.google.com/maps?q=${lat},${lng}`
    : null;
  
  const embedUrl = hasCoords
    ? `https://www.google.com/maps?q=${lat},${lng}&z=16&output=embed`
    : null;

  const allMedia = [
    ...(mediaFeaturedUrl ? [{ type: mediaFeaturedType || 'image', url: mediaFeaturedUrl }] : []),
    ...galleryImages.filter(u => u !== mediaFeaturedUrl).map(url => ({ type: 'image' as const, url })),
    ...galleryVideos.filter(u => u !== mediaFeaturedUrl).map(url => ({ type: 'video' as const, url })),
  ];

  const hasMedia = allMedia.length > 0;

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    onSelect();
  }, [emblaApi, onSelect]);

  const copyLocation = () => {
    if (!hasCoords) return;
    navigator.clipboard.writeText(`${lat},${lng}`);
    toast({ title: '✅ Localização copiada', description: `${lat}, ${lng}` });
  };

  return (
    <section
      className="relative py-20 md:py-28 px-5 overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #070A0F 0%, #0D1017 50%, #070A0F 100%)' }}
    >
      {/* Accent glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full opacity-[0.06] blur-[140px] pointer-events-none"
        style={{ background: primaryColor }}
      />

      <div className="max-w-[1200px] mx-auto relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 12 }}
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
          <p className="mt-4 text-lg text-white/70 max-w-lg mx-auto">
            Estamos prontos para te receber. Toque no botão abaixo e venha sem perder tempo.
          </p>
        </motion.div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Info Card */}
          <motion.div
            className="rounded-[20px] p-7 flex flex-col gap-5"
            style={glassStyle}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            whileHover={{ scale: 1.005, borderColor: 'rgba(255,255,255,0.18)' }}
          >
            <motion.div animate={floatAnimation}>
              <h3 className="text-2xl font-display font-bold text-white">{name}</h3>

              {address && (
                <div className="flex items-start gap-3 mt-3">
                  <MapPin className="w-5 h-5 text-white/50 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-white/70 text-base leading-relaxed">{address}</p>
                    {city && <p className="text-white/40 text-sm mt-0.5">{city}</p>}
                  </div>
                </div>
              )}

              {!address && city && (
                <div className="flex items-start gap-3 mt-3">
                  <MapPin className="w-5 h-5 text-white/50 mt-0.5 shrink-0" />
                  <p className="text-white/70 text-base">{city}</p>
                </div>
              )}
            </motion.div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
               {hasCoords ? (
                 <a
                   href={directionsUrl!}
                   target="_blank"
                   rel="noopener noreferrer"
                   className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-semibold text-sm text-[#111] transition-all duration-300 hover:scale-[1.03] animate-pulse-glow"
                   style={{
                     background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}CC)`,
                     boxShadow: `0 0 24px rgba(214,177,94,0.28)`,
                   }}
                 >
                   <Navigation className="w-4 h-4" />
                   Traçar rota agora — te esperamos 👋
                 </a>
               ) : (
                 <div
                   className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-semibold text-sm text-white/40 cursor-not-allowed"
                   style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                   title="Defina a localização nas configurações para ativar"
                 >
                   <Navigation className="w-4 h-4" />
                   Localização não configurada
                 </div>
               )}
              {hasCoords && (
                 <button
                   onClick={copyLocation}
                   className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-semibold text-sm text-white border border-white/15 bg-white/5 transition-all duration-300 hover:bg-white/10 hover:border-white/25 hover:scale-[1.03]"
                 >
                   <Copy className="w-4 h-4" />
                   Copiar localização
                 </button>
              )}
              {hasCoords && (
                <a
                  href={pinUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-semibold text-sm text-white border border-white/15 bg-white/5 transition-all duration-300 hover:bg-white/10 hover:border-white/25 hover:scale-[1.03]"
                >
                  <MapPin className="w-4 h-4" />
                  Abrir no Maps
                </a>
              )}
            </div>
            {hasCoords && (
              <a
                href={`https://www.openstreetmap.org/directions?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 hover:underline transition-colors mt-1 self-start"
              >
                <MapPin className="w-3.5 h-3.5" />
                Abrir no mapa (alternativo)
              </a>
            )}

            {!hasCoords && (
              <div className="rounded-2xl p-5 text-center mt-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-white/40 text-sm">
                  Localização ainda não configurada. Peça ao estabelecimento para adicionar o link do Google Maps nas Configurações.
                </p>
              </div>
            )}
          </motion.div>

          {/* Right: Map */}
          <motion.div
            className="flex flex-col gap-6"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {embedUrl ? (
              <motion.div
                className="rounded-[20px] overflow-hidden"
                style={{
                  ...glassStyle,
                  boxShadow: '0 10px 40px -10px rgba(0,0,0,0.4)',
                }}
                whileHover={{ scale: 1.01 }}
              >
                <iframe
                  src={embedUrl}
                  width="100%"
                  height="340"
                  style={{ border: 0, display: 'block' }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`Mapa - ${name}`}
                />
              </motion.div>
            ) : (
              <div className="rounded-[20px] p-8 text-center min-h-[300px] flex items-center justify-center" style={glassStyle}>
                <div className="text-white/30">
                  <MapPin className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">Mapa indisponível</p>
                </div>
              </div>
            )}

            {/* Book CTA */}
            <button
              onClick={onBookNow}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-semibold text-sm text-white border border-white/15 bg-white/5 transition-all duration-300 hover:bg-white/10 hover:border-white/25 hover:scale-[1.03]"
            >
              <Scissors className="w-4 h-4" />
              Agendar agora
            </button>
          </motion.div>
        </div>

        {/* Gallery: "Conheça o espaço" */}
        <motion.div
          className="mt-16"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h3 className="text-xl font-display font-bold text-white mb-6 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-white/50" />
            Conheça o espaço
          </h3>

          {hasMedia ? (
            <div className="overflow-hidden rounded-2xl" ref={emblaRef}>
              <div className="flex gap-4">
                {allMedia.map((m, i) => (
                  <div
                    key={i}
                    className="flex-none w-[280px] sm:w-[340px] aspect-[4/3] rounded-2xl overflow-hidden relative group"
                    style={glassStyle}
                  >
                    {m.type === 'video' ? (
                      <>
                        <video
                          src={m.url}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                          preload="metadata"
                          onClick={(e) => {
                            const v = e.currentTarget;
                            v.paused ? v.play() : v.pause();
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity">
                          <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
                            <Play className="w-5 h-5 text-white ml-0.5" />
                          </div>
                        </div>
                      </>
                    ) : (
                      <img src={m.url} alt={`Espaço ${i + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                    )}
                  </div>
                ))}
              </div>

              {/* Dots */}
              {allMedia.length > 1 && (
                <div className="flex justify-center gap-1.5 mt-4">
                  {allMedia.map((_, i) => (
                    <button
                      key={i}
                      className={`w-2 h-2 rounded-full transition-all ${i === selectedIndex ? 'bg-white/80 w-4' : 'bg-white/20'}`}
                      onClick={() => emblaApi?.scrollTo(i)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl p-8 text-center" style={glassStyle}>
              <ImageIcon className="w-10 h-10 mx-auto mb-3 text-white/20" />
              <p className="text-white/40 text-sm">Fotos do espaço em breve.</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Pulse glow keyframe */}
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(214,177,94,0.2); }
          50% { box-shadow: 0 0 30px rgba(214,177,94,0.4); }
        }
        .animate-pulse-glow {
          animation: pulse-glow 3s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}
