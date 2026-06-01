'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import Logo from './Logo';
import MagneticButton from './MagneticButton';

const navItems = [
  { href: '#capabilities', label: 'Возможности' },
  { href: '#use-cases', label: 'Сценарии' },
  { href: '#pricing', label: 'Тарифы' },
] as const;

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setScrolled(latest > 50);
    const prev = scrollY.getPrevious();
    setHidden(latest > 200 && prev !== undefined && latest > prev);
  });

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    setIsLoggedIn(!!token);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <>
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? 'glass-surface' : 'bg-transparent'
        }`}
        initial={{ y: -100 }}
        animate={{ y: hidden ? -100 : 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-3.5 flex items-center justify-between">
          <Logo />

          <div className="hidden md:flex items-center gap-7">
            {navItems.map((item) => (
              <NavLink key={item.href} href={item.href}>{item.label}</NavLink>
            ))}
            <MagneticButton strength={0.2}>
              <a
                href={isLoggedIn ? '/dashboard' : '/login'}
                className="btn-primary text-sm py-2 px-5"
              >
                {isLoggedIn ? 'Перейти в панель' : 'Попробовать бесплатно'}
              </a>
            </MagneticButton>
          </div>

          <button
            onClick={() => setMobileOpen((prev) => !prev)}
            className="md:hidden relative z-50 w-9 h-9 flex flex-col items-center justify-center gap-1.5"
            aria-label="Toggle menu"
          >
            <motion.span
              className="block w-5 h-px bg-ink-900 rounded-full origin-center"
              animate={mobileOpen ? { rotate: 45, y: 5.5 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            />
            <motion.span
              className="block w-5 h-px bg-ink-900 rounded-full"
              animate={mobileOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.2 }}
            />
            <motion.span
              className="block w-5 h-px bg-ink-900 rounded-full origin-center"
              animate={mobileOpen ? { rotate: -45, y: -5.5 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            />
          </button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-ink-900/30 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={closeMobile}
            />
            <motion.div
              className="fixed top-0 right-0 bottom-0 z-40 w-[280px] bg-white/95 backdrop-blur-2xl flex flex-col md:hidden shadow-2xl"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex-1 flex flex-col justify-center px-8 gap-6">
                {navItems.map((item, i) => (
                  <motion.a
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
                    className="text-2xl font-medium text-ink-800 hover:text-ink-900 transition-colors"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.05, duration: 0.3 }}
                  >
                    {item.label}
                  </motion.a>
                ))}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                  className="pt-4"
                >
                  <a
                    href={isLoggedIn ? '/dashboard' : '/login'}
                    onClick={closeMobile}
                    className="btn-primary text-sm py-2.5 px-6 inline-block"
                  >
                    {isLoggedIn ? 'Перейти в панель' : 'Попробовать бесплатно'}
                  </a>
                </motion.div>
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
      className="text-sm font-medium text-ink-500 hover:text-ink-900 transition-colors underline-animated"
    >
      {children}
    </a>
  );
}
