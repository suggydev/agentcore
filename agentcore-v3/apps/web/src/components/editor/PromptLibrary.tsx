'use client';

import { useCallback } from 'react';
import { Button } from '@/design/components/Button';
import { t } from '@/design/i18n';

interface PromptLibraryProps {
  onInsert: (text: string) => void;
}

interface PromptChip {
  id: string;
  label: string;
  text: string;
}

const CHIPS: PromptChip[] = [
  { id: 'friendly', label: t('promptLibrary.toneFriendly'), text: '\n\n- Общайся тепло и по-человечески, проявляй эмпатию\n- Используй "вы" и обращайся уважительно' },
  { id: 'no-politics', label: t('promptLibrary.noPolitics'), text: '\n\n- Не обсуждай политические темы, перенаправляй на основной вопрос' },
  { id: 'budget', label: t('promptLibrary.clarifyBudget'), text: '\n\n- Всегда уточняй бюджет клиента перед предложением вариантов' },
  { id: 'greeting', label: t('promptLibrary.startGreeting'), text: '\n\n- Начинай каждый диалог с приветствия и вопроса "Чем могу помочь?"' },
];

export default function PromptLibrary({ onInsert }: PromptLibraryProps) {
  const handleChipClick = useCallback((chip: PromptChip) => {
    onInsert(chip.text);
  }, [onInsert]);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[13px] text-[var(--text-muted)]">
        Нажмите на чип, чтобы вставить текст в промпт
      </p>
      <div className="flex flex-wrap gap-2">
        {CHIPS.map((chip) => (
          <Button
            key={chip.id}
            variant="pill"
            size="sm"
            onClick={() => handleChipClick(chip)}
            aria-label={chip.label}
          >
            {chip.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
