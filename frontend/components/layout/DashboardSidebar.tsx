'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Settings,
  LogOut,
  Bell,
  Menu,
  ShieldCheck,
} from 'lucide-react';
import { Role } from '@/lib/types';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
  path: string;
}

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: [Role.CEO, Role.ADMIN, Role.MANAGER],
    path: '/dashboard',
  },
  {
    id: 'leads',
    label: 'Leads',
    icon: Briefcase,
    roles: [Role.CEO, Role.SALES, Role.MANAGER, Role.ADMIN],
    path: '/leads',
  },
  {
    id: 'clients',
    label: 'Clients',
    icon: Users,
    roles: [Role.CEO, Role.SALES, Role.MANAGER, Role.ADMIN],
    path: '/clients',
  },
  {
    id: 'admin',
    label: 'Admin',
    icon: Settings,
    roles: [Role.ADMIN, Role.CEO],
    path: '/admin',
  },
];

export default function DashboardSidebar() {
  const [currentRole, setRole] = useState<Role>(Role.CEO);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const filteredNav = navItems.filter((item) =>
    item.roles.includes(currentRole)
  );

  const handleNavigation = (path: string) => {
    router.push(path);
    setIsMobileMenuOpen(false);
  };

  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white shadow-xl">
        <div className="p-6 flex items-center space-x-2 border-b border-slate-800">
          <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <ShieldCheck className="text-white h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            KHY Group
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {filteredNav.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.path)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive(item.path)
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}>
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="mb-4">
            <label className="text-xs text-slate-500 uppercase font-semibold mb-2 block">
              View As (Demo)
            </label>
            <select
              className="w-full bg-slate-800 border border-slate-700 text-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={currentRole}
              onChange={(e) => setRole(e.target.value as Role)}>
              {Object.values(Role).map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-3 px-4 py-3 text-slate-400 hover:text-white cursor-pointer">
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <ShieldCheck className="text-white h-5 w-5" />
          </div>
          <span className="text-lg font-bold text-slate-900">
            KHY Group
          </span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-gray-600">
          <Menu className="h-6 w-6" />
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-slate-900 text-white z-50 p-4 shadow-xl">
          <nav className="space-y-2">
            {filteredNav.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg ${
                  isActive(item.path)
                    ? 'bg-blue-600'
                    : 'text-slate-400'
                }`}>
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="mt-4 pt-4 border-t border-slate-800">
            <select
              className="w-full bg-slate-800 border border-slate-700 text-slate-300 rounded px-2 py-2 text-sm"
              value={currentRole}
              onChange={(e) => {
                setRole(e.target.value as Role);
                setIsMobileMenuOpen(false);
              }}>
              {Object.values(Role).map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Desktop Top Bar */}
      <header className="hidden md:flex bg-white border-b border-gray-200 h-16 items-center justify-between px-8">
        <h1 className="text-xl font-bold text-gray-800 uppercase tracking-wide">
          {navItems.find((i) => isActive(i.path))?.label ||
            'Dashboard'}
        </h1>
        <div className="flex items-center space-x-4">
          <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border border-white"></span>
          </button>
          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
            {currentRole.charAt(0)}
          </div>
        </div>
      </header>
    </>
  );
}
