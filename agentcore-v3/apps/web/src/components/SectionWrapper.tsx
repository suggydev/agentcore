'use client';
import { motion } from 'framer-motion';
import { motionPresets } from '@/design/motion';

export default function SectionWrapper({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={className}>
      <div style={motionPresets.container}>
        {children}
      </div>
    </section>
  );
}
