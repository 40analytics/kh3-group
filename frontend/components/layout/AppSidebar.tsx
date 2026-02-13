'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Target,
  Building2,
  UserCog,
  UsersRound,
  Shield,
  Bot,
  FileText,
  Monitor,
  ChevronRight,
  ChevronLeft,
  LogOut,
  User,
  KeyRound,
  ChevronsUpDown,
  PanelLeft,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

// --- Sidebar context ---
type SidebarContextType = {
  collapsed: boolean;
  toggle: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
};

const SidebarContext = createContext<SidebarContextType | null>(null);

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider');
  return ctx;
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const toggle = useCallback(() => setCollapsed((c) => !c), []);

  return (
    <SidebarContext.Provider value={{ collapsed, toggle, mobileOpen, setMobileOpen }}>
      <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
    </SidebarContext.Provider>
  );
}

// Trigger button for the header
export function SidebarTrigger({ className }: { className?: string }) {
  const { toggle, setMobileOpen } = useSidebar();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn('h-8 w-8', className)}
      onClick={() => (isMobile ? setMobileOpen(true) : toggle())}
    >
      <PanelLeft className="h-4 w-4" />
      <span className="sr-only">Toggle sidebar</span>
    </Button>
  );
}

// --- Nav data ---
const mainNavItems = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Leads', href: '/leads', icon: Target },
  { title: 'Clients', href: '/clients', icon: Building2 },
];

const adminSubItems = [
  { title: 'Users', href: '/admin/users', icon: UserCog },
  { title: 'Teams', href: '/admin/teams', icon: UsersRound },
  { title: 'Permissions', href: '/admin/permissions', icon: Shield },
  { title: 'AI Settings', href: '/admin/ai-settings', icon: Bot },
  { title: 'Audit Logs', href: '/admin/audit-logs', icon: FileText },
  { title: 'System', href: '/admin/system', icon: Monitor },
];

// --- NavItem component ---
function NavItem({
  item,
  isActive,
  collapsed,
  onClick,
}: {
  item: { title: string; href: string; icon: React.ElementType };
  isActive: boolean;
  collapsed: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;

  const link = (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
        collapsed && 'justify-center px-2',
        isActive
          ? 'bg-accent-red/10 text-foreground font-medium border-l-2 border-l-accent-red'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span>{item.title}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right">{item.title}</TooltipContent>
      </Tooltip>
    );
  }

  return link;
}

// --- Sidebar content (shared between desktop and mobile) ---
function SidebarNav({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const isAdmin = user?.role && ['CEO', 'ADMIN', 'MANAGER'].includes(user.role);
  const isAdminRoute = pathname.startsWith('/admin');

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const getUserInitials = () => {
    if (!user?.name) return 'U';
    return user.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header / Logo */}
      <div className={cn('flex items-center gap-2.5 border-b border-border px-4 py-4', collapsed && 'justify-center px-2')}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground text-background">
          <span className="font-display text-sm font-semibold">
            K<span className="text-[#FF0011]">3</span>
          </span>
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-none">
            <span className="font-display font-semibold">KH3</span>
            <span className="text-[10px] text-muted-foreground tracking-widest uppercase">CRM</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <ScrollArea className="flex-1 py-3">
        <div className="space-y-4 px-2">
          {/* Main group */}
          <div className="space-y-1">
            {!collapsed && (
              <p className="px-3 pb-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Main
              </p>
            )}
            {mainNavItems.map((item) => (
              <NavItem
                key={item.href}
                item={item}
                isActive={pathname === item.href}
                collapsed={collapsed}
                onClick={onNavigate}
              />
            ))}
          </div>

          {/* Admin group */}
          {isAdmin && (
            <div className="space-y-1">
              {collapsed ? (
                <>
                  <div className="mx-2 my-2 border-t border-border" />
                  {adminSubItems.map((item) => (
                    <NavItem
                      key={item.href}
                      item={item}
                      isActive={pathname === item.href}
                      collapsed={collapsed}
                      onClick={onNavigate}
                    />
                  ))}
                </>
              ) : (
                <Collapsible defaultOpen={isAdminRoute}>
                  <CollapsibleTrigger className="flex w-full items-center px-3 pb-1 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors">
                    Admin
                    <ChevronRight className="ml-auto h-3.5 w-3.5 transition-transform duration-200 [[data-state=open]>&]:rotate-90" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1">
                    {adminSubItems.map((item) => (
                      <NavItem
                        key={item.href}
                        item={item}
                        isActive={pathname === item.href}
                        collapsed={false}
                        onClick={onNavigate}
                      />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer / User */}
      <div className="border-t border-border p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted transition-colors text-left',
                collapsed && 'justify-center px-2'
              )}
            >
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email || ''}</p>
                  </div>
                  <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align={collapsed ? 'center' : 'end'}
            side={collapsed ? 'right' : 'top'}
            className="w-56"
          >
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings/profile" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings/change-password" className="cursor-pointer">
                <KeyRound className="mr-2 h-4 w-4" />
                Change Password
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// --- Main AppSidebar ---
export function AppSidebar() {
  const { collapsed, toggle, mobileOpen, setMobileOpen } = useSidebar();

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden lg:flex h-screen shrink-0 flex-col border-r border-border bg-card transition-[width] duration-200 ease-linear',
          collapsed ? 'w-[52px]' : 'w-60'
        )}
      >
        <SidebarNav collapsed={collapsed} />
        {/* Collapse rail / button */}
        <button
          onClick={toggle}
          className="hidden lg:flex items-center justify-center h-8 border-t border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ChevronLeft
            className={cn(
              'h-4 w-4 transition-transform duration-200',
              collapsed && 'rotate-180'
            )}
          />
        </button>
      </aside>

      {/* Mobile sidebar (sheet) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
            <SheetDescription>Main navigation menu</SheetDescription>
          </SheetHeader>
          <SidebarNav collapsed={false} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
