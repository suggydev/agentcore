'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import Link from 'next/link';
import Logo from './Logo';
import { useAgentStore } from '@/store/agentStore';

const navItems = [
  { href: '#capabilities', label: 'Возможности' },
  { href: '#use-cases', label: 'Сценарии' },
  { href: '#pricing', label: 'Тарифы' },
] as const;

export function scrollToSection(href: string) {
  const section = document.querySelector(href);
  section?.scrollIntoView({ behavior: 'smooth' });
}

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAuthenticated = useAgentStore((s) => s.auth.isAuthenticated);
  const { scrollY } = useScroll();
  const lastScrollY = useRef(0);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    if (Math.abs(latest - lastScrollY.current) < 20) return;
    lastScrollY.current = latest;
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
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? 'rgba(251, 250, 249, 0.9)' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          boxShadow: scrolled ? 'rgba(0,0,0,0.04) 0px 0px 0px 1px' : 'none',
          opacity: hidden ? 0 : 1,
          transform: hidden ? 'translateY(-100%)' : 'translateY(0)',
          transition: 'opacity 0.3s, transform 0.3s, background 0.3s, box-shadow 0.3s',
        }}
      >
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <Logo />

          <div className="hidden md:flex items-center gap-7">
            {navItems.map((item) => (
              <NavLink key={item.href} href={item.href}>{item.label}</NavLink>
            ))}
            <Link
              href={isAuthenticated ? '/agents' : '/login'}
              className="btn-primary text-sm py-2 px-5"
            >
              {isAuthenticated ? 'Перейти в панель' : 'Попробовать бесплатно'}
            </Link>
          </div>

          <button
            onClick={() => setMobileOpen((prev) => !prev)}
            className="md:hidden relative z-50 w-9 h-9 flex flex-col items-center justify-center gap-1.5"
            aria-label="Toggle menu"
          >
            <motion.span
              className="block w-5 h-px rounded-full origin-center bg-charcoal"
              animate={mobileOpen ? { rotate: 45, y: 5.5 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.3 }}
            />
            <motion.span
              className="block w-5 h-px rounded-full bg-charcoal"
              animate={mobileOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.2 }}
            />
            <motion.span
              className="block w-5 h-px rounded-full origin-center bg-charcoal"
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
              className="fixed inset-0 z-40 backdrop-blur-sm md:hidden"
              style={{ background: 'rgba(71, 70, 69, 0.2)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={closeMobile}
            />
            <motion.div
              className="fixed top-0 right-0 bottom-0 z-40 w-[280px] flex flex-col md:hidden"
              style={{ background: 'var(--bg)' }}
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
                        scrollToSection(item.href);
                      }
                      closeMobile();
                    }}
                    className="text-2xl font-medium text-charcoal hover:text-text-muted transition-colors"
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
                    {isAuthenticated ? 'Перейти в панель' : 'Попробовать бесплатно'}
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

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const handleClick = (e: React.MouseEvent) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      scrollToSection(href);
    }
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className="nav-link"
    >
      {children}
    </a>
  );
}
