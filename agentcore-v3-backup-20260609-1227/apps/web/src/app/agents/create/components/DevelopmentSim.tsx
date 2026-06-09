'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, Clock, Brain, Code, Database, Link, Shield,
  Rocket, Sparkles, Wand2, Zap, ChevronLeft, Loader2, ArrowRight
} from 'lucide-react';
import { GeneratedAgent } from '../page';

interface DevelopmentSimProps {
  generated: GeneratedAgent | null;
  onComplete: () => void;
}

interface DevStage {
  id: string;
  title: string;
  description: string;
  icon: any;
  duration: number; // milliseconds for animation
  estimatedTime: string; // human-readable time for display
  color: string;
}

const STAGES: DevStage[] = [
  { id: 'analysis', title: 'Анализ требований', description: 'Изучение бизнес-задачи и профиля клиента', icon: Brain, duration: 3000, estimatedTime: '30 сек', color: '#6E56CF' },
  { id: 'logic', title: 'Проектирование логики', description: 'Создание диалоговых сценариев и ветвлений', icon: Code, duration: 5000, estimatedTime: '2 мин', color: '#3B82F6' },
  { id: 'memory', title: 'Создание памяти агента', description: 'Формирование контекстной базы и инструкций', icon: Database, duration: 8000, estimatedTime: '8 мин', color: '#EC4899' },
  { id: 'tools', title: 'Настройка инструментов', description: 'Подключение CRM, аналитики и автоматизаций', icon: Wand2, duration: 4000, estimatedTime: '1 мин', color: '#F59E0B' },
  { id: 'integrations', title: 'Подключение интеграций', description: 'Интеграция с каналами коммуникации', icon: Link, duration: 5000, estimatedTime: '2 мин', color: '#14B8A6' },
  { id: 'knowledge', title: 'Обучение базы знаний', description: 'Загрузка и структурирование знаний', icon: Sparkles, duration: 6000, estimatedTime: '5 мин', color: '#8B5CF6' },
  { id: 'security', title: 'Проверка безопасности', description: 'Валидация промптов и ограничений', icon: Shield, duration: 3000, estimatedTime: '30 сек', color: '#22C55E' },
  { id: 'final', title: 'Финальная проверка', description: 'Тестирование и оптимизация', icon: Rocket, duration: 4000, estimatedTime: '1 мин', color: '#EF4444' },
];

function calculateReadyTime(): Date {
  const now = new Date();
  const hours = 6 + Math.floor(Math.random() * 19); // 6-24 hours
  const readyTime = new Date(now.getTime() + hours * 60 * 60 * 1000);

  // If it falls between 22:00 and 08:00, shift to 10:00 next day
  const hour = readyTime.getHours();
  if (hour >= 22 || hour < 8) {
    readyTime.setDate(readyTime.getDate() + 1);
    readyTime.setHours(10, Math.floor(Math.random() * 30), 0, 0);
  }

  return readyTime;
}

function formatReadyTime(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffHours < 1) {
    return `${diffMinutes} мин`;
  }
  return `${diffHours} ч ${diffMinutes} мин`;
}

