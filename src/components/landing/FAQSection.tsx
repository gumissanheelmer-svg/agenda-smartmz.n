import { motion } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  { q: 'Preciso de site?', a: 'Não! O Agenda Smart gera automaticamente uma página de agendamento para o seu negócio. Basta partilhar o link.' },
  { q: 'Funciona no WhatsApp?', a: 'Sim. Pode enviar o link de agendamento directamente pelo WhatsApp aos seus clientes.' },
  { q: 'Meus clientes conseguem agendar pelo telemóvel?', a: 'Sim, a plataforma é 100% responsiva. Funciona perfeitamente em qualquer dispositivo.' },
  { q: 'Posso editar horários?', a: 'Claro! Pode configurar horários de trabalho, pausas e folgas para cada profissional individualmente.' },
  { q: 'Como partilho o link?', a: 'Nas definições do seu negócio você encontra o link direto. Copie e cole em qualquer rede social, bio do Instagram, etc.' },
  { q: 'Tem suporte?', a: 'Sim! Oferecemos suporte por chat e email. Utilizadores Pro têm suporte prioritário.' },
];

export function FAQSection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-xs font-medium text-primary tracking-widest uppercase mb-3 block">Dúvidas</span>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight">
            Perguntas frequentes
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="rounded-xl border border-border/30 bg-card/40 backdrop-blur-sm px-6 overflow-hidden"
              >
                <AccordionTrigger className="text-foreground text-left font-medium hover:no-underline py-5">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
