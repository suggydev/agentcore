'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, ArrowRight, Sparkles, MessageSquare, Zap, Brain, Rocket } from 'lucide-react';
import { Question } from '../page';

interface StepInterviewProps {
  questions: Question[];
  answers: Record<string, string | string[]>;
  goal: string;
  onAnswersChange: (answers: Record<string, string | string[]>) => void;
  onSkip: () => void;
  onComplete: () => void;
  onBack: () => void;
}

const isCustomOption = (opt: string) => /custom|other|own|свой|другой|другое|иначе/i.test(opt);

export default function StepInterview({ questions, answers, goal, onAnswersChange, onSkip, onComplete, onBack }: StepInterviewProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [direction, setDirection] = useState(1);
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});
  const [customActive, setCustomActive] = useState<Record<string, boolean>>({});

  const currentQuestion = questions[currentIdx];
  const progress = questions.length > 0 ? ((currentIdx + 1) / questions.length) * 100 : 0;

  const selectSingle = useCallback((qid: string, option: string) => {
    if (isCustomOption(option)) {
      setCustomActive(prev => ({ ...prev, [qid]: true }));
      return;
    }
    onAnswersChange({ ...answers, [qid]: option });
    setCustomActive(prev => ({ ...prev, [qid]: false }));
    if (currentIdx < questions.length - 1) {
      setTimeout(() => { setDirection(1); setCurrentIdx(i => i + 1); }, 400);
    }
  }, [currentIdx, questions.length, answers, onAnswersChange]);

  const toggleMultiple = useCallback((qid: string, option: string) => {
    const current = answers[qid];
    let arr: string[] = Array.isArray(current) ? [...current] : typeof current === 'string' && current ? [current] : [];
    const idx = arr.indexOf(option);
    if (idx >= 0) arr.splice(idx, 1); else arr.push(option);
    onAnswersChange({ ...answers, [qid]: arr });
  }, [answers, onAnswersChange]);

  const submitCustom = useCallback((qid: string) => {
    const val = customInputs[qid]?.trim();
    if (!val) return;
    const q = questions.find(qq => qq.id === qid);
    if (!q) return;
    if (q.type === 'multiple_choice') {
      const current = answers[qid];
      let arr: string[] = Array.isArray(current) ? [...current] : typeof current === 'string' && current ? [current] : [];
      if (!arr.includes(val)) arr.push(val);
      onAnswersChange({ ...answers, [qid]: arr });
    } else {
      onAnswersChange({ ...answers, [qid]: val });
      if (currentIdx < questions.length - 1) {
        setTimeout(() => { setDirection(1); setCurrentIdx(i => i + 1); }, 400);
      }
    }
    setCustomActive(prev => ({ ...prev, [qid]: false }));
    setCustomInputs(prev => ({ ...prev, [qid]: '' }));
  }, [currentIdx, questions, answers, onAnswersChange, customInputs]);

  const goNext = useCallback(() => {
    if (currentIdx < questions.length - 1) { setDirection(1); setCurrentIdx(i => i + 1); }
  }, [currentIdx, questions.length]);

  const goPrev = useCallback(() => {
    if (currentIdx > 0) { setDirection(-1); setCurrentIdx(i => i - 1); }
  }, [currentIdx]);

  const allAnswered = questions.length > 0 && questions.every(q => {
    const ans = answers[q.id];
    if (q.type === 'multiple_choice') return Array.isArray(ans) && ans.length > 0;
    return typeof ans === 'string' && ans.trim().length > 0;
  });

  const isCurrentAnswered = () => {
    if (!currentQuestion) return false;
    const ans = answers[currentQuestion.id];
    if (currentQuestion.type === 'multiple_choice') return Array.isArray(ans) && ans.length > 0;
    return typeof ans === 'string' && ans.trim().length > 0;
  };

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 100 : -100, opacity: 0, scale: 0.95 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -100 : 100, opacity: 0, scale: 0.95 }),
  };

  if (!currentQuestion) {
    return (
      <motion.div className="min-h-screen flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="text-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
            <Brain size={40} className="text-brand mx-auto mb-4" />
          </motion.div>
          <p className="text-text-secondary">Формируем вопросы...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <button onClick={onBack} className="flex items-center gap-2 text-text-muted hover:text-text transition-colors text-sm">
          <ChevronLeft size={16} /> Назад
        </button>
        <div className="text-xs text-text-muted font-mono">ШАГ 2 ИЗ 5</div>
      </div>

      {/* Progress */}
      <div className="px-6 py-3">
        <div className="h-1 bg-surface-3 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="h-full bg-brand rounded-full"
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] text-text-muted">Вопрос {currentIdx + 1} из {questions.length}</span>
          <span className="text-[10px] text-brand font-medium">{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Goal context */}
      <div className="px-6 py-2">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand/5 border border-brand/10 text-xs text-brand">
          <Sparkles size={12} /> {goal.length > 50 ? goal.slice(0, 50) + '...' : goal}
        </div>
      </div>

      {/* Question area */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-xl w-full">
          <div className="overflow-hidden relative min-h-[400px]">
            <AnimatePresence mode="popLayout" custom={direction}>
              <motion.div
                key={currentQuestion.id}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: 'easeInOut' }}
                className="bg-surface rounded-2xl p-8 space-y-6 border border-border shadow-lg shadow-black/5"
              >
                {/* Question header */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center flex-shrink-0">
                    <MessageSquare size={18} className="text-brand" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-text leading-relaxed">{currentQuestion.question}</p>
                    {currentQuestion.type === 'multiple_choice' && (
                      <p className="text-xs text-text-muted mt-1">Можно выбрать несколько вариантов</p>
                    )}
                  </div>
                </div>

                {/* Options */}
                <div className="space-y-2.5">
                  {currentQuestion.options.map(opt => {
                    const ans = answers[currentQuestion.id];
                    let selected = false;
                    if (currentQuestion.type === 'multiple_choice') selected = Array.isArray(ans) && ans.includes(opt);
                    else selected = ans === opt;
                    const custom = isCustomOption(opt);
                    const customOpen = customActive[currentQuestion.id] && selected && currentQuestion.type === 'single_choice';

                    return (
                      <div key={opt}>
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            if (custom) {
                              setCustomActive(prev => ({ ...prev, [currentQuestion.id]: true }));
                              if (currentQuestion.type === 'single_choice') onAnswersChange({ ...answers, [currentQuestion.id]: opt });
                            } else if (currentQuestion.type === 'multiple_choice') {
                              toggleMultiple(currentQuestion.id, opt);
                            } else {
                              selectSingle(currentQuestion.id, opt);
                            }
                          }}
                          className={`w-full text-left px-4 py-4 rounded-xl border transition-all duration-200 text-sm ${
                            selected
                              ? 'border-brand bg-brand/5 shadow-sm'
                              : 'border-border bg-surface-2 hover:bg-accent-soft/30 hover:border-brand/20'
                          } text-text`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 flex items-center justify-center flex-shrink-0 transition-colors ${
                              selected ? 'bg-brand border-brand' : 'border-2 border-border'
                            } ${currentQuestion.type === 'multiple_choice' ? 'rounded-md' : 'rounded-full'}`}>
                              {selected && (currentQuestion.type === 'multiple_choice' ? <Check size={12} className="text-white" /> : <div className="w-2 h-2 rounded-full bg-white" />)}
                            </div>
                            <span className="leading-relaxed">{opt}</span>
                          </div>
                        </motion.button>

                        {customOpen && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2 px-1">
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={customInputs[currentQuestion.id] || ''}
                                onChange={e => setCustomInputs(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))}
                                placeholder="Опишите своими словами..."
                                className="flex-1 px-3 py-2.5 rounded-lg border border-border bg-surface text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/30"
                                autoFocus
                                onKeyDown={e => { if (e.key === 'Enter') submitCustom(currentQuestion.id); }}
                              />
                              <button
                                onClick={() => submitCustom(currentQuestion.id)}
                                disabled={!customInputs[currentQuestion.id]?.trim()}
                                className="px-4 py-2.5 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-hover disabled:opacity-40 transition-colors"
                              >
                                OK
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Selected count for multiple */}
                {currentQuestion.type === 'multiple_choice' && (
                  <div className="text-xs text-text-muted">
                    {(() => {
                      const ans = answers[currentQuestion.id];
                      const count = Array.isArray(ans) ? ans.length : 0;
                      return count > 0 ? `Выбрано: ${count} вариантов` : 'Выберите один или несколько вариантов';
                    })()}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={goPrev}
              disabled={currentIdx === 0}
              className="flex items-center gap-1 text-sm text-text-muted hover:text-brand transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} /> Назад
            </button>

            <div className="flex items-center gap-1.5">
              {questions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setDirection(i > currentIdx ? 1 : -1); setCurrentIdx(i); }}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i === currentIdx ? 'bg-brand w-4' : i < currentIdx ? 'bg-brand/50' : 'bg-border'
                  }`}
                />
              ))}
            </div>

            {currentIdx < questions.length - 1 ? (
              <button
                onClick={goNext}
                disabled={!isCurrentAnswered()}
                className="flex items-center gap-1 text-sm text-text-muted hover:text-brand transition-colors disabled:opacity-30"
              >
                Далее <ChevronRight size={16} />
              </button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onComplete}
                disabled={!allAnswered}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand text-white text-sm font-medium hover:bg-brand-hover disabled:opacity-40 transition-all"
              >
                Продолжить <ArrowRight size={16} />
              </motion.button>
            )}
          </div>

          <div className="text-center mt-4">
            <button onClick={onSkip} className="text-xs text-text-muted hover:text-brand transition-colors">
              Пропустить уточнения →
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
