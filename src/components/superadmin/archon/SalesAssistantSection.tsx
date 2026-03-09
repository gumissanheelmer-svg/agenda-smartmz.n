import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Copy, MessageSquare, Phone, RefreshCw } from 'lucide-react';
import { useArchonAI } from '@/hooks/useArchonAI';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';

const SCRIPT_TYPES = [
  { value: 'cold_outreach', label: '❄️ Primeiro contacto (Cold)' },
  { value: 'followup', label: '🔄 Follow-up' },
  { value: 'demo_invite', label: '📱 Convite para demo' },
  { value: 'objection', label: '🛡️ Responder objeção' },
  { value: 'closing', label: '🤝 Fechar venda' },
  { value: 'reactivation', label: '🔥 Reativar lead frio' },
];

export function SalesAssistantSection() {
  const { toast } = useToast();
  const { messages, isLoading, sendMessage, clearMessages } = useArchonAI();
  const [scriptType, setScriptType] = useState('cold_outreach');
  const [customContext, setCustomContext] = useState('');

  const generateScript = () => {
    const typeLabel = SCRIPT_TYPES.find(s => s.value === scriptType)?.label || scriptType;
    const contextPart = customContext ? `\n\nContexto adicional: ${customContext}` : '';
    
    const prompts: Record<string, string> = {
      cold_outreach: `Crie um script de vendas para WhatsApp para primeiro contacto com donos de barbearias/salões em Moçambique. O script deve:
- Ser curto e direto (máx 3 mensagens)
- Gerar curiosidade sobre o Agenda Smart
- Incluir pergunta para abrir conversa
- Tom profissional mas amigável${contextPart}`,
      followup: `Crie 3 variações de mensagens de follow-up para leads que não responderam ao primeiro contacto. Cada uma com abordagem diferente (valor, urgência, social proof).${contextPart}`,
      demo_invite: `Crie um script para convidar um lead interessado para ver uma demonstração do Agenda Smart. Inclua link fictício e instruções de como agendar.${contextPart}`,
      objection: `Liste as 8 objeções mais comuns de donos de barbearias ao adotar um sistema digital e crie respostas persuasivas para cada uma. Formato: Objeção → Resposta.${contextPart}`,
      closing: `Crie um script de fechamento de venda para WhatsApp. O lead já viu a demo e está interessado. Inclua: urgência, oferta especial, próximos passos.${contextPart}`,
      reactivation: `Crie 3 mensagens criativas para reativar leads que ficaram frios (não respondem há mais de 30 dias). Use diferentes hooks: novidade, desconto, case de sucesso.${contextPart}`,
    };

    sendMessage(prompts[scriptType] || prompts.cold_outreach);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copiado!' });
  };

  const lastAssistantMessage = messages.filter(m => m.role === 'assistant').pop();

  return (
    <div className="space-y-4">
      {/* Script Generator */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-violet-500" />
            Gerador de Scripts de Vendas
          </CardTitle>
          <CardDescription>IA gera scripts personalizados para cada etapa do funil</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Tipo de script</label>
              <Select value={scriptType} onValueChange={setScriptType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SCRIPT_TYPES.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Contexto (opcional)</label>
              <Textarea
                value={customContext}
                onChange={e => setCustomContext(e.target.value)}
                placeholder="Ex: lead é dona de salão feminino em Matola..."
                rows={1}
                className="resize-none"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={generateScript} disabled={isLoading}>
              {isLoading ? <RefreshCw className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
              Gerar Script
            </Button>
            {messages.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearMessages}>
                Limpar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Generated Script */}
      {lastAssistantMessage && (
        <Card>
          <CardHeader className="pb-2 flex-row items-center justify-between">
            <CardTitle className="text-base">Script Gerado</CardTitle>
            <Button variant="outline" size="sm" onClick={() => copyToClipboard(lastAssistantMessage.content)}>
              <Copy className="h-3.5 w-3.5 mr-1" /> Copiar
            </Button>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none bg-muted rounded-lg p-4">
              <ReactMarkdown>{lastAssistantMessage.content}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => sendMessage('Crie um pitch de elevador de 30 segundos para o Agenda Smart, focado em donos de barbearias.')}>
          <CardContent className="p-4 text-center">
            <Phone className="h-6 w-6 mx-auto mb-2 text-violet-500" />
            <p className="text-sm font-medium">Pitch de Elevador</p>
            <p className="text-xs text-muted-foreground">30 segundos</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => sendMessage('Liste 5 cases de sucesso fictícios mas realistas de barbearias que usam o Agenda Smart e tiveram resultados significativos.')}>
          <CardContent className="p-4 text-center">
            <MessageSquare className="h-6 w-6 mx-auto mb-2 text-emerald-500" />
            <p className="text-sm font-medium">Cases de Sucesso</p>
            <p className="text-xs text-muted-foreground">Social proof</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => sendMessage('Crie uma proposta comercial resumida do Agenda Smart para enviar por WhatsApp. Inclua benefícios, preço e CTA.')}>
          <CardContent className="p-4 text-center">
            <Copy className="h-6 w-6 mx-auto mb-2 text-amber-500" />
            <p className="text-sm font-medium">Proposta Comercial</p>
            <p className="text-xs text-muted-foreground">Para WhatsApp</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
