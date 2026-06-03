'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, ChevronRight, Check, MessageCircle, Wand2, Brain, Rocket, Zap, Bot } from 'lucide-react';
import { Button } from '@/design/components/Button';
import { Input, Textarea } from '@/design/components/Input';

interface CreateAgentWizardProps {
  companyName: string;
  onSubmit: (data: { name: string; systemPrompt: string; emoji: string; description: string }) => Promise<void>;
  onCancel: () => void;
}

type Step = 'input' | 'thinking' | 'clarifying' | 'generating' | 'review' | 'creating';

interface ClarificationQuestion {
  id: string;
  question: string;
  options: string[];
  type: 'single_choice';
}

interface GeneratedAgent {
  name: string;
  emoji: string;
  systemPrompt: string;
  description: string;
  model: string;
  brainNodes: string[];
  confidence: number;
}

const GENERATION_STEPS = [
  { icon: Brain, label: 'Анализирую задачу...', duration: 1500 },
  { icon: MessageCircle, label: 'Генерирую имя агента...', duration: 1200 },
  { icon: Wand2, label: 'Создаю системный промпт...', duration: 2000 },
  { icon: Zap, label: 'Настраиваю сценарии...', duration: 1500 },
];

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export default function CreateAgentWizard({ companyName, onSubmit, onCancel }: CreateAgentWizardProps) {
  const [step, setStep] = useState<Step>('input');
  const [goal, setGoal] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState<ClarificationQuestion | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [generated, setGenerated] = useState<GeneratedAgent | null>(null);
  const [generatingStep, setGeneratingStep] = useState(0);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const tk = localStorage.getItem('token') || '';
    setToken(tk);
  }, []);

  // Animation for generation steps
  useEffect(() => {
    if (step === 'generating') {
      let i = 0;
      const interval = setInterval(() => {
        i++;
        if (i < GENERATION_STEPS.length) {
          setGeneratingStep(i);
        } else {
          clearInterval(interval);
        }
      }, GENERATION_STEPS[i]?.duration || 1500);
      return () => clearInterval(interval);
    }
  }, [step]);

  const handleGenerate = useCallback(async () => {
    if (!goal.trim() || !token) return;
    setError('');
    setStep('thinking');
    setGeneratingStep(0);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`${API_BASE}/api/agents/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          goal: goal.trim(),
          companyName,
          previousAnswers: Object.keys(answers).length > 0 ? answers : undefined,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Ошибка ${res.status}`);
      }

      const data = await res.json();

      if (data.needsClarification && data.questions?.length > 0) {
        setCurrentQuestion(data.questions[0]);
        setStep('clarifying');
      } else if (data.generated) {
        setGenerated(data.generated);
        setStep('review');
      } else {
        throw new Error('Некорректный ответ от AI');
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      console.error('[CreateAgentWizard] Generate error:', err);
      setError((err as Error).message || 'Ошибка генерации. Попробуйте снова.');
      setStep('input');
    }
  }, [goal, token, companyName, answers]);

  const handleAnswer = useCallback((answer: string) => {
    if (!currentQuestion) return;
    const newAnswers = { ...answers, [currentQuestion.id]: answer };
    setAnswers(newAnswers);
    setCurrentQuestion(null);
    // Re-generate with new answers
    setStep('thinking');
    // Trigger re-generation
    setTimeout(() => {
      (async () => {
        try {
          const res = await fetch(`${API_BASE}/api/agents/generate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              goal: goal.trim(),
              companyName,
              previousAnswers: newAnswers,
            }),
          });
          const data = await res.json();
          if (data.needsClarification && data.questions?.length > 0) {
            setCurrentQuestion(data.questions[0]);
            setStep('clarifying');
          } else if (data.generated) {
            setGenerated(data.generated);
            setStep('review');
          }
        } catch (err) {
          setError('Ошибка при уточнении. Попробуйте снова.');
          setStep('input');
        }
      })();
    }, 300);
  }, [currentQuestion, answers, goal, companyName, token]);

  const handleCreate = useCallback(async () => {
    if (!generated) return;
    setStep('creating');
    try {
      await onSubmit({
        name: generated.name,
        systemPrompt: generated.systemPrompt,
        emoji: generated.emoji,
        description: generated.description,
      });
    } catch (err) {
      setError('Ошибка создания агента');
      setStep('review');
    }
  }, [generated, onSubmit]);

  const handleSkipClarification = useCallback(() => {
    setAnswers({ ...answers, _skipped: 'true' });
    setStep('generating');
    // Force generation without clarification
    setTimeout(() => {
      handleGenerate();
    }, 500);
  }, [answers, handleGenerate]);

  // ==================== RENDER ====================

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-6">
        {(['input', 'thinking', 'clarifying', 'generating', 'review', 'creating'] as Step[]).map((s, i) => {
          const isActive = step === s;
          const isPast = ['input', 'thinking', 'clarifying', 'generating', 'review', 'creating'].indexOf(step) > i;
          return (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full transition-all duration-500 ${
                isActive ? 'bg-brand w-6' : isPast ? 'bg-brand' : 'bg-border'
              }`} />
              {i < 5 && <div className={`w-4 h-px ${isPast ? 'bg-brand' : 'bg-border'}`} />}
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* STEP: INPUT */}
        {step === 'input' && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-5"
          >
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center mx-auto mb-3">
                <Bot className="w-6 h-6 text-brand" />
              </div>
              <h3 className="text-[18px] font-semibold text-text mb-1">Создайте своего агента</h3>
              <p className="text-[13px] text-text-secondary">
                Опишите, что должен делать агент — ИИ подберёт всё идеально
              </p>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-text mb-1.5">
                Что должен делать агент?
              </label>
              <Textarea
                placeholder="Например: отвечать на вопросы клиентов интернет-магазина, помогать с выбором товара, оформлять заказы и отслеживать доставку"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                rows={4}
                className="text-[14px]"
              />
              <p className="text-[11px] text-text-muted mt-1.5">
                Чем подробнее описание — тем лучше агент. Можно указать: целевую аудиторию, задачи, тон общения, интеграции.
              </p>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[13px] text-[var(--danger)]"
              >
                {error}
              </motion.p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={onCancel}>
                Отмена
              </Button>
              <Button
                variant="primary"
                onClick={handleGenerate}
                disabled={!goal.trim() || !token}
                className="gap-2"
              >
                <Sparkles size={16} />
                Сгенерировать агента
              </Button>
            </div>
          </motion.div>
        )}

        {/* STEP: THINKING */}
        {step === 'thinking' && (
          <motion.div
            key="thinking"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-16"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center mb-6"
            >
              <Brain className="w-8 h-8 text-brand" />
            </motion.div>
            <p className="text-[15px] font-medium text-text mb-2">Анализирую вашу задачу...</p>
            <p className="text-[13px] text-text-secondary">Изучаю контекст, определяю лучший подход</p>
          </motion.div>
        )}

        {/* STEP: CLARIFYING */}
        {step === 'clarifying' && currentQuestion && (
          <motion.div
            key="clarifying"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="space-y-5"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-brand" />
              </div>
              <span className="text-[13px] text-brand font-medium">Уточнение #{Object.keys(answers).length + 1}</span>
            </div>

            <p className="text-[16px] font-medium text-text leading-relaxed">
              {currentQuestion.question}
            </p>

            <div className="space-y-2">
              {currentQuestion.options.map((opt) => (
                <motion.button
                  key={opt}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleAnswer(opt)}
                  className="w-full text-left px-4 py-3 rounded-xl border border-[var(--border)] bg-surface hover:bg-accent-soft hover:border-brand/30 transition-all duration-200 text-[14px] text-text"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border-2 border-border flex items-center justify-center flex-shrink-0">
                      <ChevronRight size={12} className="text-text-muted" />
                    </div>
                    {opt}
                  </div>
                </motion.button>
              ))}
            </div>

            <button
              onClick={handleSkipClarification}
              className="text-[13px] text-text-muted hover:text-brand transition-colors"
            >
              Пропустить уточнения →
            </button>
          </motion.div>
        )}

        {/* STEP: GENERATING */}
        {step === 'generating' && (
          <motion.div
            key="generating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-10"
          >
            <div className="space-y-4">
              {GENERATION_STEPS.map((s, i) => {
                const Icon = s.icon;
                const isActive = i === generatingStep;
                const isPast = i < generatingStep;
                return (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{
                      opacity: isActive || isPast ? 1 : 0.4,
                      x: 0,
                      scale: isActive ? 1.02 : 1,
                    }}
                    transition={{ duration: 0.4 }}
                    className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${
                      isActive ? 'bg-accent-soft border border-brand/20' : 'bg-surface-2'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                      isPast ? 'bg-brand/20' : isActive ? 'bg-brand/15' : 'bg-surface-3'
                    }`}>
                      {isPast ? (
                        <Check size={18} className="text-brand" />
                      ) : isActive ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                        >
                          <Loader2 size={18} className="text-brand" />
                        </motion.div>
                      ) : (
                        <Icon size={18} className="text-text-muted" />
                      )}
                    </div>
                    <div>
                      <p className={`text-[14px] font-medium transition-colors ${
                        isActive ? 'text-brand' : isPast ? 'text-text' : 'text-text-muted'
                      }`}>
                        {s.label}
                      </p>
                      {isActive && (
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: '100%' }}
                          transition={{ duration: s.duration / 1000, ease: 'linear' }}
                          className="h-1 bg-brand/30 rounded-full mt-2"
                        />
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* STEP: REVIEW */}
        {step === 'review' && generated && (
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-5"
          >
            <div className="text-center mb-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto mb-3 text-[28px]"
              >
                {generated.emoji}
              </motion.div>
              <h3 className="text-[20px] font-semibold text-text">{generated.name}</h3>
              <p className="text-[13px] text-text-secondary mt-1">{generated.description}</p>
              {generated.confidence > 0.8 && (
                <span className="inline-flex items-center gap-1 text-[11px] text-brand bg-brand/10 px-2 py-0.5 rounded-pill mt-2">
                  <Check size={10} />
                  Уверенность AI: {(generated.confidence * 100).toFixed(0)}%
                </span>
              )}
            </div>

            <div className="bg-surface-2 rounded-xl p-4 space-y-3">
              <div>
                <label className="text-[12px] font-medium text-text-muted uppercase tracking-wide">Имя</label>
                <Input
                  value={generated.name}
                  onChange={(e) => setGenerated({ ...generated, name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-[12px] font-medium text-text-muted uppercase tracking-wide">Системный промпт</label>
                <Textarea
                  value={generated.systemPrompt}
                  onChange={(e) => setGenerated({ ...generated, systemPrompt: e.target.value })}
                  rows={8}
                  className="mt-1 text-[13px] leading-relaxed"
                />
              </div>
              <div>
                <label className="text-[12px] font-medium text-text-muted uppercase tracking-wide">Эмодзи</label>
                <div className="flex gap-2 mt-1">
                  {['🤖', '👩‍💼', '👨‍💼', '🧑‍💻', '👩‍🏫', '👨‍⚕️', '🛒', '🏠', '💼', generated.emoji].filter((e, i, arr) => arr.indexOf(e) === i).map((e) => (
                    <button
                      key={e}
                      onClick={() => setGenerated({ ...generated, emoji: e })}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-[20px] transition-all ${
                        generated.emoji === e ? 'bg-brand/20 ring-2 ring-brand' : 'bg-surface hover:bg-surface-3'
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <p className="text-[13px] text-[var(--danger)]">{error}</p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setStep('input')}>
                ← Назад
              </Button>
              <Button variant="ghost" onClick={handleGenerate}>
                <Sparkles size={14} className="mr-1" />
                Перегенерировать
              </Button>
              <Button variant="primary" onClick={handleCreate} className="gap-2">
                <Rocket size={16} />
                Создать агента
              </Button>
            </div>
          </motion.div>
        )}

        {/* STEP: CREATING */}
        {step === 'creating' && (
          <motion.div
            key="creating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 150 }}
              className="w-20 h-20 rounded-2xl bg-brand/10 flex items-center justify-center mb-6 text-[36px]"
            >
              {generated?.emoji || '🚀'}
            </motion.div>
            <motion.p
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-[16px] font-medium text-brand"
            >
              Создаю вашего агента...
            </motion.p>
            <p className="text-[13px] text-text-secondary mt-2">
              Настраиваю модель, сохраняю промпт, готовлю к работе
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
