'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import SidebarContent from './SidebarContent';
import { useAgentStore } from '@/store/agentStore';
import { Menu, X } from 'lucide-react';

const CommandPalette = dynamic(() => import('./CommandPalette'), { ssr: false });
const OnboardingTour = dynamic(() => import('./OnboardingTour'), { ssr: false });

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [balance, setBalance] = useState(0);
  const [subscriptionActive, setSubscriptionActive] = useState(false);
  const onboardingTourCompleted = useAgentStore((s) => s.onboardingTourCompleted);
  const [showTour, setShowTour] = useState(false);
  const [planName, setPlanName] = useState<string | null>(null);
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);
  const [isTrialing, setIsTrialing] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';
    const token = localStorage.getItem('token');
    if (!token) return;

    Promise.allSettled([
      fetch(`${API_BASE}/api/billing/suggy-balance`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => (res.ok ? res.json() : Promise.reject(res))),
      fetch(`${API_BASE}/api/billing/plan`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => (res.ok ? res.json() : Promise.reject(res))),
      fetch(`${API_BASE}/api/billing/trial-status`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => (res.ok ? res.json() : Promise.reject(res))),
    ]).then((results) => {
      const [balanceResult, planResult, trialResult] = results;
      if (balanceResult.status === 'fulfilled') {
        setBalance(balanceResult.value.balance ?? 0);
        setSubscriptionActive(balanceResult.value.subscriptionActive ?? false);
      }
      if (planResult.status === 'fulfilled') {
        setPlanName(planResult.value.name ?? null);
      }
      if (trialResult.status === 'fulfilled') {
        setTrialDaysLeft(trialResult.value.daysLeft ?? 0);
        setIsTrialing(trialResult.value.isTrialing ?? false);
      }
    });

    if (!onboardingTourCompleted && pathname === '/dashboard') {
      setShowTour(true);
    }
  }, [pathname]);

  const toggleMobile = useCallback(() => setMobileOpen((prev) => !prev), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
        return;
      }
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
    <div className="min-h-screen bg-[#F8F9FB]">
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-[240px] flex-col z-40 bg-white/75 backdrop-blur-2xl backdrop-saturate-150 border-r border-ink-200/40">
        <SidebarContent
          isActive={isActive}
          balance={balance}
          subscriptionActive={subscriptionActive}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          planName={planName}
          trialDaysLeft={trialDaysLeft}
          isTrialing={isTrialing}
        />
      </aside>

      <button
        type="button"
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-white/80 backdrop-blur-xl border border-ink-200/40 shadow-sm hover:shadow-md transition-shadow duration-200"
        onClick={toggleMobile}
        aria-label={mobileOpen ? 'Закрыть меню' : 'Открыть меню'}
      >
        {mobileOpen ? <X size={20} className="text-ink-700" /> : <Menu size={20} className="text-ink-700" />}
      </button>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-ink-900/40 backdrop-blur-md z-40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={closeMobile}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 w-[280px] z-50 bg-white/95 backdrop-blur-2xl backdrop-saturate-150 border-r border-ink-200/40 flex flex-col lg:hidden shadow-2xl"
              initial={{ x: '-105%' }}
              animate={{ x: 0 }}
              exit={{ x: '-105%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            >
              <SidebarContent
                isActive={isActive}
                balance={balance}
                subscriptionActive={subscriptionActive}
                onOpenCommandPalette={() => setCommandPaletteOpen(true)}
                planName={planName}
                trialDaysLeft={trialDaysLeft}
                isTrialing={isTrialing}
              />
              <button
                type="button"
                className="absolute top-4 right-4 p-2.5 rounded-xl bg-white/90 border border-ink-200/50 text-ink-500 hover:text-ink-700 hover:bg-mauve-50 transition-colors duration-200 lg:hidden"
                onClick={closeMobile}
                aria-label="Закрыть меню"
              >
                <X size={18} />
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main
        className="lg:ml-[240px] min-h-screen"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(90,77,89,0.03) 1px, transparent 1px)', backgroundSize: '32px 32px' }}
      >
        <div className="fixed top-4 right-4 z-50 hidden lg:flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur-sm border border-mauve-200 rounded-full shadow-sm text-xs font-mono">
          <span className="text-mauve-500">Баланс</span>
          <span className="font-bold text-ink-900">${balance.toFixed(2)}</span>
        </div>
        {children}
      </main>

      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />

      {showTour && <OnboardingTour />}
    </div>
  );
}
