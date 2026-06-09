'use client';

import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface SmoothScrollProps {
  children: React.ReactNode;
}

export default function SmoothScroll({ children }: SmoothScrollProps) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (lenisRef.current) {
      lenisRef.current.destroy();
      lenisRef.current = null;
    }

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 2,
      infinite: false,
      smoothWheel: true,
    });

    lenisRef.current = lenis;

    const update = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    const refreshTimeout = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);

    const refreshTimeout2 = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 500);

    const refreshTimeout3 = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 1500);

    return () => {
      clearTimeout(refreshTimeout);
      clearTimeout(refreshTimeout2);
      clearTimeout(refreshTimeout3);
      gsap.ticker.remove(update);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return <>{children}</>;
}
