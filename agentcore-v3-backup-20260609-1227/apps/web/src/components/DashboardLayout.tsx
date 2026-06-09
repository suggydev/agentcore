// DEPRECATED: This component is replaced in the redesign/cto-style branch. Do not add new features here.
'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import NewSidebar from './NewSidebar';
import { Menu, X } from 'lucide-react';

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

 return (
 <div className="min-h-screen bg-[var(--bg)]">
 <aside className="hidden lg:flex fixed inset-y-0 left-0 w-[240px] flex-col z-40 bg-surface/75 backdrop-blur-2xl backdrop-saturate-150 border-r border-[var(--border)]">
  <NewSidebar />
 </aside>

 <button
 type="button"
 className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-surface/80 backdrop-blur-xl border border-[var(--border)] shadow-sm hover:shadow-md transition-shadow duration-200"
 onClick={toggleMobile}
 aria-label={mobileOpen ? 'Закрыть меню' : 'Открыть меню'}
 >
 {mobileOpen ? <X size={20} className="text-[var(--text)]" /> : <Menu size={20} className="text-[var(--text)]" />}
 </button>

 <AnimatePresence>
 {mobileOpen && (
 <>
 <motion.div
 className="fixed inset-0 bg-[var(--accent)]/40 backdrop-blur-md z-40 lg:hidden"
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 transition={{ duration: 0.25 }}
 onClick={closeMobile}
 />
 <motion.aside
 className="fixed inset-y-0 left-0 w-[280px] z-50 bg-surface/95 backdrop-blur-2xl backdrop-saturate-150 border-r border-[var(--border)] flex flex-col lg:hidden shadow-2xl"
 initial={{ x: '-105%' }}
 animate={{ x: 0 }}
 exit={{ x: '-105%' }}
 transition={{ type: 'spring', damping: 26, stiffness: 300 }}
 >
  <NewSidebar />
 <button
 type="button"
 className="absolute top-4 right-4 p-2.5 rounded-xl bg-surface/90 border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--accent-soft)] transition-colors duration-200 lg:hidden"
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
 className="lg:ml-[240px] min-h-screen pb-12"
 style={{ backgroundImage: 'radial-gradient(circle, rgba(90,77,89,0.03) 1px, transparent 1px)', backgroundSize: '32px 32px' }}
 >
 {children}
 </main>
 </div>
 );
}
