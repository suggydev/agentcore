'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import NewSidebar from './NewSidebar';
import { Menu, X } from 'lucide-react';

const CommandPalette = dynamic(() => import('./CommandPalette'), { ssr: false });

interface NewDashboardLayoutProps {
 children: React.ReactNode;
}

export default function NewDashboardLayout({ children }: NewDashboardLayoutProps) {
 const [mobileOpen, setMobileOpen] = useState(false);
 const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
 const pathname = usePathname();

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

 return (
 <div className="min-h-screen bg-[var(--bg)]">
  {!mobileOpen && (
  <aside className="hidden lg:flex fixed inset-y-0 left-0 w-[200px] flex-col z-40">
  <NewSidebar onOpenCommandPalette={() => setCommandPaletteOpen(true)} />
  </aside>
  )}

  <button
  type="button"
  className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-[var(--surface)] backdrop-blur-xl border border-[var(--border)] shadow-sm hover:shadow-md transition-shadow duration-200 focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-1"
  onClick={toggleMobile}
  aria-label={mobileOpen ? 'Закрыть меню' : 'Открыть меню'}
  >
  {mobileOpen ? <X size={20} className="text-[var(--text)]" /> : <Menu size={20} className="text-[var(--text)]" />}
  </button>

  <AnimatePresence>
  {mobileOpen && (
  <>
  <motion.div
  className="fixed inset-0 bg-[var(--surface-2)] backdrop-blur-md z-40 lg:hidden"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.25 }}
  onClick={closeMobile}
  />
  <motion.aside
  className="fixed inset-y-0 left-0 w-[240px] z-50 flex flex-col lg:hidden shadow-2xl"
  initial={{ x: '-105%' }}
  animate={{ x: 0 }}
  exit={{ x: '-105%' }}
  transition={{ type: 'spring', damping: 26, stiffness: 300 }}
  >
  <NewSidebar onOpenCommandPalette={() => setCommandPaletteOpen(true)} />
  <button
  type="button"
  className="absolute top-4 right-4 p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors duration-200 lg:hidden focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-1"
  onClick={closeMobile}
  aria-label="Закрыть меню"
  >
  <X size={18} />
  </button>
  </motion.aside>
  </>
  )}
  </AnimatePresence>

 <main className="lg:ml-[200px] min-h-screen bg-[var(--bg)]">
 {children}
 </main>

 <CommandPalette
 open={commandPaletteOpen}
 onClose={() => setCommandPaletteOpen(false)}
 />
 </div>
 );
}
