'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  LayoutDashboard,
  Bot,
  Workflow,
  FlaskConical,
  BookOpen,
  Blocks,
  MessageSquare,
  BarChart3,
  CreditCard,
  Settings,
  LogOut,
  CornerDownLeft,
} from 'lucide-react';

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

const buildCommands = (router: ReturnType<typeof useRouter>): Command[] => [
  {
    label: 'Обзор',
    description: 'Главная страница дашборда',
    icon: LayoutDashboard,
    action: () => router.push('/dashboard'),
  },
  {
    label: 'Создать агента',
    description: 'Создать нового AI-агента',
    icon: Bot,
    action: () => router.push('/dashboard/agents'),
  },
  {
    label: 'Brain Map',
    description: 'Визуальный редактор логики',
    icon: Workflow,
    action: () => router.push('/dashboard/brain-map'),
  },
  {
    label: 'Тест агента',
    description: 'Протестировать агента в чате',
    icon: FlaskConical,
    action: () => router.push('/dashboard/brain-map/test'),
  },
  {
    label: 'База знаний',
    description: 'Документы и FAQ для агентов',
    icon: BookOpen,
    action: () => router.push('/dashboard/knowledge'),
  },
  {
    label: 'Интеграции',
    description: 'Подключить внешние сервисы',
    icon: Blocks,
    action: () => router.push('/dashboard/integrations'),
  },
  {
    label: 'Диалоги',
    description: 'История переписок агентов',
    icon: MessageSquare,
    action: () => router.push('/dashboard/conversations'),
  },
  {
    label: 'Аналитика',
    description: 'Метрики и статистика',
    icon: BarChart3,
    action: () => router.push('/dashboard/analytics'),
  },
  {
    label: 'Тарифы',
    description: 'Управление подпиской',
    icon: CreditCard,
    action: () => router.push('/dashboard/billing'),
  },
  {
    label: 'Настройки',
    description: 'Настройки рабочей области',
    icon: Settings,
    action: () => router.push('/dashboard/settings'),
  },
  {
    label: 'Выйти',
    description: 'Покинуть рабочую область',
    icon: LogOut,
    action: () => {
      localStorage.clear();
      router.push('/login');
    },
  },
];

export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const commands = buildCommands(router);

  const filtered = commands.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(query.toLowerCase()) ||
      cmd.description.toLowerCase().includes(query.toLowerCase())
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
            className="fixed inset-0 z-50 bg-ink-900/30 backdrop-blur-sm"
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
              className="w-full max-w-lg rounded-2xl bg-white/95 backdrop-blur-2xl shadow-2xl border border-ink-200/40 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 px-4 py-3 border-b border-ink-200/40">
                <Search size={16} className="text-ink-400 flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Введите команду или поиск..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-ink-900 placeholder:text-ink-400 outline-none"
                />
                <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-ink-100/70 border border-ink-200/60 text-[10px] font-medium text-ink-400 flex-shrink-0">
                  esc
                </kbd>
              </div>

              <div className="max-h-72 overflow-y-auto py-2">
                {filtered.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-ink-400">
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
                            ? 'bg-mauve-100 text-mauve-600'
                            : 'text-ink-600 hover:bg-mauve-50/80'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                            isActive ? 'bg-mauve-200 text-mauve-600' : 'bg-ink-100 text-ink-400'
                          }`}
                        >
                          <Icon size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{cmd.label}</p>
                          <p className="text-xs text-ink-400 truncate">{cmd.description}</p>
                        </div>
                        {isActive && (
                          <div className="flex items-center gap-1 text-[10px] font-medium text-mauve-500 flex-shrink-0">
                            <CornerDownLeft size={12} />
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              <div className="flex items-center gap-3 px-4 py-2 border-t border-ink-200/40 text-[10px] text-ink-400">
                <span className="flex items-center gap-1">
                  <kbd className="inline-flex items-center px-1 py-0.5 rounded bg-ink-100 border border-ink-200/60">↑↓</kbd>
                  <span>навигация</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="inline-flex items-center px-1 py-0.5 rounded bg-ink-100 border border-ink-200/60">↵</kbd>
                  <span>выбрать</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="inline-flex items-center px-1 py-0.5 rounded bg-ink-100 border border-ink-200/60">esc</kbd>
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
