import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Navigation, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface LocationSettingsTabProps {
  settings: any;
  setSettings: (s: any) => void;
}

function extractCoordinates(input: string): { lat: number; lng: number } | null {
  const patterns = [
    /@(-?\d+\.?\d*),(-?\d+\.?\d*)/,
    /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
    /place\/[^/]+\/@(-?\d+\.?\d*),(-?\d+\.?\d*)/,
    /(-?\d+\.\d+),\s*(-?\d+\.\d+)/,
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng };
      }
    }
  }
  return null;
}

export default function LocationSettingsTab({ settings, setSettings }: LocationSettingsTabProps) {
  const { toast } = useToast();
  const [mapsInput, setMapsInput] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionResult, setDetectionResult] = useState<'success' | 'error' | null>(null);

  const hasCoordinates = settings.latitude && settings.longitude;

  const mapPreviewUrl = hasCoordinates
    ? `https://www.google.com/maps?q=${settings.latitude},${settings.longitude}&z=16&output=embed`
    : null;

  const handleDetect = useCallback(() => {
    if (!mapsInput.trim()) {
      toast({ title: 'Erro', description: 'Cole um link do Google Maps primeiro.', variant: 'destructive' });
      return;
    }

    setIsDetecting(true);
    setDetectionResult(null);

    // Simulate brief processing delay for UX
    setTimeout(() => {
      const coords = extractCoordinates(mapsInput);

      if (coords) {
        setSettings({
          ...settings,
          latitude: coords.lat,
          longitude: coords.lng,
        });
        setDetectionResult('success');
        toast({
          title: '📍 Localização detectada!',
          description: `Lat: ${coords.lat.toFixed(6)}, Lng: ${coords.lng.toFixed(6)}`,
        });
      } else {
        setDetectionResult('error');
        toast({
          title: 'Não foi possível detectar',
          description: 'Cole um link completo do Google Maps com coordenadas (ex: https://www.google.com/maps/@-25.9692,32.5732,16z).',
          variant: 'destructive',
        });
      }

      setIsDetecting(false);
    }, 600);
  }, [mapsInput, settings, setSettings, toast]);

  return (
    <div className="grid gap-6">
      {/* Smart Detection Card */}
      <Card className="border-border/50 bg-card/80">
        <CardHeader className="pb-4">
          <CardTitle className="font-display flex items-center gap-2 text-lg sm:text-xl">
            <Navigation className="w-5 h-5 text-primary" />
            Localização Inteligente
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Cole um link do Google Maps e detectamos as coordenadas automaticamente.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm">Cole o link do Google Maps</Label>
            <Textarea
              value={mapsInput}
              onChange={(e) => {
                setMapsInput(e.target.value);
                setDetectionResult(null);
              }}
              placeholder="Ex: https://www.google.com/maps/@-25.9692,32.5732,16z ou -25.9692, 32.5732"
              className="bg-input border-border min-h-[80px] resize-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              onClick={handleDetect}
              disabled={isDetecting || !mapsInput.trim()}
              className="w-full sm:w-auto"
            >
              {isDetecting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <MapPin className="w-4 h-4 mr-2" />
              )}
              {isDetecting ? 'Detectando...' : 'Detectar localização'}
            </Button>

            <AnimatePresence>
              {detectionResult === 'success' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5 text-sm text-green-500"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Detectado!
                </motion.div>
              )}
              {detectionResult === 'error' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5 text-sm text-destructive"
                >
                  <AlertCircle className="w-4 h-4" />
                  Não encontrado
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {!hasCoordinates && (
            <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3 border border-border/30">
              💡 Cole um link completo do Google Maps para ativar a localização no seu site público.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Manual Fields Card */}
      <Card className="border-border/50 bg-card/80">
        <CardHeader className="pb-4">
          <CardTitle className="font-display flex items-center gap-2 text-lg sm:text-xl">
            <MapPin className="w-5 h-5 text-primary" />
            Detalhes do Endereço
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

          {hasCoordinates && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Coordenadas: {settings.latitude?.toFixed(6)}, {settings.longitude?.toFixed(6)}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Map Preview Card */}
      <AnimatePresence>
        {hasCoordinates && mapPreviewUrl && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <Card className="border-border/50 bg-card/80">
              <CardHeader className="pb-4">
                <CardTitle className="font-display flex items-center gap-2 text-lg sm:text-xl">
                  🗺️ Preview do Mapa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl overflow-hidden border border-border/50">
                  <iframe
                    src={mapPreviewUrl}
                    className="w-full h-64 sm:h-80"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Preview da localização"
                  />
                </div>
                <div className="mt-3 flex flex-col sm:flex-row gap-2">
                  <a
                    href={`https://www.google.com/maps?q=${settings.latitude},${settings.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <Navigation className="w-3 h-3" />
                    Abrir no Google Maps
                  </a>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
