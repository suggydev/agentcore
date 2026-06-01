'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Brain, Loader2, Trash2, Eye, EyeOff,
  Code, Cpu, Zap, Thermometer, Settings, Edit3, Check,
  X, Send, Bot, Sparkles, MessageSquare
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface AgentData {
  id: string; name: string; description: string | null; model: string;
  systemPrompt: string; temperature: number; isActive: boolean;
  createdAt: string; workspaceId: string;
}

interface Message {
  id?: string; role: 'user' | 'assistant' | 'system'; content: string;
}

const getModelIcon = (m: string) => {
  if (m.includes('deepseek')) return <Code className="w-4 h-4" />;
  if (m.includes('kimi')) return <Zap className="w-4 h-4" />;
  return <Cpu className="w-4 h-4" />;
};

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [agent, setAgent] = useState<AgentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState('');
  const [tab, setTab] = useState<'chat' | 'config'>('chat');

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editModel, setEditModel] = useState('');
  const [editTemp, setEditTemp] = useState(0.7);
  const [editPrompt, setEditPrompt] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = localStorage.getItem('token');
    if (!t) { router.push('/login'); return; }
    setToken(t);
    fetch(`${API_BASE}/api/agents/${id}`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json()).then(d => {
        setAgent(d); setEditName(d.name); setEditDesc(d.description || '');
        setEditModel(d.model); setEditTemp(d.temperature); setEditPrompt(d.systemPrompt);
        setEditActive(d.isActive);
      }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch(`${API_BASE}/api/agents/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: editName, description: editDesc || null, model: editModel, temperature: editTemp, systemPrompt: editPrompt, isActive: editActive }),
    });
    if (res.ok) { const u = await res.json(); setAgent(u); setEditing(false); }
    setSaving(false);
  };

  const handleDelete = async () => {
    await fetch(`${API_BASE}/api/agents/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    router.push('/dashboard/agents');
  };

  const handleToggleActive = async () => {
    const newActive = !agent!.isActive;
    const res = await fetch(`${API_BASE}/api/agents/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isActive: newActive }),
    });
    if (res.ok) { const u = await res.json(); setAgent(u); }
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const userMsg: Message = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput(''); setSending(true);

    const tempAssistantId = `temp-${Date.now()}`;
    setMessages(prev => [...prev, { role: 'assistant', content: '...' }]);

    try {
      const res = await fetch(`${API_BASE}/api/v1/chat/completions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          model: agent?.model,
          messages: [
            { role: 'system', content: agent?.systemPrompt || '' },
            ...messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMsg.content },
          ],
          stream: false,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const aiContent = data.choices?.[0]?.message?.content || 'Ответ не получен';
        setMessages(prev => prev.filter(m => m.content !== '...').concat({ role: 'assistant', content: aiContent }));
      } else {
        setMessages(prev => prev.filter(m => m.content !== '...').concat({ role: 'assistant', content: 'Ошибка: не удалось получить ответ от AI' }));
      }
    } catch {
      setMessages(prev => prev.filter(m => m.content !== '...').concat({ role: 'assistant', content: 'Ошибка сети' }));
    }
    setSending(false);
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><Loader2 className="w-8 h-8 text-mauve-500 animate-spin" /></div>;
  if (!agent) return <div className="flex items-center justify-center h-screen"><p className="text-ink-500">Агент не найден</p></div>;

  return (
    <div className="h-screen flex flex-col bg-[#F8F9FB]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-ink-100 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/dashboard/agents')} className="p-2 rounded-xl hover:bg-mauve-50 text-ink-400 hover:text-ink-600 transition-colors"><ArrowLeft className="w-5 h-5" /></button>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-mauve-500 to-mauve-300 flex items-center justify-center"><Brain className="w-5 h-5 text-white" /></div>
          <div>
            <h1 className="font-bold text-ink-900 text-sm">{agent.name}</h1>
            <span className={`text-[10px] font-medium ${agent.isActive ? 'text-emerald-600' : 'text-ink-400'}`}>{agent.isActive ? 'Активен' : 'Неактивен'}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-ink-100/50 rounded-xl p-1">
          <button onClick={() => setTab('chat')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all ${tab === 'chat' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-700'}`}><MessageSquare className="w-3.5 h-3.5" /> Чат</button>
          <button onClick={() => setTab('config')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all ${tab === 'config' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-700'}`}><Settings className="w-3.5 h-3.5" /> Настройки</button>
        </div>
        <div className="flex items-center gap-2">
          {!editing && <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl bg-mauve-50 text-mauve-600 hover:bg-mauve-100"><Edit3 className="w-3.5 h-3.5" /> Ред.</button>}
          {editing && <>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100">{saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Check className="w-3.5 h-3.5" /> Сохранить</>}</button>
            <button onClick={() => setEditing(false)} className="p-2 rounded-xl hover:bg-ink-50 text-ink-400"><X className="w-3.5 h-3.5" /></button>
          </>}
          <button onClick={() => setShowDelete(true)} className="p-2 rounded-xl hover:bg-red-50 text-ink-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      {/* Content */}
      {tab === 'chat' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-mauve-500 to-mauve-300 flex items-center justify-center mb-4"><MessageSquare className="w-8 h-8 text-white" /></div>
                <h2 className="font-bold text-ink-900 text-lg mb-2">Протестируйте агента</h2>
                <p className="text-ink-400 text-sm max-w-md">Отправьте сообщение — агент ответит используя заданный системный промпт, модель <strong>{agent.model.split('/').pop()}</strong> и температуру <strong>{agent.temperature}</strong></p>
                <div className="flex flex-wrap gap-2 mt-4 justify-center">
                  {['Привет! Расскажи о себе', 'Какие услуги вы предоставляете?', 'Помоги с заказом'].map(s => (
                    <button key={s} onClick={() => { setInput(s); }} className="text-xs px-3 py-2 rounded-xl bg-mauve-50 text-mauve-600 hover:bg-mauve-100 transition-colors">{s}</button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${m.role === 'user' ? 'bg-mauve-600 text-white' : 'bg-white border border-ink-100 text-ink-800'}`}>
                  {m.content === '...' ? <Loader2 className="w-4 h-4 animate-spin" /> : <p className="text-sm whitespace-pre-wrap">{m.content}</p>}
                </div>
              </motion.div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="flex-shrink-0 px-6 py-4 bg-white border-t border-ink-100">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Напишите сообщение агенту..."
                disabled={sending}
                className="flex-1 px-4 py-3 rounded-xl border border-mauve-200 bg-[#F8F9FB] focus:ring-2 focus:ring-mauve-400/30 focus:border-mauve-400 text-sm outline-none disabled:opacity-50"
              />
              <button onClick={handleSend} disabled={sending || !input.trim()} className="px-4 py-3 rounded-xl bg-mauve-600 text-white hover:bg-mauve-700 transition-colors disabled:opacity-40 flex-shrink-0">
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'config' && (
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Info cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-mauve-100 p-4">
              <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 rounded-lg bg-gradient-to-br from-mauve-500 to-mauve-300 flex items-center justify-center">{getModelIcon(agent.model)}</div><p className="text-[10px] text-mauve-400 uppercase">Модель</p></div>
              {editing ? <input value={editModel} onChange={e => setEditModel(e.target.value)} className="text-xs font-mono text-ink-800 bg-[#F8F9FB] border border-mauve-200 rounded-lg px-2 py-1 w-full outline-none" /> : <p className="text-xs font-mono text-ink-800 truncate">{agent.model.split('/').pop()}</p>}
            </div>
            <div className="bg-white rounded-xl border border-mauve-100 p-4">
              <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center"><Thermometer className="w-4 h-4 text-amber-500" /></div><p className="text-[10px] text-mauve-400 uppercase">Температура</p></div>
              {editing ? <div className="flex items-center gap-2"><input type="range" min="0" max="2" step="0.1" value={editTemp} onChange={e => setEditTemp(parseFloat(e.target.value))} className="flex-1 accent-mauve-600" /><span className="text-xs font-bold w-7">{editTemp.toFixed(1)}</span></div> : <p className="text-xs font-bold text-ink-800">{agent.temperature}</p>}
            </div>
            <div className="bg-white rounded-xl border border-mauve-100 p-4">
              <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center"><Sparkles className="w-4 h-4 text-emerald-500" /></div><p className="text-[10px] text-mauve-400 uppercase">Статус</p></div>
              <button onClick={editing ? () => setEditActive(!editActive) : handleToggleActive} className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${(editing ? editActive : agent.isActive) ? 'bg-emerald-100 text-emerald-700' : 'bg-ink-100 text-ink-500'}`}>{(editing ? editActive : agent.isActive) ? 'Активен' : 'Неактивен'}</button>
            </div>
            <div className="bg-white rounded-xl border border-mauve-100 p-4">
              <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center"><Bot className="w-4 h-4 text-blue-500" /></div><p className="text-[10px] text-mauve-400 uppercase">ID</p></div>
              <p className="text-[10px] font-mono text-ink-400 truncate">{agent.id}</p>
            </div>
          </div>

          {/* Name + Description */}
          <div className="bg-white rounded-xl border border-mauve-100 p-5">
            <label className="block text-xs font-medium text-ink-500 mb-1.5">Имя агента</label>
            {editing ? <input value={editName} onChange={e => setEditName(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-mauve-200 bg-[#F8F9FB] text-sm font-bold text-ink-900 outline-none" /> : <p className="text-sm font-bold text-ink-900">{agent.name}</p>}
            <label className="block text-xs font-medium text-ink-500 mb-1.5 mt-4">Описание</label>
            {editing ? <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={2} className="w-full px-3 py-2 rounded-lg border border-mauve-200 bg-[#F8F9FB] text-sm text-ink-700 outline-none resize-none" /> : <p className="text-sm text-ink-600">{agent.description || '—'}</p>}
          </div>

          {/* System Prompt */}
          <div className="bg-white rounded-xl border border-mauve-100 p-5">
            <button onClick={() => setShowPrompt(!showPrompt)} className="flex items-center justify-between w-full text-left">
              <span className="text-xs font-medium text-ink-500 uppercase">Системный промпт</span>
              {showPrompt ? <EyeOff className="w-4 h-4 text-ink-400" /> : <Eye className="w-4 h-4 text-ink-400" />}
            </button>
            {(showPrompt || editing) && (
              <div className="mt-3">
                {editing ? <textarea value={editPrompt} onChange={e => setEditPrompt(e.target.value)} rows={8} className="w-full px-3 py-2 rounded-lg border border-mauve-200 bg-[#F8F9FB] text-xs font-mono text-ink-700 outline-none resize-none" /> : <pre className="p-3 rounded-lg bg-ink-50 text-xs text-ink-600 whitespace-pre-wrap max-h-48 overflow-y-auto">{agent.systemPrompt}</pre>}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button onClick={() => router.push(`/dashboard/brain-map?agent=${agent.id}`)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-mauve-50 text-mauve-700 text-xs font-medium hover:bg-mauve-100"><Brain className="w-4 h-4" /> Brain Map</button>
            <button onClick={handleToggleActive} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium ${agent.isActive ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{agent.isActive ? 'Деактивировать' : 'Активировать'}</button>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowDelete(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-xl p-6 max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <Trash2 className="w-8 h-8 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-ink-900 text-center mb-2">Удалить агента?</h3>
            <p className="text-sm text-ink-500 text-center mb-6">«{agent.name}» будет удалён навсегда.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDelete(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-mauve-200 text-ink-600 text-sm font-medium">Отмена</button>
              <button onClick={handleDelete} className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600">Удалить</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
