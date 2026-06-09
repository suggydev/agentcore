'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Brain, LayoutList, Clock, Globe, AlertTriangle, UserPlus, SlidersHorizontal, MessageCircle } from 'lucide-react';
import { Textarea } from '@/design/components/Input';
import { Button } from '@/design/components/Button';
import { useToast } from '@/design/components/Toast';
import BrainMapTab from './BrainMapTab';
import type { AgentData, ModelOption } from './types';

interface BehaviorTabProps {
  agent: AgentData;
  onUpdate: (updates: Partial<AgentData>) => Promise<void>;
  models: ModelOption[];
}

const AUTO_SAVE_DELAY = 1000;

const TIMEZONES = [
  'Europe/Moscow', 'Europe/Kaliningrad', 'Europe/Samara', 'Asia/Yekaterinburg',
  'Asia/Omsk', 'Asia/Krasnoyarsk', 'Asia/Irkutsk', 'Asia/Yakutsk', 'Asia/Vladivostok',
  'Asia/Magadan', 'Asia/Kamchatka', 'Europe/London', 'America/New_York',
];

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Пн' },
  { key: 'tuesday', label: 'Вт' },
  { key: 'wednesday', label: 'Ср' },
  { key: 'thursday', label: 'Чт' },
  { key: 'friday', label: 'Пт' },
  { key: 'saturday', label: 'Сб' },
  { key: 'sunday', label: 'Вс' },
];

const LANGUAGES = [
  { value: 'ru', label: 'Русский' },
  { value: 'en', label: 'English' },
  { value: 'auto', label: 'Авто (по языку клиента)' },
];

interface BehaviorSettings {
  greeting: string;
  language: string;
  timezone: string;
  workDays: string[];
  workStart: string;
  workEnd: string;
  afterHoursAction: 'nothing' | 'away' | 'escalate';
  escalateKeywords: string;
  escalateMessage: string;
  leadCaptureEnabled: boolean;
  leadRequiredFields: string;
  leadMessage: string;
  confidenceThreshold: number;
}

function loadSettings(agent: AgentData): BehaviorSettings {
  try {
    const saved = agent.description ? JSON.parse(agent.description) : {};
    return {
      greeting: saved.greeting || `Здравствуйте! Я — ${agent.name}. Чем могу помочь?`,
      language: saved.language || 'auto',
      timezone: saved.timezone || 'Europe/Moscow',
      workDays: saved.workDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      workStart: saved.workStart || '09:00',
      workEnd: saved.workEnd || '18:00',
      afterHoursAction: saved.afterHoursAction || 'away',
      escalateKeywords: saved.escalateKeywords || 'оператор, человек, срочно, жалоба, недоволен, руководитель',
      escalateMessage: saved.escalateMessage || 'Переключаю вас на оператора. Ожидайте.',
      leadCaptureEnabled: saved.leadCaptureEnabled ?? true,
      leadRequiredFields: saved.leadRequiredFields || 'name, phone',
      leadMessage: saved.leadMessage || 'Оставьте контакты — мы свяжемся с вами в ближайшее время.',
      confidenceThreshold: saved.confidenceThreshold ?? 0.7,
    };
  } catch {
    return {
      greeting: `Здравствуйте! Я — ${agent.name}. Чем могу помочь?`,
      language: 'auto',
      timezone: 'Europe/Moscow',
      workDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      workStart: '09:00',
      workEnd: '18:00',
      afterHoursAction: 'away',
      escalateKeywords: 'оператор, человек, срочно, жалоба, недоволен, руководитель',
      escalateMessage: 'Переключаю вас на оператора. Ожидайте.',
      leadCaptureEnabled: true,
      leadRequiredFields: 'name, phone',
      leadMessage: 'Оставьте контакты — мы свяжемся с вами в ближайшее время.',
      confidenceThreshold: 0.7,
    };
  }
}

