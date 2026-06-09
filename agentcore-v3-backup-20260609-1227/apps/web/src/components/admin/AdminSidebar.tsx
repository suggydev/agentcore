'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '@/components/Logo';
import {
  LayoutDashboard,
  Users,
  Building2,
  BarChart3,
  CreditCard,
  Settings,
  Bell,
  ArrowLeft,
  X,
  ChevronRight,
  FileText,
} from 'lucide-react';

interface AdminSidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const navItems = [
  { label: 'Обзор', icon: LayoutDashboard, href: '/admin' },
  { label: 'Пользователи', icon: Users, href: '/admin/users' },
  { label: 'Рабочие пространства', icon: Building2, href: '/admin/workspaces' },
  { label: 'Аналитика', icon: BarChart3, href: '/admin/analytics' },
  { label: 'Биллинг', icon: CreditCard, href: '/admin/billing' },
  { label: 'Система', icon: Settings, href: '/admin/system' },
  { label: 'Алерты', icon: Bell, href: '/admin/alerts' },
  { label: 'Правовая информация', icon: FileText, href: '/admin/legal' },
];

export default function AdminSidebar({ mobileOpen, onCloseMobile }: AdminSidebarProps) {
  const pathname = usePathname();
  const [unresolvedAlerts, setUnresolvedAlerts] = useState(0);

  useEffect(() => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${API_BASE}/api/admin/alerts?resolved=false&limit=1`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => setUnresolvedAlerts(data.total ?? 0))
      .catch(() => { /* ignore */ });
  }, []);

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-surface/80 backdrop-blur-xl border-r border-border">
      <div className="px-5 pt-6 pb-5 flex items-center justify-between">
        <Link href="/agents" className="inline-flex" aria-label="На главную">
          <Logo size={24} />
        </Link>
        <Link
          href="/agents"
          className="flex items-center gap-1 text-xs text-text-muted hover:text-text transition-colors"
          aria-label="Вернуться в приложение"
        >
          <ArrowLeft size={14} />
          <span>Назад</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-1 space-y-0.5 overflow-y-auto" role="navigation" aria-label="Admin navigation">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                active
                  ? 'bg-accent-soft text-brand'
                  : 'text-text-muted hover:text-text hover:bg-surface-2'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              {active && (
                <motion.div
                  layoutId="admin-active-border"
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
              <span className="flex-1">{item.label}</span>
              {item.href === '/admin/alerts' && unresolvedAlerts > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-semibold rounded-full bg-danger text-white">
                  {unresolvedAlerts}
                </span>
              )}
              <ChevronRight
                size={14}
                className={`transition-transform duration-200 ${
                  active ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-1'
                }`}
              />
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-3">
        <div className="h-px bg-border/40" />
        <div className="mt-3 px-3 py-2 rounded-lg bg-surface-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Админ-панель</p>
          <p className="text-xs text-text-secondary mt-0.5">AgentCore v3</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-[220px] flex-col z-40">
        {sidebarContent}
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-surface-2/80 backdrop-blur-md z-40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={onCloseMobile}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 w-[260px] z-50 flex flex-col lg:hidden shadow-2xl"
              initial={{ x: '-105%' }}
              animate={{ x: 0 }}
              exit={{ x: '-105%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            >
              {sidebarContent}
              <button
                type="button"
                className="absolute top-4 right-4 p-2.5 rounded-xl bg-surface border border-border text-text-muted hover:text-text hover:bg-surface-2 transition-colors duration-200 lg:hidden focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1"
                onClick={onCloseMobile}
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
