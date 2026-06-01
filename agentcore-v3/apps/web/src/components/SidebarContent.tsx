// DEPRECATED: This component is replaced in the redesign/cto-style branch. Do not add new features here.
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Logo from './Logo';
import {
  LayoutDashboard,
  Bot,
  Workflow,
  BookOpen,
  Blocks,
  MessageSquare,
  ShoppingBag,
  CreditCard,
  Coins,
  Users,
  BarChart3,
  Settings,
  Search,
  LogOut,
  ChevronUp,
  Info,
} from 'lucide-react';

const navItems = [
  { label: 'Обзор', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Агенты', icon: Bot, href: '/dashboard/agents' },
  { label: 'Brain Map', icon: Workflow, href: '/dashboard/brain-map' },
  { label: 'База знаний', icon: BookOpen, href: '/dashboard/knowledge' },
  { label: 'Интеграции', icon: Blocks, href: '/dashboard/integrations' },
  { label: 'Диалоги', icon: MessageSquare, href: '/dashboard/conversations' },
  { label: 'Заказы', icon: ShoppingBag, href: '/dashboard/orders' },
  { label: 'Платежи', icon: CreditCard, href: '/dashboard/payments' },
  { label: 'Клиенты', icon: Users, href: '/dashboard/customers' },
  { label: 'Аналитика', icon: BarChart3, href: '/dashboard/analytics' },
  { label: 'Тарифы', icon: CreditCard, href: '/dashboard/billing' },
  { label: 'Баланс', icon: Coins, href: '/dashboard/credits' },
  { label: 'Настройки', icon: Settings, href: '/dashboard/settings' },
];

function getPlanBadge(planName: string | null, isTrialing: boolean, daysLeft: number) {
  if (isTrialing) {
    return {
      label: 'Пробный',
      className: 'bg-mauve-100 text-mauve-600 border-mauve-200/60',
      dotClass: 'bg-mauve-400',
      extra: daysLeft > 0 ? `${daysLeft} дн.` : null,
    };
  }
  switch ((planName || '').toUpperCase()) {
    case 'PRO':
      return { label: 'Pro', className: 'bg-emerald-100 text-emerald-600 border-emerald-200/60', dotClass: 'bg-emerald-400', extra: null };
    case 'ENTERPRISE':
      return { label: 'Enterprise', className: 'bg-ink-100 text-ink-600 border-ink-200/60', dotClass: 'bg-ink-400', extra: null };
    case 'FREE':
      return { label: 'Free', className: 'bg-sky-100 text-sky-600 border-sky-200/60', dotClass: 'bg-sky-400', extra: null };
    default:
      return { label: 'Пробный', className: 'bg-mauve-100 text-mauve-600 border-mauve-200/60', dotClass: 'bg-mauve-400', extra: null };
  }
}

export interface SidebarContentProps {
  isActive: (href: string) => boolean;
  balance: number;
  subscriptionActive: boolean;
  onOpenCommandPalette: () => void;
  planName: string | null;
  trialDaysLeft: number;
  isTrialing: boolean;
}

export default function SidebarContent({
  isActive,
  balance,
  subscriptionActive,
  onOpenCommandPalette,
  planName,
  trialDaysLeft,
  isTrialing,
}: SidebarContentProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const storedName = typeof window !== 'undefined' ? localStorage.getItem('userName') : null;
  const storedEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
  const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;

  let parsedUser: { name?: string; email?: string } | null = null;
  if (userStr) {
    try { parsedUser = JSON.parse(userStr); } catch { /* ignore */ }
  }

  const displayName = storedName || parsedUser?.name || null;
  const displayEmail = storedEmail || parsedUser?.email || null;
  const isLoadingUser = !displayName && !displayEmail;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [userMenuOpen]);

  const badge = getPlanBadge(planName, isTrialing, trialDaysLeft);

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-6 pb-5">
        <Link href="/dashboard" className="inline-flex">
          <Logo size={28} />
        </Link>
      </div>

      <nav className="flex-1 px-3 py-1 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                active
                  ? 'bg-mauve-100 text-mauve-600'
                  : 'text-ink-500 hover:text-ink-700 hover:bg-mauve-50/80'
              }`}
            >
              {active && (
                <motion.div
                  layoutId="active-border"
                  className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-mauve-500"
                  transition={{ type: 'spring', damping: 26, stiffness: 300 }}
                />
              )}
              <Icon
                size={18}
                className={`transition-colors duration-200 ${
                  active ? 'text-mauve-600' : 'text-ink-400 group-hover:text-ink-500'
                }`}
              />
              <span>{item.label}</span>
              {item.label === 'Диалоги' && (
                <div className="relative ml-0.5">
                  <Info size={12} className="text-ink-300 hover:text-ink-500 transition-colors cursor-help" />
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 px-3 py-2 bg-ink-800 text-white text-[10px] leading-relaxed rounded-xl whitespace-nowrap opacity-0 hover:opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none shadow-xl z-50">
                    История разговоров ваших AI-агентов с клиентами
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-ink-800 rotate-45 -mt-1" />
                  </div>
                </div>
              )}
              {active && (
                <motion.div
                  layoutId="active-indicator"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-mauve-600"
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 pb-1.5">
        <div className="h-px bg-gradient-to-r from-ink-100 via-ink-200/60 to-ink-100" />
      </div>

      <div className="px-3 py-3 space-y-2">
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg bg-white/60 hover:bg-white/90 border border-ink-200/50 hover:border-ink-300/50 transition-all duration-200 hover:shadow-sm"
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

        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setUserMenuOpen((prev) => !prev)}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg hover:bg-mauve-50/80 transition-colors duration-200 text-left"
            disabled={isLoadingUser}
          >
            {isLoadingUser ? (
              <>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-mauve-200 to-mauve-300 flex items-center justify-center flex-shrink-0 ring-2 ring-mauve-100/60 animate-pulse" />
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="h-3 w-20 bg-mauve-100 rounded animate-pulse" />
                  <div className="h-2.5 w-28 bg-mauve-50 rounded animate-pulse" />
                </div>
              </>
            ) : (
              <>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-mauve-200 to-mauve-300 flex items-center justify-center text-xs font-semibold text-mauve-700 flex-shrink-0 ring-2 ring-mauve-100/60">
                  {displayName?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-900 truncate leading-tight">{displayName || '\u2014'}</p>
                  <p className="text-[11px] text-ink-400 truncate leading-tight">{displayEmail || '\u2014'}</p>
                </div>
                <ChevronUp
                  size={14}
                  className={`text-ink-400 flex-shrink-0 transition-transform duration-200 ${
                    userMenuOpen ? 'rotate-180' : 'rotate-0'
                  }`}
                />
              </>
            )}
          </button>

          <AnimatePresence>
            {userMenuOpen && !isLoadingUser && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full left-2 right-2 mb-1 bg-white rounded-xl border border-ink-200/60 shadow-lg shadow-ink-900/5 overflow-hidden z-50"
              >
                <div className="p-3 border-b border-ink-100">
                  <p className="text-sm font-medium text-ink-900">{displayName}</p>
                  <p className="text-xs text-ink-500 mt-0.5">{displayEmail}</p>
                </div>
                <div className="py-1">
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-ink-600 hover:bg-mauve-50 transition-colors duration-150"
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
                  >
                    <LogOut size={15} />
                    Выйти
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="px-3">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-widest border ${badge.className}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`} />
            {badge.label}
            {badge.extra && (
              <span className="ml-0.5 opacity-70 normal-case tracking-normal">{badge.extra}</span>
            )}
          </span>
        </div>

        <div className="px-3 pt-0.5 pb-0.5">
          <div className="rounded-xl bg-gradient-to-br from-mauve-50 to-mauve-100 border border-mauve-200 p-3 hover:shadow-md hover:border-mauve-300 transition-all duration-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-mauve-500">Баланс AI</span>
              <span className="text-[10px] text-mauve-400">
                {subscriptionActive ? '+$10/мес' : 'Trial'}
              </span>
            </div>
            <div className="font-mono font-bold text-lg text-ink-900">${balance.toFixed(2)}</div>
            <Link href="/dashboard/credits" className="text-[10px] text-mauve-500 hover:text-mauve-600 mt-1 inline-block">
              Пополнить &rarr;
            </Link>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            localStorage.clear();
            window.location.href = '/login';
          }}
          className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm text-ink-400 hover:text-ink-600 hover:bg-mauve-50/80 transition-all duration-200"
        >
          <LogOut size={16} />
          <span>Выйти</span>
        </button>
      </div>
    </div>
  );
}
