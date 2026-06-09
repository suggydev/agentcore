'use client';

import { motion } from 'framer-motion';
import {
  TrendingUp,
  Headphones,
  MessageCircle,
  Building2,
  Pen,
  Check,
  Heart,
} from 'lucide-react';

interface FormData {
  companyName: string;
  companySize: string;
  industry: string;
  geography: string;
  channels: string[];
  websiteUrl: string;
  crm: string;
  agentGoal: string;
}

interface GoalStepProps {
  form: FormData;
  update: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
}

const GOALS = [
  {
    id: 'sales',
    icon: TrendingUp,
    label: 'Продажи',
    description: 'Генерация лидов, квалификация, увеличение конверсии',
  },
  {
    id: 'support',
    icon: Headphones,
    label: 'Поддержка',
    description: '24/7 ответы, снижение нагрузки на команду',
  },
  {
    id: 'consulting',
    icon: MessageCircle,
    label: 'Консультации',
    description: 'Квалификация клиентов, запись на встречи',
  },
  {
    id: 'internal',
    icon: Building2,
    label: 'Автоматизация',
    description: 'Внутренние процессы, онбординг, обучение',
  },
  {
    id: 'custom',
    icon: Pen,
    label: 'Другое',
    description: 'Свой сценарий',
  },
];

const slideUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -24, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
};

export default function GoalStep({ form, update }: GoalStepProps) {
  return (
    <motion.div {...slideUp} className="px-6 sm:px-8 pt-8 pb-2">
      <div className="mb-7">
        <h2 className="font-display font-bold text-2xl text-[var(--text)] mb-1.5">
          Что будет делать ваш агент?
        </h2>
        <p className="text-sm text-[var(--text-muted)]">
          Выберите основную задачу для AI-агента
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 mb-6">
        {GOALS.map(goal => {
          const selected = form.agentGoal === goal.id;
          const Icon = goal.icon;
          return (
            <motion.button
              key={goal.id}
              type="button"
              whileHover={selected ? { scale: 1.01 } : { y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => update('agentGoal', goal.id)}
              className={`flex items-start gap-4 p-4 rounded-xl border text-left transition-all duration-300 ${
                selected
                  ? 'bg-[var(--accent-soft)] border-[var(--brand)]/40 shadow-lg ring-1 ring-[var(--brand)]/30'
                  : 'bg-[var(--bg)] border-[var(--border)] hover:border-[var(--brand)]/40 hover:shadow-lg hover:bg-surface'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-300 ${
                  selected ? 'bg-[var(--brand)]' : 'bg-[var(--accent-soft)]'
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-colors duration-300 ${
                    selected ? 'text-white' : 'text-[var(--brand)]'
                  }`}
                />
              </div>
              <div className="min-w-0">
                <p
                  className={`font-semibold text-sm transition-colors duration-300 ${
                    selected ? 'text-[var(--brand)]' : 'text-[var(--text)]'
                  }`}
                >
                  {goal.label}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{goal.description}</p>
              </div>
              {selected && (
                <div className="ml-auto flex-shrink-0 self-center">
                  <div className="w-5 h-5 rounded-full bg-[var(--brand)] flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {form.agentGoal && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="p-5 rounded-xl border border-[var(--border)] bg-gradient-to-br from-[var(--accent-soft)]/80 to-[var(--surface)] shadow-md"
        >
          <p className="text-xs font-semibold uppercase tracking-label text-[var(--brand)] mb-4">
            Создать первого агента
          </p>
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[var(--brand)] to-[var(--brand)]/60 flex items-center justify-center shadow-lg">
              {(() => {
                const goal = GOALS.find(g => g.id === form.agentGoal);
                if (!goal) return null;
                const Icon = goal.icon;
                return <Icon className="w-5 h-5 text-white" />;
              })()}
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">
                {GOALS.find(g => g.id === form.agentGoal)?.label} Агент
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <Heart className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                <p className="text-xs text-[var(--brand)]">При подписке — ₽1 000/мес на AI-запросы</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
