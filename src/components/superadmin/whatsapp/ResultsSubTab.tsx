import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Send, CheckCircle, XCircle, MessageSquare } from 'lucide-react';

interface CampaignMessage {
  id: string;
  campaign_id: string;
  phone: string;
  message_text: string;
  status: string;
  sent_at: string | null;
  response_at: string | null;
  error_message: string | null;
}

interface Campaign {
  id: string;
  title: string;
}

const MSG_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-muted text-muted-foreground',
  sent: 'bg-blue-500/20 text-blue-400',
  delivered: 'bg-green-500/20 text-green-400',
  failed: 'bg-red-500/20 text-red-400',
  replied: 'bg-purple-500/20 text-purple-400',
};

export function ResultsSubTab() {
  const [messages, setMessages] = useState<CampaignMessage[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: m }, { data: c }] = await Promise.all([
      supabase.from('whatsapp_campaign_messages').select('*').order('sent_at', { ascending: false }).limit(500),
      supabase.from('whatsapp_campaigns').select('id, title').order('created_at', { ascending: false }),
    ]);
    setMessages(m || []);
    setCampaigns(c || []);
    setLoading(false);
  };

  const filtered = selectedCampaign === 'all' ? messages : messages.filter(m => m.campaign_id === selectedCampaign);

  const stats = {
    total: filtered.length,
    sent: filtered.filter(m => m.status === 'sent' || m.status === 'delivered').length,
    failed: filtered.filter(m => m.status === 'failed').length,
    replied: filtered.filter(m => m.status === 'replied').length,
    pending: filtered.filter(m => m.status === 'pending').length,
  };

  const exportCsv = () => {
    const header = 'phone,status,sent_at,response_at,error_message\n';
    const rows = filtered.map(m => `${m.phone},${m.status},${m.sent_at || ''},${m.response_at || ''},${m.error_message || ''}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campaign-results-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
          <SelectTrigger className="w-64"><SelectValue placeholder="Filtrar campanha" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as campanhas</SelectItem>
            {campaigns.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={filtered.length === 0}>
          <Download className="h-4 w-4 mr-1" />Exportar CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center">
          <Send className="h-5 w-5 mx-auto mb-1 text-blue-400" />
          <p className="text-2xl font-bold">{stats.sent}</p>
          <p className="text-xs text-muted-foreground">Enviados</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <XCircle className="h-5 w-5 mx-auto mb-1 text-red-400" />
          <p className="text-2xl font-bold">{stats.failed}</p>
          <p className="text-xs text-muted-foreground">Falhados</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <MessageSquare className="h-5 w-5 mx-auto mb-1 text-purple-400" />
          <p className="text-2xl font-bold">{stats.replied}</p>
          <p className="text-xs text-muted-foreground">Respondidos</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <CheckCircle className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Telefone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Enviado em</TableHead>
                <TableHead>Resposta em</TableHead>
                <TableHead>Erro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhuma mensagem encontrada.</TableCell></TableRow>
              ) : filtered.map(m => (
                <TableRow key={m.id}>
                  <TableCell className="font-mono text-sm">{m.phone}</TableCell>
                  <TableCell><Badge className={MSG_STATUS_COLORS[m.status] || ''} variant="outline">{m.status}</Badge></TableCell>
                  <TableCell className="text-sm">{m.sent_at ? new Date(m.sent_at).toLocaleString('pt') : '—'}</TableCell>
                  <TableCell className="text-sm">{m.response_at ? new Date(m.response_at).toLocaleString('pt') : '—'}</TableCell>
                  <TableCell className="text-sm text-destructive">{m.error_message || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
