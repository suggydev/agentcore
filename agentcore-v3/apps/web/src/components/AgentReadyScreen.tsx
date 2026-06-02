'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, FlaskConical, Map, Plug, BookOpen, ArrowLeft, MessageSquare, Send } from 'lucide-react';

interface AgentReadyScreenProps {
 agent: {
 id: string;
 name: string;
 description?: string;
 model?: string;
 };
 testPrompts?: string[];
 onClose: () => void;
}

interface ActionCard {
 icon: React.ElementType;
 label: string;
 href: string;
 colorClass: string;
}

const ACTION_CARDS: ActionCard[] = [
 { icon: FlaskConical, label: 'Тест', href: 'test', colorClass: 'from-amber-400 to-orange-500' },
 { icon: Map, label: 'Настроить логику', href: 'brain-map', colorClass: 'from-violet-400 to-purple-500' },
 { icon: Plug, label: 'Подключить каналы', href: 'integrations', colorClass: 'from-blue-400 to-indigo-500' },
 { icon: BookOpen, label: 'Добавить знания', href: 'knowledge', colorClass: 'from-emerald-400 to-teal-500' },
];

function resolveActionHref(baseHref: string, agentId: string): string {
 switch (baseHref) {
 case 'test':
 return `/agents/brain-map/test?agent=${agentId}`;
 case 'brain-map':
 return `/agents/brain-map?agent=${agentId}`;
 case 'integrations':
 return '/agents';
 case 'knowledge':
 return '/knowledge';
 default:
 return '/agents';
 }
}

function generateBotReply(agentName: string): string {
 return `Привет! Я ${agentName}, готов помочь. Расскажите что нужно и я предоставлю информацию.`;
}

