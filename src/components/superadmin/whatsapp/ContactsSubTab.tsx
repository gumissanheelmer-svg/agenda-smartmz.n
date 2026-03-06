import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, Upload, Search, Edit2, Trash2 } from 'lucide-react';

interface Contact {
  id: string;
  name: string | null;
  phone: string;
  country_code: string | null;
  niche: string | null;
  source: string | null;
  language: string;
  opt_in: boolean;
  last_inbound_at: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

const STATUS_OPTIONS = ['new', 'contacted', 'replied', 'interested', 'converted', 'do_not_contact'];
const SOURCE_OPTIONS = ['instagram', 'google_maps', 'referral', 'tiktok', 'website', 'other'];
const LANGUAGE_OPTIONS = [{ value: 'pt', label: 'Português' }, { value: 'en', label: 'English' }];

const statusColors: Record<string, string> = {
  new: 'bg-blue-500/20 text-blue-400',
  contacted: 'bg-yellow-500/20 text-yellow-400',
  replied: 'bg-emerald-500/20 text-emerald-400',
  interested: 'bg-purple-500/20 text-purple-400',
  converted: 'bg-green-500/20 text-green-400',
  do_not_contact: 'bg-red-500/20 text-red-400',
};

export function ContactsSubTab() {
  const { toast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [filterLanguage, setFilterLanguage] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);

  const [form, setForm] = useState({
    name: '', phone: '', country_code: '', niche: '', source: '',
    language: 'pt', opt_in: false, notes: '', status: 'new',
  });

  useEffect(() => { fetchContacts(); }, []);

  const fetchContacts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('whatsapp_contacts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Erro', description: 'Falha ao carregar contatos.', variant: 'destructive' });
    } else {
      setContacts(data || []);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.phone.trim()) {
      toast({ title: 'Erro', description: 'Telefone é obrigatório.', variant: 'destructive' });
      return;
    }
    const payload = {
      name: form.name || null,
      phone: form.phone.trim(),
      country_code: form.country_code || null,
      niche: form.niche || null,
      source: form.source || null,
      language: form.language,
      opt_in: form.opt_in,
      notes: form.notes || null,
      status: form.status,
    };

    if (editingContact) {
      const { error } = await supabase.from('whatsapp_contacts').update(payload).eq('id', editingContact.id);
      if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'Sucesso', description: 'Contato atualizado.' });
    } else {
      const { error } = await supabase.from('whatsapp_contacts').insert([payload]);
      if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'Sucesso', description: 'Contato adicionado.' });
    }
    resetForm();
    setDialogOpen(false);
    fetchContacts();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('whatsapp_contacts').delete().eq('id', id);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Sucesso', description: 'Contato removido.' });
    fetchContacts();
  };

  const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length < 2) {
      toast({ title: 'Erro', description: 'CSV deve ter cabeçalho e pelo menos 1 linha.', variant: 'destructive' });
      return;
    }
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const phoneIdx = headers.indexOf('phone');
    const nameIdx = headers.indexOf('name');
    const countryIdx = headers.indexOf('country_code');
    const nicheIdx = headers.indexOf('niche');
    const sourceIdx = headers.indexOf('source');
    const langIdx = headers.indexOf('language');

    if (phoneIdx === -1) {
      toast({ title: 'Erro', description: 'CSV deve conter coluna "phone".', variant: 'destructive' });
      return;
    }

    const rows = lines.slice(1).map(line => {
      const cols = line.split(',').map(c => c.trim());
      return {
        phone: cols[phoneIdx],
        name: nameIdx >= 0 ? cols[nameIdx] || null : null,
        country_code: countryIdx >= 0 ? cols[countryIdx] || null : null,
        niche: nicheIdx >= 0 ? cols[nicheIdx] || null : null,
        source: sourceIdx >= 0 ? cols[sourceIdx] || null : null,
        language: langIdx >= 0 ? cols[langIdx] || 'pt' : 'pt',
        opt_in: false,
        status: 'new' as const,
      };
    }).filter(r => r.phone);

    const { error } = await supabase.from('whatsapp_contacts').upsert(rows, { onConflict: 'phone', ignoreDuplicates: true });
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Sucesso', description: `${rows.length} contatos importados.` });
    setCsvDialogOpen(false);
    fetchContacts();
  };

  const resetForm = () => {
    setForm({ name: '', phone: '', country_code: '', niche: '', source: '', language: 'pt', opt_in: false, notes: '', status: 'new' });
    setEditingContact(null);
  };

  const openEdit = (c: Contact) => {
    setEditingContact(c);
    setForm({
      name: c.name || '', phone: c.phone, country_code: c.country_code || '',
      niche: c.niche || '', source: c.source || '', language: c.language,
      opt_in: c.opt_in, notes: c.notes || '', status: c.status,
    });
    setDialogOpen(true);
  };

  const toggleOptIn = async (c: Contact) => {
    await supabase.from('whatsapp_contacts').update({ opt_in: !c.opt_in }).eq('id', c.id);
    fetchContacts();
  };

  const filtered = contacts.filter(c => {
    if (search && !c.name?.toLowerCase().includes(search.toLowerCase()) && !c.phone.includes(search)) return false;
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (filterSource !== 'all' && c.source !== filterSource) return false;
    if (filterLanguage !== 'all' && c.language !== filterLanguage) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2 items-center flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-56" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterSource} onValueChange={setFilterSource}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Origem" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {SOURCE_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterLanguage} onValueChange={setFilterLanguage}>
            <SelectTrigger className="w-32"><SelectValue placeholder="Idioma" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {LANGUAGE_OPTIONS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Dialog open={csvDialogOpen} onOpenChange={setCsvDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><Upload className="h-4 w-4 mr-1" />CSV</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Importar CSV</DialogTitle></DialogHeader>
              <p className="text-sm text-muted-foreground">CSV com colunas: phone (obrigatório), name, country_code, niche, source, language</p>
              <Input type="file" accept=".csv" onChange={handleCsvImport} />
            </DialogContent>
          </Dialog>
          <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" />Adicionar</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>{editingContact ? 'Editar Contato' : 'Novo Contato'}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Telefone *</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+258841234567" /></div>
                <div><Label>Nome</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>País</Label><Input value={form.country_code} onChange={e => setForm(f => ({ ...f, country_code: e.target.value }))} placeholder="MZ" /></div>
                  <div><Label>Idioma</Label>
                    <Select value={form.language} onValueChange={v => setForm(f => ({ ...f, language: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{LANGUAGE_OPTIONS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Nicho</Label><Input value={form.niche} onChange={e => setForm(f => ({ ...f, niche: e.target.value }))} placeholder="barbearia" /></div>
                  <div><Label>Origem</Label>
                    <Select value={form.source || 'none'} onValueChange={v => setForm(f => ({ ...f, source: v === 'none' ? '' : v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">—</SelectItem>
                        {SOURCE_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Notas</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.opt_in} onCheckedChange={v => setForm(f => ({ ...f, opt_in: v }))} />
                  <Label>Opt-in (consentiu receber mensagens)</Label>
                </div>
                <Button onClick={handleSave} className="w-full">{editingContact ? 'Atualizar' : 'Salvar'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Opt-in</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Idioma</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum contato encontrado.</TableCell></TableRow>
              ) : filtered.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name || '—'}</TableCell>
                  <TableCell className="font-mono text-sm">{c.phone}</TableCell>
                  <TableCell>
                    <Switch checked={c.opt_in} onCheckedChange={() => toggleOptIn(c)} />
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColors[c.status] || ''}>{c.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{c.source || '—'}</TableCell>
                  <TableCell className="text-sm">{c.language === 'pt' ? 'PT' : 'EN'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Edit2 className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">{filtered.length} contato(s)</p>
    </div>
  );
}
