'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from './Logo';
import {
  Bot,
  Settings,
  LogOut,
  Users,
  MessageSquare,
  User,
  CreditCard,
  ChevronUp,
  BarChart3,
} from 'lucide-react';
import { Skeleton } from '@/design/components/Skeleton';

const navItems = [
  { label: 'Агенты', icon: Bot, href: '/agents' },
  { label: 'Аналитика', icon: BarChart3, href: '/dashboard/analytics' },
  { label: 'Команда', icon: Users, href: '/team' },
  { label: 'Поддержка', icon: MessageSquare, href: '/support' },
];

const userMenuItems = [
  { label: 'Профиль', icon: User, href: '/settings' },
  { label: 'Биллинг', icon: CreditCard, href: '/billing' },
  { label: 'Выйти', icon: LogOut, href: null },
];

export interface NewSidebarProps {
 onOpenCommandPalette?: () => void;
}

export default function NewSidebar({ onOpenCommandPalette }: NewSidebarProps) {
 const pathname = usePathname();
 const [userMenuOpen, setUserMenuOpen] = useState(false);
 const userMenuRef = useRef<HTMLDivElement>(null);
 const [balance, setBalance] = useState(0);

  useEffect(() => {
   const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';
   const token = localStorage.getItem('token');
   if (!token) return;
   const controller = new AbortController();
   fetch(`${API_BASE}/api/billing/balance`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: controller.signal,
   })
   .then((res) => {
     if (res.status === 401) {
       localStorage.removeItem('token');
       window.location.href = '/login';
       return Promise.reject(new Error('Unauthorized'));
     }
     return res.ok ? res.json() : Promise.reject(res);
   })
   .then((data) => setBalance(data.balance ?? 0))
   .catch(err => {
     if (err instanceof DOMException && err.name === 'AbortError') return;
      if (process.env.NODE_ENV === 'development') console.error('[NewSidebar] Failed to load balance:', err);
   });
   return () => controller.abort();
  }, []);

 useEffect(() => {
  if (userMenuOpen) {
   const handler = (e: MouseEvent) => {
    if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
     setUserMenuOpen(false);
    }
   };
   document.addEventListener('mousedown', handler);
   return () => document.removeEventListener('mousedown', handler);
  }
 }, [userMenuOpen]);

  const isActive = (href: string) => {
   if (!pathname) return false;
   if (href === '/agents') return pathname === '/agents' || pathname.startsWith('/agents/');
   return pathname.startsWith(href);
  };

  const [displayName, setDisplayName] = useState<string | null>(null);
  const [displayEmail, setDisplayEmail] = useState<string | null>(null);
  const isLoaded = displayName !== null && displayEmail !== null;

  useEffect(() => {
   const storedName = localStorage.getItem('userName');
   const storedEmail = localStorage.getItem('userEmail');
   const userStr = localStorage.getItem('user');
   let parsedUser: { name?: string; email?: string } | null = null;
   if (userStr) {
    try { parsedUser = JSON.parse(userStr); } catch { /* ignore */ }
   }
   setDisplayName(storedName || parsedUser?.name || null);
   setDisplayEmail(storedEmail || parsedUser?.email || null);
  }, []);

 return (
  <div className="flex flex-col h-full bg-surface/80 backdrop-blur-xl border-r border-border">
  <div className="px-5 pt-6 pb-5">
  <Link href="/agents" className="inline-flex" aria-label="На главную">
  <Logo size={24} />
  </Link>
  </div>

  <nav className="flex-1 px-3 py-1 space-y-0.5 overflow-y-auto" role="navigation" aria-label="Основная навигация">
  {navItems.map((item) => {
  const active = isActive(item.href);
  const Icon = item.icon;
  return (
  <Link
  key={item.href}
  href={item.href}
  className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
  active
  ? 'bg-accent-soft text-brand'
  : 'text-text-muted hover:text-text hover:bg-surface-2'
  }`}
  aria-current={active ? 'page' : undefined}
  >
  {active && (
  <motion.div
  layoutId="active-border"
  className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-brand"
  transition={{ type: 'spring', damping: 26, stiffness: 300 }}
  />
  )}
  <Icon
  size={18}
  className={`transition-colors duration-200 ${
  active ? 'text-brand' : 'text-text-muted group-hover:text-text-muted'
  }`}
  />
  <span>{item.label}</span>
  </Link>
  );
  })}
  </nav>

   <div className="mx-5 mb-2">
   <div className="h-px bg-border/40" />
   </div>

  <div className="px-3 py-2 space-y-2">
  {/* Balance Card */}
  <div className="rounded-card bg-gradient-to-br from-brand/10 to-brand/5 border border-brand/20 p-3">
  <div className="flex items-center justify-between mb-1">
  <span className="text-[10px] font-semibold uppercase tracking-wider text-brand">AI Баланс</span>
  <span className="text-[10px] text-brand/70">₽</span>
  </div>
  <div className="font-mono font-bold text-xl text-text mb-2">{balance.toFixed(2).replace('.', ',')}</div>
  <Link
    href="/billing"
    className="flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-lg bg-brand/15 hover:bg-brand/25 text-brand text-xs font-semibold transition-colors text-center"
  >
    Пополнить
  </Link>
  </div>

  {/* User Menu */}
  <div className="relative">
    <button
      onClick={() => setUserMenuOpen(!userMenuOpen)}
      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-2 transition-colors group w-full text-left"
      aria-haspopup="true"
      aria-expanded={userMenuOpen}
    >
      {isLoaded && displayName ? (
        <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center text-xs font-semibold flex-shrink-0 group-hover:scale-105 transition-transform">
          {displayName.charAt(0).toUpperCase()}
        </div>
      ) : !isLoaded ? (
        <Skeleton variant="avatar" width={32} height={32} />
      ) : (
        <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center text-xs font-semibold text-text-muted flex-shrink-0">?</div>
      )}
      <div className="flex-1 min-w-0">
        {isLoaded ? (
          <>
            <p className="text-sm font-medium text-text truncate leading-tight">{displayName}</p>
            <p className="text-[11px] text-text-muted truncate leading-tight">{displayEmail}</p>
          </>
        ) : (
          <div className="space-y-1.5 py-0.5">
            <Skeleton variant="text" width={96} height={14} />
            <Skeleton variant="text" width={128} height={10} />
          </div>
        )}
      </div>
      <ChevronUp size={14} className={`text-text-muted transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
    </button>
    <AnimatePresence>
      {userMenuOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden mt-1 mx-2 space-y-0.5"
        >
          {userMenuItems.map((item) =>
            item.href ? (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-muted hover:text-text hover:bg-surface-2 transition-colors"
                onClick={() => setUserMenuOpen(false)}
              >
                <item.icon size={15} />
                {item.label}
              </Link>
            ) : (
              <button
                key={item.label}
                type="button"
                onClick={async () => {
                  document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax;';
                  try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); } catch {}
                  localStorage.clear();
                  window.location.href = '/login';
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger-soft transition-colors w-full text-left rounded-lg"
              >
                <item.icon size={15} />
                {item.label}
              </button>
            )
          )}
        </motion.div>
      )}
    </AnimatePresence>
  </div>
  </div>
  </div>
  );
}
