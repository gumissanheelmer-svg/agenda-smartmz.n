import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Play, Pause, Send, MessageSquare } from 'lucide-react';

interface Campaign {
  id: string;
  title: string;
  template_id: string | null;
  freeform_message: string | null;
  target_filter: Record<string, unknown>;
  status: string;
  scheduled_at: string | null;
  send_mode: string;
  created_at: string;
  created_by: string | null;
}

interface Template {
  id: string;
  name: string;
  body: string;
  is_approved: boolean;
  language: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  scheduled: 'bg-blue-500/20 text-blue-400',
  sending: 'bg-yellow-500/20 text-yellow-400',
  paused: 'bg-orange-500/20 text-orange-400',
  completed: 'bg-green-500/20 text-green-400',
  cancelled: 'bg-red-500/20 text-red-400',
};

export function CampaignsSubTab() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [form, setForm] = useState({
    title: '', send_mode: 'template', template_id: '', freeform_message: '',
    filter_status: '', filter_language: '', filter_source: '', filter_niche: '',
    batch_size: '50', interval_seconds: '10', scheduled_at: '',
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: c }, { data: t }] = await Promise.all([
      supabase.from('whatsapp_campaigns').select('*').order('created_at', { ascending: false }),
      supabase.from('whatsapp_templates').select('*').eq('active', true).eq('is_approved', true),
    ]);
    setCampaigns((c || []) as Campaign[]);
    setTemplates(t || []);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.title.trim()) {
      toast({ title: 'Erro', description: 'Título é obrigatório.', variant: 'destructive' });
      return;
    }
    if (form.send_mode === 'template' && !form.template_id) {
      toast({ title: 'Erro', description: 'Selecione um template aprovado.', variant: 'destructive' });
      return;
    }
    if (form.send_mode === 'freeform' && !form.freeform_message.trim()) {
      toast({ title: 'Erro', description: 'Escreva a mensagem.', variant: 'destructive' });
      return;
    }

    const target_filter: Record<string, string> = {};
    if (form.filter_status) target_filter.status = form.filter_status;
    if (form.filter_language) target_filter.language = form.filter_language;
    if (form.filter_source) target_filter.source = form.filter_source;
    if (form.filter_niche) target_filter.niche = form.filter_niche;

    const payload = {
      title: form.title.trim(),
      send_mode: form.send_mode,
      template_id: form.send_mode === 'template' ? form.template_id : null,
      freeform_message: form.send_mode === 'freeform' ? form.freeform_message.trim() : null,
      target_filter,
      status: form.scheduled_at ? 'scheduled' : 'draft',
      scheduled_at: form.scheduled_at || null,
      created_by: user?.id || null,
    };

    const { error } = await supabase.from('whatsapp_campaigns').insert([payload]);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Sucesso', description: 'Campanha criada.' });
    setDialogOpen(false);
    resetForm();
    fetchData();
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    await supabase.from('whatsapp_campaigns').update({ status: newStatus }).eq('id', id);
    fetchData();
  };

  const handleTestSend = async (campaign: Campaign) => {
    const messageText = campaign.freeform_message || templates.find(t => t.id === campaign.template_id)?.body || '';
    if (!messageText) {
      toast({ title: 'Erro', description: 'Sem mensagem para enviar.', variant: 'destructive' });
      return;
    }
    const phone = prompt('Digite seu número para teste (com código do país):');
    if (!phone) return;

    const encoded = encodeURIComponent(messageText);
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
    toast({ title: 'Teste', description: 'WhatsApp aberto com a mensagem de teste.' });
  };

  const resetForm = () => {
    setForm({ title: '', send_mode: 'template', template_id: '', freeform_message: '',
      filter_status: '', filter_language: '', filter_source: '', filter_niche: '',
      batch_size: '50', interval_seconds: '10', scheduled_at: '' });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{campaigns.length} campanha(s)</p>
        <Dialog open={dialogOpen} onOpenChange={v => { setDialogOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Nova Campanha</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Nova Campanha</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Título *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Prospecção Barbearias Maputo" /></div>
              
              <div><Label>Modo de envio</Label>
                <Select value={form.send_mode} onValueChange={v => setForm(f => ({ ...f, send_mode: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="template">Template aprovado</SelectItem>
                    <SelectItem value="freeform">Mensagem livre (só janela 24h)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {form.send_mode === 'template' ? (
                <div><Label>Template</Label>
                  <Select value={form.template_id} onValueChange={v => setForm(f => ({ ...f, template_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name} ({t.language.toUpperCase()})</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {templates.length === 0 && <p className="text-xs text-destructive mt-1">Nenhum template aprovado disponível.</p>}
                </div>
              ) : (
                <div><Label>Mensagem livre</Label>
                  <Textarea value={form.freeform_message} onChange={e => setForm(f => ({ ...f, freeform_message: e.target.value }))} rows={4} />
                  <p className="text-xs text-amber-400 mt-1">⚠️ Só será enviada para contatos com janela de 24h ativa.</p>
                </div>
              )}

              <div className="border border-border rounded-lg p-3 space-y-2">
                <p className="text-sm font-medium">Filtros de público</p>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label className="text-xs">Status</Label>
                    <Select value={form.filter_status || 'all'} onValueChange={v => setForm(f => ({ ...f, filter_status: v === 'all' ? '' : v }))}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="new">new</SelectItem>
                        <SelectItem value="contacted">contacted</SelectItem>
                        <SelectItem value="replied">replied</SelectItem>
                        <SelectItem value="interested">interested</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs">Idioma</Label>
                    <Select value={form.filter_language || 'all'} onValueChange={v => setForm(f => ({ ...f, filter_language: v === 'all' ? '' : v }))}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="pt">PT</SelectItem>
                        <SelectItem value="en">EN</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs">Origem</Label><Input className="h-8" value={form.filter_source} onChange={e => setForm(f => ({ ...f, filter_source: e.target.value }))} placeholder="instagram" /></div>
                  <div><Label className="text-xs">Nicho</Label><Input className="h-8" value={form.filter_niche} onChange={e => setForm(f => ({ ...f, filter_niche: e.target.value }))} placeholder="barbearia" /></div>
                </div>
              </div>

              <div><Label>Agendamento (opcional)</Label>
                <Input type="datetime-local" value={form.scheduled_at} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))} />
              </div>

              <Button onClick={handleCreate} className="w-full">Criar Campanha</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {loading ? <p className="text-muted-foreground text-center py-8">Carregando...</p> :
          campaigns.length === 0 ? <p className="text-muted-foreground text-center py-8">Nenhuma campanha criada.</p> :
          campaigns.map(c => (
            <Card key={c.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{c.title}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {c.send_mode === 'template' ? 'Template' : 'Mensagem livre'} • Criada em {new Date(c.created_at).toLocaleDateString('pt')}
                      {c.scheduled_at && ` • Agendada: ${new Date(c.scheduled_at).toLocaleString('pt')}`}
                    </p>
                  </div>
                  <Badge className={STATUS_COLORS[c.status] || ''}>{c.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={() => handleTestSend(c)}>
                    <MessageSquare className="h-3 w-3 mr-1" />Testar
                  </Button>
                  {c.status === 'draft' && (
                    <Button size="sm" onClick={() => handleStatusChange(c.id, 'sending')}>
                      <Play className="h-3 w-3 mr-1" />Iniciar
                    </Button>
                  )}
                  {c.status === 'sending' && (
                    <Button variant="outline" size="sm" onClick={() => handleStatusChange(c.id, 'paused')}>
                      <Pause className="h-3 w-3 mr-1" />Pausar
                    </Button>
                  )}
                  {c.status === 'paused' && (
                    <Button size="sm" onClick={() => handleStatusChange(c.id, 'sending')}>
                      <Play className="h-3 w-3 mr-1" />Retomar
                    </Button>
                  )}
                  {['draft', 'scheduled', 'paused'].includes(c.status) && (
                    <Button variant="destructive" size="sm" onClick={() => handleStatusChange(c.id, 'cancelled')}>
                      Cancelar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        }
      </div>
    </div>
  );
}
