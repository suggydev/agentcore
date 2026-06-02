'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
 Search,
 Bot,
 Workflow,
 FlaskConical,
 BookOpen,
 Settings,
 LogOut,
 CornerDownLeft,
} from 'lucide-react';
import { useAgentStore } from '@/store/agentStore';

interface Command {
 label: string;
 description: string;
 icon: React.ElementType;
 action: () => void;
}

interface CommandPaletteProps {
 open: boolean;
 onClose: () => void;
}

const COMMAND_DEFS: Omit<Command, 'action'>[] = [
 { label: 'Агенты', description: 'Ваши AI-агенты', icon: Bot },
 { label: 'Brain Map', description: 'Визуальный редактор логики', icon: Workflow },
 { label: 'Тест агента', description: 'Протестировать агента в чате', icon: FlaskConical },
 { label: 'База знаний', description: 'Документы и FAQ для агентов', icon: BookOpen },
 { label: 'Настройки', description: 'Настройки рабочей области', icon: Settings },
 { label: 'Выйти', description: 'Покинуть рабочую область', icon: LogOut },
];

export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
 const router = useRouter();
 const [query, setQuery] = useState('');
 const [activeIndex, setActiveIndex] = useState(0);
 const inputRef = useRef<HTMLInputElement>(null);
 const logout = useAgentStore((s) => s.logout);

 const commands = useMemo((): Command[] =>
 COMMAND_DEFS.map((cmd): Command => {
 switch (cmd.label) {
 case 'Агенты': return { ...cmd, action: () => router.push('/agents') };
 case 'Brain Map': return { ...cmd, action: () => router.push('/agents/brain-map') };
 case 'Тест агента': return { ...cmd, action: () => router.push('/agents/brain-map/test') };
 case 'База знаний': return { ...cmd, action: () => router.push('/knowledge') };
 case 'Настройки': return { ...cmd, action: () => router.push('/settings') };
 case 'Выйти':
 return {
 ...cmd,
 action: () => {
 logout();
 router.push('/login');
 },
 };
 default: return { ...cmd, action: () => {} };
 }
 }),
 [router, logout]
 );

 const filtered = useMemo(
 () =>
 commands.filter(
 (cmd) =>
 cmd.label.toLowerCase().includes(query.toLowerCase()) ||
 cmd.description.toLowerCase().includes(query.toLowerCase())
 ),
 [commands, query]
 );

 useEffect(() => {
 if (open) {
 setQuery('');
 setActiveIndex(0);
 requestAnimationFrame(() => inputRef.current?.focus());
 }
 }, [open]);

 const execute = useCallback(
 (index: number) => {
 if (filtered[index]) {
 filtered[index].action();
 onClose();
 }
 },
 [filtered, onClose]
 );

 useEffect(() => {
 if (!open) return;
 const handleKeyDown = (e: KeyboardEvent) => {
 if (e.key === 'Escape') {
 e.preventDefault();
 onClose();
 return;
 }
 if (e.key === 'ArrowDown') {
 e.preventDefault();
 setActiveIndex((prev) => (prev + 1) % Math.max(filtered.length, 1));
 return;
 }
 if (e.key === 'ArrowUp') {
 e.preventDefault();
 setActiveIndex((prev) => (prev - 1 + filtered.length) % Math.max(filtered.length, 1));
 return;
 }
 if (e.key === 'Enter') {
 e.preventDefault();
 execute(activeIndex);
 }
 };
 document.addEventListener('keydown', handleKeyDown);
 return () => document.removeEventListener('keydown', handleKeyDown);
 }, [open, onClose, filtered.length, activeIndex, execute]);

 useEffect(() => {
 setActiveIndex(0);
 }, [query]);

 return (
 <AnimatePresence>
 {open && (
 <>
 <motion.div
 className="fixed inset-0 z-50 bg-[var(--accent)]/30 backdrop-blur-sm"
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 transition={{ duration: 0.15 }}
 onClick={onClose}
 />
 <motion.div
 className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
 initial={{ opacity: 0, scale: 0.96 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.96 }}
 transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
 >
 <div
 className="w-full max-w-lg rounded-2xl bg-white/95 backdrop-blur-2xl shadow-2xl border border-[var(--border)] overflow-hidden"
 onClick={(e) => e.stopPropagation()}
 >
 <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
 <Search size={16} className="text-[var(--text-muted)] flex-shrink-0" />
 <input
 ref={inputRef}
 type="text"
 placeholder="Введите команду или поиск..."
 value={query}
 onChange={(e) => setQuery(e.target.value)}
 className="flex-1 bg-transparent text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none"
 />
 <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[var(--surface-2)] border border-[var(--border)] text-[10px] font-medium text-[var(--text-muted)] flex-shrink-0">
 esc
 </kbd>
 </div>

 <div className="max-h-72 overflow-y-auto py-2">
 {filtered.length === 0 ? (
 <div className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
 Ничего не найдено для &quot;{query}&quot;
 </div>
 ) : (
 filtered.map((cmd, i) => {
 const Icon = cmd.icon;
 const isActive = i === activeIndex;
 return (
 <button
 key={cmd.label}
 type="button"
 onClick={() => execute(i)}
 onMouseEnter={() => setActiveIndex(i)}
 className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-75 ${
 isActive
 ? 'bg-[var(--accent-soft)] text-[var(--brand)]'
 : 'text-[var(--text)] hover:bg-[var(--accent-soft)]'
 }`}
 >
 <div
 className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
 isActive ? 'bg-[var(--border)] text-[var(--brand)]' : 'bg-[var(--surface-2)] text-[var(--text-muted)]'
 }`}
 >
 <Icon size={16} />
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-sm font-medium truncate">{cmd.label}</p>
 <p className="text-xs text-[var(--text-muted)] truncate">{cmd.description}</p>
 </div>
 {isActive && (
 <div className="flex items-center gap-1 text-[10px] font-medium text-[var(--brand)] flex-shrink-0">
 <CornerDownLeft size={12} />
 </div>
 )}
 </button>
 );
 })
 )}
 </div>

 <div className="flex items-center gap-3 px-4 py-2 border-t border-[var(--border)] text-[10px] text-[var(--text-muted)]">
 <span className="flex items-center gap-1">
 <kbd className="inline-flex items-center px-1 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--border)]">\u2191\u2193</kbd>
 <span>навигация</span>
 </span>
 <span className="flex items-center gap-1">
 <kbd className="inline-flex items-center px-1 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--border)]">\u21b5</kbd>
 <span>выбрать</span>
 </span>
 <span className="flex items-center gap-1">
 <kbd className="inline-flex items-center px-1 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--border)]">esc</kbd>
 <span>закрыть</span>
 </span>
 </div>
 </div>
 </motion.div>
 </>
 )}
 </AnimatePresence>
 );
}
