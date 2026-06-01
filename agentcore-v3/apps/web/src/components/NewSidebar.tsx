'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from './Logo';
import {
  Bot,
  Brain,
  BookOpen,
  Settings,
  Search,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react';

const navItems = [
  { label: 'Агенты', icon: Bot, href: '/agents' },
  { label: 'Brain Map', icon: Brain, href: '/agents/brain-map' },
  { label: 'База знаний', icon: BookOpen, href: '/knowledge' },
  { label: 'Настройки', icon: Settings, href: '/settings' },
];

export interface NewSidebarProps {
  onOpenCommandPalette: () => void;
}

export default function NewSidebar({ onOpenCommandPalette }: NewSidebarProps) {
  const pathname = usePathname();
  const [dark, setDark] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDark(true);
    }
  }, []);

  useEffect(() => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${API_BASE}/api/billing/suggy-balance`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => setBalance(data.balance ?? 0))
      .catch(() => {});
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

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', next);
  };

  const isActive = (href: string) => {
    if (href === '/agents') return pathname === '/agents' || pathname.startsWith('/agents/');
    return pathname.startsWith(href);
  };

  const storedName = typeof window !== 'undefined' ? localStorage.getItem('userName') : null;
  const storedEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
  const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  let parsedUser: { name?: string; email?: string } | null = null;
  if (userStr) {
    try { parsedUser = JSON.parse(userStr); } catch { /* ignore */ }
  }
  const displayName = storedName || parsedUser?.name || null;
  const displayEmail = storedEmail || parsedUser?.email || null;

  return (
    <div className="flex flex-col h-full bg-white/80 dark:bg-surface/80 backdrop-blur-xl border-r border-ink-200/40 dark:border-ink-700/40">
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
                  ? 'bg-[var(--brand-light,theme(colors.mauve.100))] text-[var(--brand,theme(colors.mauve.600))]'
                  : 'text-ink-500 hover:text-ink-700 hover:bg-surface-2'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              {active && (
                <motion.div
                  layoutId="active-border"
                  className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-[var(--brand,theme(colors.mauve.500))]"
                  transition={{ type: 'spring', damping: 26, stiffness: 300 }}
                />
              )}
              <Icon
                size={18}
                className={`transition-colors duration-200 ${
                  active ? 'text-[var(--brand,theme(colors.mauve.600))]' : 'text-ink-400 group-hover:text-ink-500'
                }`}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-2">
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg bg-white/60 hover:bg-white/90 border border-ink-200/50 hover:border-ink-300/50 transition-all duration-200 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-[var(--brand,theme(colors.mauve.500))] focus-visible:ring-offset-1"
          aria-label="Открыть быстрый поиск"
          role="search"
        >
          <div className="flex items-center gap-2.5 text-xs text-ink-500">
            <Search size={14} />
            <span>Быстрый поиск...</span>
          </div>
          <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-ink-100/70 border border-ink-200/60 text-[10px] font-medium tracking-wide text-ink-400">
            <span className="text-[11px]">&#8984;</span>
            <span>K</span>
          </div>
        </button>
      </div>

      <div className="mx-5 mb-2">
        <div className="h-px bg-ink-200/40" />
      </div>

      <div className="px-3 py-2 space-y-2">
        <div className="rounded-[var(--radius-card,1rem)] bg-surface-2 p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">Баланс</span>
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1 rounded-md hover:bg-ink-100 transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[var(--brand,theme(colors.mauve.500))] focus-visible:ring-offset-1"
              aria-label={dark ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'}
            >
              {dark ? <Sun size={12} className="text-ink-400" /> : <Moon size={12} className="text-ink-400" />}
            </button>
          </div>
          <div className="font-mono font-bold text-lg text-ink-900">${balance.toFixed(2)}</div>
          <Link
            href="/settings/billing"
            className="text-[10px] text-[var(--brand,theme(colors.mauve.500))] hover:text-[var(--brand,theme(colors.mauve.600))] mt-1 inline-block transition-colors duration-200"
            aria-label="Пополнить баланс"
          >
            Пополнить &rarr;
          </Link>
        </div>

        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setUserMenuOpen((prev) => !prev)}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg hover:bg-surface-2 transition-colors duration-200 text-left focus-visible:ring-2 focus-visible:ring-[var(--brand,theme(colors.mauve.500))] focus-visible:ring-offset-1"
            aria-expanded={userMenuOpen}
            aria-haspopup="true"
            aria-label="Меню пользователя"
          >
            <div className="w-8 h-8 rounded-full bg-[var(--brand,theme(colors.mauve.600))] text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
              {displayName?.charAt(0).toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink-900 truncate leading-tight">{displayName || '\u2014'}</p>
              <p className="text-[11px] text-ink-400 truncate leading-tight">{displayEmail || '\u2014'}</p>
            </div>
          </button>

          <AnimatePresence>
            {userMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full left-2 right-2 mb-1 bg-white rounded-xl border border-ink-200/60 shadow-lg shadow-ink-900/5 overflow-hidden z-50"
                role="menu"
              >
                <div className="py-1">
                  <Link
                    href="/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-ink-600 hover:bg-surface-2 transition-colors duration-150"
                    role="menuitem"
                  >
                    <Settings size={15} className="text-ink-400" />
                    Настройки
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.clear();
                      window.location.href = '/login';
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150 w-full text-left"
                    role="menuitem"
                  >
                    <LogOut size={15} />
                    Выйти
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
