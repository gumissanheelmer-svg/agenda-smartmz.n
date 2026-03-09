import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Command, Users, MessageSquare, Lightbulb, FileText, Globe, FlaskConical, Link2, BarChart3 } from 'lucide-react';
import { CommandCenterSection } from './CommandCenterSection';
import { LeadIntelligenceSection } from './LeadIntelligenceSection';
import { SalesAssistantSection } from './SalesAssistantSection';

export function ArchonTab() {
  const [activeSection, setActiveSection] = useState('command-center');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg">
          <Command className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Archon AI Growth Director</h2>
          <p className="text-sm text-muted-foreground">Inteligência artificial para crescimento da plataforma</p>
        </div>
      </div>

      <Tabs value={activeSection} onValueChange={setActiveSection}>
        <div className="overflow-x-auto -mx-4 px-4">
          <TabsList className="inline-flex w-auto min-w-full sm:grid sm:w-full sm:grid-cols-9 h-auto">
            <TabsTrigger value="command-center" className="flex items-center gap-1.5 text-xs">
              <Command className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">Command</span>
            </TabsTrigger>
            <TabsTrigger value="leads" className="flex items-center gap-1.5 text-xs">
              <Users className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">Leads</span>
            </TabsTrigger>
            <TabsTrigger value="funnels" className="flex items-center gap-1.5 text-xs">
              <BarChart3 className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">Funis</span>
            </TabsTrigger>
            <TabsTrigger value="sales" className="flex items-center gap-1.5 text-xs">
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">Vendas</span>
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-1.5 text-xs">
              <FileText className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">Conteúdo</span>
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-1.5 text-xs">
              <Globe className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">Audit</span>
            </TabsTrigger>
            <TabsTrigger value="experiments" className="flex items-center gap-1.5 text-xs">
              <FlaskConical className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">Testes</span>
            </TabsTrigger>
            <TabsTrigger value="connections" className="flex items-center gap-1.5 text-xs">
              <Link2 className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">Conexões</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-1.5 text-xs">
              <Lightbulb className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">Insights</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="command-center">
          <CommandCenterSection />
        </TabsContent>
        <TabsContent value="leads">
          <LeadIntelligenceSection />
        </TabsContent>
        <TabsContent value="funnels">
          <ComingSoon title="Sales Funnels" description="Crie e gerencie funis de vendas automatizados com IA." icon={BarChart3} />
        </TabsContent>
        <TabsContent value="sales">
          <SalesAssistantSection />
        </TabsContent>
        <TabsContent value="content">
          <ComingSoon title="Content Engine" description="Gere conteúdo para redes sociais, blog e campanhas." icon={FileText} />
        </TabsContent>
        <TabsContent value="audit">
          <ComingSoon title="Website Audit" description="Analise sites concorrentes e receba sugestões de melhoria." icon={Globe} />
        </TabsContent>
        <TabsContent value="experiments">
          <ComingSoon title="Growth Experiments" description="Crie testes A/B, experimentos de preço e programas de referência." icon={FlaskConical} />
        </TabsContent>
        <TabsContent value="connections">
          <ComingSoon title="Connections" description="Conecte ferramentas externas: Google Maps, Instagram, CRMs." icon={Link2} />
        </TabsContent>
        <TabsContent value="insights">
          <ComingSoon title="Insights" description="Relatórios e métricas de crescimento gerados por IA." icon={Lightbulb} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ComingSoon({ title, description, icon: Icon }: { title: string; description: string; icon: React.ElementType }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md">{description}</p>
      <span className="mt-4 text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">Em breve</span>
    </div>
  );
}
