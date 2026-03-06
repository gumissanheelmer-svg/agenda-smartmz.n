import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ContactsSubTab } from './whatsapp/ContactsSubTab';
import { TemplatesSubTab } from './whatsapp/TemplatesSubTab';
import { CampaignsSubTab } from './whatsapp/CampaignsSubTab';
import { ResultsSubTab } from './whatsapp/ResultsSubTab';
import { Users, FileText, Megaphone, BarChart3 } from 'lucide-react';

export function WhatsAppCampaignsTab() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Campanhas WhatsApp</h2>
        <p className="text-sm text-muted-foreground">Gerencie contatos, templates e campanhas de prospecção.</p>
      </div>

      <Tabs defaultValue="contacts" className="space-y-4">
        <TabsList className="grid w-full max-w-lg grid-cols-4">
          <TabsTrigger value="contacts" className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Contatos</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-1">
            <FileText className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Templates</span>
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center gap-1">
            <Megaphone className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Campanhas</span>
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-1">
            <BarChart3 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Resultados</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contacts"><ContactsSubTab /></TabsContent>
        <TabsContent value="templates"><TemplatesSubTab /></TabsContent>
        <TabsContent value="campaigns"><CampaignsSubTab /></TabsContent>
        <TabsContent value="results"><ResultsSubTab /></TabsContent>
      </Tabs>
    </div>
  );
}
