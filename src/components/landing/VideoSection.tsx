import { motion } from 'framer-motion';
import { useLandingSettings } from '@/hooks/useLandingSettings';
import { useI18n } from '@/lib/i18n';

export function VideoSection() {
  const { settings, isLoading } = useLandingSettings();
  const { t } = useI18n();

  if (isLoading) return null;
  if (!settings.vsl_enabled) return null;
  if (!settings.vsl_embed_url) return null;

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
          <span className="text-xs font-medium text-primary tracking-widest uppercase mb-3 block">{t('video.label')}</span>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight">
            {settings.vsl_title}
          </h2>
          <p className="mt-4 text-muted-foreground text-lg max-w-lg mx-auto">
            {settings.vsl_subtitle}
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
              src={settings.vsl_embed_url}
              title={settings.vsl_title}
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