export default function DevelopmentSim({ generated, onComplete }: DevelopmentSimProps) {
  const [currentStage, setCurrentStage] = useState(-1);
  const [completedStages, setCompletedStages] = useState<string[]>([]);
  const [readyTime, setReadyTime] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [showComplete, setShowComplete] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stageTimer, setStageTimer] = useState(0); // milliseconds remaining for current stage

  useEffect(() => {
    const rt = calculateReadyTime();
    setReadyTime(rt);

    // Start stages sequentially
    let stageIndex = 0;
    const runStage = () => {
      if (stageIndex >= STAGES.length) {
        setShowComplete(true);
        return;
      }
      setCurrentStage(stageIndex);
      setProgress(((stageIndex + 1) / STAGES.length) * 100);

      setTimeout(() => {
        setCompletedStages(prev => [...prev, STAGES[stageIndex].id]);
        stageIndex++;
        runStage();
      }, STAGES[stageIndex].duration);
    };

    const startDelay = setTimeout(() => {
      runStage();
    }, 800);

    return () => clearTimeout(startDelay);
  }, []);

  // Stage countdown timer
  useEffect(() => {
    if (currentStage < 0 || currentStage >= STAGES.length) return;
    const duration = STAGES[currentStage].duration;
    setStageTimer(duration);
    const interval = setInterval(() => {
      setStageTimer((prev) => {
        if (prev <= 100) {
          clearInterval(interval);
          return 0;
        }
        return prev - 100;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [currentStage]);

  useEffect(() => {
    if (!readyTime) return;
    const interval = setInterval(() => {
      setTimeLeft(formatReadyTime(readyTime));
    }, 60000);
    setTimeLeft(formatReadyTime(readyTime));
    return () => clearInterval(interval);
  }, [readyTime]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden"
    >
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-brand/3 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/3 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4 z-20">
        <div className="text-xs text-text-muted font-mono">ШАГ 4 ИЗ 5</div>
      </div>

      <div className="relative z-10 max-w-lg w-full">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand/10 border border-brand/20 text-xs text-brand mb-4">
            <Rocket size={12} /> Разработка агента
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-text mb-2">
            Ваша команда работает
          </h1>
          <p className="text-sm text-text-muted">
            AI-инженеры проектируют {generated?.name || 'вашего агента'}
          </p>
        </motion.div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-brand rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-text-muted">
              {completedStages.length} из {STAGES.length} этапов
            </span>
            <span className="text-xs text-brand font-medium">
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        {/* Stages */}
        <div className="space-y-3">
          {STAGES.map((stage, i) => {
            const isCompleted = completedStages.includes(stage.id);
            const isActive = currentStage === i;
            const isPending = i > currentStage && currentStage !== -1;

            return (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{
                  opacity: isPending ? 0.3 : 1,
                  x: 0,
                  scale: isActive ? 1.02 : 1,
                }}
                transition={{ delay: i * 0.1, duration: 0.3 }}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-brand/5 border-brand/30 shadow-lg shadow-brand/5'
                    : isCompleted
                    ? 'bg-surface border-border'
                    : 'bg-surface/50 border-border/50'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                    isActive
                      ? 'animate-pulse'
                      : ''
                  }`}
                  style={{
                    background: isActive || isCompleted ? `${stage.color}20` : 'var(--surface-3)',
                    color: isActive || isCompleted ? stage.color : 'var(--text-muted)',
                  }}
                >
                  {isCompleted ? (
                    <CheckCircle size={18} />
                  ) : isActive ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    >
                      <stage.icon size={18} />
                    </motion.div>
                  ) : (
                    <stage.icon size={18} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-sm font-medium ${isActive ? 'text-text' : isCompleted ? 'text-text' : 'text-text-muted'}`}>
                      {stage.title}
                    </h3>
                    {isActive && (
                      <span className="text-[10px] text-brand bg-brand/10 px-1.5 py-0.5 rounded-full">
                        выполняется
                      </span>
                    )}
                    {!isActive && !isCompleted && (
                      <span className="text-[10px] text-text-muted bg-surface-3 px-1.5 py-0.5 rounded-full">
                        ~{stage.estimatedTime}
                      </span>
                    )}
                    {isCompleted && (
                      <span className="text-[10px] text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded-full">
                        готово
                      </span>
                    )}
                  </div>
                  <p className={`text-xs mt-0.5 ${isActive ? 'text-text-secondary' : 'text-text-muted'}`}>
                    {stage.description}
                  </p>
                </div>

                {isActive && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-brand tabular-nums">
                      {Math.ceil(stageTimer / 1000)}с
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                      <span className="w-1.5 h-1.5 rounded-full bg-brand/60 animate-pulse" style={{ animationDelay: '200ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-brand/30 animate-pulse" style={{ animationDelay: '400ms' }} />
                    </div>
                  </div>
                )}

                {isCompleted && (
                  <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Ready time estimate */}
        <AnimatePresence>
          {readyTime && !showComplete && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 rounded-xl bg-surface border border-border text-center"
            >
              <div className="flex items-center justify-center gap-2 text-sm text-text-muted mb-1">
                <Clock size={14} /> Ожидаемое время готовности
              </div>
              <p className="text-lg font-bold text-text">
                {readyTime.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                {' '}
                {readyTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-xs text-text-muted mt-1">
                Примерно через {timeLeft}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Complete button */}
        <AnimatePresence>
          {showComplete && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-8 text-center"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 text-sm mb-4">
                <CheckCircle size={14} /> Разработка завершена!
              </div>
              <p className="text-sm text-text-muted mb-4">
                Ваш агент готов раньше ожидаемого срока. Осталось только активировать.
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onComplete}
                className="px-8 py-3.5 rounded-xl bg-brand text-white font-medium text-sm hover:bg-brand-hover transition-all shadow-lg shadow-brand/20 flex items-center gap-2 mx-auto"
              >
                <Zap size={16} /> Активировать агента
                <ArrowRight size={16} />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
