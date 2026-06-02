'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import Logo from './Logo';
import { useAgentStore } from '@/store/agentStore';

const navItems = [
  { href: '#capabilities', label: 'Возможности' },
  { href: '#use-cases', label: 'Сценарии' },
  { href: '#pricing', label: 'Тарифы' },
] as const;

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAuthenticated = useAgentStore((s) => s.auth.isAuthenticated);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setScrolled(latest > 50);
    const prev = scrollY.getPrevious();
    setHidden(latest > 200 && prev !== undefined && latest > prev);
  });

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-surface/90 backdrop-blur-xl border-b border-[var(--border)]' : 'bg-transparent'
        }`}
        style={{ opacity: hidden ? 0 : 1, transform: hidden ? 'translateY(-100%)' : 'translateY(0)', transition: 'opacity 0.3s, transform 0.3s' }}
      >
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <Logo />

          <div className="hidden md:flex items-center gap-7">
            {navItems.map((item) => (
              <NavLink key={item.href} href={item.href}>{item.label}</NavLink>
            ))}
            <a
              href={isAuthenticated ? '/agents' : '/login'}
              className="btn-primary text-sm py-2 px-5"
            >
              {isAuthenticated ? 'Перейти в панель' : 'Попробовать бесплатно'}
            </a>
          </div>

          <button
            onClick={() => setMobileOpen((prev) => !prev)}
            className="md:hidden relative z-50 w-9 h-9 flex flex-col items-center justify-center gap-1.5"
            aria-label="Toggle menu"
          >
            <motion.span
              className="block w-5 h-px bg-[var(--text)] rounded-full origin-center"
              animate={mobileOpen ? { rotate: 45, y: 5.5 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.3 }}
            />
            <motion.span
              className="block w-5 h-px bg-[var(--text)] rounded-full"
              animate={mobileOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.2 }}
            />
            <motion.span
              className="block w-5 h-px bg-[var(--text)] rounded-full origin-center"
              animate={mobileOpen ? { rotate: -45, y: -5.5 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.3 }}
            />
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-text/20 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={closeMobile}
            />
            <motion.div
              className="fixed top-0 right-0 bottom-0 z-40 w-[280px] bg-surface flex flex-col md:hidden"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex-1 flex flex-col justify-center px-8 gap-6">
                {navItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={(e) => {
                      if (item.href.startsWith('#')) {
                        e.preventDefault();
                        const el = document.querySelector(item.href);
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }
                      closeMobile();
                    }}
                    className="text-2xl font-medium text-[var(--text)] hover:text-[var(--text-muted)] transition-colors"
                  >
                    {item.label}
                  </a>
                ))}
                <div className="pt-4">
                  <a
                    href={isAuthenticated ? '/agents' : '/login'}
                    onClick={closeMobile}
                    className="btn-primary text-sm py-2.5 px-6 inline-block"
                  >
                    {isAuthenticated ? 'Перейти в панель' : 'Попробовать бесплатно'}
                  </a>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const handleClick = (e: React.MouseEvent) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const el = document.querySelector(href);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
    >
      {children}
    </a>
  );
}
