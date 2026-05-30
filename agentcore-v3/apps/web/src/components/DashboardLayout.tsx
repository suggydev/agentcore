'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from './Logo';
import {
  LayoutDashboard,
  Bot,
  Workflow,
  BookOpen,
  Blocks,
  MessageSquare,
  BarChart3,
  CreditCard,
  Settings,
  Search,
  Menu,
  X,
  LogOut,
  ChevronUp,
} from 'lucide-react';

const navItems = [
  { label: 'Overview', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Agents', icon: Bot, href: '/dashboard/agents' },
  { label: 'Brain Map', icon: Workflow, href: '/dashboard/brain-map' },
  { label: 'Knowledge', icon: BookOpen, href: '/dashboard/knowledge' },
  { label: 'Integrations', icon: Blocks, href: '/dashboard/integrations' },
  { label: 'Conversations', icon: MessageSquare, href: '/dashboard/conversations' },
  { label: 'Analytics', icon: BarChart3, href: '/dashboard/analytics' },
  { label: 'Billing', icon: CreditCard, href: '/dashboard/billing' },
  { label: 'Settings', icon: Settings, href: '/dashboard/settings' },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const toggleMobile = useCallback(() => setMobileOpen((prev) => !prev), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMobile();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeMobile]);

  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-ink-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-[240px] flex-col z-40 bg-white/75 backdrop-blur-2xl backdrop-saturate-150 border-r border-ink-200/40">
        <SidebarContent isActive={isActive} />
      </aside>

      {/* Mobile Toggle */}
      <button
        type="button"
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-white/80 backdrop-blur-xl border border-ink-200/40 shadow-sm hover:shadow-md transition-shadow duration-200"
        onClick={toggleMobile}
        aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
      >
        {mobileOpen ? <X size={20} className="text-ink-700" /> : <Menu size={20} className="text-ink-700" />}
      </button>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-ink-900/20 backdrop-blur-sm z-40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeMobile}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 w-[280px] z-50 bg-white/90 backdrop-blur-2xl backdrop-saturate-150 border-r border-ink-200/40 flex flex-col lg:hidden shadow-2xl"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <SidebarContent isActive={isActive} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="lg:ml-[240px] min-h-screen">{children}</main>
    </div>
  );
}

function SidebarContent({ isActive }: { isActive: (href: string) => boolean }) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5">
        <Link href="/dashboard" className="inline-flex">
          <Logo size={28} />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-1 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                active
                  ? 'bg-mauve-100 text-mauve-600'
                  : 'text-ink-500 hover:text-ink-700 hover:bg-mauve-50/80'
              }`}
            >
              <Icon
                size={18}
                className={`transition-colors duration-200 ${
                  active ? 'text-mauve-600' : 'text-ink-400 group-hover:text-ink-500'
                }`}
              />
              <span>{item.label}</span>
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

      {/* Divider */}
      <div className="px-4 pb-1">
        <div className="h-px bg-gradient-to-r from-transparent via-ink-200/50 to-transparent" />
      </div>

      {/* Bottom Section */}
      <div className="px-3 py-4 space-y-2.5">
        {/* Command Palette Trigger */}
        <button
          type="button"
          className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg bg-white/60 hover:bg-white/90 border border-ink-200/50 hover:border-ink-300/50 transition-all duration-200 hover:shadow-sm"
        >
          <div className="flex items-center gap-2.5 text-xs text-ink-500">
            <Search size={14} />
            <span>Quick search...</span>
          </div>
          <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-ink-100/70 border border-ink-200/60 text-[10px] font-medium tracking-wide text-ink-400">
            <span className="text-[11px]">&#8984;</span>
            <span>K</span>
          </div>
        </button>

        {/* User Section */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-mauve-50/80 transition-colors duration-200 cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-mauve-200 to-mauve-300 flex items-center justify-center text-xs font-semibold text-mauve-700 flex-shrink-0 ring-2 ring-mauve-100/60">
            U
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink-900 truncate leading-tight">User Name</p>
            <p className="text-[11px] text-ink-400 truncate leading-tight">user@email.com</p>
          </div>
          <ChevronUp size={14} className="text-ink-400 flex-shrink-0" />
        </div>

        {/* Plan Badge */}
        <div className="px-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-widest bg-mauve-100 text-mauve-600 border border-mauve-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-mauve-400" />
            Trial
          </span>
        </div>

        {/* Sign Out */}
        <button
          type="button"
          className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm text-ink-400 hover:text-ink-600 hover:bg-mauve-50/80 transition-all duration-200"
        >
          <LogOut size={16} />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );
}
