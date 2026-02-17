import { useEffect, useState } from 'react';
import { useNavigate, Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdminBarbershop } from '@/hooks/useAdminBarbershop';
import { Logo } from '@/components/Logo';
import { SmartSummary } from '@/components/admin/SmartSummary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Calendar, 
  Users, 
  Scissors, 
  Settings, 
  LogOut,
  LayoutDashboard,
  UserCheck,
  Menu,
  Wallet,
  Clock,
  Shield,
  Search,
  Bell,
  Plus,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Receipt
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Helmet } from 'react-helmet-async';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { motion, AnimatePresence } from 'framer-motion';

interface NavItem {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const getNavItems = (professionalsLabel: string, isBarbershop: boolean, isAdmin: boolean): NavItem[] => {
  const items: NavItem[] = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Visão Geral' },
    { to: '/admin/dashboard/appointments', icon: Calendar, label: 'Agendamentos' },
    { to: '/admin/dashboard/barbers', icon: isBarbershop ? UserCheck : Sparkles, label: professionalsLabel },
    { to: '/admin/dashboard/schedules', icon: Clock, label: 'Horários' },
    { to: '/admin/dashboard/attendance', icon: UserCheck, label: 'Presença' },
    { to: '/admin/dashboard/accounts', icon: Users, label: 'Contas' },
    { to: '/admin/dashboard/services', icon: Scissors, label: 'Serviços' },
    { to: '/admin/dashboard/clients', icon: Users, label: 'Clientes' },
    { to: '/admin/dashboard/expenses', icon: Wallet, label: 'Despesas' },
    { to: '/admin/dashboard/receipts', icon: Receipt, label: 'Recibos' },
  ];
  
  if (isAdmin) {
    items.push({ to: '/admin/dashboard/managers', icon: Shield, label: 'Gerentes' });
    items.push({ to: '/admin/dashboard/settings', icon: Settings, label: 'Configurações' });
  }
  
  return items;
};

interface SidebarNavProps {
  navItems: NavItem[];
  collapsed: boolean;
  onItemClick?: () => void;
  onSignOut: () => void;
  onToggleCollapse?: () => void;
}

