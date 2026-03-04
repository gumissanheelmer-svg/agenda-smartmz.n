import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAdminBarbershop } from '@/hooks/useAdminBarbershop';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Notification {
  id: string;
  event_type: string;
  title: string;
  body: string;
  metadata: Record<string, any>;
  read: boolean;
  created_at: string;
  appointment_id: string | null;
}

export function NotificationBell({ className }: { className?: string }) {
  const { barbershop } = useAdminBarbershop();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (!barbershop?.id) return;
    fetchNotifications();

    // Realtime subscription
    const channel = supabase
      .channel('admin-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_notifications',
          filter: `barbershop_id=eq.${barbershop.id}`,
        },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [barbershop?.id]);

  const fetchNotifications = async () => {
    if (!barbershop?.id) return;
    const { data } = await supabase
      .from('admin_notifications')
      .select('*')
      .eq('barbershop_id', barbershop.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setNotifications((data as Notification[]) || []);
  };

  const markAsRead = async (id: string) => {
    await supabase
      .from('admin_notifications')
      .update({ read: true } as any)
      .eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = async () => {
    if (!barbershop?.id) return;
    await supabase
      .from('admin_notifications')
      .update({ read: true } as any)
      .eq('barbershop_id', barbershop.id)
      .eq('read', false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClick = (notif: Notification) => {
    markAsRead(notif.id);
    setOpen(false);
    if (notif.appointment_id) {
      navigate(`/admin/dashboard/appointments?focus=${notif.appointment_id}`);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'CODE_SUBMITTED': return '💳';
      case 'NEW_PENDING': return '📋';
      default: return '🔔';
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("relative text-muted-foreground hover:text-foreground rounded-xl", className)}>
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-[hsl(var(--dashboard-accent))] text-[10px] font-bold text-white flex items-center justify-center px-1 animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-[hsl(var(--dashboard-surface))] border-white/[0.08]" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <h3 className="text-sm font-semibold text-foreground">Notificações</h3>
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className="text-xs text-[hsl(var(--dashboard-accent))] hover:underline">
              Marcar todas como lidas
            </button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Nenhuma notificação
            </div>
          ) : (
            notifications.map(notif => (
              <button
                key={notif.id}
                onClick={() => handleClick(notif)}
                className={cn(
                  "w-full text-left px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.04] transition-colors",
                  !notif.read && "bg-[hsl(var(--dashboard-accent))]/5"
                )}
              >
                <div className="flex gap-3">
                  <span className="text-lg mt-0.5">{getEventIcon(notif.event_type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm truncate", !notif.read ? "font-semibold text-foreground" : "text-muted-foreground")}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 whitespace-pre-line">
                      {notif.metadata?.client_name && `${notif.metadata.client_name} • `}
                      {notif.metadata?.service_name || ''}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                  {!notif.read && (
                    <span className="w-2 h-2 rounded-full bg-[hsl(var(--dashboard-accent))] mt-2 flex-shrink-0" />
                  )}
                </div>
              </button>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