export default function AgentReadyScreen({ agent, testPrompts, onClose }: AgentReadyScreenProps) {
 const [activePrompt, setActivePrompt] = useState<string | null>(null);
 const [typingText, setTypingText] = useState('');
 const [isTyping, setIsTyping] = useState(false);
 const [showTooltip, setShowTooltip] = useState(false);

 const prompts = testPrompts && testPrompts.length > 0 ? testPrompts : [
 'Здравствуйте! Чем могу помочь?',
 'Расскажите о ваших услугах',
 'Мне нужна консультация',
 ];

 const fullBotReply = generateBotReply(agent.name);

 useEffect(() => {
 if (!activePrompt) {
 setTypingText('');
 setIsTyping(false);
 return;
 }

 setIsTyping(true);
 setTypingText('');

 let index = 0;
 const interval = setInterval(() => {
 if (index < fullBotReply.length) {
 setTypingText(fullBotReply.slice(0, index + 1));
 index++;
 } else {
 clearInterval(interval);
 setIsTyping(false);
 }
 }, 25);

 return () => clearInterval(interval);
 }, [activePrompt, fullBotReply]);

 const handlePromptClick = useCallback((prompt: string) => {
 setActivePrompt((prev) => (prev === prompt ? null : prompt));
 }, []);

 const descriptionText = agent.description || 'Ваш AI-агент настроен и готов помогать клиентам.';

 return (
 <motion.div
 className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-gradient-to-b from-white via-[var(--accent-soft)]/50 to-[var(--accent-soft)] px-4 py-10 sm:py-16"
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 transition={{ duration: 0.4 }}
 >
 <motion.div
 className="w-full max-w-2xl"
 initial={{ scale: 0.8, opacity: 0 }}
 animate={{ scale: 1, opacity: 1 }}
 transition={{ type: 'spring', stiffness: 120, damping: 16, delay: 0.1 }}
 >
 <div className="rounded-3xl border border-white/60 bg-white/70 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
 <div className="flex flex-col items-center text-center">
 <motion.div
 className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--brand)] to-[var(--brand)]/60 shadow-lg"
 initial={{ scale: 0 }}
 animate={{ scale: 1 }}
 transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.2 }}
 >
 <Brain className="h-7 w-7 text-white" strokeWidth={2} />
 <motion.div
 className="absolute inset-0 rounded-2xl border-2 border-[var(--brand)]/40/40"
 initial={{ scale: 1, opacity: 0.6 }}
 animate={{ scale: [1, 1.4, 1.4], opacity: [0.6, 0, 0] }}
 transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
 />
 </motion.div>

 <motion.h2
 className="font-display text-2xl font-bold tracking-display text-[var(--text)] sm:text-3xl"
 initial={{ opacity: 0, y: 16 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.5, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
 >
 {agent.name} готов!
 </motion.h2>

 <motion.p
 className="mt-2 max-w-md text-base text-[var(--text-muted)]"
 initial={{ opacity: 0, y: 12 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.5, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
 >
 {descriptionText}
 </motion.p>

 <motion.div
 className="mt-8 grid w-full grid-cols-2 gap-3 sm:gap-4"
 initial="hidden"
 animate="visible"
 variants={{
 visible: { transition: { staggerChildren: 0.1 } },
 }}
 >
 {ACTION_CARDS.map((card) => {
 const Icon = card.icon;
 const href = resolveActionHref(card.href, agent.id);
 return (
 <motion.a
 key={card.href}
 href={href}
 className="group relative flex flex-col items-center gap-3 rounded-2xl border border-[var(--border)] bg-white p-5 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[var(--border)]/80 hover:shadow-md sm:p-6"
 variants={{
 hidden: { opacity: 0, y: 20 },
 visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
 }}
 whileHover={{ y: -4 }}
 whileTap={{ scale: 0.97 }}
 >
 <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${card.colorClass} shadow-md`}>
 <Icon className="h-5 w-5 text-white" strokeWidth={2} />
 </div>
 <span className="text-sm font-medium text-[var(--text)] sm:text-base">{card.label}</span>
 </motion.a>
 );
 })}
 </motion.div>

 <motion.div
 className="mt-8 w-full"
 initial={{ opacity: 0, y: 16 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.5, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
 >
 <p className="mb-3 text-left text-xs font-semibold uppercase tracking-label text-[var(--text-muted)]">
 Попробуйте спросить
 </p>
 <div className="flex flex-wrap gap-2">
 {prompts.slice(0, 3).map((prompt, i) => (
 <motion.button
 key={i}
 className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-300 ${
 activePrompt === prompt
 ? 'border-[var(--brand)]/40 bg-[var(--accent-soft)] text-[var(--brand)] shadow-sm'
 : 'border-[var(--border)] bg-white text-[var(--text)] hover:border-[var(--brand)]/30 hover:bg-[var(--accent-soft)] hover:text-[var(--brand)]'
 }`}
 onClick={() => handlePromptClick(prompt)}
 whileHover={{ scale: 1.03 }}
 whileTap={{ scale: 0.97 }}
 >
 <MessageSquare className="h-3.5 w-3.5" strokeWidth={2} />
 {prompt}
 </motion.button>
 ))}
 </div>

 <AnimatePresence mode="wait">
 {activePrompt && (
 <motion.div
 key={activePrompt}
 className="mt-4 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--accent-soft)]"
 initial={{ height: 0, opacity: 0 }}
 animate={{ height: 'auto', opacity: 1 }}
 exit={{ height: 0, opacity: 0 }}
 transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
 >
 <div className="flex flex-col gap-3 p-4">
 <motion.div
 className="flex items-start gap-2.5"
 initial={{ opacity: 0, x: -12 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ duration: 0.3, delay: 0.05 }}
 >
 <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--border)]">
 <span className="text-xs font-bold text-[var(--brand)]">U</span>
 </div>
 <div className="rounded-2xl rounded-tl-md bg-white px-3.5 py-2 text-sm text-[var(--text)] shadow-sm">
 {activePrompt}
 </div>
 </motion.div>
 <motion.div
 className="flex items-start gap-2.5"
 initial={{ opacity: 0, x: -12 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ duration: 0.3, delay: 0.15 }}
 >
 <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--brand)] to-[var(--brand)]/60">
 <Brain className="h-3.5 w-3.5 text-white" />
 </div>
 <div className="rounded-2xl rounded-tl-md bg-[var(--accent-soft)] px-3.5 py-2 text-sm text-[var(--text)] shadow-sm">
 {typingText}
 {isTyping && (
 <motion.span
 animate={{ opacity: [0, 1] }}
 transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
 className="ml-0.5 inline-block h-4 w-0.5 bg-[var(--brand)]"
 />
 )}
 </div>
 </motion.div>
 <motion.div
 className="flex items-center gap-2 border-t border-[var(--border)] pt-3"
 initial={{ opacity: 0, y: 8 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.3, delay: 0.25 }}
 >
 <div className="flex flex-1 items-center gap-2 rounded-full border border-[var(--border)] bg-white px-3 py-1.5">
 <span className="text-xs text-[var(--text-muted)]">Напишите сообщение...</span>
 </div>
 <div
 className="relative"
 onMouseEnter={() => setShowTooltip(true)}
 onMouseLeave={() => setShowTooltip(false)}
 >
 <button className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand)]/25 text-white shadow-sm transition-transform hover:scale-105 active:scale-95 cursor-default">
 <Send className="h-3.5 w-3.5" />
 </button>
 <AnimatePresence>
 {showTooltip && (
 <motion.div
 className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[var(--accent)] px-2.5 py-1 text-xs text-white shadow-lg"
 initial={{ opacity: 0, y: 4 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: 4 }}
 transition={{ duration: 0.15 }}
 >
 Режим предпросмотра
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 </motion.div>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </motion.div>

 <motion.button
 className="mt-8 inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-6 py-3 text-sm font-semibold text-[var(--text)] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--border)] hover:bg-[var(--surface-2)] hover:shadow-md active:scale-[0.98]"
 onClick={onClose}
 initial={{ opacity: 0, y: 12 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.5, delay: 1, ease: [0.16, 1, 0.3, 1] }}
 whileHover={{ y: -2 }}
 whileTap={{ scale: 0.97 }}
 >
 <ArrowLeft className="h-4 w-4" strokeWidth={2} />
 К списку агентов
 </motion.button>
 </div>
 </div>
 </motion.div>
 </motion.div>
 );
}
