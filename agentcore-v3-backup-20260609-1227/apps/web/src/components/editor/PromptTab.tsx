'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Sparkles, Eye, EyeOff, MessageCircle, Filter, UserPlus, HelpCircle, AlertTriangle, Blocks, Database, Users, GripVertical } from 'lucide-react';
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
}

const DEFAULT_MAX_TOKENS = 2000;
const AUTO_SAVE_DELAY = 1000;

// ── Action node types for the logic workspace ──
type ActionType = 'greeting' | 'qualification' | 'leadCapture' | 'faq' | 'escalation' | 'integration' | 'memory' | 'handoff';

interface ActionNode {
  id: string;
  type: ActionType;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  active: boolean;
  triggerWords: string;
  responseText: string;
  settings: Record<string, string | number | boolean>;
}

const ACTION_META: Record<ActionType, Omit<ActionNode, 'id' | 'active' | 'triggerWords' | 'responseText' | 'settings'>> = {
  greeting: { type: 'greeting', label: 'Приветствие', description: 'Первое сообщение агента клиенту', icon: MessageCircle, color: 'border-brand/40 bg-accent-soft' },
  qualification: { type: 'qualification', label: 'Квалификация', description: 'Выяснение потребностей клиента', icon: Filter, color: 'border-brand/30 bg-accent-soft' },
  leadCapture: { type: 'leadCapture', label: 'Сбор лидов', description: 'Сохранение контактных данных', icon: UserPlus, color: 'border-brand-soft bg-brand-light' },
  faq: { type: 'faq', label: 'FAQ', description: 'Ответы на частые вопросы', icon: HelpCircle, color: 'border-border bg-bg' },
  escalation: { type: 'escalation', label: 'Эскалация', description: 'Передача сложных вопросов оператору', icon: AlertTriangle, color: 'border-warning-soft bg-warning-soft' },
  integration: { type: 'integration', label: 'Интеграция', description: 'Вызов внешнего API / webhook', icon: Blocks, color: 'border-brand-soft bg-brand-light' },
  memory: { type: 'memory', label: 'Память', description: 'Сохранение контекста диалога', icon: Database, color: 'border-success-soft bg-success-soft' },
  handoff: { type: 'handoff', label: 'Передача', description: 'Перехват диалога человеком', icon: Users, color: 'border-warning-soft bg-warning-soft' },
};

function parseActionsFromPrompt(prompt: string): ActionNode[] {
  const defaults: ActionNode[] = [
    { id: 'greeting', ...ACTION_META.greeting, active: true, triggerWords: 'привет, здравствуй, старт, начать', responseText: 'Здравствуйте! Чем могу помочь?', settings: {} },
    { id: 'qualification', ...ACTION_META.qualification, active: true, triggerWords: 'цена, стоимость, сколько, тариф', responseText: 'Расскажите подробнее о вашей задаче — я подберу оптимальное решение.', settings: { maxQuestions: 3 } },
    { id: 'faq', ...ACTION_META.faq, active: true, triggerWords: 'вопрос, как, что такое, помощь, не работает', responseText: 'Я постараюсь ответить. Если не знаю — предложу связаться с оператором.', settings: { fallbackToOperator: true } },
    { id: 'escalation', ...ACTION_META.escalation, active: true, triggerWords: 'оператор, человек, свяжите, жалоба, недоволен', responseText: 'Передаю вопрос оператору. Ожидайте, пожалуйста.', settings: { notifyOperator: true } },
    { id: 'leadCapture', ...ACTION_META.leadCapture, active: false, triggerWords: 'заказ, купить, оформить, заявка', responseText: 'Отлично! Оставьте контакт — мы свяжемся с вами.', settings: { requiredFields: 'name,phone' } },
    { id: 'integration', ...ACTION_META.integration, active: false, triggerWords: 'api, webhook, интеграция, синхронизация', responseText: 'Выполняю внешний запрос...', settings: { endpoint: '', method: 'POST' } },
    { id: 'memory', ...ACTION_META.memory, active: true, triggerWords: '_always', responseText: '_internal', settings: { contextWindow: 10 } },
    { id: 'handoff', ...ACTION_META.handoff, active: false, triggerWords: 'переключить, живой человек, перейти', responseText: 'Передаю диалог коллеге. Ожидайте.', settings: { department: 'support' } },
  ];
  return defaults;
}

