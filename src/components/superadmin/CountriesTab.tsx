import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Save, Loader2, Globe } from 'lucide-react';

interface Country {
  country_code: string;
  name: string;
  default_currency_code: string;
  default_timezone: string;
  default_locale: string;
  phone_country_prefix: string | null;
  is_enabled: boolean;
}

export function CountriesTab() {
  const { toast } = useToast();
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingCode, setSavingCode] = useState<string | null>(null);

  useEffect(() => { fetchCountries(); }, []);

  const fetchCountries = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('countries' as any)
      .select('*')
      .order('name');
    if (!error && data) setCountries(data as unknown as Country[]);
    setIsLoading(false);
  };

  const handleUpdate = async (code: string, updates: Partial<Country>) => {
    setSavingCode(code);
    const { error } = await supabase
      .from('countries' as any)
      .update(updates as any)
      .eq('country_code', code);

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      setCountries(prev => prev.map(c => c.country_code === code ? { ...c, ...updates } : c));
      toast({ title: 'Salvo', description: `País ${code} atualizado.` });
    }
    setSavingCode(null);
  };

  const handleFieldChange = (code: string, field: keyof Country, value: any) => {
    setCountries(prev => prev.map(c => c.country_code === code ? { ...c, [field]: value } : c));
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Países Habilitados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Moeda</TableHead>
                  <TableHead>Fuso Horário</TableHead>
                  <TableHead>Prefixo</TableHead>
                  <TableHead>Ativo</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {countries.map(c => (
                  <TableRow key={c.country_code}>
                    <TableCell className="font-mono font-bold">{c.country_code}</TableCell>
                    <TableCell>
                      <Input
                        value={c.name}
                        onChange={(e) => handleFieldChange(c.country_code, 'name', e.target.value)}
                        className="w-32 h-8 text-sm"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={c.default_currency_code}
                        onChange={(e) => handleFieldChange(c.country_code, 'default_currency_code', e.target.value)}
                        className="w-20 h-8 text-sm"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={c.default_timezone}
                        onChange={(e) => handleFieldChange(c.country_code, 'default_timezone', e.target.value)}
                        className="w-40 h-8 text-sm"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={c.phone_country_prefix || ''}
                        onChange={(e) => handleFieldChange(c.country_code, 'phone_country_prefix', e.target.value || null)}
                        className="w-20 h-8 text-sm"
                        placeholder="+258"
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={c.is_enabled}
                        onCheckedChange={(v) => handleUpdate(c.country_code, { is_enabled: v })}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={savingCode === c.country_code}
                        onClick={() => handleUpdate(c.country_code, {
                          name: c.name,
                          default_currency_code: c.default_currency_code,
                          default_timezone: c.default_timezone,
                          phone_country_prefix: c.phone_country_prefix,
                        })}
                      >
                        {savingCode === c.country_code ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
