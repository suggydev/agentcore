'use client';

import { motion } from 'framer-motion';
import SelectField from './SelectField';

const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-1000', '1000+'];
const INDUSTRIES = [
  'Технологии', 'Финансы', 'Медицина', 'E-commerce', 'Образование',
  'Недвижимость', 'Консалтинг', 'Производство', 'Другое',
];
const GEOGRAPHIES = [
  'Весь мир', 'Европа', 'Сев. Америка', 'Азия',
  'Юж. Америка', 'Африка', 'Бл. Восток', 'Россия/СНГ',
];

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

interface CompanyStepProps {
  form: FormData;
  update: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
}

const slideUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -24, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
};

export default function CompanyStep({ form, update }: CompanyStepProps) {
  return (
    <motion.div {...slideUp} className="px-6 sm:px-8 pt-8 pb-2">
      <div className="mb-7">
        <h2 className="font-display font-bold text-2xl text-[var(--text)] mb-1.5">
          Давайте познакомимся
        </h2>
        <p className="text-sm text-[var(--text-muted)]">
          Расскажите о вашей компании, чтобы мы могли лучше настроить AI-агентов
        </p>
      </div>

      <div className="space-y-4">
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg)] transition-all focus-within:ring-2 focus-within:ring-[var(--brand)] focus-within:border-[var(--brand)] focus-within:bg-surface">
          <label className="block text-xs font-semibold uppercase tracking-label text-[var(--brand)] mb-2">
            Название компании
          </label>
          <input
            type="text"
            value={form.companyName}
            onChange={e => update('companyName', e.target.value)}
            placeholder="ООО «Ромашка»"
            className="w-full bg-transparent text-[var(--text)] text-sm placeholder:text-[var(--text-muted)] outline-none"
          />
        </div>

        <SelectField
          label="Размер команды"
          value={form.companySize}
          onChange={v => update('companySize', v)}
          options={COMPANY_SIZES}
          placeholder="Выберите размер"
        />

        <SelectField
          label="Индустрия"
          value={form.industry}
          onChange={v => update('industry', v)}
          options={INDUSTRIES}
          placeholder="Выберите индустрию"
        />

        <SelectField
          label="Регион"
          value={form.geography}
          onChange={v => update('geography', v)}
          options={GEOGRAPHIES}
          placeholder="Выберите регион"
        />
      </div>
    </motion.div>
  );
}
