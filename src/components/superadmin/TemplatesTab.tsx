import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Save, Loader2, Wand2, Plus, Trash2 } from 'lucide-react';
import { getBusinessConfig } from '@/lib/businessConfig';

interface TemplateService {
  name: string;
  price: number;
  duration: number;
  requires_deposit?: boolean;
  deposit_amount?: number;
}

interface BusinessTemplate {
  id: string;
  business_type: string;
  locale: string;
  template_services: TemplateService[];
  is_enabled: boolean;
}

export function TemplatesTab() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<BusinessTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => { fetchTemplates(); }, []);

  const fetchTemplates = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('business_templates' as any)
      .select('*')
      .order('business_type');
    if (!error && data) {
      setTemplates((data as any[]).map(t => ({
        ...t,
        template_services: t.template_services || [],
      })));
    }
    setIsLoading(false);
  };

  const handleSave = async (template: BusinessTemplate) => {
    setSavingId(template.id);
    const { error } = await supabase
      .from('business_templates' as any)
      .update({
        template_services: template.template_services as any,
        is_enabled: template.is_enabled,
      } as any)
      .eq('id', template.id);

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Salvo', description: `Template ${template.business_type} atualizado.` });
    }
    setSavingId(null);
  };

  const updateService = (templateId: string, serviceIndex: number, field: keyof TemplateService, value: any) => {
    setTemplates(prev => prev.map(t => {
      if (t.id !== templateId) return t;
      const services = [...t.template_services];
      (services[serviceIndex] as any)[field] = value;
      return { ...t, template_services: services };
    }));
  };

  const addService = (templateId: string) => {
    setTemplates(prev => prev.map(t => {
      if (t.id !== templateId) return t;
      return { ...t, template_services: [...t.template_services, { name: '', price: 0, duration: 30 }] };
    }));
  };

  const removeService = (templateId: string, index: number) => {
    setTemplates(prev => prev.map(t => {
      if (t.id !== templateId) return t;
      const services = t.template_services.filter((_, i) => i !== index);
      return { ...t, template_services: services };
    }));
  };

  const toggleEnabled = (templateId: string, enabled: boolean) => {
    setTemplates(prev => prev.map(t => t.id === templateId ? { ...t, is_enabled: enabled } : t));
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      {templates.map(template => (
        <Card key={template.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Wand2 className="w-4 h-4 text-primary" />
                {getBusinessConfig(template.business_type).label}
                <Badge variant="outline" className="ml-2 text-xs">{template.locale}</Badge>
              </CardTitle>
              <div className="flex items-center gap-3">
                <Switch
                  checked={template.is_enabled}
                  onCheckedChange={(v) => toggleEnabled(template.id, v)}
                />
                <Button
                  size="sm"
                  onClick={() => handleSave(template)}
                  disabled={savingId === template.id}
                >
                  {savingId === template.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                  Salvar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {template.template_services.map((svc, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg border border-border/50 bg-secondary/10">
                <Input
                  value={svc.name}
                  placeholder="Nome do serviço"
                  onChange={(e) => updateService(template.id, i, 'name', e.target.value)}
                  className="flex-1 h-8 text-sm"
                />
                <Input
                  type="number"
                  value={svc.price}
                  onChange={(e) => updateService(template.id, i, 'price', Number(e.target.value))}
                  className="w-24 h-8 text-sm"
                  placeholder="Preço"
                />
                <Input
                  type="number"
                  value={svc.duration}
                  onChange={(e) => updateService(template.id, i, 'duration', Number(e.target.value))}
                  className="w-20 h-8 text-sm"
                  placeholder="Min"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeService(template.id, i)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={() => addService(template.id)}>
              <Plus className="w-3 h-3 mr-1" /> Adicionar serviço
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
