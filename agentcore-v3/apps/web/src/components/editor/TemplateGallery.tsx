'use client';

import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/design/components/Card';
import { Button } from '@/design/components/Button';
import { t } from '@/design/i18n';
import { AGENT_TEMPLATES } from '@/data/agentTemplates';

interface TemplateGalleryProps {
  onSelect: (templateId: string | null) => void;
  companyName: string;
}

const TEMPLATE_EMOJIS: Record<string, string> = {
  retail: '🌸',
  ecommerce: '🛒',
  saas: '☁️',
  healthcare: '🏥',
  realestate: '🏠',
  consulting: '💼',
  education: '🎓',
  hospitality: '🏨',
  legal: '⚖️',
  finance: '🏦',
};

export default function TemplateGallery({ onSelect, companyName }: TemplateGalleryProps) {
  const handleSelect = useCallback((templateId: string | null) => {
    onSelect(templateId);
  }, [onSelect]);

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <h2 className="text-[20px] font-semibold text-[var(--text)]">{t('templates.title')}</h2>
        <p className="text-[14px] text-[var(--text-muted)] mt-1">{t('templates.subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {AGENT_TEMPLATES.map((template, i) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card
              hoverable
              onClick={() => handleSelect(template.id)}
              className="flex flex-col items-center text-center h-full"
            >
              <span className="text-[32px] mb-2">{TEMPLATE_EMOJIS[template.id] || '🤖'}</span>
              <p className="text-[14px] font-medium text-[var(--text)] mb-1">{t(`templates.${template.id}`)}</p>
              <p className="text-[12px] text-[var(--text-muted)] line-clamp-2">{template.industry}</p>
              <Button variant="pill" size="sm" className="mt-3" aria-label={t('templates.use')}>
                {t('templates.use')}
              </Button>
            </Card>
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: AGENT_TEMPLATES.length * 0.05 }}
        >
          <Card
            hoverable
            onClick={() => handleSelect(null)}
            className="flex flex-col items-center text-center h-full border-dashed"
          >
            <span className="text-[32px] mb-2">📝</span>
            <p className="text-[14px] font-medium text-[var(--text)]">{t('templates.fromScratch')}</p>
            <p className="text-[12px] text-[var(--text-muted)]">{t('templates.fromScratchDesc')}</p>
            <Button variant="pill" size="sm" className="mt-3" aria-label={t('templates.use')}>
              {t('templates.use')}
            </Button>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
