import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Logo } from '@/components/Logo';
import { Card, CardContent } from '@/components/ui/card';
import GeneralSettingsTab from './settings/GeneralSettingsTab';
import LocationSettingsTab from './settings/LocationSettingsTab';
import AppearanceSettingsTab from './settings/AppearanceSettingsTab';

interface BarbershopSettings {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  whatsapp_number: string | null;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;
  opening_time: string | null;
  closing_time: string | null;
  business_type: string;
  background_image_url: string | null;
  background_overlay_level: 'low' | 'medium' | 'high';
  mpesa_number: string | null;
  emola_number: string | null;
  payment_methods_enabled: string[];
  payment_required: boolean;
  prep_buffer_minutes: number;
  cleanup_buffer_minutes: number;
  slot_interval_minutes: number;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  cover_image_url: string | null;
  city: string | null;
  neighborhood: string | null;
  location_name: string | null;
  gallery_images: string[];
  video_url: string | null;
}

const getBusinessLabels = (type: string) => {
  switch (type) {
    case 'salao':
      return { businessName: 'Nome do Salão', businessLabel: 'Salão de Beleza', slugPlaceholder: 'meu-salao' };
    case 'salao_barbearia':
      return { businessName: 'Nome do Estabelecimento', businessLabel: 'Salão & Barbearia', slugPlaceholder: 'meu-estabelecimento' };
    default:
      return { businessName: 'Nome da Barbearia', businessLabel: 'Barbearia', slugPlaceholder: 'minha-barbearia' };
  }
};

export default function SettingsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [settings, setSettings] = useState<BarbershopSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) fetchSettings();
  }, [user]);

  const fetchSettings = async () => {
    setIsLoading(true);
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('barbershop_id')
      .eq('user_id', user?.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData?.barbershop_id) { setIsLoading(false); return; }

    const { data, error } = await supabase
      .from('barbershops')
      .select('*')
      .eq('id', roleData.barbershop_id)
      .maybeSingle();

    if (data && !error) {
      setSettings({
        ...data,
        gallery_images: data.gallery_images || [],
        background_overlay_level: (data.background_overlay_level || 'medium') as 'low' | 'medium' | 'high',
        payment_methods_enabled: data.payment_methods_enabled || [],
      } as BarbershopSettings);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    const { error } = await supabase
      .from('barbershops')
      .update({
        name: settings.name,
        slug: settings.slug,
        logo_url: settings.logo_url,
        whatsapp_number: settings.whatsapp_number,
        primary_color: settings.primary_color,
        secondary_color: settings.secondary_color,
        background_color: settings.background_color,
        text_color: settings.text_color,
        opening_time: settings.opening_time,
        closing_time: settings.closing_time,
        background_image_url: settings.background_image_url,
        background_overlay_level: settings.background_overlay_level,
        mpesa_number: settings.mpesa_number,
        emola_number: settings.emola_number,
        payment_methods_enabled: settings.payment_methods_enabled,
        payment_required: settings.payment_required,
        prep_buffer_minutes: settings.prep_buffer_minutes,
        cleanup_buffer_minutes: settings.cleanup_buffer_minutes,
        slot_interval_minutes: settings.slot_interval_minutes,
        address: settings.address,
        latitude: settings.latitude,
        longitude: settings.longitude,
        cover_image_url: settings.cover_image_url,
        city: settings.city,
        neighborhood: settings.neighborhood,
        location_name: settings.location_name,
        gallery_images: settings.gallery_images,
        video_url: settings.video_url,
      })
      .eq('id', settings.id);

    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível salvar.', variant: 'destructive' });
    } else {
      toast({ title: 'Sucesso', description: 'Configurações salvas com sucesso.' });
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pb-safe space-y-6">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Configurações</h1>
        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pb-safe space-y-6">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Configurações</h1>
        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-6 sm:p-8 text-center">
            <p className="text-muted-foreground text-sm sm:text-base">Configure seu negócio para começar.</p>
            <Button className="mt-4 w-full sm:w-auto" onClick={() => window.location.href = '/register'}>Criar Negócio</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const labels = getBusinessLabels(settings.business_type);

  return (
    <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pb-safe space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Configurações</h1>
        <Button variant="gold" onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="w-full grid grid-cols-3 bg-muted/50 rounded-xl p-1">
          <TabsTrigger value="general" className="rounded-lg text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:shadow-sm">
            Informações Gerais
          </TabsTrigger>
          <TabsTrigger value="location" className="rounded-lg text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:shadow-sm">
            Localização
          </TabsTrigger>
          <TabsTrigger value="appearance" className="rounded-lg text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:shadow-sm">
            Aparência
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <GeneralSettingsTab settings={settings} setSettings={setSettings} labels={labels} />
        </TabsContent>

        <TabsContent value="location" className="mt-6">
          <LocationSettingsTab settings={settings} setSettings={setSettings} />
        </TabsContent>

        <TabsContent value="appearance" className="mt-6">
          <AppearanceSettingsTab settings={settings} setSettings={setSettings} />
        </TabsContent>
      </Tabs>

      {/* Fixed Save Button for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t border-border sm:hidden pb-safe">
        <Button variant="gold" onClick={handleSave} disabled={isSaving} className="w-full">
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>
    </div>
  );
}
