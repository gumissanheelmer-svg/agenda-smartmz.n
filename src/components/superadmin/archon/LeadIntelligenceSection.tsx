import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Upload, Search, Sparkles, MapPin, Phone, Globe, Trash2 } from 'lucide-react';
import { useArchonAI } from '@/hooks/useArchonAI';
import ReactMarkdown from 'react-markdown';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Lead {
  id: string;
  name: string | null;
  phone: string;
  country_code: string | null;
  niche: string | null;
  source: string | null;
  status: string;
  notes: string | null;
  opt_in: boolean;
  created_at: string;
}

export function LeadIntelligenceSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const { messages: aiMessages, isLoading: aiLoading, sendMessage: aiSend, clearMessages } = useArchonAI();

  // Form state
  const [form, setForm] = useState({ name: '', phone: '', country_code: 'MZ', niche: '', source: 'manual', notes: '' });

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['archon-leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_contacts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Lead[];
    },
  });

  const addLead = useMutation({
    mutationFn: async (leadData: typeof form) => {
      const { error } = await supabase.from('whatsapp_contacts').insert([{
        name: leadData.name || null,
        phone: leadData.phone,
        country_code: leadData.country_code || null,
        niche: leadData.niche || null,
        source: leadData.source || 'manual',
        notes: leadData.notes || null,
        opt_in: false,
        status: 'new',
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['archon-leads'] });
      setShowAdd(false);
      setForm({ name: '', phone: '', country_code: 'MZ', niche: '', source: 'manual', notes: '' });
      toast({ title: 'Lead adicionado!' });
    },
    onError: (e: Error) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const deleteLead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('whatsapp_contacts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['archon-leads'] });
      toast({ title: 'Lead removido' });
    },
  });

  const handleCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length < 2) return;

    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    const phoneIdx = headers.findIndex(h => h.includes('phone') || h.includes('telefone'));
    const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('nome'));
    const nicheIdx = headers.findIndex(h => h.includes('niche') || h.includes('nicho'));

    if (phoneIdx === -1) {
      toast({ title: 'Erro', description: 'CSV precisa ter coluna "phone" ou "telefone"', variant: 'destructive' });
      return;
    }

    const rows = lines.slice(1).map(line => {
      const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      return {
        phone: cols[phoneIdx],
        name: nameIdx >= 0 ? cols[nameIdx] || null : null,
        niche: nicheIdx >= 0 ? cols[nicheIdx] || null : null,
        source: 'csv_import',
        opt_in: false,
        status: 'new',
      };
    }).filter(r => r.phone);

    const { error } = await supabase.from('whatsapp_contacts').upsert(rows, { onConflict: 'phone' });
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: `${rows.length} leads importados!` });
      queryClient.invalidateQueries({ queryKey: ['archon-leads'] });
    }
    e.target.value = '';
  };

  const filtered = leads.filter(l => {
    const matchSearch = !search || l.name?.toLowerCase().includes(search.toLowerCase()) || l.phone.includes(search);
    const matchStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusColors: Record<string, string> = {
    new: 'bg-blue-500/10 text-blue-600',
    contacted: 'bg-yellow-500/10 text-yellow-600',
    replied: 'bg-green-500/10 text-green-600',
    interested: 'bg-violet-500/10 text-violet-600',
    converted: 'bg-emerald-500/10 text-emerald-600',
    do_not_contact: 'bg-red-500/10 text-red-600',
  };

  return (
    <div className="space-y-4">
      {/* AI Lead Discovery */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-500" />
            Descoberta de Leads com IA
          </CardTitle>
          <CardDescription>Use IA para encontrar potenciais clientes</CardDescription>
        </CardHeader>
        <CardContent>
          {!showAI ? (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => { setShowAI(true); aiSend('Liste 15 barbearias e salões de beleza em Maputo, Moçambique que provavelmente não usam sistema de agendamento digital. Inclua nome estimado, localização e estratégia de abordagem.'); }}>
                <MapPin className="h-3.5 w-3.5 mr-1" /> Barbearias em Maputo
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setShowAI(true); aiSend('Sugira 10 nichos de beleza em Angola (Luanda) para prospectar. Para cada nicho, estime o tamanho do mercado e a melhor abordagem de venda.'); }}>
                <Globe className="h-3.5 w-3.5 mr-1" /> Nichos em Angola
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setShowAI(true); aiSend('Crie uma lista de critérios para qualificar leads de barbearias. Como identificar os que têm mais probabilidade de adotar um sistema digital?'); }}>
                <Search className="h-3.5 w-3.5 mr-1" /> Critérios de qualificação
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {aiMessages.filter(m => m.role === 'assistant').map((msg, i) => (
                  <div key={i} className="prose prose-sm dark:prose-invert max-w-none text-sm bg-muted rounded-lg p-3">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ))}
                {aiLoading && <div className="text-sm text-muted-foreground animate-pulse">Buscando leads...</div>}
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setShowAI(false); clearMessages(); }}>
                Fechar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leads table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base">Leads ({filtered.length})</CardTitle>
            <div className="flex gap-2 flex-wrap">
              <Dialog open={showAdd} onOpenChange={setShowAdd}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="h-3.5 w-3.5 mr-1" /> Adicionar</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Novo Lead</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>Nome</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                    <div><Label>Telefone *</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+258..." /></div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><Label>País</Label>
                        <Select value={form.country_code} onValueChange={v => setForm(f => ({ ...f, country_code: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MZ">🇲🇿 Moçambique</SelectItem>
                            <SelectItem value="AO">🇦🇴 Angola</SelectItem>
                            <SelectItem value="BR">🇧🇷 Brasil</SelectItem>
                            <SelectItem value="PT">🇵🇹 Portugal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div><Label>Nicho</Label><Input value={form.niche} onChange={e => setForm(f => ({ ...f, niche: e.target.value }))} placeholder="barbearia, salão..." /></div>
                    </div>
                    <div><Label>Origem</Label>
                      <Select value={form.source} onValueChange={v => setForm(f => ({ ...f, source: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual">Manual</SelectItem>
                          <SelectItem value="instagram">Instagram</SelectItem>
                          <SelectItem value="google_maps">Google Maps</SelectItem>
                          <SelectItem value="referral">Referência</SelectItem>
                          <SelectItem value="tiktok">TikTok</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Notas</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
                    <Button className="w-full" onClick={() => addLead.mutate(form)} disabled={!form.phone || addLead.isPending}>
                      {addLead.isPending ? 'Salvando...' : 'Salvar Lead'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button size="sm" variant="outline" asChild>
                <label className="cursor-pointer">
                  <Upload className="h-3.5 w-3.5 mr-1" /> CSV
                  <input type="file" accept=".csv" className="hidden" onChange={handleCSV} />
                </label>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-3">
            <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="new">Novo</SelectItem>
                <SelectItem value="contacted">Contactado</SelectItem>
                <SelectItem value="replied">Respondeu</SelectItem>
                <SelectItem value="interested">Interessado</SelectItem>
                <SelectItem value="converted">Convertido</SelectItem>
                <SelectItem value="do_not_contact">Não Contactar</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Nicho</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum lead encontrado</TableCell></TableRow>
                ) : (
                  filtered.slice(0, 50).map(lead => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.name || '—'}</TableCell>
                      <TableCell><span className="flex items-center gap-1"><Phone className="h-3 w-3" />{lead.phone}</span></TableCell>
                      <TableCell>{lead.niche || '—'}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{lead.source || '—'}</Badge></TableCell>
                      <TableCell><Badge className={`text-xs ${statusColors[lead.status] || ''}`}>{lead.status}</Badge></TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteLead.mutate(lead.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
