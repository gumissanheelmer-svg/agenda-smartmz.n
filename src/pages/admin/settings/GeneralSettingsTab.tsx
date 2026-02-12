import { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Settings as SettingsIcon, MessageCircle, Upload, Trash2, ImageIcon,
  CreditCard, Smartphone, AlertCircle
} from 'lucide-react';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024;

interface GeneralSettingsTabProps {
  settings: any;
  setSettings: (s: any) => void;
  labels: { businessName: string; slugPlaceholder: string };
}

export default function GeneralSettingsTab({ settings, setSettings, labels }: GeneralSettingsTabProps) {
  const { toast } = useToast();
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) return 'No iPhone, envie JPG/PNG (HEIC não é suportado).';
    if (file.size > MAX_SIZE) return 'O tamanho máximo permitido é 5MB.';
    return null;
  };

  const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !settings) return;

    const error = validateFile(file);
    if (error) {
      toast({ title: 'Formato inválido', description: error, variant: 'destructive' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setIsUploadingLogo(true);
    try {
      if (settings.logo_url) {
        const oldPath = settings.logo_url.split('/logos/')[1];
        if (oldPath) await supabase.storage.from('logos').remove([oldPath]);
      }
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${settings.id}/logo.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('logos').upload(fileName, file, { upsert: true, contentType: file.type });
      if (uploadError) {
        toast({ title: 'Erro no upload', description: uploadError.message, variant: 'destructive' });
        setLogoPreview(null);
        return;
      }
      const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(fileName);
      setSettings({ ...settings, logo_url: publicUrl });
      setLogoPreview(null);
      toast({ title: 'Logo carregado', description: 'Clique em Salvar para aplicar.' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err?.message, variant: 'destructive' });
      setLogoPreview(null);
    } finally {
      setIsUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = async () => {
    if (!settings?.logo_url) return;
    const path = settings.logo_url.split('/logos/')[1];
    if (path) await supabase.storage.from('logos').remove([path]);
    setSettings({ ...settings, logo_url: null });
    setLogoPreview(null);
    toast({ title: 'Logo removido', description: 'Clique em Salvar para aplicar.' });
  };

  return (
    <div className="grid gap-6">
      {/* Business Info */}
      <Card className="border-border/50 bg-card/80">
        <CardHeader className="pb-4">
          <CardTitle className="font-display flex items-center gap-2 text-lg sm:text-xl">
            <SettingsIcon className="w-5 h-5 text-primary" />
            Informações do Negócio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="business_name" className="text-sm sm:text-base">{labels.businessName}</Label>
              <Input
                id="business_name"
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                className="bg-input border-border w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug" className="text-sm sm:text-base">URL (slug)</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs sm:text-sm">/b/</span>
                <Input
                  id="slug"
                  value={settings.slug}
                  onChange={(e) => setSettings({ ...settings, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  className="bg-input border-border flex-1"
                  placeholder={labels.slugPlaceholder}
                />
              </div>
            </div>
          </div>

          {/* Logo Upload */}
          <div className="space-y-3 pt-2 border-t border-border/50">
            <Label className="text-sm sm:text-base font-medium">Logotipo</Label>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg overflow-hidden border border-border bg-muted flex-shrink-0">
                {(logoPreview || settings.logo_url) ? (
                  <img src={logoPreview || settings.logo_url || ''} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <ImageIcon className="w-8 h-8 opacity-50" />
                    <p className="text-xs mt-1">Sem logo</p>
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-3 w-full">
                <div className="flex flex-wrap gap-2">
                  <input ref={logoInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleLogoSelect} className="hidden" />
                  <Button type="button" variant="outline" size="sm" onClick={() => logoInputRef.current?.click()} disabled={isUploadingLogo} className="flex-1 sm:flex-none">
                    <Upload className="w-4 h-4 mr-2" />
                    {isUploadingLogo ? 'Enviando...' : 'Carregar Logo'}
                  </Button>
                  {settings.logo_url && (
                    <Button type="button" variant="destructive" size="sm" onClick={handleRemoveLogo} className="flex-1 sm:flex-none">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remover
                    </Button>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="logo_url" className="text-xs text-muted-foreground">Ou insira uma URL (opcional)</Label>
                  <Input id="logo_url" value={settings.logo_url || ''} onChange={(e) => setSettings({ ...settings, logo_url: e.target.value || null })} className="bg-input border-border text-sm" placeholder="https://exemplo.com/logo.png" />
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Formatos: JPG, PNG, WEBP. Tamanho máximo: 5MB.</p>
          </div>

          {/* Operating Hours */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
            <div className="space-y-2">
              <Label htmlFor="opening_time" className="text-sm sm:text-base">Abertura</Label>
              <Input id="opening_time" type="time" value={settings.opening_time || '09:00'} onChange={(e) => setSettings({ ...settings, opening_time: e.target.value })} className="bg-input border-border w-full" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="closing_time" className="text-sm sm:text-base">Fechamento</Label>
              <Input id="closing_time" type="time" value={settings.closing_time || '18:00'} onChange={(e) => setSettings({ ...settings, closing_time: e.target.value })} className="bg-input border-border w-full" />
            </div>
          </div>

          {/* Scheduling Config */}
          <div className="pt-4 border-t border-border/50 space-y-4">
            <h4 className="text-sm font-medium text-foreground">Configurações de Agendamento</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">Intervalo (min)</Label>
                <Select value={String(settings.slot_interval_minutes ?? 30)} onValueChange={(v) => setSettings({ ...settings, slot_interval_minutes: parseInt(v) })}>
                  <SelectTrigger className="bg-input border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[10, 15, 20, 30, 60].map(v => <SelectItem key={v} value={String(v)}>{v} min</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">Buffer Início</Label>
                <Select value={String(settings.prep_buffer_minutes ?? 0)} onValueChange={(v) => setSettings({ ...settings, prep_buffer_minutes: parseInt(v) })}>
                  <SelectTrigger className="bg-input border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[0, 10, 15, 20, 30].map(v => <SelectItem key={v} value={String(v)}>{v} min</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">Buffer Fim</Label>
                <Select value={String(settings.cleanup_buffer_minutes ?? 0)} onValueChange={(v) => setSettings({ ...settings, cleanup_buffer_minutes: parseInt(v) })}>
                  <SelectTrigger className="bg-input border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[0, 15, 30, 45, 60].map(v => <SelectItem key={v} value={String(v)}>{v} min</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              <strong>Intervalo:</strong> tempo entre horários disponíveis.<br />
              <strong>Buffer Início:</strong> margem após abertura.<br />
              <strong>Buffer Fim:</strong> margem antes de fechar.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* WhatsApp */}
      <Card className="border-border/50 bg-card/80">
        <CardHeader className="pb-4">
          <CardTitle className="font-display flex items-center gap-2 text-lg sm:text-xl">
            <MessageCircle className="w-5 h-5 text-primary" />
            WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="whatsapp" className="text-sm sm:text-base">Número do WhatsApp</Label>
            <Input id="whatsapp" value={settings.whatsapp_number || ''} onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })} placeholder="+258 84 000 0000" className="bg-input border-border w-full" />
            <p className="text-xs text-muted-foreground">Este número será usado para receber confirmações de agendamento.</p>
          </div>
        </CardContent>
      </Card>

      {/* Payments */}
      <Card className="border-border/50 bg-card/80">
        <CardHeader className="pb-4">
          <CardTitle className="font-display flex items-center gap-2 text-lg sm:text-xl">
            <CreditCard className="w-5 h-5 text-primary" />
            Pagamentos & Confirmação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-secondary/20">
            <div className="space-y-0.5">
              <Label htmlFor="payment_required" className="text-base font-medium cursor-pointer">Pagamento obrigatório para confirmar agendamento</Label>
              <p className="text-sm text-muted-foreground">Quando ativado, os clientes devem validar o código de transação.</p>
            </div>
            <Switch id="payment_required" checked={settings.payment_required || false} onCheckedChange={(checked) => setSettings({ ...settings, payment_required: checked })} />
          </div>

          {settings.payment_required && (
            <>
              <div className="space-y-3 p-4 rounded-lg border border-border/50 bg-secondary/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-red-500" />
                    <div><p className="font-medium">M-Pesa</p><p className="text-xs text-muted-foreground">Vodacom (84/85)</p></div>
                  </div>
                  <Checkbox checked={settings.payment_methods_enabled?.includes('mpesa') || false} onCheckedChange={(checked) => {
                    const methods = settings.payment_methods_enabled || [];
                    setSettings({ ...settings, payment_methods_enabled: checked ? [...methods, 'mpesa'] : methods.filter((m: string) => m !== 'mpesa') });
                  }} />
                </div>
                {settings.payment_methods_enabled?.includes('mpesa') && (
                  <div className="space-y-2 pt-2">
                    <Label className="text-sm">Número M-Pesa</Label>
                    <Input value={settings.mpesa_number || ''} onChange={(e) => setSettings({ ...settings, mpesa_number: e.target.value })} placeholder="84 XXX XXXX" className="bg-input border-border" />
                  </div>
                )}
              </div>

              <div className="space-y-3 p-4 rounded-lg border border-border/50 bg-secondary/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-orange-500" />
                    <div><p className="font-medium">eMola</p><p className="text-xs text-muted-foreground">Movitel (86/87)</p></div>
                  </div>
                  <Checkbox checked={settings.payment_methods_enabled?.includes('emola') || false} onCheckedChange={(checked) => {
                    const methods = settings.payment_methods_enabled || [];
                    setSettings({ ...settings, payment_methods_enabled: checked ? [...methods, 'emola'] : methods.filter((m: string) => m !== 'emola') });
                  }} />
                </div>
                {settings.payment_methods_enabled?.includes('emola') && (
                  <div className="space-y-2 pt-2">
                    <Label className="text-sm">Número eMola</Label>
                    <Input value={settings.emola_number || ''} onChange={(e) => setSettings({ ...settings, emola_number: e.target.value })} placeholder="86 XXX XXXX" className="bg-input border-border" />
                  </div>
                )}
              </div>

              {settings.payment_required && settings.payment_methods_enabled?.length === 0 && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                  <p className="text-sm text-destructive">Ative pelo menos um método de pagamento.</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
