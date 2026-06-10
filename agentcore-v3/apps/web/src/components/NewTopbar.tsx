'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface Crumb {
 label: string;
 href?: string;
}

function buildCrumbs(pathname: string): Crumb[] {
 const crumbs: Crumb[] = [];
 if (pathname.startsWith('/agents')) {
 crumbs.push({ label: 'Агенты', href: '/agents' });
 if (pathname.includes('/brain-map')) {
 crumbs.push({ label: 'Brain Map' });
 }
 const parts = pathname.split('/');
  const idPart = parts.find((p) => /^[a-f0-9-]{20,}$/i.test(p));
 if (idPart) {
 crumbs.push({ label: 'Агент' });
 }
 } else if (pathname.startsWith('/knowledge')) {
 crumbs.push({ label: 'База знаний' });
 } else if (pathname.startsWith('/settings')) {
 crumbs.push({ label: 'Настройки', href: '/settings' });
 if (pathname.includes('/billing')) {
 crumbs.push({ label: 'Биллинг' });
 } else if (pathname.includes('/subscription')) {
 crumbs.push({ label: 'Подписка' });
 } else if (pathname.includes('/security')) {
 crumbs.push({ label: 'Безопасность' });
 } else if (pathname.includes('/team')) {
 crumbs.push({ label: 'Команда' });
 } else if (pathname.includes('/profile')) {
 crumbs.push({ label: 'Профиль' });
 }
 }
 return crumbs;
}

export default function NewTopbar() {
 const pathname = usePathname();
 const crumbs = buildCrumbs(pathname);

 if (crumbs.length === 0) return null;

 return (
 <header
 className="h-12 flex items-center px-6 border-b border-[var(--border)] bg-[var(--bg)] z-10"
 role="banner"
 >
 <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
 {crumbs.map((crumb, i) => (
 <span key={i} className="flex items-center gap-1">
 {i > 0 && <ChevronRight size={12} className="text-[var(--text-muted)]" />}
 {crumb.href && i < crumbs.length - 1 ? (
 <Link
 href={crumb.href}
 className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors duration-200"
 >
 {crumb.label}
 </Link>
 ) : (
 <span className="text-[var(--text)] font-medium">{crumb.label}</span>
 )}
 </span>
 ))}
 </nav>
 </header>
 );
}
