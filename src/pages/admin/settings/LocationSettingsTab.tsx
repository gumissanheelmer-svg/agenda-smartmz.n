import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Navigation, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LocationSettingsTabProps {
  settings: any;
  setSettings: (s: any) => void;
}

export default function LocationSettingsTab({ settings, setSettings }: LocationSettingsTabProps) {
  const [showMapPicker, setShowMapPicker] = useState(false);

  const hasCoordinates = settings.latitude && settings.longitude;

  const handleMapClick = useCallback(() => {
    setShowMapPicker(true);
  }, []);

  // Listen for messages from embedded map (Google Maps click)
  const handleMapMessage = useCallback((e: MessageEvent) => {
    if (e.data?.type === 'map-click') {
      setSettings({
        ...settings,
        latitude: e.data.lat,
        longitude: e.data.lng,
      });
      setShowMapPicker(false);
    }
  }, [settings, setSettings]);

  // Build a simple map URL for display
  const mapPreviewUrl = hasCoordinates
    ? `https://maps.google.com/maps?q=${settings.latitude},${settings.longitude}&z=16&output=embed`
    : null;

  // Interactive map URL for picking location
  const mapPickerUrl = hasCoordinates
    ? `https://maps.google.com/maps?q=${settings.latitude},${settings.longitude}&z=16&output=embed`
    : `https://maps.google.com/maps?q=-25.9692,32.5732&z=12&output=embed`;

  return (
    <div className="grid gap-6">
      <Card className="border-border/50 bg-card/80">
        <CardHeader className="pb-4">
          <CardTitle className="font-display flex items-center gap-2 text-lg sm:text-xl">
            <MapPin className="w-5 h-5 text-primary" />
            Localização do Estabelecimento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Nome do Local</Label>
              <Input
                value={settings.location_name || ''}
                onChange={(e) => setSettings({ ...settings, location_name: e.target.value })}
                placeholder="Ex: Salão Merniela"
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Endereço Completo</Label>
              <Input
                value={settings.address || ''}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                placeholder="Av. Eduardo Mondlane, 123"
                className="bg-input border-border"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Cidade</Label>
              <Input
                value={settings.city || ''}
                onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                placeholder="Maputo"
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Bairro</Label>
              <Input
                value={settings.neighborhood || ''}
                onChange={(e) => setSettings({ ...settings, neighborhood: e.target.value })}
                placeholder="Polana Cimento"
                className="bg-input border-border"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Latitude</Label>
              <Input
                type="number"
                step="any"
                value={settings.latitude || ''}
                onChange={(e) => setSettings({ ...settings, latitude: e.target.value ? parseFloat(e.target.value) : null })}
                placeholder="-25.9692"
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Longitude</Label>
              <Input
                type="number"
                step="any"
                value={settings.longitude || ''}
                onChange={(e) => setSettings({ ...settings, longitude: e.target.value ? parseFloat(e.target.value) : null })}
                placeholder="32.5732"
                className="bg-input border-border"
              />
            </div>
          </div>

          {/* Map Picker Button */}
          <div className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleMapClick}
              className="w-full sm:w-auto"
            >
              <Navigation className="w-4 h-4 mr-2" />
              Selecionar no Mapa
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Clique para abrir o mapa e ajustar as coordenadas manualmente.
            </p>
          </div>

          {/* Map Preview / Picker */}
          <AnimatePresence>
            {(showMapPicker || hasCoordinates) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="relative rounded-xl overflow-hidden border border-border/50">
                  {showMapPicker && (
                    <div className="absolute top-3 right-3 z-10">
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => setShowMapPicker(false)}
                        className="rounded-full bg-card/90 backdrop-blur-sm"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  <iframe
                    src={showMapPicker ? mapPickerUrl : mapPreviewUrl!}
                    className="w-full h-64 sm:h-80"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Localização do estabelecimento"
                  />
                  {showMapPicker && (
                    <div className="bg-secondary/30 p-3 text-center">
                      <p className="text-xs text-muted-foreground">
                        Copie as coordenadas do Google Maps e cole nos campos Latitude/Longitude acima.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {hasCoordinates && !showMapPicker && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Coordenadas definidas: {settings.latitude?.toFixed(6)}, {settings.longitude?.toFixed(6)}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
