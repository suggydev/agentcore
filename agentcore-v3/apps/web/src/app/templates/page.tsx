'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutTemplate, Sparkles, MessageSquare, Bot, ShoppingCart, Headphones, BarChart3, Layers } from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'Все', icon: Layers },
  { id: 'sales', label: 'Продажи', icon: ShoppingCart },
  { id: 'support', label: 'Поддержка', icon: Headphones },
  { id: 'marketing', label: 'Маркетинг', icon: BarChart3 },
  { id: 'chat', label: 'Чат-боты', icon: MessageSquare },
];

const TEMPLATES = [
  { id: '1', name: 'Продавец-консультант', description: 'Консультирует клиентов по товарам и помогает с выбором', category: 'sales', icon: ShoppingCart },
  { id: '2', name: 'Техническая поддержка', description: 'Отвечает на вопросы и решает технические проблемы', category: 'support', icon: Headphones },
  { id: '3', name: 'SMM-ассистент', description: 'Генерирует идеи для постов и отвечает на комментарии', category: 'marketing', icon: BarChart3 },
  { id: '4', name: 'FAQ-бот', description: 'Отвечает на частые вопросы клиентов 24/7', category: 'chat', icon: MessageSquare },
  { id: '5', name: 'Квалификация лидов', description: 'Задаёт вопросы и оценивает потенциальных клиентов', category: 'sales', icon: Sparkles },
  { id: '6', name: 'AI-ассистент', description: 'Универсальный чат-бот для любых задач', category: 'chat', icon: Bot },
];

export default function TemplatesPage() {
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredTemplates = activeCategory === 'all'
    ? TEMPLATES
    : TEMPLATES.filter((t) => t.category === activeCategory);

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto" data-testid="templates-page">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-label text-[var(--brand)] mb-2">Библиотека</p>
        <h1 className="font-display font-bold text-3xl text-[var(--text)] tracking-tight">Шаблоны</h1>
        <p className="text-[var(--text-muted)] mt-1 text-sm">Готовые шаблоны агентов для разных задач.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 mb-6 overflow-x-auto pb-2" data-testid="template-categories">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const active = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-1 ${
                active
                  ? 'bg-[var(--accent)] text-white shadow-sm'
                  : 'bg-surface text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--accent-soft)] border border-[var(--border)]'
              }`}
              data-testid={`category-tab-${cat.id}`}
            >
              <Icon size={16} />
              {cat.label}
            </button>
          );
        })}
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => {
          const Icon = template.icon;
          return (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-5 group cursor-pointer hover:shadow-md hover:border-[var(--border)] transition-all template-card"
              data-testid="template-card"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--brand)] to-[var(--brand)]/60 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--brand)] font-medium border border-[var(--border)]">
                  {CATEGORIES.find((c) => c.id === template.category)?.label}
                </span>
              </div>
              <h3 className="font-bold text-[var(--text)] mb-1">{template.name}</h3>
              <p className="text-[var(--text-muted)] text-sm line-clamp-2">{template.description}</p>
              <div className="mt-4 pt-4 border-t border-[var(--border)]">
                <button className="text-sm text-[var(--brand)] font-medium hover:underline">
                  Использовать шаблон →
                </button>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
