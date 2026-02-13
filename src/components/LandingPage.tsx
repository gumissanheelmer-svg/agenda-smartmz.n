import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { Scissors, Clock, MapPin, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LocationSection } from '@/components/LocationSection';

interface LandingPageProps {
  onBookNow: () => void;
  barbershopName?: string;
  logoUrl?: string | null;
  backgroundImageUrl?: string | null;
  backgroundOverlayLevel?: 'low' | 'medium' | 'high';
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
}

const floatAnimation = {
  y: [0, -6, 0],
  transition: {
    duration: 6,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
};

const featureCards = [
  { icon: Clock, title: 'Agendamento Rápido', desc: 'Em poucos cliques' },
  { icon: Star, title: 'Profissionais Top', desc: 'Equipa experiente' },
  { icon: MapPin, title: 'Localização Central', desc: 'Fácil acesso' },
];

export function LandingPage({
  onBookNow,
  barbershopName,
  logoUrl,
  backgroundImageUrl,
  address,
  latitude,
  longitude,
  coverImageUrl,
  primaryColor,
  city,
  galleryImages,
  galleryVideos,
  mediaFeaturedUrl,
  mediaFeaturedType,
}: LandingPageProps) {
  const displayName = barbershopName || 'Barbearia Elite';

  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      {/* Background Image */}
      {backgroundImageUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
          style={{ backgroundImage: `url(${backgroundImageUrl})` }}
        />
      )}

      {/* Premium Gradient Overlay – works on any image */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.75), rgba(0,0,0,0.55), rgba(0,0,0,0.80))',
        }}
      />

      {/* Header */}
      <header className="relative z-20 flex items-center justify-between px-6 py-5 max-w-[1200px] mx-auto">
        {logoUrl ? (
          <img src={logoUrl} alt={displayName} className="h-10 w-auto object-contain" />
        ) : (
          <Logo size="sm" />
        )}
        <Link to="/login">
          <Button
            variant="ghost"
            size="sm"
            className="text-white/70 hover:text-white hover:bg-white/10 transition-colors duration-300"
          >
            Entrar
          </Button>
        </Link>
      </header>

      {/* Hero Content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-6 text-center">
        <div className="max-w-[1200px] mx-auto w-full py-20 md:py-28">
          {/* Logo mark */}
          {logoUrl && (
            <motion.img
              src={logoUrl}
              alt={displayName}
              className="h-20 w-auto object-contain mx-auto mb-8"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            />
          )}

          {/* Title */}
          <motion.h1
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-extrabold text-white tracking-tight leading-[1.05]"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            {displayName}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="mt-5 text-lg md:text-xl text-white/85 font-medium max-w-lg mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
          >
            Estilo e precisão em cada corte. Agende seu horário agora.
          </motion.p>

          {/* Microcopy */}
          <motion.p
            className="mt-2 text-sm text-white/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            Agende seu horário em segundos.
          </motion.p>

          {/* CTA Button */}
          <motion.div
            className="mt-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
          >
            <button
              onClick={onBookNow}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold text-base
                text-[#111] shadow-lg
                transition-all duration-300 ease-out
                hover:scale-[1.04] hover:shadow-[0_0_30px_rgba(250,204,21,0.35)]
                active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #FACC15, #FDBA74)',
              }}
            >
              <Scissors className="w-5 h-5" />
              Agendar Agora
            </button>
          </motion.div>

          {/* Feature Cards */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-5 max-w-3xl mx-auto">
            {featureCards.map((card, i) => (
              <motion.div
                key={card.title}
                className="flex flex-col items-center p-7 rounded-[20px] border border-white/10 shadow-lg"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                }}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.55 + i * 0.12 }}
                whileInView={floatAnimation}
                viewport={{ once: false }}
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-white/10">
                  <card.icon className="w-6 h-6 text-white/90" />
                </div>
                <h3 className="font-semibold text-white text-base">{card.title}</h3>
                <p className="text-sm text-white/60 mt-1">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      {/* Location Section */}
      <LocationSection
        name={displayName}
        address={address}
        latitude={latitude}
        longitude={longitude}
        coverImageUrl={coverImageUrl}
        primaryColor={primaryColor}
        city={city}
        galleryImages={galleryImages}
        galleryVideos={galleryVideos}
        mediaFeaturedUrl={mediaFeaturedUrl}
        mediaFeaturedType={mediaFeaturedType}
        onBookNow={onBookNow}
      />

      {/* Footer */}
      <footer className="relative z-10 py-8 text-center text-sm text-white/40" style={{ background: '#14141C' }}>
        <p>© {new Date().getFullYear()} {displayName}. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
