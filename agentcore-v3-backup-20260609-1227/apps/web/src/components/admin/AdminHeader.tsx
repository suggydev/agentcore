'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Menu, Shield, LogOut } from 'lucide-react';
import Link from 'next/link';
import { getUserRole } from '@/utils/auth';

interface AdminHeaderProps {
  title: string;
  onToggleMobile: () => void;
}

export default function AdminHeader({ title, onToggleMobile }: AdminHeaderProps) {
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr) as { name?: string; email?: string; role?: string };
        setUserName(user.name || null);
        setUserEmail(user.email || null);
        setUserRole(getUserRole());
      } catch {
        /* ignore */
      }
    }
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-border">
      <div className="flex items-center justify-between px-4 py-3 lg:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleMobile}
            className="lg:hidden p-2 rounded-lg bg-surface-2 border border-border hover:bg-surface transition-colors focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1"
            aria-label="Open menu"
          >
            <Menu size={18} className="text-text" />
          </button>
          <motion.h1
            key={title}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="text-lg font-semibold text-text tracking-heading"
          >
            {title}
          </motion.h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-brand-light border border-brand/10">
            <Shield size={14} className="text-brand" />
            <span className="text-xs font-medium text-brand">{mounted ? (userRole || 'Админ') : '...'}</span>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
              {mounted ? (userName?.charAt(0).toUpperCase() || 'А') : '...'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-text leading-tight">{mounted ? (userName || 'Админ') : 'Загрузка...'}</p>
              <p className="text-[11px] text-text-muted leading-tight">{mounted ? (userEmail || '') : ''}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax;';
              localStorage.clear();
              window.location.href = '/login';
            }}
            className="p-2 rounded-lg hover:bg-surface-2 text-text-muted hover:text-danger transition-colors focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1"
            aria-label="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
