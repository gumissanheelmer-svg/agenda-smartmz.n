import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Trash2, Bot, User, Sparkles } from 'lucide-react';
import { useArchonAI } from '@/hooks/useArchonAI';
import ReactMarkdown from 'react-markdown';

const QUICK_PROMPTS = [
  { label: '📊 Estratégia de crescimento', prompt: 'Crie uma estratégia de crescimento para os próximos 90 dias para a plataforma Agenda Smart em Moçambique. Inclua canais, metas e ações específicas.' },
  { label: '🎯 Prospecção de leads', prompt: 'Liste 10 tipos de negócios de beleza que posso prospectar em Maputo e Matola. Para cada um, sugira a melhor abordagem de venda.' },
  { label: '💬 Script de vendas', prompt: 'Crie um script de vendas para WhatsApp para abordar donos de barbearias que ainda não usam sistema de agendamento.' },
  { label: '📱 Ideias de conteúdo', prompt: 'Sugira 10 ideias de posts para Instagram/TikTok para promover o Agenda Smart para donos de barbearias.' },
  { label: '💰 Estratégia de preços', prompt: 'Analise nossa estratégia de preços atual e sugira melhorias para maximizar conversão no mercado moçambicano.' },
  { label: '🔄 Programa de referência', prompt: 'Desenhe um programa de referência/afiliados para o Agenda Smart que incentive clientes existentes a trazer novos negócios.' },
];

export function CommandCenterSection() {
  const { messages, isLoading, sendMessage, clearMessages } = useArchonAI();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="space-y-4">
      {/* Quick prompts */}
      {messages.length === 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-500" />
              Comandos rápidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {QUICK_PROMPTS.map((qp) => (
                <Button
                  key={qp.label}
                  variant="outline"
                  size="sm"
                  className="justify-start text-left h-auto py-2 px-3 text-xs"
                  onClick={() => sendMessage(qp.prompt)}
                  disabled={isLoading}
                >
                  {qp.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat area */}
      <Card className="flex flex-col" style={{ height: messages.length > 0 ? '60vh' : '30vh' }}>
        <CardHeader className="pb-2 flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Bot className="h-4 w-4 text-violet-500" />
            Archon AI
          </CardTitle>
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearMessages}>
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Limpar
            </Button>
          )}
        </CardHeader>
        <CardContent className="flex-1 flex flex-col min-h-0">
          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Pergunte qualquer coisa sobre crescimento, leads ou estratégia...
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                  msg.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-foreground'
                }`}>
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="h-3.5 w-3.5 text-primary" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex gap-2 justify-start">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-3.5 w-3.5 text-white animate-pulse" />
                </div>
                <div className="bg-muted rounded-xl px-3 py-2 text-sm text-muted-foreground">
                  Pensando...
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte ao Archon..."
              className="resize-none min-h-[44px] max-h-[120px]"
              rows={1}
              disabled={isLoading}
            />
            <Button onClick={handleSend} disabled={!input.trim() || isLoading} size="icon" className="flex-shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
