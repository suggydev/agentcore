'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Sparkles, Brain } from 'lucide-react';
import { Textarea } from '@/design/components/Input';
import { Button } from '@/design/components/Button';
import { useToast } from '@/design/components/Toast';
import { Modal } from '@/design/components/Modal';
import { t } from '@/design/i18n';
import type { AgentData, ModelOption } from './types';
import PromptLibrary from './PromptLibrary';

interface PromptTabProps {
  agent: AgentData;
  onUpdate: (updates: Partial<AgentData>) => Promise<void>;
  models: ModelOption[];
  onBrainMap: () => void;
}

const DEFAULT_MAX_TOKENS = 2000;
const AUTO_SAVE_DELAY = 1000;

export default function PromptTab({ agent, onUpdate, models, onBrainMap }: PromptTabProps) {
  const [prompt, setPrompt] = useState(agent.systemPrompt);
  const [model, setModel] = useState(agent.model);
  const [temperature, setTemperature] = useState(agent.temperature);
  const [maxTokens, setMaxTokens] = useState(agent.maxTokens || DEFAULT_MAX_TOKENS);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [libraryOpen, setLibraryOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    setPrompt(agent.systemPrompt);
    setModel(agent.model);
    setTemperature(agent.temperature);
    setMaxTokens(agent.maxTokens || DEFAULT_MAX_TOKENS);
  }, [agent.systemPrompt, agent.model, agent.temperature, agent.maxTokens]);

  const doSave = useCallback(async (updates: Partial<AgentData>) => {
    setSaveStatus('saving');
    try {
      await onUpdate(updates);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('idle');
      addToast({ variant: 'error', message: t('toast.error') });
    }
  }, [onUpdate, addToast]);

  const scheduleSave = useCallback((updates: Partial<AgentData>) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => doSave(updates), AUTO_SAVE_DELAY);
  }, [doSave]);

  const handlePromptChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setPrompt(val);
    scheduleSave({ systemPrompt: val });
  }, [scheduleSave]);

  const handleModelChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setModel(val);
    doSave({ model: val });
  }, [doSave]);

  const handleTempChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setTemperature(val);
    scheduleSave({ temperature: val });
  }, [scheduleSave]);

  const handleMaxTokensChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val > 0) {
      setMaxTokens(val);
      scheduleSave({ maxTokens: val });
    }
  }, [scheduleSave]);

  const handleEnhance = useCallback(() => {
    addToast({ variant: 'info', message: t('editor.enhanceSoon') });
  }, [addToast]);

  const handleInsert = useCallback((text: string) => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const newPrompt = prompt.slice(0, start) + text + prompt.slice(end);
    setPrompt(newPrompt);
    scheduleSave({ systemPrompt: newPrompt });
    setLibraryOpen(false);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  }, [prompt, scheduleSave]);

  const handleManualSave = useCallback(() => {
    doSave({ systemPrompt: prompt, model, temperature, maxTokens });
  }, [doSave, prompt, model, temperature, maxTokens]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleManualSave();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [handleManualSave]);

  const promptLiveValue = prompt;

  return (
    <div className="p-5 flex flex-col gap-4">
      <div className="relative">
        <div className="absolute top-3 right-3 z-10">
          {saveStatus === 'saving' && (
            <span className="text-[11px] text-[var(--text-muted)]">{t('editor.saving')}</span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-[11px] text-[var(--success)]">{t('editor.saved')}</span>
          )}
        </div>
        <Textarea
          ref={textareaRef}
          variant="monospace"
          value={prompt}
          onChange={handlePromptChange}
          placeholder={t('editor.promptPlaceholder')}
          autoResize
          className="font-[family-name:var(--font-mono)] text-[14px] tracking-[-0.02em]"
          style={{ minHeight: '300px' }}
          aria-label={t('editor.systemPrompt')}
        />
      </div>

      <div className="flex items-center gap-2">
        <Button variant="pill" size="sm" onClick={handleEnhance} aria-label={t('editor.enhancePrompt')}>
          <Sparkles size={12} />
          {t('editor.enhancePrompt')}
        </Button>
        <Button variant="pill" size="sm" onClick={() => setLibraryOpen(true)} aria-label={t('promptLibrary.title')}>
          {t('promptLibrary.title')}
        </Button>
      </div>

      <button
        onClick={() => setAdvancedOpen(!advancedOpen)}
        className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] rounded"
        aria-expanded={advancedOpen}
        aria-label={t('editor.advancedSettings')}
      >
        {advancedOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {t('editor.advancedSettings')}
      </button>

      {advancedOpen && (
        <div className="flex flex-col gap-4 p-4 bg-[var(--surface-2)] rounded-[var(--radius-card)]">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="model-select" className="text-[12px] font-medium text-[var(--text-muted)]">
              {t('editor.model')}
            </label>
            <select
              id="model-select"
              value={model}
              onChange={handleModelChange}
              className="h-10 px-3 rounded-[var(--radius-button)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-[14px] focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-offset-1"
              aria-label={t('editor.model')}
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="temp-slider" className="text-[12px] font-medium text-[var(--text-muted)]">
              {t('editor.temperature')}: {temperature.toFixed(1)}
            </label>
            <input
              id="temp-slider"
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={temperature}
              onChange={handleTempChange}
              className="w-full accent-[var(--brand)]"
              aria-label={t('editor.temperature')}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="max-tokens" className="text-[12px] font-medium text-[var(--text-muted)]">
              {t('editor.maxTokens')}
            </label>
            <input
              id="max-tokens"
              type="number"
              min={1}
              max={32000}
              value={maxTokens}
              onChange={handleMaxTokensChange}
              className="h-10 px-3 rounded-[var(--radius-button)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-[14px] focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-offset-1 w-32"
              aria-label={t('editor.maxTokens')}
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <Button variant="secondary" size="sm" onClick={onBrainMap} aria-label={t('editor.brainMap')}>
          <Brain size={14} />
          {t('editor.brainMap')}
        </Button>
        <Button variant="primary" size="sm" onClick={handleManualSave} aria-label={t('editor.save')}>
          {t('editor.save')}
        </Button>
      </div>

      <Modal
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        title={t('promptLibrary.title')}
        size="md"
      >
        <PromptLibrary onInsert={handleInsert} />
      </Modal>
    </div>
  );
}