function buildPromptFromActions(actions: ActionNode[], agentName: string, companyName: string): string {
  const active = actions.filter(a => a.active);
  const greeting = active.find(a => a.type === 'greeting');
  const lines = [
    `Вы — AI-ассистент «${agentName}» компании «${companyName || 'Компания'}».`,
    '',
    `Ваша задача: помогать клиентам, отвечать на вопросы и направлять диалог по заданной логике.`,
    '',
    '--- ЛОГИКА РАБОТЫ ---',
    ...active.map(a => {
      let s = `[${a.label}]`;
      if (a.triggerWords && a.triggerWords !== '_always' && a.triggerWords !== '_internal') {
        s += ` — срабатывает при словах: ${a.triggerWords}.`;
      }
      if (a.responseText && a.responseText !== '_internal') {
        s += ` Ответ: «${a.responseText}».`;
      }
      return s;
    }),
    '',
    '--- ПРАВИЛА ---',
    '1. Общайтесь вежливо, профессионально, кратко.',
    '2. Если не знаете ответ — передайте оператору.',
    '3. Следуйте логике узлов сверху вниз.',
    greeting ? `4. Первое сообщение: «${greeting.responseText}».` : '',
    '',
    '--- ДОПОЛНИТЕЛЬНО ---',
    'Не раскрывайте технические детали работы. Не сообщайте, что вы AI, если клиент не спросит.',
  ];
  return lines.filter(Boolean).join('\n');
}

