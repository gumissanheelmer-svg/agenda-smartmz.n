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
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit2, Trash2, Eye } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  language: string;
  category: string;
  body: string;
  is_approved: boolean;
  active: boolean;
  created_at: string;
}

const CATEGORIES = [
  { value: 'marketing', label: 'Marketing' },
  { value: 'utility', label: 'Utilidade' },
  { value: 'followup', label: 'Follow-up' },
];

export function TemplatesSubTab() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewBody, setPreviewBody] = useState('');
  const [editing, setEditing] = useState<Template | null>(null);
  const [form, setForm] = useState({ name: '', language: 'pt', category: 'marketing', body: '', is_approved: false });

  useEffect(() => { fetchTemplates(); }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('whatsapp_templates').select('*').order('created_at', { ascending: false });
    if (!error) setTemplates(data || []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.body.trim()) {
      toast({ title: 'Erro', description: 'Nome e corpo são obrigatórios.', variant: 'destructive' });
      return;
    }
    const payload = { name: form.name.trim(), language: form.language, category: form.category, body: form.body.trim(), is_approved: form.is_approved };
    if (editing) {
      const { error } = await supabase.from('whatsapp_templates').update(payload).eq('id', editing.id);
      if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    } else {
      const { error } = await supabase.from('whatsapp_templates').insert([payload]);
      if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    }
    toast({ title: 'Sucesso', description: editing ? 'Template atualizado.' : 'Template criado.' });
    resetForm();
    setDialogOpen(false);
    fetchTemplates();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('whatsapp_templates').delete().eq('id', id);
    fetchTemplates();
  };

  const toggleActive = async (t: Template) => {
    await supabase.from('whatsapp_templates').update({ active: !t.active }).eq('id', t.id);
    fetchTemplates();
  };

  const resetForm = () => {
    setForm({ name: '', language: 'pt', category: 'marketing', body: '', is_approved: false });
    setEditing(null);
  };

  const openEdit = (t: Template) => {
    setEditing(t);
    setForm({ name: t.name, language: t.language, category: t.category, body: t.body, is_approved: t.is_approved });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{templates.length} template(s)</p>
        <Dialog open={dialogOpen} onOpenChange={v => { setDialogOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Novo Template</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editing ? 'Editar Template' : 'Novo Template'}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nome *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="primeiro_contato_pt" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Idioma</Label>
                  <Select value={form.language} onValueChange={v => setForm(f => ({ ...f, language: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt">Português</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Categoria</Label>
                  <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Corpo da mensagem *</Label>
                <Textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={6} placeholder="Olá {{name}}! Temos uma proposta..." />
                <p className="text-xs text-muted-foreground mt-1">Use {'{{name}}'}, {'{{business}}'} como variáveis.</p>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_approved} onCheckedChange={v => setForm(f => ({ ...f, is_approved: v }))} />
                <Label>Aprovado para envio</Label>
              </div>
              <Button onClick={handleSave} className="w-full">{editing ? 'Atualizar' : 'Criar'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {loading ? <p className="text-muted-foreground col-span-2 text-center py-8">Carregando...</p> :
          templates.length === 0 ? <p className="text-muted-foreground col-span-2 text-center py-8">Nenhum template criado.</p> :
          templates.map(t => (
            <Card key={t.id} className={!t.active ? 'opacity-50' : ''}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base">{t.name}</CardTitle>
                  <div className="flex gap-1">
                    {t.is_approved && <Badge className="bg-green-500/20 text-green-400">Aprovado</Badge>}
                    <Badge variant="outline">{t.language.toUpperCase()}</Badge>
                    <Badge variant="secondary">{t.category}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{t.body}</p>
                <div className="flex gap-1 justify-end">
                  <Button variant="ghost" size="icon" onClick={() => { setPreviewBody(t.body); setPreviewOpen(true); }}><Eye className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(t)}><Edit2 className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => toggleActive(t)}>
                    <span className="text-xs">{t.active ? 'Off' : 'On'}</span>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))
        }
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Preview da Mensagem</DialogTitle></DialogHeader>
          <div className="bg-muted rounded-lg p-4 whitespace-pre-wrap text-sm">{previewBody}</div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
