import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Users, Search, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';

interface Client {
  client_name: string;
  client_phone_masked: string;
  appointment_count: number;
  last_appointment: string;
}

export default function ClientsList() {
  const { barbershopId } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (barbershopId) {
      fetchClients();
    }
  }, [barbershopId]);

  const fetchClients = async () => {
    if (!barbershopId) return;
    
    setIsLoading(true);
    const { data, error } = await supabase
      .rpc('get_clients_for_barbershop', { p_barbershop_id: barbershopId });

    if (error) {
      console.error('Error fetching clients:', error);
      setIsLoading(false);
      return;
    }

    setClients((data || []).map((d: any) => ({
      client_name: d.client_name,
      client_phone_masked: d.client_phone_masked,
      appointment_count: Number(d.appointment_count),
      last_appointment: d.last_appointment,
    })));
    setIsLoading(false);
  };

  const filteredClients = clients.filter((client) =>
    client.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.client_phone_masked.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-bold text-foreground">Clientes</h1>
      </div>

      {/* Search */}
      <Card className="border-border/50 bg-card/80">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-input border-border"
            />
          </div>
        </CardContent>
      </Card>

      {/* Clients List */}
      <Card className="border-border/50 bg-card/80">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Lista de Clientes ({filteredClients.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : filteredClients.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhum cliente encontrado.</p>
          ) : (
            <div className="space-y-4">
              {filteredClients.map((client, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                      <span className="text-primary font-medium">
                        {client.client_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{client.client_name}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {client.client_phone_masked}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-foreground font-medium">{client.appointment_count} agendamento(s)</p>
                    <p className="text-sm text-muted-foreground">
                      Último: {format(new Date(client.last_appointment), "dd 'de' MMM", { locale: pt })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
