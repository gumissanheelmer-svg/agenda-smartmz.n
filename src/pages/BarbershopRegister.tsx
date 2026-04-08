import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Scissors, Upload, Eye, ArrowLeft, Loader2, Sparkles, Store, Heart, PenTool } from 'lucide-react';
import { ALL_BUSINESS_TYPES, getBusinessConfig, type BusinessType } from '@/lib/businessConfig';
import { getReferralCode, clearReferralCode } from '@/hooks/useReferral';
import { checkRateLimit, recordAttempt, REGISTER_LIMIT } from '@/lib/rateLimiter';
import { sanitizeText, sanitizePhone, sanitizeEmail, sanitizeSlug } from '@/lib/sanitize';
import { logError } from '@/lib/errorHandler';

interface Country {
  country_code: string;
  name: string;
  default_currency_code: string;
  default_timezone: string;
  default_locale: string;
  phone_country_prefix: string | null;
}

interface FormData {
  // Owner info
  ownerName: string;
  ownerEmail: string;
  ownerPassword: string;
  ownerPhone: string;
  // Barbershop info
  name: string;
  slug: string;
  whatsappNumber: string;
  businessType: BusinessType;
  countryCode: string;
  currencyCode: string;
  timezone: string;
  locale: string;
  // Theme
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  // Logo
  logoFile: File | null;
  logoPreview: string | null;
}

