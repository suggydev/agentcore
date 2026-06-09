'use client';

import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import Link from 'next/link';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

export default function TeamTab() {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="bg-surface rounded-2xl border border-border shadow-sm p-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center mx-auto mb-4">
          <Users size={24} className="text-brand" />
        </div>
        <h3 className="font-semibold text-text mb-2">Управление командой</h3>
        <p className="text-sm text-text-muted mb-4">Управление командой доступно на отдельной странице</p>
        <Link
          href="/team"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-hover transition-all shadow-lg shadow-brand/20"
        >
          Перейти к команде
        </Link>
      </motion.div>
    </motion.div>
  );
}
