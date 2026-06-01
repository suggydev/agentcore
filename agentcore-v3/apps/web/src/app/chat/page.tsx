'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Plus, Loader2, Bot, User, ArrowLeft, 
  Sparkles, Brain, Clock, Trash2,
  MessageSquare, Image as ImageIcon, Code, Zap,
  Info, ChevronDown, Search
} from 'lucide-react';

interface Message {
  id: string;
  content: string;
  role: string;
  model?: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  title: string;
  messages?: Message[];
  agentName?: string;
  updatedAt: string;
}

interface Model {
  id: string;
  supports_chat?: boolean;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  const ls = localStorage.getItem('token');
  if (ls) return ls;
  const match = document.cookie.match(/(?:^|;\s*)token=([^;]*)/);
  return match ? match[1] : null;
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConv, setCurrentConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [sidebarFilter, setSidebarFilter] = useState('');
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      window.location.href = '/login';
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    const init = async () => {
      await loadConversations(token, controller.signal);
      await fetchModels(controller.signal);

      const params = new URLSearchParams(window.location.search);
      const convId = params.get('id');
      if (convId) {
        await loadMessages(convId, token, controller.signal);
      }
      setInitialLoadDone(true);
    };
    init();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target as Node)) {
        setModelDropdownOpen(false);
      }
    }
    if (modelDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [modelDropdownOpen]);

  const fetchModels = async (signal?: AbortSignal) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/models`, { signal });
      const data = await res.json();
      const allModels = Array.isArray(data) ? data : (data?.data || []);
      setModels(allModels.filter((m: { supports_chat?: boolean; id?: string }) => m.supports_chat === true && !m.id?.includes('flux')));
    } catch {}
  };

  const loadConversations = async (t: string, signal?: AbortSignal) => {
    try {
      const res = await fetch(`${API_BASE}/api/conversations`, {
        headers: { Authorization: `Bearer ${t}` },
        signal,
      });
      if (res.ok) {
        const data = await res.json();
        const convs = Array.isArray(data) ? data : (data.data || data.conversations || []);
        setConversations(convs);
      }
    } catch {}
  };

  const createConversation = async (): Promise<Conversation | null> => {
    const token = getToken();
    if (!token) return null;
    try {
      const res = await fetch(`${API_BASE}/api/conversations`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title: 'Новый чат' })
      });
      if (res.ok) {
        const conv = await res.json();
        setConversations(prev => [conv, ...prev]);
        setCurrentConv(conv);
        setMessages([]);
        setSidebarOpen(false);
        return conv;
      }
      return null;
    } catch {
      return null;
    }
  };

  const loadMessages = async (convId: string, t?: string, signal?: AbortSignal) => {
    const token = t || getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/conversations/${convId}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal,
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentConv(data);
        setMessages(data.messages || []);
        setSidebarOpen(false);
      }
    } catch {}
  };

  const sendMessage = async (messageContent?: string, targetConvId?: string) => {
    const token = getToken();
    if (!token) return;
    const convId = targetConvId || currentConv?.id;
    const content = (messageContent ?? input).trim();
    if (!content || !convId || loading) return;

    setInput('');
    setLoading(true);

    const tempId = Date.now().toString();
    const userMsg: Message = {
      id: tempId,
      content,
      role: 'user',
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const res = await fetch(`${API_BASE}/api/conversations/${convId}/messages`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content, role: 'user', model: selectedModel || undefined })
      });

      const data = await res.json();
      if (res.ok && data.aiMessage && !data.error) {
        setMessages(prev => {
          const filtered = prev.filter(m => m.id !== tempId);
          return [...filtered, data.userMessage, data.aiMessage];
        });
        if (messages.length === 0) {
          setConversations(prev => prev.map(c => 
            c.id === convId ? { ...c, title: content.slice(0, 50) } : c
          ));
        }
      } else {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          content: typeof data.error === 'string' ? data.error : data.aiMessage?.content || 'Не удалось получить ответ. Попробуйте ещё раз.',
          role: 'assistant',
          model: 'error',
          createdAt: new Date().toISOString()
        }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: 'Ошибка сети. Проверьте подключение к интернету.',
        role: 'assistant',
        model: 'error',
        createdAt: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const deleteConversation = async (id: string) => {
    const token = getToken();
    if (!token) return;
    try {
      await fetch(`${API_BASE}/api/conversations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(prev => prev.filter(c => c.id !== id));
      if (currentConv?.id === id) {
        setCurrentConv(null);
        setMessages([]);
      }
    } catch {}
  };

  const getModelIcon = (modelId?: string) => {
    if (!modelId) return <Sparkles className="w-4 h-4" />;
    if (modelId.includes('flux')) return <ImageIcon className="w-4 h-4" />;
    if (modelId.includes('deepseek') || modelId.includes('gpt')) return <Code className="w-4 h-4" />;
    if (modelId.includes('kimi')) return <Zap className="w-4 h-4" />;
    return <Brain className="w-4 h-4" />;
  };

  const getModelName = (modelId?: string) => {
    if (!modelId) return 'AI';
    if (modelId === 'error') return 'Error';
    const parts = modelId.split('/');
    return parts[parts.length - 1] || 'AI';
  };

  return (
    <div className="h-screen flex bg-[#faf8fb] overflow-hidden">
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside 
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-mauve-100 flex flex-col shadow-xl lg:shadow-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} transition-transform duration-300`}
      >
        <div className="p-4 border-b border-mauve-100 flex items-center justify-between">
          <a href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-mauve-600 to-mauve-400 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-mauve-800">AgentCore</span>
          </a>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-mauve-50 text-mauve-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <button 
            onClick={createConversation}
            className="w-full btn-primary flex items-center justify-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" /> Новый чат
          </button>
        </div>

        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-mauve-400" />
            <input
              type="text"
              placeholder="Поиск диалогов..."
              value={sidebarFilter}
              onChange={e => setSidebarFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-mauve-100 bg-mauve-50 focus:outline-none focus:ring-2 focus:ring-mauve-200 focus:border-transparent text-mauve-700 placeholder:text-mauve-300 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
          {conversations
            .filter(c => sidebarFilter === '' || (c.title || 'New Chat').toLowerCase().includes(sidebarFilter.toLowerCase()))
            .map((conv) => (
            <div 
              key={conv.id}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                currentConv?.id === conv.id 
                  ? 'bg-mauve-100 text-mauve-900' 
                  : 'hover:bg-mauve-50 text-mauve-600'
              }`}
              onClick={() => loadMessages(conv.id)}
            >
              <MessageSquare className="w-4 h-4 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm truncate block">{conv.title || 'Новый чат'}</span>
                {conv.agentName && (
                  <span className="text-[10px] text-mauve-400 truncate block">{conv.agentName}</span>
                )}
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 text-red-400 hover:text-red-600 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {conversations.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="w-10 h-10 text-mauve-200 mb-3" />
              <p className="text-mauve-400 text-sm font-medium">Пока нет диалогов</p>
              <p className="text-mauve-300 text-xs mt-1">Создайте новый чат, чтобы начать</p>
            </div>
          )}
          {conversations.length > 0 && conversations.filter(c => sidebarFilter === '' || (c.title || 'New Chat').toLowerCase().includes(sidebarFilter.toLowerCase())).length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="w-10 h-10 text-mauve-200 mb-3" />
              <p className="text-mauve-400 text-sm font-medium">Ничего не найдено</p>
              <p className="text-mauve-300 text-xs mt-1">Попробуйте изменить запрос</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-mauve-100">
          <p className="text-xs text-mauve-400 mb-2 font-medium">Доступные модели</p>
          <div className="flex flex-wrap gap-1">
            {models.slice(0, 4).map(m => (
              <span key={m.id} className="text-[10px] px-2 py-0.5 rounded-full bg-mauve-50 text-mauve-600 border border-mauve-100">
                {m.id.split('/').pop()}
              </span>
            ))}
            {models.length > 4 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-mauve-50 text-mauve-600">
                +{models.length - 4}
              </span>
            )}
          </div>
        </div>
      </motion.aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center gap-3 px-4 py-3 border-b border-mauve-100 bg-white/80 backdrop-blur-sm">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-mauve-50 text-mauve-500"
          >
            <MessageSquare className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-mauve-900 truncate">
              {currentConv?.title || 'Выберите диалог'}
            </h2>
            {currentConv ? (
              <div className="flex items-center gap-2 flex-wrap">
                {currentConv.agentName && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-mauve-600 bg-mauve-50 px-2 py-0.5 rounded-full">
                    <Bot className="w-3 h-3" />
                    {currentConv.agentName}
                  </span>
                )}
                <p className="text-xs text-mauve-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(currentConv.updatedAt).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <p className="text-xs text-mauve-400">Выберите диалог из боковой панели или создайте новый</p>
            )}
          </div>

          {currentConv && (
            <div className="relative" ref={modelDropdownRef}>
              <button
                onClick={() => setModelDropdownOpen(prev => !prev)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-mauve-200 bg-white text-xs font-medium text-mauve-700 hover:bg-mauve-50 transition-all"
              >
                {selectedModel ? (
                  <span className="max-w-[100px] truncate">{getModelName(selectedModel)}</span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-mauve-400" />
                    Авто
                  </span>
                )}
                <ChevronDown className={`w-3 h-3 text-mauve-400 transition-transform ${modelDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {modelDropdownOpen && (
                <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl border border-mauve-200 shadow-lg shadow-mauve-900/5 z-50 py-1 overflow-hidden">
                  <button
                    onClick={() => { setSelectedModel(''); setModelDropdownOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${!selectedModel ? 'bg-mauve-50 text-mauve-700 font-semibold' : 'text-ink-600 hover:bg-mauve-50'}`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-mauve-400" />
                    Авто (умный выбор)
                  </button>
                  <div className="h-px bg-mauve-100 my-1" />
                  {models.map(m => (
                    <button
                      key={m.id}
                      onClick={() => { setSelectedModel(m.id); setModelDropdownOpen(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${selectedModel === m.id ? 'bg-mauve-50 text-mauve-700 font-semibold' : 'text-ink-600 hover:bg-mauve-50'}`}
                    >
                      <span className="w-5 h-5 rounded-md bg-gradient-to-br from-mauve-300 to-mauve-100 flex items-center justify-center flex-shrink-0">
                        {getModelIcon(m.id)}
                      </span>
                      <span className="truncate">{m.id.split('/').pop()}</span>
                    </button>
                  ))}
                  {models.length === 0 && (
                    <p className="px-3 py-2 text-xs text-mauve-400">Модели загружаются...</p>
                  )}
                </div>
              )}
            </div>
          )}

          <a href="/dashboard" className="p-2 rounded-lg hover:bg-mauve-50 text-mauve-500 flex-shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </a>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!currentConv ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-20 h-20 rounded-3xl bg-gradient-to-br from-mauve-400 to-mauve-200 flex items-center justify-center mb-6 shadow-xl shadow-mauve-200"
              >
                <Sparkles className="w-10 h-10 text-white" />
              </motion.div>
              <h3 className="text-2xl font-bold text-mauve-900 mb-2">Начните диалог</h3>
              <p className="text-mauve-500 max-w-md mb-2">
                Выберите диалог из боковой панели или создайте новый. AI автоматически распределит задачи по лучшим моделям.
              </p>
              <div className="flex items-center gap-4 mb-6 text-xs text-mauve-400">
                <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> кнопка «Новый чат» слева</span>
                <span className="flex items-center gap-1"><Search className="w-3.5 h-3.5" /> поиск по истории</span>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  { icon: '\ud83d\udca1', text: 'Explain quantum computing in simple terms' },
                  { icon: '\ud83d\udd27', text: 'Debug this React useEffect infinite loop' },
                  { icon: '\ud83d\udcca', text: 'Create a Python script to analyze CSV data' },
                  { icon: '\ud83c\udfa8', text: 'Design a REST API for a task manager app' },
                  { icon: '\ud83d\udcdd', text: 'Напиши SQL-запрос для поиска дубликатов' },
                  { icon: '\ud83d\ude80', text: 'Optimize this Node.js API for performance' },
                ].map(item => (
                  <button
                    key={item.text}
                    onClick={async () => {
                      const conv = currentConv || await createConversation();
                      if (conv) sendMessage(item.text, conv.id);
                    }}
                    className="px-4 py-2 rounded-xl bg-white border border-mauve-200 text-sm text-mauve-600 hover:bg-mauve-50 hover:border-mauve-300 transition-all flex items-center gap-2"
                  >
                    <span>{item.icon}</span>
                    {item.text}
                  </button>
                ))}
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
              <p className="text-mauve-400">Введите первое сообщение...</p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <motion.div
                key={msg.id || i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-br from-mauve-600 to-mauve-400' 
                    : msg.model === 'error'
                      ? 'bg-red-100 text-red-500'
                      : 'bg-gradient-to-br from-mauve-400 to-mauve-200'
                }`}>
                  {msg.role === 'user' 
                    ? <User className="w-4 h-4 text-white" />
                    : getModelIcon(msg.model)
                  }
                </div>
                <div className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-mauve-600 text-white'
                    : 'bg-white border border-mauve-100 text-mauve-800 shadow-sm'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  {msg.role === 'assistant' && msg.model && msg.model !== 'error' && (
                    <div className="flex items-center gap-1 mt-2 pt-2 border-t border-mauve-100/50">
                      {getModelIcon(msg.model)}
                      <span className="text-[10px] text-mauve-400 font-medium">
                        {getModelName(msg.model)}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
          {loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-mauve-400 to-mauve-200 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white animate-pulse" />
              </div>
              <div className="bg-white border border-mauve-100 rounded-2xl px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2 text-sm text-mauve-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AgentCore думает...</span>
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {currentConv && (
          <div className="p-4 bg-white/80 backdrop-blur-sm border-t border-mauve-100">
            <div className="max-w-4xl mx-auto flex gap-3">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Спросите что угодно — код, изображения, анализ..."
                disabled={loading}
                className="flex-1 px-5 py-3.5 rounded-xl border border-mauve-200 bg-white focus:outline-none focus:ring-2 focus:ring-mauve-400 focus:border-transparent text-mauve-900 placeholder:text-mauve-300 disabled:opacity-50 transition-all"
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                className="w-12 h-12 rounded-xl btn-primary flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-center text-xs text-mauve-400 mt-2">
              Умная маршрутизация: задачи автоматически распределяются по лучшей AI-модели
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
