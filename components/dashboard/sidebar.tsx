'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, CreditCard, Settings, LogOut, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { name: 'Mis Rifas', href: '/dashboard/rifas', icon: LayoutGrid },
  { name: 'Comprobantes', href: '/dashboard/comprobantes', icon: CreditCard },
  { name: 'Configuración', href: '/dashboard/configuracion', icon: Settings },
];

const adminNavItems = [
  { name: 'Clientes', href: '/admin/clients', icon: ShieldCheck },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-white/5 bg-background">
      <div className="flex h-full flex-col p-4">
        {/* User Profile */}
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand text-xl font-bold text-black">
            {user?.email?.[0].toUpperCase() || 'U'}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white">
              {user?.email?.split('@')[0] || 'Usuario'}
            </span>
            <span className="text-xs text-muted-foreground capitalize">
              {user?.role?.toLowerCase() || 'Organizador'}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-brand/10 text-brand"
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive ? "text-brand" : "text-muted-foreground")} />
                {item.name}
              </Link>
            );
          })}

          {user?.role === 'SUPERADMIN' && (
            <div className="pt-4">
              <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                Admin
              </p>
              {adminNavItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-brand/10 text-brand"
                        : "text-muted-foreground hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <item.icon className={cn("h-5 w-5", isActive ? "text-brand" : "text-muted-foreground")} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          )}
        </nav>

        {/* Logout */}
        <button
          onClick={logout}
          className="mt-auto flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-500 transition-all hover:bg-red-500/10"
        >
          <LogOut className="h-5 w-5" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
