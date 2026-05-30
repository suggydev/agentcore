'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import Logo from './Logo';
import MagneticButton from './MagneticButton';

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const { scrollY } = useScroll();
  const lastScrollY = useRef(0);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setScrolled(latest > 50);
    if (latest > lastScrollY.current && latest > 200) {
      setHidden(true);
    } else {
      setHidden(false);
    }
    lastScrollY.current = latest;
  });

  return (
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
          <NavLink href="#capabilities">Возможности</NavLink>
          <NavLink href="#workflow">Как работает</NavLink>
          <NavLink href="#pricing">Тарифы</NavLink>
          <MagneticButton strength={0.2}>
            <a href="/login" className="btn-primary text-sm py-2 px-5">
              Начать работу
            </a>
          </MagneticButton>
        </div>
      </div>
    </motion.nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a 
      href={href} 
      className="text-sm font-medium text-ink-500 hover:text-ink-900 transition-colors underline-animated"
    >
      {children}
    </a>
  );
}
