import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DEFAULT_LANDING_SETTINGS, type LandingSettings, type Plan } from '@/lib/landingSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Save, RotateCcw, Loader2, ExternalLink } from 'lucide-react';

const CURRENCIES = ['MZN', 'USD', 'ZAR', 'AOA', 'MWK', 'ZMW', 'TZS'];

export function LandingSettingsTab() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<LandingSettings>(DEFAULT_LANDING_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('landing_settings')
      .select('*')
      .eq('site_key', 'agenda-smart')
      .single();

    if (!error && data) {
      setSettings({
        ...data,
        plans: (data.plans as unknown as Plan[]) || DEFAULT_LANDING_SETTINGS.plans,
      } as LandingSettings);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    // Validations
    if (settings.vsl_minutes_label < 1 || settings.vsl_minutes_label > 60) {
      toast({ title: 'Erro', description: 'Minutos VSL deve ser entre 1 e 60.', variant: 'destructive' });
      return;
    }
    if (settings.vsl_embed_url && !/(youtube|youtu\.be|vimeo|\/embed\/)/i.test(settings.vsl_embed_url)) {
      toast({ title: 'Erro', description: 'URL do vídeo deve ser do YouTube, Vimeo ou embed.', variant: 'destructive' });
      return;
    }
    for (const plan of settings.plans) {
      if (plan.monthly_price < 0 || plan.yearly_price < 0) {
        toast({ title: 'Erro', description: `Preços do plano "${plan.name}" devem ser >= 0.`, variant: 'destructive' });
        return;
      }
    }
    // Validate phone numbers
    const validatePhone = (phone: string | null, label: string) => {
      if (!phone) return true;
      const digits = phone.replace(/\D/g, '');
      if (digits.length < 9 || digits.length > 15) {
        toast({ title: 'Erro', description: `${label}: número deve ter 9-15 dígitos.`, variant: 'destructive' });
        return false;
      }
      return true;
    };
    if (!validatePhone(settings.wa_sales_phone, 'WhatsApp Vendas')) return;
    if (!validatePhone(settings.wa_support_phone, 'WhatsApp Suporte')) return;

    // Clean phone numbers
    const cleanPhone = (phone: string | null) => phone ? phone.replace(/[^0-9]/g, '') || null : null;

    setIsSaving(true);
    const { error } = await supabase
      .from('landing_settings')
      .update({
        ...settings,
        wa_sales_phone: cleanPhone(settings.wa_sales_phone),
        wa_support_phone: cleanPhone(settings.wa_support_phone),
        updated_at: new Date().toISOString(),
      } as any)
      .eq('site_key', 'agenda-smart');

    if (error) {
      toast({ title: 'Erro', description: 'Falha ao salvar configurações.', variant: 'destructive' });
    } else {
      toast({ title: 'Salvo', description: 'Configurações da landing atualizadas.' });
    }
    setIsSaving(false);
  };

  const handleRestore = () => {
    setSettings({ ...DEFAULT_LANDING_SETTINGS, id: settings.id });
    toast({ title: 'Restaurado', description: 'Valores padrão restaurados. Clique Salvar para aplicar.' });
  };

  const updatePlan = (index: number, field: keyof Plan, value: any) => {
    const newPlans = [...settings.plans];
    (newPlans[index] as any)[field] = value;
    setSettings({ ...settings, plans: newPlans });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Action buttons */}
      <div className="flex items-center gap-3 justify-end">
        <Button variant="outline" size="sm" onClick={handleRestore}>
          <RotateCcw className="w-4 h-4 mr-2" /> Restaurar padrão
        </Button>
        <Button size="sm" onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Salvar
        </Button>
      </div>

      {/* Toggles */}
      <Card>
        <CardHeader><CardTitle className="text-base">Seções</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Ativar VSL (Vídeo)</Label>
            <Switch checked={settings.vsl_enabled} onCheckedChange={(v) => setSettings({ ...settings, vsl_enabled: v })} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Ativar Preços</Label>
            <Switch checked={settings.pricing_enabled} onCheckedChange={(v) => setSettings({ ...settings, pricing_enabled: v })} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Botão "Entrar" (secundário)</Label>
            <Switch checked={settings.secondary_cta_enabled} onCheckedChange={(v) => setSettings({ ...settings, secondary_cta_enabled: v })} />
          </div>
        </CardContent>
      </Card>

      {/* VSL */}
      <Card>
        <CardHeader><CardTitle className="text-base">VSL / Demonstração</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Título</Label>
            <Input value={settings.vsl_title} onChange={(e) => setSettings({ ...settings, vsl_title: e.target.value })} />
          </div>
          <div>
            <Label>Subtítulo</Label>
            <Input value={settings.vsl_subtitle} onChange={(e) => setSettings({ ...settings, vsl_subtitle: e.target.value })} />
          </div>
          <div>
            <Label>Minutos</Label>
            <Input type="number" min={1} max={60} value={settings.vsl_minutes_label} onChange={(e) => setSettings({ ...settings, vsl_minutes_label: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Embed URL (YouTube/Vimeo)</Label>
            <Input value={settings.vsl_embed_url || ''} placeholder="https://www.youtube.com/embed/..." onChange={(e) => setSettings({ ...settings, vsl_embed_url: e.target.value || null })} />
          </div>
          <div>
            <Label>URL da capa (opcional)</Label>
            <Input value={settings.vsl_cover_image_url || ''} placeholder="https://..." onChange={(e) => setSettings({ ...settings, vsl_cover_image_url: e.target.value || null })} />
          </div>
        </CardContent>
      </Card>

      {/* Pricing header */}
      <Card>
        <CardHeader><CardTitle className="text-base">Preços — Cabeçalho</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Título</Label>
            <Input value={settings.pricing_title} onChange={(e) => setSettings({ ...settings, pricing_title: e.target.value })} />
          </div>
          <div>
            <Label>Subtítulo</Label>
            <Input value={settings.pricing_subtitle} onChange={(e) => setSettings({ ...settings, pricing_subtitle: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Moeda</Label>
              <Select value={settings.currency_code} onValueChange={(v) => setSettings({ ...settings, currency_code: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Label desconto anual</Label>
              <Input value={settings.pricing_discount_label} onChange={(e) => setSettings({ ...settings, pricing_discount_label: e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plans */}
      {settings.plans.map((plan, i) => (
        <Card key={plan.key}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Plano: {plan.name}</CardTitle>
              <Switch checked={plan.enabled} onCheckedChange={(v) => updatePlan(i, 'enabled', v)} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome</Label>
                <Input value={plan.name} onChange={(e) => updatePlan(i, 'name', e.target.value)} />
              </div>
              <div>
                <Label>Tagline</Label>
                <Input value={plan.tagline} onChange={(e) => updatePlan(i, 'tagline', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Badge</Label>
                <Input value={plan.badge || ''} placeholder="Ex: Popular" onChange={(e) => updatePlan(i, 'badge', e.target.value || null)} />
              </div>
              <div>
                <Label>Preço mensal</Label>
                <Input type="number" min={0} value={plan.monthly_price} onChange={(e) => updatePlan(i, 'monthly_price', Number(e.target.value))} />
              </div>
              <div>
                <Label>Preço anual</Label>
                <Input type="number" min={0} value={plan.yearly_price} onChange={(e) => updatePlan(i, 'yearly_price', Number(e.target.value))} />
              </div>
            </div>
            <div>
              <Label>Features (1 por linha)</Label>
              <Textarea
                value={plan.features.join('\n')}
                rows={4}
                onChange={(e) => updatePlan(i, 'features', e.target.value.split('\n').filter(Boolean))}
              />
            </div>
            <div>
              <Label>CTA Label</Label>
              <Input value={plan.cta_label} onChange={(e) => updatePlan(i, 'cta_label', e.target.value)} />
            </div>
          </CardContent>
        </Card>
      ))}

      {/* WhatsApp Sales */}
      <Card>
        <CardHeader><CardTitle className="text-base">WhatsApp — Vendas / Setup</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Ativar CTA WhatsApp no Hero</Label>
            <Switch checked={settings.wa_sales_enabled} onCheckedChange={(v) => setSettings({ ...settings, wa_sales_enabled: v })} />
          </div>
          <div>
            <Label>Número do WhatsApp (somente dígitos)</Label>
            <Input value={settings.wa_sales_phone || ''} placeholder="258841234567" onChange={(e) => setSettings({ ...settings, wa_sales_phone: e.target.value || null })} />
          </div>
          <div>
            <Label>Texto do botão (CTA)</Label>
            <Input value={settings.wa_sales_cta_label} onChange={(e) => setSettings({ ...settings, wa_sales_cta_label: e.target.value })} />
          </div>
          <div>
            <Label>Mensagem padrão</Label>
            <Textarea value={settings.wa_sales_message_template} rows={3} onChange={(e) => setSettings({ ...settings, wa_sales_message_template: e.target.value })} />
          </div>
          {settings.wa_sales_phone && (
            <Button variant="outline" size="sm" onClick={() => {
              const digits = settings.wa_sales_phone!.replace(/\D/g, '');
              const phone = digits.length === 9 ? '258' + digits : digits;
              window.open(`https://wa.me/${phone}?text=${encodeURIComponent(settings.wa_sales_message_template)}`, '_blank');
            }}>
              <ExternalLink className="w-4 h-4 mr-2" /> Testar link
            </Button>
          )}
        </CardContent>
      </Card>

      {/* WhatsApp Support */}
      <Card>
        <CardHeader><CardTitle className="text-base">WhatsApp — Suporte Flutuante</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Ativar botão flutuante</Label>
            <Switch checked={settings.wa_support_enabled} onCheckedChange={(v) => setSettings({ ...settings, wa_support_enabled: v })} />
          </div>
          <div>
            <Label>Número do suporte (vazio = usa o de vendas)</Label>
            <Input value={settings.wa_support_phone || ''} placeholder="258841234567" onChange={(e) => setSettings({ ...settings, wa_support_phone: e.target.value || null })} />
          </div>
          <div>
            <Label>Tooltip</Label>
            <Input value={settings.wa_support_tooltip} onChange={(e) => setSettings({ ...settings, wa_support_tooltip: e.target.value })} />
          </div>
          <div>
            <Label>Mensagem do suporte</Label>
            <Textarea value={settings.wa_support_message} rows={2} onChange={(e) => setSettings({ ...settings, wa_support_message: e.target.value })} />
          </div>
          {(settings.wa_support_phone || settings.wa_sales_phone) && (
            <Button variant="outline" size="sm" onClick={() => {
              const raw = settings.wa_support_phone || settings.wa_sales_phone || '';
              const digits = raw.replace(/\D/g, '');
              const phone = digits.length === 9 ? '258' + digits : digits;
              window.open(`https://wa.me/${phone}?text=${encodeURIComponent(settings.wa_support_message)}`, '_blank');
            }}>
              <ExternalLink className="w-4 h-4 mr-2" /> Testar link
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
