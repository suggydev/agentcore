'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import SelectField from './SelectField';

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

interface ChannelStepProps {
  form: FormData;
  update: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  toggleChannel: (ch: string) => void;
}

const CHANNELS = [
  'Веб-чат', 'Telegram', 'WhatsApp', 'Email', 'Телефон', 'Slack', 'Discord',
];
const CRMS = [
  'Нет', 'HubSpot', 'Salesforce', 'Pipedrive', 'Zoho', 'Bitrix24', 'AmoCRM', 'Своя',
];

const slideUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -24, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
};

export default function ChannelStep({ form, update, toggleChannel }: ChannelStepProps) {
  return (
    <motion.div {...slideUp} className="px-6 sm:px-8 pt-6 pb-2">
      <div className="space-y-4">
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg)]">
          <label className="block text-xs font-semibold uppercase tracking-label text-[var(--brand)] mb-3">
            Каналы общения
          </label>
          <div className="flex flex-wrap gap-2">
            {CHANNELS.map(ch => {
              const selected = form.channels.includes(ch);
              return (
                <button
                  key={ch}
                  type="button"
                  onClick={() => toggleChannel(ch)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
                    selected
                      ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-md scale-105'
                      : 'bg-surface text-[var(--text)] border-[var(--border)] hover:border-[var(--brand)]/40 hover:bg-[var(--accent-soft)] hover:text-[var(--brand)]'
                  }`}
                >
                  {selected && <Check className="w-3 h-3" />}
                  {ch}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg)] transition-all focus-within:ring-2 focus-within:ring-[var(--brand)] focus-within:border-[var(--brand)] focus-within:bg-surface">
          <label className="block text-xs font-semibold uppercase tracking-label text-[var(--brand)] mb-2">
            Сайт компании
          </label>
          <input
            type="url"
            value={form.websiteUrl}
            onChange={e => update('websiteUrl', e.target.value)}
            placeholder="https://example.com"
            className="w-full bg-transparent text-[var(--text)] text-sm placeholder:text-[var(--text-muted)] outline-none"
          />
        </div>

        <SelectField
          label="CRM"
          value={form.crm}
          onChange={v => update('crm', v)}
          options={CRMS}
          placeholder="Выберите CRM"
        />
      </div>
    </motion.div>
  );
}