export default function BarbershopRegister() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshRoles } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [formData, setFormData] = useState<FormData>({
    ownerName: '',
    ownerEmail: '',
    ownerPassword: '',
    ownerPhone: '',
    name: '',
    slug: '',
    whatsappNumber: '',
    businessType: 'barbearia',
    countryCode: 'MZ',
    currencyCode: 'MZN',
    timezone: 'Africa/Maputo',
    locale: 'pt-MZ',
    primaryColor: '#D4AF37',
    secondaryColor: '#1a1a2e',
    backgroundColor: '#0f0f1a',
    textColor: '#ffffff',
    logoFile: null,
    logoPreview: null,
  });

  useEffect(() => {
    supabase.from('countries' as any).select('*').eq('is_enabled', true).order('name')
      .then(({ data }) => { if (data) setCountries(data as unknown as Country[]); });
  }, []);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-generate slug from name
    if (field === 'name') {
      const slug = value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      toast({
        title: "Nenhuma imagem selecionada",
        description: "Selecione uma imagem para o logo.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Formato inválido",
        description: "No iPhone, envie JPG/PNG (HEIC não é suportado).",
        variant: "destructive",
      });
      return;
    }
    
    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "Arquivo muito grande",
        description: "O logo deve ter no máximo 5MB.",
        variant: "destructive",
      });
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        logoFile: file,
        logoPreview: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const validateStep1 = () => {
    if (!formData.ownerName.trim() || !formData.ownerEmail.trim() || !formData.ownerPassword.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos do proprietário",
        variant: "destructive",
      });
      return false;
    }
    if (formData.ownerPassword.length < 6) {
      toast({
        title: "Senha fraca",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.name.trim() || !formData.slug.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o nome e slug do estabelecimento",
        variant: "destructive",
      });
      return false;
    }
    if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      toast({
        title: "Slug inválido",
        description: "O slug deve conter apenas letras minúsculas, números e hífens",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const getBusinessTypeLabel = () => {
    return getBusinessConfig(formData.businessType).label;
  };

  const getBusinessTypeIcon = () => {
    const iconMap: Record<string, React.ReactNode> = {
      barbearia: <Scissors className="w-6 h-6" style={{ color: formData.backgroundColor }} />,
      salao: <Sparkles className="w-6 h-6" style={{ color: formData.backgroundColor }} />,
      salao_barbearia: <Store className="w-6 h-6" style={{ color: formData.backgroundColor }} />,
      estetica: <Heart className="w-6 h-6" style={{ color: formData.backgroundColor }} />,
      tattoo_studio: <PenTool className="w-6 h-6" style={{ color: formData.backgroundColor }} />,
    };
    return iconMap[formData.businessType] || iconMap.barbearia;
  };

  const handleSubmit = async () => {
    // Rate limit check
    const rateCheck = checkRateLimit(REGISTER_LIMIT);
    if (!rateCheck.allowed) {
      const seconds = Math.ceil(rateCheck.retryAfterMs / 1000);
      toast({
        title: 'Muitas tentativas',
        description: `Aguarde ${seconds}s antes de tentar novamente.`,
        variant: 'destructive',
      });
      return;
    }
    
    recordAttempt(REGISTER_LIMIT);
    setIsLoading(true);

    try {
      // 1. Check if slug is available
      const { data: existingShop } = await supabase
        .from('barbershops')
        .select('id')
        .eq('slug', formData.slug)
        .maybeSingle();

      if (existingShop) {
        toast({
          title: "Slug indisponível",
          description: "Este endereço já está em uso. Escolha outro.",
          variant: "destructive",
        });
        setIsLoading(false);
        setStep(2);
        return;
      }

      let userId: string;
      let isExistingUser = false;

      // 2. Try to create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.ownerEmail,
        password: formData.ownerPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/admin/dashboard`,
          data: {
            name: formData.ownerName,
            phone: formData.ownerPhone,
          },
        },
      });

      // Handle user already registered - try to sign in instead
      if (authError) {
        if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
          // User exists, try to sign in
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: formData.ownerEmail,
            password: formData.ownerPassword,
          });

          if (signInError) {
            throw new Error('Email já cadastrado. Verifique sua senha ou faça login.');
          }

          if (!signInData.user) {
            throw new Error('Falha ao autenticar');
          }

          userId = signInData.user.id;
          isExistingUser = true;

          // Check if user already has a barbershop
          const { data: existingRole } = await supabase
            .from('user_roles')
            .select('barbershop_id')
            .eq('user_id', userId)
            .eq('role', 'admin')
            .maybeSingle();

          if (existingRole?.barbershop_id) {
            // Check if barbershop still exists
            const { data: existingBarbershop } = await supabase
              .from('barbershops')
              .select('id, name')
              .eq('id', existingRole.barbershop_id)
              .maybeSingle();

            if (existingBarbershop) {
              toast({
                title: "Barbearia existente",
                description: `Você já possui a barbearia "${existingBarbershop.name}". Redirecionando...`,
              });
              await refreshRoles();
              await new Promise(resolve => setTimeout(resolve, 500));
              navigate('/pending-approval');
              return;
            }
          }
        } else {
          throw new Error(authError.message);
        }
      } else {
        if (!authData.user) {
          throw new Error('Falha ao criar conta');
        }
        userId = authData.user.id;
      }

      // CRITICAL: Ensure session is active before creating barbershop
      // For new users, signUp may not immediately establish a session
      let sessionActive = false;
      
      // Check current session
      const { data: currentSession } = await supabase.auth.getSession();
      sessionActive = !!currentSession.session;
      
      // If no session, try to sign in (works with auto-confirm enabled)
      if (!sessionActive) {
        console.log('No active session, attempting sign in...');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.ownerEmail,
          password: formData.ownerPassword,
        });
        
        if (signInError) {
          // If sign in fails, user might need to confirm email
          throw new Error('Falha ao estabelecer sessão. Por favor, confirme seu email e tente novamente.');
        }
        
        if (signInData.session) {
          sessionActive = true;
          userId = signInData.user.id;
        }
      }
      
      // Final session check before proceeding
      if (!sessionActive) {
        throw new Error('Sessão não estabelecida. Tente fazer login novamente.');
      }
      
      console.log('Session active, proceeding with barbershop creation for user:', userId);

      // 3. Upload logo if provided
      let logoUrl: string | null = null;
      if (formData.logoFile) {
        const fileExt = formData.logoFile.name.split('.').pop()?.toLowerCase() || 'jpg';
        const filePath = `${userId}/${Date.now()}.${fileExt}`;
        
        try {
          const { error: uploadError } = await supabase.storage
            .from('logos')
            .upload(filePath, formData.logoFile, {
              upsert: true,
              contentType: formData.logoFile.type
            });

          if (uploadError) {
            console.error('Logo upload error:', uploadError);
            toast({
              title: "Erro no upload do logo",
              description: uploadError.message,
              variant: "destructive",
            });
          } else {
            const { data: urlData } = supabase.storage
              .from('logos')
              .getPublicUrl(filePath);
            logoUrl = urlData.publicUrl;
          }
        } catch (error: any) {
          console.error('Logo upload exception:', error);
          toast({
            title: "Erro inesperado no upload",
            description: error?.message || 'Erro desconhecido',
            variant: "destructive",
          });
        }
      }

      // 4. Create barbershop using RPC function (bypasses RLS)
      const { data: barbershopId, error: shopError } = await supabase
        .rpc('create_barbershop', {
          p_name: formData.name,
          p_slug: formData.slug,
          p_whatsapp_number: formData.whatsappNumber || null,
          p_logo_url: logoUrl,
          p_primary_color: formData.primaryColor,
          p_secondary_color: formData.secondaryColor,
          p_background_color: formData.backgroundColor,
          p_text_color: formData.textColor,
          p_owner_email: formData.ownerEmail,
          p_business_type: formData.businessType,
        });

      if (shopError) {
        throw new Error('Falha ao criar barbearia: ' + shopError.message);
      }

      // 4.1 Update country-specific fields (RPC doesn't support them)
      await supabase
        .from('barbershops')
        .update({
          country_code: formData.countryCode,
          currency_code: formData.currencyCode,
          timezone: formData.timezone,
          locale: formData.locale,
        } as any)
        .eq('id', barbershopId);

      const barbershopData = { id: barbershopId };

      // 5. Assign admin role to user (upsert to handle existing role without barbershop_id)
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role: 'admin',
          barbershop_id: barbershopData.id,
        }, { onConflict: 'user_id,role' });

      if (roleError) {
        console.error('Role assignment error:', roleError);
        // Try update if upsert fails
        await supabase
          .from('user_roles')
          .update({ barbershop_id: barbershopData.id })
          .eq('user_id', userId)
          .eq('role', 'admin');
      }

      // 6. Create profile if it doesn't exist
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (!existingProfile) {
        await supabase.from('profiles').insert({
          id: userId,
          email: formData.ownerEmail,
        });
      }

      // 7. Track referral if exists
      const refCode = getReferralCode();
      if (refCode && barbershopData.id) {
        try {
          const { data: affiliateData } = await supabase
            .from('affiliates_agenda')
            .select('id')
            .eq('referral_code', refCode)
            .eq('active', true)
            .maybeSingle();

          if (affiliateData) {
            await supabase.from('affiliate_referrals').insert({
              affiliate_id: affiliateData.id,
              business_id: barbershopData.id,
              status: 'lead',
              commission_amount: 0,
            });
            clearReferralCode();
          }
        } catch (refErr) {
          console.error('Referral tracking error:', refErr);
        }
      }

      toast({
        title: "Barbearia registrada!",
        description: "Aguarde a aprovação do administrador para acessar o sistema.",
      });

      // Refresh roles to ensure state is updated
      await refreshRoles();
      
      // Give a small delay for state to propagate
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Redirect to pending approval page
      navigate('/pending-approval');

    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Erro ao registrar",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const ThemePreview = () => (
    <div 
      className="rounded-lg p-4 border"
      style={{ 
        backgroundColor: formData.backgroundColor,
        borderColor: formData.primaryColor,
      }}
    >
      <div className="flex items-center gap-3 mb-3">
        {formData.logoPreview ? (
          <img 
            src={formData.logoPreview} 
            alt="Logo preview" 
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: formData.primaryColor }}
          >
            {getBusinessTypeIcon()}
          </div>
        )}
        <div>
          <h3 style={{ color: formData.textColor }} className="font-bold">
            {formData.name || 'Nome do Estabelecimento'}
          </h3>
          <p style={{ color: formData.textColor }} className="text-xs opacity-70">
            {getBusinessTypeLabel()}
          </p>
        </div>
      </div>
      <div 
        className="rounded p-2 text-center text-sm font-medium"
        style={{ 
          backgroundColor: formData.primaryColor,
          color: formData.backgroundColor,
        }}
      >
        Agendar Horário
      </div>
      <div 
        className="mt-2 rounded p-2 text-center text-sm"
        style={{ 
          backgroundColor: formData.secondaryColor,
          color: formData.textColor,
        }}
      >
        Serviços
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30 py-8 px-4">
      <Helmet>
        <title>Registrar Barbearia | Sistema de Agendamento</title>
      </Helmet>

      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => step > 1 ? setStep(step - 1) : navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {step > 1 ? 'Voltar' : 'Início'}
        </Button>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 w-16 rounded-full transition-colors ${
                s <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Scissors className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">
              {step === 1 && 'Dados do Proprietário'}
              {step === 2 && 'Dados da Barbearia'}
              {step === 3 && 'Personalização'}
            </CardTitle>
            <CardDescription>
              {step === 1 && 'Crie sua conta de administrador'}
              {step === 2 && 'Configure as informações básicas'}
              {step === 3 && 'Defina as cores e logo da sua barbearia'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Step 1: Owner Info */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ownerName">Nome completo *</Label>
                  <Input
                    id="ownerName"
                    placeholder="Seu nome"
                    value={formData.ownerName}
                    onChange={(e) => handleInputChange('ownerName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ownerEmail">E-mail *</Label>
                  <Input
                    id="ownerEmail"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.ownerEmail}
                    onChange={(e) => handleInputChange('ownerEmail', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ownerPassword">Senha *</Label>
                  <Input
                    id="ownerPassword"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={formData.ownerPassword}
                    onChange={(e) => handleInputChange('ownerPassword', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ownerPhone">Telefone (opcional)</Label>
                  <Input
                    id="ownerPhone"
                    placeholder="+258 84 123 4567"
                    value={formData.ownerPhone}
                    onChange={(e) => handleInputChange('ownerPhone', e.target.value)}
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => validateStep1() && setStep(2)}
                >
                  Continuar
                </Button>
              </div>
            )}

            {/* Step 2: Business Info */}
            {step === 2 && (
              <div className="space-y-4">
                {/* Business Type Selection */}
                <div className="space-y-3">
                  <Label>Tipo de estabelecimento *</Label>
                  <div className="grid grid-cols-1 gap-3">
                    {([
                      { type: 'barbearia' as BusinessType, icon: Scissors, desc: 'Cortes, barbas e tratamentos masculinos' },
                      { type: 'salao' as BusinessType, icon: Sparkles, desc: 'Cabelo, manicure, maquiagem e mais' },
                      { type: 'salao_barbearia' as BusinessType, icon: Store, desc: 'Serviços completos para todos' },
                      { type: 'estetica' as BusinessType, icon: Heart, desc: 'Limpeza de pele, tratamentos faciais' },
                      { type: 'tattoo_studio' as BusinessType, icon: PenTool, desc: 'Tatuagens, piercings e retoques' },
                    ]).map(({ type, icon: Icon, desc }) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, businessType: type }))}
                        className={`p-4 rounded-lg border-2 transition-all text-left flex items-center gap-3 ${
                          formData.businessType === type
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          formData.businessType === type ? 'bg-primary' : 'bg-muted'
                        }`}>
                          <Icon className={`w-5 h-5 ${formData.businessType === type ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                        </div>
                        <div>
                          <p className="font-medium">{getBusinessConfig(type).label}</p>
                          <p className="text-xs text-muted-foreground">{desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Country Selection */}
                <div className="space-y-2">
                  <Label>País *</Label>
                  <Select value={formData.countryCode} onValueChange={(v) => {
                    const country = countries.find(c => c.country_code === v);
                    if (country) {
                      setFormData(prev => ({
                        ...prev,
                        countryCode: v,
                        currencyCode: country.default_currency_code,
                        timezone: country.default_timezone,
                        locale: country.default_locale,
                      }));
                    }
                  }}>
                    <SelectTrigger><SelectValue placeholder="Selecione o país" /></SelectTrigger>
                    <SelectContent>
                      {countries.map(c => (
                        <SelectItem key={c.country_code} value={c.country_code}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Moeda: {formData.currencyCode} • Fuso: {formData.timezone}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Nome do estabelecimento *</Label>
                  <Input
                    id="name"
                    placeholder={formData.businessType === 'barbearia' ? 'Minha Barbearia' : 'Meu Salão'}
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Endereço (URL) *</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">/b/</span>
                    <Input
                      id="slug"
                      placeholder="meu-estabelecimento"
                      value={formData.slug}
                      onChange={(e) => handleInputChange('slug', e.target.value.toLowerCase())}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Seus clientes acessarão em: /b/{formData.slug || 'seu-endereco'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsappNumber">WhatsApp (opcional)</Label>
                  <Input
                    id="whatsappNumber"
                    placeholder={`${countries.find(c => c.country_code === formData.countryCode)?.phone_country_prefix || '+258'} 84 123 4567`}
                    value={formData.whatsappNumber}
                    onChange={(e) => handleInputChange('whatsappNumber', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Usado para enviar confirmações de agendamento
                  </p>
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => validateStep2() && setStep(3)}
                >
                  Continuar
                </Button>
              </div>
            )}

            {/* Step 3: Theme */}
            {step === 3 && (
              <div className="space-y-6">
                {/* Logo Upload */}
                <div className="space-y-2">
                  <Label>Logo (opcional)</Label>
                  <div className="flex items-center gap-4">
                    {formData.logoPreview ? (
                      <img 
                        src={formData.logoPreview} 
                        alt="Logo" 
                        className="w-16 h-16 rounded-full object-cover border-2 border-primary"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                        <Scissors className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleLogoChange}
                      />
                      <div className="flex items-center gap-2 px-4 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors">
                        <Upload className="w-4 h-4" />
                        <span className="text-sm">Enviar logo</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Colors */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Cor primária</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        id="primaryColor"
                        value={formData.primaryColor}
                        onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer border-0"
                      />
                      <Input
                        value={formData.primaryColor}
                        onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondaryColor">Cor secundária</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        id="secondaryColor"
                        value={formData.secondaryColor}
                        onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer border-0"
                      />
                      <Input
                        value={formData.secondaryColor}
                        onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="backgroundColor">Cor de fundo</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        id="backgroundColor"
                        value={formData.backgroundColor}
                        onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer border-0"
                      />
                      <Input
                        value={formData.backgroundColor}
                        onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="textColor">Cor do texto</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        id="textColor"
                        value={formData.textColor}
                        onChange={(e) => handleInputChange('textColor', e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer border-0"
                      />
                      <Input
                        value={formData.textColor}
                        onChange={(e) => handleInputChange('textColor', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Pré-visualização
                  </Label>
                  <ThemePreview />
                </div>

                <Button 
                  className="w-full" 
                  onClick={handleSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Criando barbearia...
                    </>
                  ) : (
                    'Criar Barbearia'
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
