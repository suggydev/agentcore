'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, Bot, X, MessageCircle, Mail, Smartphone, Globe } from 'lucide-react';
import { Button } from '@/design/components/Button';
import { Textarea } from '@/design/components/Input';

const CHANNELS = [
  { id: 'telegram', label: 'Telegram', icon: MessageCircle },
  { id: 'whatsapp', label: 'WhatsApp', icon: Smartphone },
  { id: 'vk', label: 'VK', icon: Globe },
  { id: 'instagram', label: 'Instagram', icon: MessageCircle },
  { id: 'avito', label: 'Avito', icon: Globe },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'webchat', label: 'Веб-чат', icon: Globe },
  { id: '', label: 'Универсально (все каналы)', icon: Globe },
];

interface CreateAgentWizardProps {
  companyName: string;
  onCancel: () => void;
}

export default function CreateAgentWizard({ companyName, onCancel }: CreateAgentWizardProps) {
  const router = useRouter();
  const [goal, setGoal] = useState('');
  const [channel, setChannel] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    setToken(localStorage.getItem('token') || '');
  }, []);

  const handleSubmit = () => {
    if (!goal.trim()) return;
    const params = new URLSearchParams();
    params.set('goal', goal.trim());
    if (companyName) params.set('companyName', companyName);
    if (channel) params.set('channel', channel);
    router.push(`/agents/create?${params.toString()}`);
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center mx-auto mb-3">
          <Bot className="w-6 h-6 text-brand" />
        </div>
        <h3 className="text-[18px] font-semibold text-text mb-1">Создайте своего агента</h3>
        <p className="text-[13px] text-text-secondary">
          Опишите задачу — AI подберёт вопросы и сгенерирует идеального сотрудника
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-[13px] font-medium text-text mb-1.5">
            Где будет работать агент?
          </label>
          <div className="grid grid-cols-2 gap-2">
            {CHANNELS.map(ch => {
              const Icon = ch.icon;
              const selected = channel === ch.id;
              return (
                <motion.button
                  key={ch.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setChannel(ch.id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[13px] transition-all ${
                    selected
                      ? 'border-brand bg-brand/10 text-brand'
                      : 'border-[var(--border)] bg-surface text-text hover:bg-accent-soft/50'
                  }`}
                >
                  <Icon size={14} />
                  {ch.label}
                </motion.button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-[13px] font-medium text-text mb-1.5">
            Что должен делать агент?
          </label>
          <Textarea
            placeholder="Например: отвечать на вопросы клиентов в Instagram, помогать с выбором букетов, оформлять заказы и отслеживать доставку"
            value={goal}
            onChange={e => setGoal(e.target.value)}
            rows={4}
            className="text-[14px]"
          />
          <p className="text-[11px] text-text-muted mt-1.5">
            Чем подробнее описание — тем точнее вопросы и лучше агент.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4">
        <Button variant="ghost" onClick={onCancel}>Отмена</Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={!goal.trim() || !token}
          className="gap-2"
        >
          <Sparkles size={16} />
          Сгенерировать агента
        </Button>
      </div>
    </div>
  );
}
