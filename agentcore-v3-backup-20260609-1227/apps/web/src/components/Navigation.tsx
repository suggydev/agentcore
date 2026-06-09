'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import Link from 'next/link';
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
  const [activeSection, setActiveSection] = useState('');
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

  useEffect(() => {
    const sectionIds = navItems.map((item) => item.href.slice(1));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection('#' + entry.target.id);
          }
        }
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
    );

    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <>
      <nav
        aria-label="Основная навигация"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-surface/90 backdrop-blur-xl border-b border-[var(--border)]' : 'bg-transparent'
        }`}
        style={{ opacity: hidden ? 0 : 1, transform: hidden ? 'translateY(-100%)' : 'translateY(0)', transition: 'opacity 0.3s, transform 0.3s' }}
      >
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <Logo />

          <div className="hidden md:flex items-center gap-7">
            {navItems.map((item) => (
              <NavLink key={item.href} href={item.href} active={activeSection === item.href}>{item.label}</NavLink>
            ))}
            <Link
              href={isAuthenticated ? '/agents' : '/login'}
              className="btn-primary text-sm py-2 px-5"
            >
              {isAuthenticated ? 'Перейти в панель' : 'Попробовать'}
            </Link>
          </div>

          <button
            onClick={() => setMobileOpen((prev) => !prev)}
            className="md:hidden relative z-50 w-9 h-9 flex flex-col items-center justify-center gap-1.5"
            aria-label="Меню"
            aria-expanded={mobileOpen}
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
              aria-hidden="true"
              className="fixed inset-0 z-40 bg-text/20 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={closeMobile}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Меню навигации"
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
                        if (el) {
                          const nav = document.querySelector('nav');
                          const offset = nav ? nav.getBoundingClientRect().height + 24 : 80;
                          const top = el.getBoundingClientRect().top + window.scrollY - offset;
                          window.scrollTo({ top, behavior: 'smooth' });
                        }
                      }
                      closeMobile();
                    }}
                    className={`text-2xl font-medium transition-colors ${
                      activeSection === item.href
                        ? 'text-[var(--brand)]'
                        : 'text-[var(--text)] hover:text-[var(--text-muted)]'
                    }`}
                  >
                    {item.label}
                  </a>
                ))}
                <div className="pt-4">
                  <Link
                    href={isAuthenticated ? '/agents' : '/login'}
                    onClick={closeMobile}
                    className="btn-primary text-sm py-2.5 px-6 inline-block"
                  >
                    {isAuthenticated ? 'Перейти в панель' : 'Попробовать'}
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function NavLink({ href, children, active }: { href: string; children: React.ReactNode; active?: boolean }) {
  const handleClick = (e: React.MouseEvent) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const el = document.querySelector(href);
      if (el) {
        const nav = document.querySelector('nav');
        const offset = nav ? nav.getBoundingClientRect().height + 24 : 80;
        const top = el.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    }
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className={`text-sm font-medium transition-colors relative ${
        active
          ? 'text-[var(--text)]'
          : 'text-[var(--text-muted)] hover:text-[var(--text)]'
      }`}
    >
      {children}
      {active && (
        <motion.span
          layoutId="nav-active-indicator"
          className="absolute -bottom-[3px] left-0 right-0 h-[2px] rounded-full bg-[var(--brand)]"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
    </a>
  );
}