export default function BehaviorTab({ agent, onUpdate, models }: BehaviorTabProps) {
  const [mode, setMode] = useState<'map' | 'settings'>('map');
  const [settings, setSettings] = useState<BehaviorSettings>(() => loadSettings(agent));
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [name, setName] = useState(agent.name);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  useEffect(() => {
    setName(agent.name);
    setSettings(loadSettings(agent));
  }, [agent]);

  const doSave = useCallback(async (updates: Partial<AgentData>) => {
    setSaveStatus('saving');
    try {
      await onUpdate(updates);
      setSaveStatus('saved');
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('idle');
      addToast({ variant: 'error', message: 'Ошибка сохранения' });
    }
  }, [onUpdate, addToast]);

  const scheduleSettingsSave = useCallback((s: BehaviorSettings) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      doSave({ description: JSON.stringify(s) });
    }, AUTO_SAVE_DELAY);
  }, [doSave]);

  const updateSetting = useCallback(<K extends keyof BehaviorSettings>(key: K, value: BehaviorSettings[K]) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value };
      scheduleSettingsSave(next);
      return next;
    });
  }, [scheduleSettingsSave]);

  const toggleWorkDay = useCallback((day: string) => {
    setSettings(prev => {
      const days = prev.workDays.includes(day)
        ? prev.workDays.filter(d => d !== day)
        : [...prev.workDays, day];
      const next = { ...prev, workDays: days };
      scheduleSettingsSave(next);
      return next;
    });
  }, [scheduleSettingsSave]);

  const handleNameSave = useCallback(() => {
    if (name.trim() && name.trim() !== agent.name) {
      doSave({ name: name.trim() });
    }
  }, [name, agent.name, doSave]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1 px-5 pt-4 pb-2">
        <button
          onClick={() => setMode('map')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            mode === 'map'
              ? 'bg-brand text-white shadow-sm'
              : 'bg-surface-2 text-text-muted hover:text-text'
          }`}
        >
          <Brain size={14} />
          Brain Map
        </button>
        <button
          onClick={() => setMode('settings')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            mode === 'settings'
              ? 'bg-brand text-white shadow-sm'
              : 'bg-surface-2 text-text-muted hover:text-text'
          }`}
        >
          <SlidersHorizontal size={14} />
          Настройки
        </button>
        {saveStatus !== 'idle' && (
          <span className={`ml-auto text-[11px] ${saveStatus === 'saved' ? 'text-[var(--success)]' : 'text-[var(--text-muted)]'}`}>
            {saveStatus === 'saving' ? 'Сохранение...' : 'Сохранено'}
          </span>
        )}
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        {mode === 'map' ? (
          <div className="flex-1 min-h-0 overflow-y-auto">
            <BrainMapTab
              agent={agent}
              container={{
                hidden: { opacity: 0 },
                show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
              }}
              item={{
                hidden: { opacity: 0, y: 16 },
                show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
              }}
              onUpdate={(a) => onUpdate(a as Partial<AgentData>)}
            />
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-6 space-y-5 pt-2">
            {/* Agent name */}
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-muted)] mb-1.5">
                Имя агента
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={handleNameSave}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleNameSave(); }}
                  className="flex-1 h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
                  placeholder="Имя агента"
                />
                <Button variant="secondary" size="sm" onClick={handleNameSave}>Сохранить</Button>
              </div>
            </div>

            {/* Greeting */}
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-muted)] mb-1.5 flex items-center gap-1.5">
                <MessageCircle size={13} />
                Приветственное сообщение
              </label>
              <Textarea
                value={settings.greeting}
                onChange={(e) => updateSetting('greeting', e.target.value)}
                rows={3}
                className="text-[13px]"
                placeholder="Первое сообщение от агента..."
              />
              <p className="text-[10px] text-[var(--text-muted)] mt-1">
                Отправляется автоматически при начале диалога
              </p>
            </div>

            {/* Language */}
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-muted)] mb-1.5 flex items-center gap-1.5">
                <Globe size={13} />
                Язык ответов
              </label>
              <select
                value={settings.language}
                onChange={(e) => updateSetting('language', e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
              >
                {LANGUAGES.map(l => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>

            {/* Working hours */}
            <div className="p-4 bg-[var(--surface-2)] rounded-xl space-y-3">
              <h4 className="text-[13px] font-semibold text-[var(--text)] flex items-center gap-1.5">
                <Clock size={13} />
                Рабочие часы
              </h4>

              <div>
                <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">Часовой пояс</label>
                <select
                  value={settings.timezone}
                  onChange={(e) => updateSetting('timezone', e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
                >
                  {TIMEZONES.map(tz => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">Начало</label>
                  <input
                    type="time"
                    value={settings.workStart}
                    onChange={(e) => updateSetting('workStart', e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">Конец</label>
                  <input
                    type="time"
                    value={settings.workEnd}
                    onChange={(e) => updateSetting('workEnd', e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">Рабочие дни</label>
                <div className="flex gap-1.5">
                  {DAYS_OF_WEEK.map(d => (
                    <button
                      key={d.key}
                      type="button"
                      onClick={() => toggleWorkDay(d.key)}
                      className={`w-9 h-9 rounded-lg text-[11px] font-medium transition-all ${
                        settings.workDays.includes(d.key)
                          ? 'bg-[var(--brand)] text-white'
                          : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--brand)]'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">
                  Поведение в нерабочее время
                </label>
                <div className="flex gap-2">
                  {([
                    { value: 'nothing', label: 'Игнорировать' },
                    { value: 'away', label: 'Автоответ «Нет на месте»' },
                    { value: 'escalate', label: 'Передать оператору' },
                  ] as const).map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateSetting('afterHoursAction', opt.value)}
                      className={`flex-1 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                        settings.afterHoursAction === opt.value
                          ? 'bg-[var(--brand)] text-white'
                          : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--brand)]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Escalation rules */}
            <div className="p-4 bg-[var(--surface-2)] rounded-xl space-y-3">
              <h4 className="text-[13px] font-semibold text-[var(--text)] flex items-center gap-1.5">
                <AlertTriangle size={13} />
                Правила эскалации
              </h4>
              <div>
                <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">
                  Ключевые слова для передачи оператору
                </label>
                <input
                  type="text"
                  value={settings.escalateKeywords}
                  onChange={(e) => updateSetting('escalateKeywords', e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
                  placeholder="оператор, человек, срочно..."
                />
                <p className="text-[10px] text-[var(--text-muted)] mt-1">
                  При обнаружении любого из этих слов диалог передаётся оператору
                </p>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">
                  Сообщение при передаче
                </label>
                <Textarea
                  value={settings.escalateMessage}
                  onChange={(e) => updateSetting('escalateMessage', e.target.value)}
                  rows={2}
                  className="text-[13px]"
                  placeholder="Что сказать клиенту перед передачей..."
                />
              </div>
            </div>

            {/* Lead capture */}
            <div className="p-4 bg-[var(--surface-2)] rounded-xl space-y-3">
              <h4 className="text-[13px] font-semibold text-[var(--text)] flex items-center gap-1.5">
                <UserPlus size={13} />
                Сбор лидов
              </h4>
              <label className="flex items-center gap-2 text-[12px] text-[var(--text)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.leadCaptureEnabled}
                  onChange={(e) => updateSetting('leadCaptureEnabled', e.target.checked)}
                  className="rounded border-[var(--border)] accent-[var(--brand)]"
                />
                Включить автоматический сбор контактов
              </label>
              {settings.leadCaptureEnabled && (
                <>
                  <div>
                    <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">
                      Обязательные поля (через запятую)
                    </label>
                    <input
                      type="text"
                      value={settings.leadRequiredFields}
                      onChange={(e) => updateSetting('leadRequiredFields', e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
                      placeholder="name, phone, email"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">
                      Сообщение при сборе лида
                    </label>
                    <Textarea
                      value={settings.leadMessage}
                      onChange={(e) => updateSetting('leadMessage', e.target.value)}
                      rows={2}
                      className="text-[13px]"
                      placeholder="Оставьте контакты..."
                    />
                  </div>
                </>
              )}
            </div>

            {/* Confidence threshold */}
            <div className="p-4 bg-[var(--surface-2)] rounded-xl space-y-2">
              <h4 className="text-[13px] font-semibold text-[var(--text)] flex items-center gap-1.5">
                <SlidersHorizontal size={13} />
                Порог уверенности
              </h4>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[var(--text-muted)]">Минимальная уверенность для ответа</span>
                <span className="text-[12px] font-semibold text-[var(--brand)]">
                  {Math.round(settings.confidenceThreshold * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.3"
                max="1.0"
                step="0.05"
                value={settings.confidenceThreshold}
                onChange={(e) => updateSetting('confidenceThreshold', parseFloat(e.target.value))}
                className="w-full accent-[var(--brand)]"
              />
              <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
                <span>30% — отвечает на всё</span>
                <span>100% — только точно</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
