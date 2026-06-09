'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, X, MessageSquare, Building2, ChevronDown, Zap } from 'lucide-react';

interface StepGoalProps {
  goal: string;
  companyName: string;
  channel: string;
  error: string;
  onGoalChange: (v: string) => void;
  onCompanyChange: (v: string) => void;
  onChannelChange: (v: string) => void;
  onSubmit: (g?: string, cn?: string) => void;
  onCancel: () => void;
}

const CHANNELS = [
  { id: '', label: 'Все каналы', icon: Zap },
  { id: 'telegram', label: 'Telegram', icon: MessageSquare },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
  { id: 'vk', label: 'VK', icon: MessageSquare },
  { id: 'instagram', label: 'Instagram', icon: MessageSquare },
  { id: 'avito', label: 'Avito', icon: Building2 },
  { id: 'email', label: 'Email', icon: MessageSquare },
  { id: 'webchat', label: 'Веб-чат', icon: MessageSquare },
];

export default function StepGoal({ goal, companyName, channel, error, onGoalChange, onCompanyChange, onChannelChange, onSubmit, onCancel }: StepGoalProps) {
  const [focused, setFocused] = useState(false);
  const [particles, setParticles] = useState<{id: number; x: number; y: number; size: number; delay: number}[]>([]);

  useEffect(() => {
    const pts = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 4,
      delay: Math.random() * 5,
    }));
    setParticles(pts);
  }, []);

  const examples = [
    'Отвечать на вопросы клиентов в Instagram и помогать с выбором товаров',
    'Принимать заказы в Telegram, консультировать по доставке и собирать отзывы',
    'Автоматически квалифицировать лидов в WhatsApp и записывать на встречу',
    'Вести первую линию поддержки по email, решать типовые проблемы клиентов',
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen relative flex flex-col items-center justify-center px-4 py-12 overflow-hidden"
    >
      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map(p => (
          <motion.div
            key={p.id}
            className="absolute rounded-full bg-brand/20"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.6, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 4 + Math.random() * 3,
              repeat: Infinity,
              delay: p.delay,
              ease: 'easeInOut',
            }}
          />
        ))}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[100px]" />
      </div>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4 z-20">
        <button onClick={onCancel} className="flex items-center gap-2 text-text-muted hover:text-text transition-colors text-sm">
          <X size={16} /> Закрыть
        </button>
        <div className="text-xs text-text-muted font-mono">ШАГ 1 ИЗ 5</div>
      </div>

      <div className="relative z-10 max-w-2xl w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand/10 border border-brand/20 text-brand text-sm mb-6">
            <Sparkles size={14} /> AI-агентство AgentCore
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-text mb-3 leading-tight">
            Создайте своего<br />
            <span className="text-brand">цифрового сотрудника</span>
          </h1>
          <p className="text-text-secondary text-base md:text-lg max-w-lg mx-auto">
            Опишите задачу — AI спроектирует идеального агента специально для вашего бизнеса
          </p>
        </motion.div>

        {/* Input Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-5"
        >
          {/* Company */}
          <div className="relative">
            <label className="block text-sm font-medium text-text-muted mb-2">Название компании</label>
            <div className="relative">
              <Building2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={companyName}
                onChange={e => onCompanyChange(e.target.value)}
                placeholder="Например: Цветочный магазин «Роза»"
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-surface border border-border text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/50 transition-all text-sm"
              />
            </div>
          </div>

          {/* Channel */}
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">Канал коммуникации</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {CHANNELS.map(ch => {
                const Icon = ch.icon;
                return (
                  <motion.button
                    key={ch.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onChannelChange(ch.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all ${
                      channel === ch.id
                        ? 'border-brand bg-brand/10 text-brand'
                        : 'border-border bg-surface text-text-muted hover:text-text hover:bg-accent-soft/50'
                    }`}
                  >
                    <Icon size={14} />
                    {ch.label}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Goal */}
          <div className="relative">
            <label className="block text-sm font-medium text-text-muted mb-2">Что должен делать агент?</label>
            <div className={`relative rounded-xl border transition-all duration-300 ${
              focused ? 'border-brand/50 ring-2 ring-brand/20' : 'border-border'
            }`}>
              <textarea
                value={goal}
                onChange={e => onGoalChange(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="Опишите задачу подробно..."
                rows={4}
                className="w-full px-4 py-3.5 bg-surface rounded-xl text-text placeholder:text-text-muted focus:outline-none resize-none text-sm leading-relaxed"
              />
              <div className="absolute bottom-3 right-3 text-[10px] text-text-muted font-mono">
                {goal.length} симв.
              </div>
            </div>
          </div>

          {/* Examples */}
          <div>
            <p className="text-xs text-text-muted mb-2 flex items-center gap-1.5">
              <ChevronDown size={12} /> Примеры задач
            </p>
            <div className="flex flex-wrap gap-2">
              {examples.map((ex, i) => (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onGoalChange(ex)}
                  className="px-3 py-2 rounded-lg bg-surface border border-border text-xs text-text-muted hover:text-text hover:border-brand/30 transition-all text-left"
                >
                  {ex}
                </motion.button>
              ))}
            </div>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-danger bg-danger/10 px-4 py-2.5 rounded-xl border border-danger/20"
            >
              {error}
            </motion.p>
          )}

          {/* Submit */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onSubmit()}
            disabled={!goal.trim()}
            className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl bg-brand text-white font-medium text-sm hover:bg-brand-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand/20"
          >
            <Sparkles size={18} />
            Создать агента
            <ArrowRight size={16} />
          </motion.button>

          {/* Note: pricing info moved to payment step */}
        </motion.div>
      </div>
    </motion.div>
  );
}
