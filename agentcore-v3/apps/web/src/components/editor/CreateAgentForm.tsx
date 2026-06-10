'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/design/components/Button';
import { Input, Textarea } from '@/design/components/Input';
import { t } from '@/design/i18n';
import { extractFromPrompt } from '@/data/agentTemplates';

const EMOJI_OPTIONS = ['🤖', '👩‍💼', '👨‍💼', '🧑‍💻', '👩‍🏫', '👨‍⚕️', '🛒', '🏠', '☁️', '⚖️', '🏦', '🎓', '🌸', '💼'];

interface CreateAgentFormProps {
  companyName: string;
  onSubmit: (data: { name: string; systemPrompt: string; emoji: string }) => Promise<void>;
  onCancel: () => void;
}

export default function CreateAgentForm({ companyName, onSubmit, onCancel }: CreateAgentFormProps) {
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [emoji, setEmoji] = useState('🤖');
  const [aiWorking, setAiWorking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);

  const handleAiAssist = useCallback(async () => {
    if (!goal.trim()) return;
    setAiWorking(true);
    try {
      const tmpl = extractFromPrompt(goal);
      let generatedPrompt = '';
      let generatedName = '';
      let generatedEmoji = '🤖';

      if (tmpl?.suggestedName && tmpl.systemPrompt) {
        generatedName = tmpl.suggestedName;
        generatedEmoji = tmpl.icon || '🤖';
        generatedPrompt = tmpl.systemPrompt(tmpl.suggestedName, companyName || 'Компания', tmpl.industry ?? '');
      } else {
        generatedName = goal.length > 30 ? goal.slice(0, 30) + '...' : goal;
        generatedPrompt = `Вы — AI-ассистент для компании "${companyName || 'Компания'}".\n\nВаша цель: ${goal}\n\nОбщайтесь вежливо и профессионально. Отвечайте на вопросы клиентов, помогайте решать их задачи. Если не знаете ответ — предложите связаться с оператором.`;
      }

      setName(generatedName);
      setSystemPrompt(generatedPrompt);
      setEmoji(generatedEmoji);
      setAiGenerated(true);
    } catch (err) {
      console.error('[CreateAgentForm] AI assist:', err);
    }
    setAiWorking(false);
  }, [goal, companyName]);

  const handleSubmit = useCallback(async () => {
    if (!name.trim() || !systemPrompt.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({ name, systemPrompt, emoji });
    } catch (err) {
      console.error('[CreateAgentForm] Submit:', err);
    }
    setSubmitting(false);
  }, [name, systemPrompt, emoji, onSubmit]);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[14px] text-text-secondary mb-5">
          Опишите, что должен делать агент — ИИ подберёт настройки и напишет промпт
        </p>
      </div>

      <div>
        <label className="block text-[13px] font-medium text-text mb-1.5">Эмодзи</label>
        <div className="flex flex-wrap gap-1.5">
          {EMOJI_OPTIONS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(e)}
              className={`w-9 h-9 rounded-button flex items-center justify-center text-[18px] transition-all duration-150 ${
                emoji === e ? 'bg-accent-soft ring-2 ring-brand scale-110' : 'bg-surface-2 hover:bg-surface-3'
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-[13px] font-medium text-text mb-1.5">
          Что должен делать агент?
        </label>
        <div className="relative">
          <Textarea
            placeholder="Например: отвечать на вопросы клиентов интернет-магазина, помогать с выбором товара и оформлением заказа"
            value={goal}
            onChange={(e) => { setGoal(e.target.value); setAiGenerated(false); }}
            rows={3}
            className="pr-12"
          />
          <button
            type="button"
            onClick={handleAiAssist}
            disabled={aiWorking || !goal.trim()}
            className="absolute top-2.5 right-2.5 p-1.5 rounded-button bg-brand text-white hover:bg-brand-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
            aria-label="ИИ-помощник"
          >
            {aiWorking ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          </button>
        </div>
        {aiGenerated && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[12px] text-brand mt-1.5"
          >
            ИИ подготовил промпт и настройки — можете редактировать
          </motion.p>
        )}
      </div>

      <div>
        <label className="block text-[13px] font-medium text-text mb-1.5">Имя агента</label>
        <Input
          placeholder="Айгуль, Макс, Елена..."
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-[13px] font-medium text-text mb-1.5">Системный промпт</label>
        <Textarea
          placeholder="Опишите роль, тон и правила общения агента..."
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          rows={6}
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button variant="ghost" onClick={onCancel}>
          {t('common.close')}
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={!name.trim() || !systemPrompt.trim() || submitting}
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
          Создать агента
        </Button>
      </div>
    </div>
  );
}