const SidebarNav = ({ navItems, collapsed, onItemClick, onSignOut, onToggleCollapse }: SidebarNavProps) => (
  <div className="flex flex-col h-full bg-[hsl(var(--dashboard-surface))] border-r border-white/[0.06]">
    {/* Logo */}
    <div className={cn(
      "flex items-center border-b border-white/[0.06] h-16 px-4",
      collapsed ? "justify-center" : "justify-between"
    )}>
      {!collapsed && <Logo size="sm" />}
      {collapsed && (
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <span className="text-primary font-display font-bold text-sm">AS</span>
        </div>
      )}
      {onToggleCollapse && !collapsed && (
        <button 
          onClick={onToggleCollapse}
          className="p-1.5 rounded-md hover:bg-white/[0.06] text-muted-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}
    </div>

    {/* Nav Items */}
    <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/admin/dashboard'}
          onClick={onItemClick}
          className={({ isActive }) =>
            cn(
              'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative',
              collapsed && 'justify-center px-2',
              isActive
                ? 'bg-[hsl(var(--dashboard-accent))]/10 text-[hsl(var(--dashboard-accent))]'
                : 'text-muted-foreground hover:bg-white/[0.04] hover:text-foreground'
            )
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl bg-[hsl(var(--dashboard-accent))]/10 border border-[hsl(var(--dashboard-accent))]/20"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
              <item.icon className={cn("w-5 h-5 relative z-10 flex-shrink-0", isActive && "drop-shadow-[0_0_6px_hsl(var(--dashboard-accent)/0.5)]")} />
              {!collapsed && <span className="relative z-10 truncate">{item.label}</span>}
            </>
          )}
        </NavLink>
      ))}
    </nav>

    {/* Collapse toggle (bottom) */}
    {onToggleCollapse && collapsed && (
      <div className="p-3 border-t border-white/[0.06]">
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-white/[0.06] text-muted-foreground transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    )}

    {/* Sign Out */}
    <div className="p-3 border-t border-white/[0.06]">
      <button
        onClick={onSignOut}
        className={cn(
          "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all duration-200",
          collapsed && "justify-center px-2"
        )}
      >
        <LogOut className="w-5 h-5 flex-shrink-0" />
        {!collapsed && <span>Sair</span>}
      </button>
    </div>
  </div>
);

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, isAdmin, isActiveManager, isLoading, signOut } = useAuth();
  const { barbershop } = useAdminBarbershop();
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const businessType = barbershop?.business_type || 'barbearia';
  const isBarbershop = businessType === 'barbearia';
  const professionalsLabel = isBarbershop ? 'Barbeiros' : 'Profissionais';
  const navItems = getNavItems(professionalsLabel, isBarbershop, isAdmin);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        setHasCheckedAuth(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  useEffect(() => {
    if (hasCheckedAuth && (!user || (!isAdmin && !isActiveManager))) {
      navigate('/login');
    }
  }, [hasCheckedAuth, user, isAdmin, isActiveManager, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const closeMenu = () => setMenuOpen(false);

  if (isLoading || !hasCheckedAuth) {
    return (
      <div className="min-h-screen bg-[hsl(var(--dashboard-bg))] flex items-center justify-center">
        <div className="animate-pulse">
          <Logo size="lg" />
        </div>
      </div>
    );
  }

  if (!user || (!isAdmin && !isActiveManager)) {
    return null;
  }

  const sidebarWidth = sidebarCollapsed ? 'w-[68px]' : 'w-64';

  return (
    <>
      <Helmet>
        <title>Dashboard - {barbershop?.name || 'Admin'}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-[hsl(var(--dashboard-bg))] flex">
        {/* Mobile Header */}
        {isMobile && (
          <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-[hsl(var(--dashboard-surface))]/80 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between px-4">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0 bg-[hsl(var(--dashboard-surface))] border-white/[0.06]">
                <SidebarNav
                  navItems={navItems}
                  collapsed={false}
                  onItemClick={closeMenu}
                  onSignOut={handleSignOut}
                />
              </SheetContent>
            </Sheet>
            <Logo size="sm" />
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[hsl(var(--dashboard-accent))]" />
            </Button>
          </header>
        )}

        {/* Desktop Sidebar */}
        {!isMobile && (
          <aside className={cn(
            "fixed h-full z-40 transition-all duration-300 ease-out",
            sidebarWidth
          )}>
            <SidebarNav
              navItems={navItems}
              collapsed={sidebarCollapsed}
              onSignOut={handleSignOut}
              onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
          </aside>
        )}

        {/* Main Content Area */}
        <div className={cn(
          "flex-1 flex flex-col min-h-screen transition-all duration-300",
          isMobile ? "pt-14" : sidebarCollapsed ? "ml-[68px]" : "ml-64"
        )}>
          {/* Desktop Topbar */}
          {!isMobile && (
            <motion.header
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="sticky top-0 z-30 h-16 bg-[hsl(var(--dashboard-bg))]/80 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between px-6 gap-4"
            >
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar clientes, agendamentos…"
                  className="pl-10 bg-white/[0.04] border-white/[0.08] rounded-xl h-10 text-sm focus:border-[hsl(var(--dashboard-accent))]/40 focus:ring-[hsl(var(--dashboard-accent))]/20 placeholder:text-muted-foreground/60"
                />
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/[0.06] text-[10px] text-muted-foreground font-mono">
                  ⌘K
                </kbd>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="rounded-xl bg-[hsl(var(--dashboard-accent))] hover:bg-[hsl(var(--dashboard-accent))]/90 text-white shadow-[0_0_20px_hsl(var(--dashboard-accent)/0.3)] hover:shadow-[0_0_30px_hsl(var(--dashboard-accent)/0.4)] transition-all duration-300"
                  onClick={() => navigate('/admin/dashboard/appointments')}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Novo Agendamento
                </Button>
                <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground rounded-xl">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[hsl(var(--dashboard-accent))] animate-pulse" />
                </Button>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[hsl(var(--dashboard-accent))] to-[hsl(var(--dashboard-accent))]/60 flex items-center justify-center text-white text-sm font-semibold cursor-pointer hover:opacity-90 transition-opacity">
                  {user?.email?.charAt(0).toUpperCase() || 'A'}
                </div>
              </div>
            </motion.header>
          )}

          {/* Page Content */}
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <SmartSummary />
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}
