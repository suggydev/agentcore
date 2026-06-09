'use client';

import { useState, useCallback, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import StepGoal from './components/StepGoal';
import StepInterview from './components/StepInterview';
import BrainDesigner from './components/BrainDesigner';
import DevelopmentSim from './components/DevelopmentSim';
import PaymentStep from './components/PaymentStep';

export interface Question {
  id: string;
  question: string;
  options: string[];
  type: 'single_choice' | 'multiple_choice';
}

export interface GeneratedAgent {
  name: string;
  emoji: string;
  systemPrompt: string;
  description: string;
  model: string;
  brainNodes: string[];
  confidence: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  isStreaming?: boolean;
}

export type WizardStep = 'goal' | 'interview' | 'designer' | 'development' | 'payment';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

const SYSTEM_PROMPT = 'Ты — эксперт по созданию AI-агентов для бизнеса на платформе AgentCore.\n\nПользователь описал задачу и ответил на уточняющие вопросы. Теперь сгенерируй идеального цифрового сотрудника.\n\nПокажи процесс мышления: что ты понял, какие аспекты учитываешь, почему делаешь именно такие выборы. Пиши живо, как AI-ассистент.\n\nВ конце обязательно включи JSON агента между маркерами:\n\n---AGENT_JSON---\n{\n  "name": "Короткое имя (2-3 слова)",\n  "emoji": "Подходящий эмодзи",\n  "systemPrompt": "Детальный системный промпт на русском (минимум 10 строк)",\n  "description": "Краткое описание 1-2 предложения",\n  "model": "glm-5p1",\n  "brainNodes": ["greeting","qualification","faq","leadCapture","escalation","memory"],\n  "confidence": 0.9\n}\n---END_JSON---';

export default function AgentCreatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-brand animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Загрузка...</p>
        </div>
      </div>
    }>
      <AgentCreateWizard />
    </Suspense>
  );
}

function AgentCreateWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialGoal = searchParams.get('goal') || '';

  const [step, setStep] = useState<WizardStep>(initialGoal ? 'interview' : 'goal');
  const [goal, setGoal] = useState(initialGoal);
  const [companyName, setCompanyName] = useState(searchParams.get('companyName') || '');
  const [channel, setChannel] = useState(searchParams.get('channel') || '');

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [generated, setGenerated] = useState<GeneratedAgent | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const [initTriggered, setInitTriggered] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const tk = localStorage.getItem('token') || '';
    if (!tk) { router.push('/login'); return; }
    setToken(tk);
    // Load company name from workspace profile
    fetch(`${API_BASE}/api/workspace`, {
      headers: { Authorization: `Bearer ${tk}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.settings?.companyName) {
          setCompanyName(data.settings.companyName);
        }
      })
      .catch(() => {});
  }, [router]);

  useEffect(() => {
    if (!token || !initialGoal || initTriggered) return;
    setInitTriggered(true);
    handleSubmitGoal(initialGoal, searchParams.get('companyName') || '');
  }, [token, initialGoal, initTriggered, searchParams]);

  const handleSubmitGoal = useCallback(async (g?: string, cn?: string) => {
    const goalText = (g || goal).trim();
    if (!goalText || !token) return;
    setError(''); setStep('interview');
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch(`${API_BASE}/api/agents/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ goal: goalText, companyName: cn || companyName, channel }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `Ошибка ${res.status}`);
      const data = await res.json();
      if (data.needsClarification && data.questions?.length > 0) {
        setQuestions(data.questions);
        setAnswers({});
      } else if (data.generated) {
        setGenerated(data.generated);
        setStep('designer');
      } else { throw new Error('Некорректный ответ от AI'); }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setError((err as Error).message || 'Ошибка'); setStep('goal');
    }
  }, [goal, token, companyName, channel]);

  const startGeneration = useCallback(async () => {
    if (!token || !goal) return;
    setStep('designer'); setGenerated(null); setChatMessages([]);
    setIsStreaming(true); setError('');
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const answersText = Object.entries(answers).map(([k, v]) => {
      const q = questions.find(qq => qq.id === k);
      const label = q ? q.question : k;
      const val = Array.isArray(v) ? v.join(', ') : v;
      return `${label}: ${val}`;
    }).join('\n');

    const channelNote = channel ? `\n\nОсновной канал: ${channel}. Стиль общения должен соответствовать этому каналу.` : '';
    const userPrompt = `Создай AI-агента для бизнеса.\n\nЗадача: ${goal.trim()}\nКомпания: ${companyName || 'Не указано'}${channelNote}\n\nУточнения:\n${answersText || 'Нет уточнений'}\n\nСгенерируй агента.`;

    const apiMessages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      { role: 'user' as const, content: userPrompt },
    ];

    try {
      const res = await fetch(`${API_BASE}/api/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: apiMessages, stream: true, max_tokens: 4000, temperature: 0.5 }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `Ошибка ${res.status}`);
      const reader = res.body?.getReader();
      if (!reader) throw new Error('Нет доступа к потоку');

      let assistantContent = '';
      const assistantId = `assistant-${Date.now()}`;
      setChatMessages([{ id: assistantId, role: 'assistant', content: '', isStreaming: true }]);

      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const dataStr = line.slice(6).trim();
          if (dataStr === '[DONE]') continue;
          try {
            const data = JSON.parse(dataStr);
            const delta = data.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              setChatMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: assistantContent } : m));
            }
          } catch { /* ignore */ }
        }
      }
      if (buffer) {
        const line = buffer.trim();
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6).trim();
          if (dataStr !== '[DONE]') {
            try { const data = JSON.parse(dataStr); const delta = data.choices?.[0]?.delta?.content; if (delta) assistantContent += delta; } catch { /* ignore */ }
          }
        }
      }
      const cleanContent = assistantContent.replace(/---AGENT_JSON---[\s\S]*?---END_JSON---/, '').trim();
      setChatMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: cleanContent, isStreaming: false } : m));
      setIsStreaming(false);

      const match = assistantContent.match(/---AGENT_JSON---\s*([\s\S]*?)\s*---END_JSON---/);
      if (match) {
        try {
          const parsed = JSON.parse(match[1]);
          const gen = {
            name: parsed.name || 'Агент',
            emoji: parsed.emoji || '\u{1F916}',
            systemPrompt: parsed.systemPrompt || '',
            description: parsed.description || '',
            model: parsed.model || 'glm-5p1',
            brainNodes: parsed.brainNodes || ['greeting', 'faq', 'escalation'],
            confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.85,
          };
          setGenerated(gen);
        } catch (e) { console.error('JSON parse error:', e); }
      }
    } catch (err) {
      setIsStreaming(false);
      const msg = (err as Error).message || 'Ошибка соединения';
      setChatMessages(prev => [...prev, { id: `err-${Date.now()}`, role: 'system', content: `Ошибка: ${msg}` }]);
    }
  }, [token, goal, companyName, answers, questions, channel]);

  const handleCreateAgent = useCallback(async (brainData: { nodes: any[]; edges: any[] }) => {
    if (!generated || !token) return;
    try {
      const res = await fetch(`${API_BASE}/api/agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: generated.name,
          systemPrompt: generated.systemPrompt,
          description: generated.description,
          emoji: generated.emoji,
          model: generated.model || 'glm-5p1',
          brainNodes: generated.brainNodes || ['greeting', 'faq', 'escalation'],
          temperature: 0.7,
          channel,
          settings: { brainMap: brainData },
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Ошибка создания');
      const data = await res.json();
      if (data.id || data.agent?.id) {
        router.push(`/agents/${data.id || data.agent?.id}`);
      } else { throw new Error('Нет ID агента'); }
    } catch (err) {
      setError((err as Error).message || 'Ошибка создания');
    }
  }, [generated, token, channel, router]);

  const sendChatMessage = useCallback(async (text: string) => {
    if (!text.trim() || !token || isStreaming) return;
    const userMsg: ChatMessage = { id: `user-${Date.now()}`, role: 'user', content: text };
    setChatMessages(prev => [...prev, userMsg]);
    setIsStreaming(true); setGenerated(null);

    const channelNote2 = channel ? ` (канал: ${channel})` : '';
    const history = chatMessages.filter(m => m.role !== 'system').map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));
    const apiMessages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...history,
      { role: 'user' as const, content: text + channelNote2 },
    ];

    try {
      const res = await fetch(`${API_BASE}/api/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: apiMessages, stream: true, max_tokens: 4000, temperature: 0.5 }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `Ошибка ${res.status}`);
      const reader = res.body?.getReader();
      if (!reader) throw new Error('Нет доступа к потоку');

      let assistantContent = '';
      const assistantId = `assistant-${Date.now()}`;
      setChatMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '', isStreaming: true }]);

      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const dataStr = line.slice(6).trim();
          if (dataStr === '[DONE]') continue;
          try {
            const data = JSON.parse(dataStr);
            const delta = data.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              setChatMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: assistantContent } : m));
            }
          } catch { /* ignore */ }
        }
      }
      if (buffer) {
        const line = buffer.trim();
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6).trim();
          if (dataStr !== '[DONE]') {
            try { const data = JSON.parse(dataStr); const delta = data.choices?.[0]?.delta?.content; if (delta) assistantContent += delta; } catch { /* ignore */ }
          }
        }
      }
      const cleanContent = assistantContent.replace(/---AGENT_JSON---[\s\S]*?---END_JSON---/, '').trim();
      setChatMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: cleanContent, isStreaming: false } : m));
      setIsStreaming(false);

      const match = assistantContent.match(/---AGENT_JSON---\s*([\s\S]*?)\s*---END_JSON---/);
      if (match) {
        try {
          const parsed = JSON.parse(match[1]);
          const gen = {
            name: parsed.name || 'Агент',
            emoji: parsed.emoji || '\u{1F916}',
            systemPrompt: parsed.systemPrompt || '',
            description: parsed.description || '',
            model: parsed.model || 'glm-5p1',
            brainNodes: parsed.brainNodes || ['greeting', 'faq', 'escalation'],
            confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.85,
          };
          setGenerated(gen);
        } catch (e) { console.error('JSON parse error:', e); }
      }
    } catch (err) {
      setIsStreaming(false);
      setChatMessages(prev => [...prev, { id: `err-${Date.now()}`, role: 'system', content: `Ошибка: ${(err as Error).message}` }]);
    }
  }, [token, isStreaming, chatMessages, channel]);

  const handleRegenerate = useCallback(() => {
    setGenerated(null); setChatMessages([]); startGeneration();
  }, [startGeneration]);

  return (
    <div className="min-h-screen bg-bg text-text overflow-x-hidden">
      <AnimatePresence mode="wait">
        {step === 'goal' && (
          <StepGoal
            key="goal"
            goal={goal}
            companyName={companyName}
            channel={channel}
            error={error}
            onGoalChange={setGoal}
            onCompanyChange={setCompanyName}
            onChannelChange={setChannel}
            onSubmit={handleSubmitGoal}
            onCancel={() => router.push('/agents')}
          />
        )}

        {step === 'interview' && (
          <StepInterview
            key="interview"
            questions={questions}
            answers={answers}
            goal={goal}
            onAnswersChange={setAnswers}
            onSkip={() => startGeneration()}
            onComplete={() => startGeneration()}
            onBack={() => setStep('goal')}
          />
        )}

        {step === 'designer' && (
          <BrainDesigner
            key="designer"
            generated={generated}
            chatMessages={chatMessages}
            isStreaming={isStreaming}
            onSendMessage={sendChatMessage}
            onRegenerate={handleRegenerate}
            onProceed={() => setStep('development')}
            onBack={() => setStep('interview')}
          />
        )}

        {step === 'development' && (
          <DevelopmentSim
            key="development"
            generated={generated}
            onComplete={() => setStep('payment')}
          />
        )}

        {step === 'payment' && (
          <PaymentStep
            key="payment"
            generated={generated}
            token={token}
            onBack={() => setStep('designer')}
            onComplete={(brainData) => handleCreateAgent(brainData)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