export default function PromptTab({ agent, onUpdate, models }: PromptTabProps) {
  const [prompt, setPrompt] = useState(agent.systemPrompt);
  const [model, setModel] = useState(agent.model);
  const [temperature, setTemperature] = useState(agent.temperature);
  const [maxTokens, setMaxTokens] = useState(agent.maxTokens || DEFAULT_MAX_TOKENS);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [actions, setActions] = useState<ActionNode[]>(() => parseActionsFromPrompt(agent.systemPrompt));
  const [expandedAction, setExpandedAction] = useState<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  useEffect(() => {
    setPrompt(agent.systemPrompt);
    setModel(agent.model);
    setTemperature(agent.temperature);
    setMaxTokens(agent.maxTokens || DEFAULT_MAX_TOKENS);
    setActions(parseActionsFromPrompt(agent.systemPrompt));
  }, [agent.systemPrompt, agent.model, agent.temperature, agent.maxTokens]);

  const doSave = useCallback(async (updates: Partial<AgentData>) => {
    setSaveStatus('saving');
    try {
      await onUpdate(updates);
      setSaveStatus('saved');
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('idle');
      addToast({ variant: 'error', message: t('toast.error') });
    }
  }, [onUpdate, addToast]);

  const scheduleSave = useCallback((updates: Partial<AgentData>) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => doSave(updates), AUTO_SAVE_DELAY);
  }, [doSave]);

  const regeneratePromptFromActions = useCallback(() => {
    const newPrompt = buildPromptFromActions(actions, agent.name, '');
    setPrompt(newPrompt);
    scheduleSave({ systemPrompt: newPrompt });
  }, [actions, agent.name, scheduleSave]);

  const toggleAction = (id: string) => {
    setActions(prev => prev.map(a => a.id === id ? { ...a, active: !a.active } : a));
  };

  const updateAction = (id: string, patch: Partial<ActionNode>) => {
    setActions(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a));
  };

  // Auto-save actions when they change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      const newPrompt = buildPromptFromActions(actions, agent.name, '');
      if (newPrompt !== prompt) {
        setPrompt(newPrompt);
        doSave({ systemPrompt: newPrompt });
      }
    }, 1200);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions, agent.name]);

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

  const handleInsert = useCallback((_text: string) => {
    addToast({ variant: 'info', message: 'Используйте блоки для настройки поведения' });
    setLibraryOpen(false);
  }, [addToast]);

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

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4">
        <div>
          <h2 className="text-[15px] font-semibold text-[var(--text)]">Логика агента</h2>
          <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
            Настройте поведение, сценарии и ответы агента
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saveStatus === 'saving' && (
            <span className="text-[11px] text-[var(--text-muted)]">{t('editor.saving')}</span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-[11px] text-[var(--success)]">{t('editor.saved')}</span>
          )}
        </div>
      </div>

      {/* Model & temperature — always visible */}
      <div className="px-5 space-y-3 pb-1">
        <div>
          <label className="block text-[12px] font-medium text-[var(--text-muted)] mb-1.5 flex items-center gap-1.5">
            <Sparkles size={13} />
            Модель AI
          </label>
          <select
            value={model}
            onChange={handleModelChange}
            className="w-full h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
          >
            <option value="">Автоматический выбор</option>
            {models.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="temp-slider-main" className="text-[12px] font-medium text-[var(--text-muted)]">
              Креативность (temperature)
            </label>
            <span className="text-[12px] font-medium text-[var(--brand)]">{temperature.toFixed(1)}</span>
          </div>
          <input
            id="temp-slider-main"
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={temperature}
            onChange={handleTempChange}
            className="w-full accent-[var(--brand)]"
            aria-label={t('editor.temperature')}
          />
          <p className="text-[10px] text-[var(--text-muted)]">
            0 = точные ответы. 1 = сбалансированно. 2 = максимально креативно.
          </p>
        </div>
      </div>

      {/* Actions workspace */}
      <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-2.5">
        {actions.map((action) => {
          const Icon = action.icon;
          const isExpanded = expandedAction === action.id;
          return (
            <div
              key={action.id}
              className={`rounded-xl border transition-all duration-200 ${
                action.active ? action.color : 'border-[var(--border)] bg-[var(--surface-2)] opacity-60'
              }`}
            >
              {/* Action header */}
              <button
                onClick={() => setExpandedAction(isExpanded ? null : action.id)}
                className="w-full flex items-center gap-3 px-3.5 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] rounded-xl"
              >
                <GripVertical size={14} className="text-[var(--text-muted)] flex-shrink-0" />
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${action.active ? 'bg-[var(--surface)]' : 'bg-[var(--surface)]'}`}>
                  <Icon size={14} className={action.active ? 'text-[var(--brand)]' : 'text-[var(--text-muted)]'} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-[var(--text)] flex items-center gap-2">
                    {action.label}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      action.active ? 'bg-[var(--success-soft)] text-[var(--success)]' : 'bg-[var(--surface-3)] text-[var(--text-muted)]'
                    }`}>
                      {action.active ? 'ON' : 'OFF'}
                    </span>
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] truncate">{action.description}</div>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); toggleAction(action.id); }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                    action.active
                      ? 'bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)]'
                      : 'bg-[var(--brand)] text-white hover:bg-[var(--brand-hover)]'
                  }`}
                >
                  {action.active ? 'Отключить' : 'Включить'}
                </button>
                {isExpanded ? <ChevronUp size={14} className="text-[var(--text-muted)]" /> : <ChevronDown size={14} className="text-[var(--text-muted)]" />}
              </button>

              {/* Expanded configuration */}
              {isExpanded && action.active && (
                <div className="px-3.5 pb-3.5 pt-1 space-y-3 border-t border-[var(--border)]/50">
                  {/* Trigger words */}
                  {action.type !== 'greeting' && action.type !== 'memory' && (
                    <div>
                      <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">
                        Триггер-слова (через запятую)
                      </label>
                      <input
                        type="text"
                        value={action.triggerWords}
                        onChange={(e) => updateAction(action.id, { triggerWords: e.target.value })}
                        className="w-full h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
                        placeholder="привет, цена, помощь..."
                      />
                      <p className="text-[10px] text-[var(--text-muted)] mt-1">
                        Агент среагирует, если в сообщении клиента есть хотя бы одно из этих слов
                      </p>
                    </div>
                  )}

                  {/* Response text */}
                  {action.type !== 'memory' && (
                    <div>
                      <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">
                        Текст ответа
                      </label>
                      <Textarea
                        value={action.responseText}
                        onChange={(e) => updateAction(action.id, { responseText: e.target.value })}
                        rows={3}
                        className="text-[13px]"
                        placeholder="Что ответит агент при срабатывании..."
                      />
                    </div>
                  )}

                  {/* Action-specific settings */}
                  {action.type === 'escalation' && (
                    <label className="flex items-center gap-2 text-[12px] text-[var(--text)]">
                      <input
                        type="checkbox"
                        checked={!!action.settings.notifyOperator}
                        onChange={(e) => updateAction(action.id, { settings: { ...action.settings, notifyOperator: e.target.checked } })}
                        className="rounded border-[var(--border)]"
                      />
                      Уведомить оператора в Telegram / email
                    </label>
                  )}

                  {action.type === 'leadCapture' && (
                    <div>
                      <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">
                        Обязательные поля
                      </label>
                      <input
                        type="text"
                        value={String(action.settings.requiredFields || '')}
                        onChange={(e) => updateAction(action.id, { settings: { ...action.settings, requiredFields: e.target.value } })}
                        className="w-full h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
                        placeholder="name, phone, email"
                      />
                    </div>
                  )}

                  {action.type === 'integration' && (
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">Endpoint</label>
                        <input
                          type="text"
                          value={String(action.settings.endpoint || '')}
                          onChange={(e) => updateAction(action.id, { settings: { ...action.settings, endpoint: e.target.value } })}
                          className="w-full h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
                          placeholder="https://api.example.com/webhook"
                        />
                      </div>
                      <div className="flex gap-2">
                        {(['GET','POST','PUT']).map(m => (
                          <button
                            key={m}
                            onClick={() => updateAction(action.id, { settings: { ...action.settings, method: m } })}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                              action.settings.method === m ? 'bg-[var(--brand)] text-white' : 'bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text)]'
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {action.type === 'memory' && (
                    <div>
                      <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">
                        Контекстное окно (сообщений)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={Number(action.settings.contextWindow || 10)}
                        onChange={(e) => updateAction(action.id, { settings: { ...action.settings, contextWindow: parseInt(e.target.value,10) || 10 } })}
                        className="w-24 h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Advanced model settings */}
        <button
          onClick={() => setAdvancedOpen(!advancedOpen)}
          className="flex items-center gap-1.5 text-[12px] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors mt-2"
        >
          {advancedOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          Расширенные настройки
        </button>

        {advancedOpen && (
          <div className="flex flex-col gap-4 p-4 bg-[var(--surface-2)] rounded-[var(--radius-card)]">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="max-tokens" className="text-[12px] font-medium text-[var(--text-muted)]">
                  Максимальная длина ответа
                </label>
                <span className="text-[12px] font-medium text-[var(--brand)]">{maxTokens.toLocaleString()} токенов</span>
              </div>
              <input
                id="max-tokens"
                type="range"
                min={500}
                max={8000}
                step={500}
                value={maxTokens}
                onChange={handleMaxTokensChange}
                className="w-full accent-[var(--brand)]"
                aria-label={t('editor.maxTokens')}
              />
              <p className="text-[10px] text-[var(--text-muted)]">
                Один токен ≈ 1-2 символа. 2000 — стандартный ответ. 4000 — подробный.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom actions */}
      <div className="flex items-center justify-end px-5 py-3 border-t border-[var(--border)] bg-[var(--surface)]">
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
