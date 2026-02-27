import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface Affiliate {
  id: string;
  name: string;
  referral_code: string | null;
  commission_percentage: number;
  commission_fixed: number;
}

interface Country {
  country_code: string;
  name: string;
  default_currency_code: string;
  default_timezone: string;
  default_locale: string;
  phone_country_prefix: string | null;
}

interface CreateBusinessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function CreateBusinessDialog({ open, onOpenChange, onCreated }: CreateBusinessDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [businessType, setBusinessType] = useState("barbearia");
  const [countryCode, setCountryCode] = useState("MZ");
  const [affiliateId, setAffiliateId] = useState<string>("");

  useEffect(() => {
    if (open) {
      fetchAffiliates();
      fetchCountries();
    }
  }, [open]);

  const fetchAffiliates = async () => {
    const { data } = await supabase
      .from("affiliates_agenda")
      .select("id, name, referral_code, commission_percentage, commission_fixed")
      .eq("active", true)
      .order("name");
    setAffiliates(data || []);
  };

  const fetchCountries = async () => {
    const { data } = await supabase
      .from("countries")
      .select("*")
      .eq("is_enabled", true)
      .order("name");
    setCountries(data || []);
  };

  const generateSlug = (value: string) => {
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleNameChange = (value: string) => {
    setName(value);
    setSlug(generateSlug(value));
  };

  const selectedCountry = countries.find(c => c.country_code === countryCode);

  const handleSubmit = async () => {
    if (!name.trim() || !slug.trim()) {
      toast({ title: "Erro", description: "Nome e slug são obrigatórios.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Create barbershop via RPC
      const { data: barbershopId, error: createError } = await supabase.rpc("create_barbershop", {
        p_name: name.trim(),
        p_slug: slug.trim(),
        p_whatsapp_number: whatsapp.trim() || null,
        p_owner_email: ownerEmail.trim() || null,
        p_business_type: businessType,
      });

      if (createError) throw createError;

      // Update country-specific fields + approve immediately
      const { error: updateError } = await supabase
        .from("barbershops")
        .update({
          country_code: countryCode,
          currency_code: selectedCountry?.default_currency_code || "MZN",
          timezone: selectedCountry?.default_timezone || "Africa/Maputo",
          locale: selectedCountry?.default_locale || "pt-MZ",
          owner_name: ownerName.trim() || null,
          approval_status: "approved",
          active: true,
        })
        .eq("id", barbershopId);

      if (updateError) throw updateError;

      // If affiliate selected, create referral
      if (affiliateId && affiliateId !== "none") {
        const { error: refError } = await supabase
          .from("affiliate_referrals")
          .insert({
            affiliate_id: affiliateId,
            business_id: barbershopId,
            status: "activated",
          } as any);

        if (refError) {
          console.error("Error creating referral:", refError);
          toast({ title: "Aviso", description: "Negócio criado, mas houve erro ao vincular afiliado." });
        }
      }

      toast({ title: "Sucesso", description: `Negócio "${name}" criado com sucesso.` });
      resetForm();
      onOpenChange(false);
      onCreated();
    } catch (error: any) {
      console.error("Error creating business:", error);
      toast({ title: "Erro", description: error.message || "Não foi possível criar o negócio.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setSlug("");
    setOwnerEmail("");
    setOwnerName("");
    setWhatsapp("");
    setBusinessType("barbearia");
    setCountryCode("MZ");
    setAffiliateId("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Negócio</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Nome do Negócio *</Label>
            <Input value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="Ex: Barbearia Premium" />
          </div>

          <div className="space-y-2">
            <Label>Slug (URL)</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="barbearia-premium" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>País</Label>
              <Select value={countryCode} onValueChange={setCountryCode}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {countries.map(c => (
                    <SelectItem key={c.country_code} value={c.country_code}>
                      {c.name} ({c.country_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Negócio</Label>
              <Select value={businessType} onValueChange={setBusinessType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="barbearia">Barbearia</SelectItem>
                  <SelectItem value="salao">Salão</SelectItem>
                  <SelectItem value="salao_barbearia">Salão & Barbearia</SelectItem>
                  <SelectItem value="estetica">Estética</SelectItem>
                  <SelectItem value="tattoo">Tattoo Studio</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome do Dono</Label>
              <Input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="João Silva" />
            </div>
            <div className="space-y-2">
              <Label>Email do Dono</Label>
              <Input type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} placeholder="joao@email.com" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>WhatsApp</Label>
            <Input
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder={`${selectedCountry?.phone_country_prefix || "+258"}xxxxxxxxx`}
            />
          </div>

          <div className="space-y-2">
            <Label>Afiliado (opcional)</Label>
            <Select value={affiliateId} onValueChange={setAffiliateId}>
              <SelectTrigger><SelectValue placeholder="Sem afiliado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem afiliado</SelectItem>
                {affiliates.map(a => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name} {a.referral_code ? `(${a.referral_code})` : ""} — {a.commission_percentage}%
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Se selecionado, um vínculo será criado em affiliate_referrals com status "activated".
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar Negócio
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
