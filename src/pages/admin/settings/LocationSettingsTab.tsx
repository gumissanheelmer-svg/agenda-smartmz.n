import { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Navigation, Loader2, CheckCircle2, AlertCircle, Upload, X, Video, Image, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
  const [mapsInput, setMapsInput] = useState(settings.maps_raw_link || '');
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionResult, setDetectionResult] = useState<'success' | 'error' | null>(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const hasCoordinates = settings.latitude && settings.longitude;
  const mapPreviewUrl = hasCoordinates
    ? `https://www.google.com/maps?q=${settings.latitude},${settings.longitude}&z=16&output=embed`
    : null;

  const galleryImages: string[] = settings.gallery_images || [];
  const galleryVideos: string[] = settings.gallery_videos || [];
  const allMedia = [
    ...galleryImages.map((url: string) => ({ type: 'image' as const, url })),
    ...galleryVideos.map((url: string) => ({ type: 'video' as const, url })),
  ];

  const handleDetect = useCallback(() => {
    if (!mapsInput.trim()) {
      toast({ title: 'Erro', description: 'Cole um link do Google Maps primeiro.', variant: 'destructive' });
      return;
    }
    setIsDetecting(true);
    setDetectionResult(null);
    setTimeout(() => {
      const coords = extractCoordinates(mapsInput);
      if (coords) {
        setSettings({
          ...settings,
          latitude: coords.lat,
          longitude: coords.lng,
          maps_raw_link: mapsInput,
        });
        setDetectionResult('success');
        toast({ title: '📍 Localização detectada!', description: `Lat: ${coords.lat.toFixed(6)}, Lng: ${coords.lng.toFixed(6)}` });
      } else {
        setDetectionResult('error');
        toast({
          title: 'Não foi possível detectar',
          description: 'Abra o Google Maps, clique em "Compartilhar" e cole o link completo.',
          variant: 'destructive',
        });
      }
      setIsDetecting(false);
    }, 500);
  }, [mapsInput, settings, setSettings, toast]);

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const currentCount = galleryVideos.length;
    if (currentCount >= 10) {
      toast({ title: 'Limite atingido', description: 'Máximo de 10 vídeos.', variant: 'destructive' });
      return;
    }

    const remaining = 10 - currentCount;
    const filesToUpload = Array.from(files).slice(0, remaining);

    for (const file of filesToUpload) {
      if (!['video/mp4', 'video/webm'].includes(file.type)) {
        toast({ title: 'Formato inválido', description: `${file.name}: use MP4 ou WEBM.`, variant: 'destructive' });
        continue;
      }
      if (file.size > 25 * 1024 * 1024) {
        toast({ title: 'Arquivo muito grande', description: `${file.name}: máximo 25MB.`, variant: 'destructive' });
        continue;
      }

      setIsUploadingVideo(true);
      const ext = file.name.split('.').pop();
      const path = `${settings.id}/gallery-video-${Date.now()}.${ext}`;

      const { error } = await supabase.storage.from('videos').upload(path, file, { contentType: file.type });
      if (error) {
        toast({ title: 'Erro no upload', description: error.message, variant: 'destructive' });
        setIsUploadingVideo(false);
        continue;
      }

      const { data: urlData } = supabase.storage.from('videos').getPublicUrl(path);
      const newVideos = [...(settings.gallery_videos || []), urlData.publicUrl];
      setSettings({ ...settings, gallery_videos: newVideos });
      setIsUploadingVideo(false);
    }

    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const removeVideo = (index: number) => {
    const newVideos = [...galleryVideos];
    newVideos.splice(index, 1);
    setSettings({ ...settings, gallery_videos: newVideos });
  };

  const setFeaturedMedia = (url: string, type: 'image' | 'video') => {
    setSettings({ ...settings, media_featured_url: url, media_featured_type: type });
  };

  const clearFeaturedMedia = () => {
    setSettings({ ...settings, media_featured_url: null, media_featured_type: null });
  };

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
              onChange={(e) => { setMapsInput(e.target.value); setDetectionResult(null); }}
              onBlur={() => { if (mapsInput.trim()) handleDetect(); }}
              placeholder="Ex: https://www.google.com/maps/@-25.9692,32.5732,16z"
              className="bg-input border-border min-h-[80px] resize-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <Button type="button" onClick={handleDetect} disabled={isDetecting || !mapsInput.trim()} className="w-full sm:w-auto">
              {isDetecting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MapPin className="w-4 h-4 mr-2" />}
              {isDetecting ? 'Detectando...' : 'Detectar localização'}
            </Button>
            <AnimatePresence>
              {detectionResult === 'success' && (
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 text-sm text-green-500">
                  <CheckCircle2 className="w-4 h-4" /> Detectado!
                </motion.div>
              )}
              {detectionResult === 'error' && (
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4" /> Não encontrado
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

      {/* Address Details Card */}
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
              <Input value={settings.location_name || ''} onChange={(e) => setSettings({ ...settings, location_name: e.target.value })} placeholder="Ex: Salão Merniela" className="bg-input border-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Endereço Completo</Label>
              <Input value={settings.address || ''} onChange={(e) => setSettings({ ...settings, address: e.target.value })} placeholder="Av. Eduardo Mondlane, 123" className="bg-input border-border" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Cidade</Label>
              <Input value={settings.city || ''} onChange={(e) => setSettings({ ...settings, city: e.target.value })} placeholder="Maputo" className="bg-input border-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Bairro</Label>
              <Input value={settings.neighborhood || ''} onChange={(e) => setSettings({ ...settings, neighborhood: e.target.value })} placeholder="Polana Cimento" className="bg-input border-border" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Latitude</Label>
              <Input type="number" step="any" value={settings.latitude || ''} onChange={(e) => setSettings({ ...settings, latitude: e.target.value ? parseFloat(e.target.value) : null })} placeholder="-25.9692" className="bg-input border-border" readOnly={!!detectionResult} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Longitude</Label>
              <Input type="number" step="any" value={settings.longitude || ''} onChange={(e) => setSettings({ ...settings, longitude: e.target.value ? parseFloat(e.target.value) : null })} placeholder="32.5732" className="bg-input border-border" readOnly={!!detectionResult} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map Preview */}
      <AnimatePresence>
        {hasCoordinates && mapPreviewUrl && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
            <Card className="border-border/50 bg-card/80">
              <CardHeader className="pb-4">
                <CardTitle className="font-display flex items-center gap-2 text-lg sm:text-xl">🗺️ Preview do Mapa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl overflow-hidden border border-border/50">
                  <iframe src={mapPreviewUrl} className="w-full h-64 sm:h-80" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Preview da localização" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Gallery Card */}
      <Card className="border-border/50 bg-card/80">
        <CardHeader className="pb-4">
          <CardTitle className="font-display flex items-center gap-2 text-lg sm:text-xl">
            <Video className="w-5 h-5 text-primary" />
            Galeria de Vídeos
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Até 10 vídeos (MP4/WEBM, máx. 25MB cada)</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <input ref={videoInputRef} type="file" accept="video/mp4,video/webm" multiple className="hidden" onChange={handleVideoUpload} />
          <Button type="button" variant="outline" onClick={() => videoInputRef.current?.click()} disabled={isUploadingVideo || galleryVideos.length >= 10} className="w-full sm:w-auto">
            {isUploadingVideo ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
            {isUploadingVideo ? 'Enviando...' : 'Adicionar Vídeos'}
          </Button>

          {galleryVideos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {galleryVideos.map((url: string, i: number) => (
                <div key={i} className="relative rounded-xl overflow-hidden border border-border/50 aspect-video bg-muted">
                  <video src={url} className="w-full h-full object-cover" muted preload="metadata" />
                  <button onClick={() => removeVideo(i)} className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {galleryVideos.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">Nenhum vídeo adicionado ainda.</p>
          )}
        </CardContent>
      </Card>

      {/* Featured Media Card */}
      <Card className="border-border/50 bg-card/80">
        <CardHeader className="pb-4">
          <CardTitle className="font-display flex items-center gap-2 text-lg sm:text-xl">
            <Star className="w-5 h-5 text-primary" />
            Mídia em Destaque
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Escolha 1 foto ou vídeo para destacar na seção pública.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {allMedia.length > 0 ? (
            <>
              <Select
                value={settings.media_featured_url || ''}
                onValueChange={(val) => {
                  const item = allMedia.find(m => m.url === val);
                  if (item) setFeaturedMedia(item.url, item.type);
                }}
              >
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="Selecione uma mídia..." />
                </SelectTrigger>
                <SelectContent>
                  {allMedia.map((m, i) => (
                    <SelectItem key={i} value={m.url}>
                      {m.type === 'image' ? '🖼️' : '🎬'} {m.type === 'image' ? 'Foto' : 'Vídeo'} {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {settings.media_featured_url && (
                <div className="space-y-2">
                  <div className="rounded-xl overflow-hidden border border-border/50 aspect-video">
                    {settings.media_featured_type === 'video' ? (
                      <video src={settings.media_featured_url} className="w-full h-full object-cover" controls muted />
                    ) : (
                      <img src={settings.media_featured_url} alt="Destaque" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={clearFeaturedMedia} className="text-xs">
                    <X className="w-3 h-3 mr-1" /> Remover destaque
                  </Button>
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">
              Adicione fotos na aba Aparência ou vídeos acima para selecionar um destaque.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
