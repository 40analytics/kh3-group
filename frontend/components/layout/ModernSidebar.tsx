'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/auth-context';
import {
  LayoutDashboard,
  Users,
  Target,
  Settings,
  Menu,
  X,
  Building2,
  Sparkles,
  ChevronRight,
  LogOut,
  User,
  KeyRound,
} from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  roles?: string[]; // If undefined, visible to all roles
  description?: string;
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Business performance (CEO view)',
    roles: ['CEO', 'ADMIN'], // CEO and Admin only
  },
  {
    title: 'Leads',
    href: '/leads',
    icon: Target,
    description: 'Sales pipeline',
    // Visible to all roles (but backend filters by role)
  },
  {
    title: 'Clients',
    href: '/clients',
    icon: Users,
    description: 'Client relationships',
    // Visible to all roles (but backend filters by role)
  },
  {
    title: 'Admin Panel',
    href: '/admin',
    icon: Settings,
    roles: ['CEO', 'ADMIN'],
    description: 'User & system management',
  },
];

export function ModernSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  // Get role display name
  const getRoleDisplayName = (role: string) => {
    const roleMap: Record<string, string> = {
      CEO: 'CEO',
      ADMIN: 'Admin',
      MANAGER: 'Unit Manager',
      SALES: 'Sales Executive',
    };
    return roleMap[role] || role;
  };

  // Filter navigation items based on user's actual role
  const filteredNavItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(user?.role || '');
  });

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-linear-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg">KHY CRM</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 mt-[57px]"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 z-40 h-screen w-80 bg-white border-r border-gray-200 transition-transform duration-300 lg:translate-x-0',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:top-0 mt-0 lg:mt-0'
        )}>
        <ScrollArea className="h-full">
          <div className="flex flex-col h-full">
            {/* Logo - Desktop only */}
            <div className="hidden lg:flex items-center gap-3 px-6 py-5 border-b border-gray-100">
              <div className="h-10 w-10 rounded-lg bg-linear-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg">KHY CRM</h1>
                <p className="text-xs text-muted-foreground">
                  Business Suite
                </p>
              </div>
            </div>

            {/* User Role Display */}
            <div className="p-4 lg:pt-6 mt-[57px] lg:mt-0">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                {user?.role === 'CEO' && (
                  <Sparkles className="h-4 w-4 text-purple-600" />
                )}
                {user?.role === 'ADMIN' && (
                  <Settings className="h-4 w-4 text-blue-600" />
                )}
                {user?.role === 'SALES' && (
                  <Target className="h-4 w-4 text-green-600" />
                )}
                {user?.role === 'MANAGER' && (
                  <Users className="h-4 w-4 text-orange-600" />
                )}
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Your Role
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {user?.role
                      ? getRoleDisplayName(user.role)
                      : 'Loading...'}
                  </p>
                </div>
              </div>
            </div>

            <Separator className="my-2" />

            {/* Navigation */}
            <nav className="flex-1 px-4 py-2 space-y-1">
              <div className="px-3 py-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Navigation
                </p>
              </div>
              {filteredNavItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group',
                      isActive
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 font-medium shadow-sm border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-50 hover:border hover:border-gray-200'
                    )}>
                    <Icon
                      className={cn(
                        'h-5 w-5 shrink-0',
                        isActive
                          ? 'text-blue-600'
                          : 'text-gray-500 group-hover:text-gray-700'
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          'text-sm',
                          isActive ? 'font-semibold' : 'font-medium'
                        )}>
                        {item.title}
                      </p>
                      {item.description && (
                        <p
                          className={cn(
                            'text-xs truncate',
                            isActive
                              ? 'text-blue-600/80'
                              : 'text-gray-500'
                          )}>
                          {item.description}
                        </p>
                      )}
                    </div>
                    {item.badge && (
                      <Badge
                        variant={isActive ? 'default' : 'secondary'}
                        className={cn(
                          'text-xs px-2',
                          isActive && 'bg-blue-600'
                        )}>
                        {item.badge}
                      </Badge>
                    )}
                    {isActive && (
                      <ChevronRight className="h-4 w-4 text-blue-600" />
                    )}
                  </Link>
                );
              })}

              {/* Role-based access indicator */}
              <div className="mt-6 px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <div className="shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">
                      Access Level:{' '}
                      {user?.role
                        ? getRoleDisplayName(user.role)
                        : 'Loading'}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {user?.role === 'CEO' &&
                        'Full system access to all features and data'}
                      {user?.role === 'ADMIN' &&
                        'System administration and user management'}
                      {user?.role === 'MANAGER' &&
                        'Access to team data and reports'}
                      {user?.role === 'SALES' &&
                        'Access to assigned leads and clients'}
                    </p>
                  </div>
                </div>
              </div>
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 space-y-3">
              {/* User Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 px-3 h-auto py-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-600 text-white text-xs">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left overflow-hidden">
                      <p className="text-sm font-medium truncate">
                        {user?.name || 'User'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user?.email || ''}
                      </p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      href="/settings/profile"
                      className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/settings/change-password"
                      className="cursor-pointer">
                      <KeyRound className="mr-2 h-4 w-4" />
                      <span>Change Password</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* AI Insights Card */}
              {/* <div className="p-3 rounded-lg bg-linear-to-br from-blue-50 to-indigo-50 border border-blue-200">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      AI-Powered Insights
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Get intelligent recommendations
                    </p>
                  </div>
                </div>
              </div> */}
            </div>
          </div>
        </ScrollArea>
      </aside>
    </>
  );
}
