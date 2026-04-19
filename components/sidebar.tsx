'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, Upload, Settings, Wrench, ChevronLeft, ChevronRight, Wallet, LogOut, Menu, X, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/records', label: 'Records', icon: FileText },
  { href: '/paychecks', label: 'Paychecks', icon: Wallet },
  { href: '/upload', label: 'Upload CSV', icon: Upload },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = useSession() || {};
  const role = (session?.user as any)?.role;

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const allItems = role === 'admin'
    ? [...navItems, { href: '/admin', label: 'Admin', icon: Users }]
    : navItems;

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#1e3a5f] text-white flex items-center px-4 z-50 shadow-lg">
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-1.5 hover:bg-white/10 rounded-lg">
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
        <div className="flex items-center gap-2 ml-3">
          <Wrench className="h-5 w-5 text-amber-400" />
          <span className="font-bold">MechDash</span>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed md:sticky top-0 h-screen flex flex-col bg-[#1e3a5f] text-white transition-all duration-300 shadow-xl z-50',
        // Mobile: slide in/out
        'md:translate-x-0',
        mobileOpen ? 'translate-x-0 w-60' : '-translate-x-full w-60',
        // Desktop: collapsible
        'md:block',
        collapsed ? 'md:w-16' : 'md:w-60',
        // Mobile: push below top bar
        'top-14 md:top-0',
        'h-[calc(100vh-3.5rem)] md:h-screen'
      )}>
        {/* Desktop header */}
        <div className="hidden md:flex items-center gap-2 p-4 border-b border-white/10">
          <Wrench className="h-7 w-7 text-amber-400 flex-shrink-0" />
          {!collapsed && <span className="text-lg font-bold tracking-tight">MechDash</span>}
        </div>
        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {allItems.map((item) => {
            const active = pathname?.startsWith?.(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {(!collapsed || mobileOpen) && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10">
          {(!collapsed || mobileOpen) && session?.user?.name && (
            <div className="px-4 py-2 text-xs text-white/50 truncate">
              {session.user.name}
              {role === 'admin' && <span className="ml-1 text-amber-400">(Admin)</span>}
            </div>
          )}
          <div className="flex items-center">
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex-1 flex items-center gap-2 px-4 py-2.5 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              {(!collapsed || mobileOpen) && <span>Sign Out</span>}
            </button>
            {/* Desktop collapse button */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:block p-2.5 hover:bg-white/10 transition-colors"
            >
              {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
