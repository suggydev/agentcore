// DEPRECATED: This component is replaced in the redesign/cto-style branch. Do not add new features here.
'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Check, LayoutDashboard, Bot } from 'lucide-react';
import { useAgentStore } from '@/store/agentStore';

interface TourStep {
 id: string;
 title: string;
 icon: React.ElementType;
 spotlightSelector?: string;
}

const STEPS: TourStep[] = [
 {
 id: 'dashboard',
 title: 'Это ваша панель управления — здесь вся статистика',
 icon: LayoutDashboard,
 },
 {
 id: 'agents',
 title: 'Создайте AI-агента в разделе Агенты',
 icon: Bot,
 spotlightSelector: 'a[href="/agents"]',
 },
 {
 id: 'done',
 title: 'Готово! Начните работу',
 icon: Check,
 },
];

export default function OnboardingTour() {
 const [step, setStep] = useState(0);
 const [visible, setVisible] = useState(false);
 const [spotlight, setSpotlight] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
 const setOnboardingTourCompleted = useAgentStore((s) => s.setOnboardingTourCompleted);

 const currentStep = STEPS[step];
 const isLast = step === STEPS.length - 1;

 const calculateSpotlight = useCallback((selector: string | undefined) => {
 if (!selector) {
 setSpotlight(null);
 return;
 }
 const el = document.querySelector(selector) as HTMLElement | null;
 if (el) {
 const rect = el.getBoundingClientRect();
 setSpotlight({
 top: rect.top,
 left: rect.left,
 width: rect.width,
 height: rect.height,
 });
 el.scrollIntoView({ behavior: 'smooth', block: 'center' });
 }
 }, []);

 useEffect(() => {
 calculateSpotlight(currentStep.spotlightSelector);
 }, [step, visible, currentStep, calculateSpotlight]);

 useEffect(() => {
 const timer = setTimeout(() => setVisible(true), 600);
 return () => clearTimeout(timer);
 }, []);

 const complete = useCallback(() => {
 setVisible(false);
 setOnboardingTourCompleted();
 }, [setOnboardingTourCompleted]);

 const goNext = useCallback(() => {
 if (isLast) {
 complete();
 } else {
 setStep((s) => s + 1);
 }
 }, [isLast, complete]);

 const skip = useCallback(() => {
 complete();
 }, [complete]);

 useEffect(() => {
 if (!visible) return;
 const handler = (e: KeyboardEvent) => {
 if (e.key === 'Escape') skip();
 if (e.key === 'ArrowRight') goNext();
 };
 window.addEventListener('keydown', handler);
 return () => window.removeEventListener('keydown', handler);
 }, [visible, skip, goNext]);

 useEffect(() => {
 if (!visible) return;
 const handleResize = () => calculateSpotlight(currentStep.spotlightSelector);
 window.addEventListener('resize', handleResize);
 return () => window.removeEventListener('resize', handleResize);
 }, [visible, currentStep, calculateSpotlight]);

 if (!visible) return null;

 const Icon = currentStep.icon;

 return (
 <AnimatePresence>
 <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ pointerEvents: 'all' }}>
 {/* Overlay */}
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 transition={{ duration: 0.3 }}
 className="absolute inset-0"
 style={{ background: 'rgba(17, 19, 24, 0.7)', backdropFilter: 'blur(2px)' }}
 />

 {/* Spotlight cutout */}
 {spotlight && (
 <motion.div
 key={`spot-${step}`}
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 transition={{ duration: 0.3 }}
 className="absolute"
 style={{
 top: spotlight.top,
 left: spotlight.left,
 width: spotlight.width,
 height: spotlight.height,
 borderRadius: 8,
 boxShadow: '0 0 0 9999px rgba(17, 19, 24, 0.7)',
 background: 'transparent',
 zIndex: 10,
 }}
 />
 )}

 {/* Card */}
 <motion.div
 key={`card-${step}`}
 initial={{ opacity: 0, y: 24, scale: 0.97 }}
 animate={{ opacity: 1, y: 0, scale: 1 }}
 exit={{ opacity: 0, y: 24, scale: 0.97 }}
 transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
 className="relative z-20 w-[384px] max-w-[92vw]"
 >
 <div className="bg-white rounded-2xl shadow-2xl border border-[var(--border)] overflow-hidden">
 {/* Header */}
 <div className="flex items-center justify-between px-5 pt-5 pb-2">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--brand)] to-[var(--brand)] flex items-center justify-center">
 <Icon className="w-5 h-5 text-white" />
 </div>
 <span className="text-xs font-semibold uppercase tracking-wider text-[var(--brand)]">
 Шаг {step + 1} из {STEPS.length}
 </span>
 </div>
 <button
 onClick={skip}
 className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
 aria-label="Пропустить обучение"
 >
 <X className="w-4 h-4" />
 </button>
 </div>

 {/* Content */}
 <div className="px-5 py-4">
 <p className="text-base text-[var(--text)] leading-relaxed">
 {currentStep.title}
 </p>
 </div>

 {/* Footer */}
 <div className="flex items-center justify-between px-5 py-4 border-t border-[var(--border)]">
 <div className="flex gap-1.5">
 {STEPS.map((_, i) => (
 <div
 key={i}
 className={`h-2 rounded-full transition-all duration-300 ${
 i === step
 ? 'bg-[var(--brand)] w-6'
 : i < step
 ? 'bg-[var(--brand)]/30 w-2'
 : 'bg-[var(--border)] w-2'
 }`}
 />
 ))}
 </div>

 <div className="flex items-center gap-2">
 <button
 onClick={skip}
 className="px-3 py-2 rounded-xl text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
 >
 Пропустить
 </button>
 <button
 onClick={goNext}
 className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
 isLast
 ? 'bg-[var(--accent)] text-white hover:shadow-lg'
 : 'btn-primary text-sm py-2.5 px-5'
 }`}
 >
 {isLast ? (
 <>
 <Check className="w-4 h-4" />
 Начать работу
 </>
 ) : (
 <>
 Далее
 <ChevronRight className="w-4 h-4" />
 </>
 )}
 </button>
 </div>
 </div>
 </div>
 </motion.div>
 </div>
 </AnimatePresence>
 );
}
