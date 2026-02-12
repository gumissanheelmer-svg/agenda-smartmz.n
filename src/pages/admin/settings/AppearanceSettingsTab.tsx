import { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Image, Upload, Trash2, Palette, Film, Plus, X, GripVertical
} from 'lucide-react';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const MAX_IMG_SIZE = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE = 20 * 1024 * 1024;
const MAX_GALLERY = 10;

interface AppearanceSettingsTabProps {
  settings: any;
  setSettings: (s: any) => void;
}

export default function AppearanceSettingsTab({ settings, setSettings }: AppearanceSettingsTabProps) {
  const { toast } = useToast();
  const [isUploadingBg, setIsUploadingBg] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [bgPreview, setBgPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const bgInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const validateImage = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) return 'Formato inválido. Use JPG, PNG ou WEBP.';
    if (file.size > MAX_IMG_SIZE) return 'Tamanho máximo: 5MB.';
    return null;
  };

  const uploadFile = async (file: File, bucket: string, path: string) => {
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true, contentType: file.type });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
    return publicUrl;
  };

  // Background Image
  const handleBgSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateImage(file);
    if (err) { toast({ title: 'Erro', description: err, variant: 'destructive' }); return; }

    const reader = new FileReader();
    reader.onload = (ev) => setBgPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setIsUploadingBg(true);
    try {
      if (settings.background_image_url) {
        const old = settings.background_image_url.split('/backgrounds/')[1];
        if (old) await supabase.storage.from('backgrounds').remove([old]);
      }
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const url = await uploadFile(file, 'backgrounds', `${settings.id}/background.${ext}`);
      setSettings({ ...settings, background_image_url: url });
      setBgPreview(null);
      toast({ title: 'Imagem carregada' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err?.message, variant: 'destructive' });
      setBgPreview(null);
    } finally {
      setIsUploadingBg(false);
      if (bgInputRef.current) bgInputRef.current.value = '';
    }
  };

  const handleRemoveBg = async () => {
    if (!settings?.background_image_url) return;
    const path = settings.background_image_url.split('/backgrounds/')[1];
    if (path) await supabase.storage.from('backgrounds').remove([path]);
    setSettings({ ...settings, background_image_url: null });
    setBgPreview(null);
    toast({ title: 'Imagem removida' });
  };

  // Cover Image
  const handleCoverSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateImage(file);
    if (err) { toast({ title: 'Erro', description: err, variant: 'destructive' }); return; }

    const reader = new FileReader();
    reader.onload = (ev) => setCoverPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setIsUploadingCover(true);
    try {
      if (settings.cover_image_url) {
        const old = settings.cover_image_url.split('/covers/')[1];
        if (old) await supabase.storage.from('covers').remove([old]);
      }
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const url = await uploadFile(file, 'covers', `${settings.id}/cover.${ext}`);
      setSettings({ ...settings, cover_image_url: url });
      setCoverPreview(null);
      toast({ title: 'Capa carregada' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err?.message, variant: 'destructive' });
      setCoverPreview(null);
    } finally {
      setIsUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const handleRemoveCover = async () => {
    if (!settings?.cover_image_url) return;
    const path = settings.cover_image_url.split('/covers/')[1];
    if (path) await supabase.storage.from('covers').remove([path]);
    setSettings({ ...settings, cover_image_url: null });
    setCoverPreview(null);
    toast({ title: 'Capa removida' });
  };

  // Gallery
  const galleryImages: string[] = settings.gallery_images || [];

  const handleGallerySelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remaining = MAX_GALLERY - galleryImages.length;
    if (remaining <= 0) {
      toast({ title: 'Limite atingido', description: `Máximo de ${MAX_GALLERY} imagens.`, variant: 'destructive' });
      return;
    }

    setIsUploadingGallery(true);
    const newUrls: string[] = [];

    try {
      const filesToProcess = Array.from(files).slice(0, remaining);
      for (const file of filesToProcess) {
        const err = validateImage(file);
        if (err) { toast({ title: 'Erro', description: `${file.name}: ${err}`, variant: 'destructive' }); continue; }
        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const path = `${settings.id}/gallery-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
        const url = await uploadFile(file, 'gallery', path);
        newUrls.push(url);
      }

      if (newUrls.length > 0) {
        setSettings({ ...settings, gallery_images: [...galleryImages, ...newUrls] });
        toast({ title: `${newUrls.length} imagem(ns) adicionada(s)` });
      }
    } catch (err: any) {
      toast({ title: 'Erro no upload', description: err?.message, variant: 'destructive' });
    } finally {
      setIsUploadingGallery(false);
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  const handleRemoveGalleryImage = async (index: number) => {
    const url = galleryImages[index];
    const path = url.split('/gallery/')[1];
    if (path) await supabase.storage.from('gallery').remove([path]);
    const updated = galleryImages.filter((_, i) => i !== index);
    setSettings({ ...settings, gallery_images: updated });
    toast({ title: 'Imagem removida' });
  };

  // Video
  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      toast({ title: 'Formato inválido', description: 'Use MP4, WEBM ou MOV.', variant: 'destructive' });
      return;
    }
    if (file.size > MAX_VIDEO_SIZE) {
      toast({ title: 'Arquivo muito grande', description: 'Máximo: 20MB.', variant: 'destructive' });
      return;
    }

    setIsUploadingVideo(true);
    try {
      if (settings.video_url) {
        const old = settings.video_url.split('/videos/')[1];
        if (old) await supabase.storage.from('videos').remove([old]);
      }
      const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4';
      const url = await uploadFile(file, 'videos', `${settings.id}/video.${ext}`);
      setSettings({ ...settings, video_url: url });
      toast({ title: 'Vídeo carregado' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err?.message, variant: 'destructive' });
    } finally {
      setIsUploadingVideo(false);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  const handleRemoveVideo = async () => {
    if (!settings?.video_url) return;
    const path = settings.video_url.split('/videos/')[1];
    if (path) await supabase.storage.from('videos').remove([path]);
    setSettings({ ...settings, video_url: null });
    toast({ title: 'Vídeo removido' });
  };

  return (
    <div className="grid gap-6">
      {/* Cover Image (Hero) */}
      <Card className="border-border/50 bg-card/80">
        <CardHeader className="pb-4">
          <CardTitle className="font-display flex items-center gap-2 text-lg sm:text-xl">
            <Image className="w-5 h-5 text-primary" />
            Foto Principal (Hero)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative w-full h-40 sm:h-48 rounded-lg overflow-hidden border border-border bg-muted">
            {(coverPreview || settings.cover_image_url) ? (
              <img src={coverPreview || settings.cover_image_url} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Image className="w-10 h-10 opacity-50" />
                <p className="text-sm mt-2">Nenhuma imagem de capa</p>
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleCoverSelect} className="hidden" />
            <Button type="button" variant="outline" onClick={() => coverInputRef.current?.click()} disabled={isUploadingCover} className="w-full sm:w-auto">
              <Upload className="w-4 h-4 mr-2" />
              {isUploadingCover ? 'Enviando...' : 'Carregar Capa'}
            </Button>
            {settings.cover_image_url && (
              <Button type="button" variant="destructive" onClick={handleRemoveCover} className="w-full sm:w-auto">
                <Trash2 className="w-4 h-4 mr-2" />Remover
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Esta imagem será usada como hero background na landing page. JPG, PNG, WEBP. Máx: 5MB.</p>
        </CardContent>
      </Card>

      {/* Background Image */}
      <Card className="border-border/50 bg-card/80">
        <CardHeader className="pb-4">
          <CardTitle className="font-display flex items-center gap-2 text-lg sm:text-xl">
            <Image className="w-5 h-5 text-primary" />
            Imagem de Fundo do Site
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative w-full h-40 sm:h-48 rounded-lg overflow-hidden border border-border bg-muted">
            {(bgPreview || settings.background_image_url) ? (
              <>
                <img src={bgPreview || settings.background_image_url} alt="Background" className="w-full h-full object-cover" />
                <div className={`absolute inset-0 bg-black ${settings.background_overlay_level === 'low' ? 'opacity-30' : settings.background_overlay_level === 'high' ? 'opacity-70' : 'opacity-50'}`} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-foreground font-display text-lg font-bold">{settings.name}</p>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Image className="w-10 h-10 opacity-50" />
                <p className="text-sm mt-2">Nenhuma imagem de fundo</p>
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input ref={bgInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleBgSelect} className="hidden" />
            <Button type="button" variant="outline" onClick={() => bgInputRef.current?.click()} disabled={isUploadingBg} className="w-full sm:w-auto">
              <Upload className="w-4 h-4 mr-2" />
              {isUploadingBg ? 'Enviando...' : 'Carregar Imagem'}
            </Button>
            {settings.background_image_url && (
              <Button type="button" variant="destructive" onClick={handleRemoveBg} className="w-full sm:w-auto">
                <Trash2 className="w-4 h-4 mr-2" />Remover
              </Button>
            )}
          </div>
          <div className="space-y-2 pt-2 border-t border-border/50">
            <Label className="text-sm">Intensidade do Overlay</Label>
            <Select value={settings.background_overlay_level} onValueChange={(v: 'low' | 'medium' | 'high') => setSettings({ ...settings, background_overlay_level: v })}>
              <SelectTrigger className="w-full sm:w-48 bg-input border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baixo (30%)</SelectItem>
                <SelectItem value="medium">Médio (50%)</SelectItem>
                <SelectItem value="high">Alto (70%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Gallery */}
      <Card className="border-border/50 bg-card/80">
        <CardHeader className="pb-4">
          <CardTitle className="font-display flex items-center gap-2 text-lg sm:text-xl">
            <GripVertical className="w-5 h-5 text-primary" />
            Galeria de Fotos ({galleryImages.length}/{MAX_GALLERY})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {galleryImages.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {galleryImages.map((url, i) => (
                <div key={i} className="relative group rounded-lg overflow-hidden border border-border aspect-square">
                  <img src={url} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => handleRemoveGalleryImage(i)}
                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-destructive/90 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {galleryImages.length < MAX_GALLERY && (
            <div className="flex flex-col sm:flex-row gap-3">
              <input ref={galleryInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleGallerySelect} className="hidden" />
              <Button type="button" variant="outline" onClick={() => galleryInputRef.current?.click()} disabled={isUploadingGallery} className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                {isUploadingGallery ? 'Enviando...' : 'Adicionar Fotos'}
              </Button>
            </div>
          )}
          <p className="text-xs text-muted-foreground">Até {MAX_GALLERY} fotos. JPG, PNG, WEBP. Máx: 5MB cada.</p>
        </CardContent>
      </Card>

      {/* Video */}
      <Card className="border-border/50 bg-card/80">
        <CardHeader className="pb-4">
          <CardTitle className="font-display flex items-center gap-2 text-lg sm:text-xl">
            <Film className="w-5 h-5 text-primary" />
            Vídeo Institucional
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings.video_url && (
            <div className="rounded-lg overflow-hidden border border-border">
              <video src={settings.video_url} controls className="w-full max-h-64 bg-black" />
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3">
            <input ref={videoInputRef} type="file" accept="video/mp4,video/webm,video/quicktime" onChange={handleVideoSelect} className="hidden" />
            <Button type="button" variant="outline" onClick={() => videoInputRef.current?.click()} disabled={isUploadingVideo} className="w-full sm:w-auto">
              <Upload className="w-4 h-4 mr-2" />
              {isUploadingVideo ? 'Enviando...' : settings.video_url ? 'Substituir Vídeo' : 'Carregar Vídeo'}
            </Button>
            {settings.video_url && (
              <Button type="button" variant="destructive" onClick={handleRemoveVideo} className="w-full sm:w-auto">
                <Trash2 className="w-4 h-4 mr-2" />Remover
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">1 vídeo. MP4, WEBM ou MOV. Máx: 20MB.</p>
        </CardContent>
      </Card>

      {/* Colors */}
      <Card className="border-border/50 bg-card/80">
        <CardHeader className="pb-4">
          <CardTitle className="font-display flex items-center gap-2 text-lg sm:text-xl">
            <Palette className="w-5 h-5 text-primary" />
            Cores Personalizadas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { key: 'primary_color', label: 'Cor Primária', placeholder: '#D4AF37' },
              { key: 'secondary_color', label: 'Cor Secundária', placeholder: '#1a1a2e' },
              { key: 'background_color', label: 'Cor de Fundo', placeholder: '#0f0f1a' },
              { key: 'text_color', label: 'Cor do Texto', placeholder: '#ffffff' },
            ].map(({ key, label, placeholder }) => (
              <div key={key} className="space-y-2">
                <Label className="text-sm">{label}</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={(settings as any)[key]}
                    onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                    className="w-10 h-10 rounded cursor-pointer border-0 flex-shrink-0"
                  />
                  <Input
                    value={(settings as any)[key]}
                    onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                    className="bg-input border-border flex-1 text-sm"
                    placeholder={placeholder}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Cores aplicadas na página de agendamento dos clientes.</p>
        </CardContent>
      </Card>
    </div>
  );
}
