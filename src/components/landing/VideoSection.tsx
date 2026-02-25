import { motion } from 'framer-motion';

// ── Altere esta URL para o vídeo de demonstração real ──
const VSL_EMBED_URL = 'https://www.youtube.com/embed/dQw4w9WgXcQ';

export function VideoSection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-xs font-medium text-primary tracking-widest uppercase mb-3 block">Demonstração</span>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight">
            Veja como funciona em 2 minutos
          </h2>
          <p className="mt-4 text-muted-foreground text-lg max-w-lg mx-auto">
            Uma demonstração rápida do Agenda Smart na prática.
          </p>
        </motion.div>

        <motion.div
          className="relative rounded-2xl overflow-hidden border border-border/30 bg-card/40 backdrop-blur-sm shadow-lg"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7 }}
        >
          <div className="aspect-video">
            <iframe
              src={VSL_EMBED_URL}
              title="Demonstração Agenda Smart"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
              className="w-full h-full"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
