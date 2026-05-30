'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Plus, Loader2, Bot, User, ArrowLeft, 
  Sparkles, Brain, ChevronRight, Clock, Trash2,
  MessageSquare, Image as ImageIcon, Code, Zap
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
  updatedAt: string;
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConv, setCurrentConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [models, setModels] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    if (!token) {
      window.location.href = '/login';
      return;
    }
    loadConversations();
    fetchModels();
  }, [token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchModels = async () => {
    try {
      const res = await fetch('http://31.76.102.116:4000/api/v1/models');
      const data = await res.json();
      setModels(data.data || []);
    } catch {}
  };

  const loadConversations = async () => {
    try {
      const res = await fetch('http://31.76.102.116:4000/api/conversations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch {}
  };

  const createConversation = async () => {
    try {
      const res = await fetch('http://31.76.102.116:4000/api/conversations', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title: 'New Chat' })
      });
      if (res.ok) {
        const conv = await res.json();
        setConversations(prev => [conv, ...prev]);
        setCurrentConv(conv);
        setMessages([]);
        setSidebarOpen(false);
      }
    } catch {}
  };

  const loadMessages = async (convId: string) => {
    try {
      const res = await fetch(`http://31.76.102.116:4000/api/conversations/${convId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentConv(data);
        setMessages(data.messages || []);
        setSidebarOpen(false);
      }
    } catch {}
  };

  const sendMessage = async () => {
    if (!input.trim() || !currentConv || loading) return;

    const content = input.trim();
    setInput('');
    setLoading(true);

    // Optimistically add user message
    const tempId = Date.now().toString();
    const userMsg: Message = {
      id: tempId,
      content,
      role: 'user',
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const res = await fetch(`http://31.76.102.116:4000/api/conversations/${currentConv.id}/messages`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content, role: 'user' })
      });

      const data = await res.json();
      if (res.ok && data.aiMessage) {
        setMessages(prev => {
          const filtered = prev.filter(m => m.id !== tempId);
          return [...filtered, data.userMessage, data.aiMessage];
        });
        // Update conversation title if it's the first message
        if (messages.length === 0) {
          setConversations(prev => prev.map(c => 
            c.id === currentConv.id ? { ...c, title: content.slice(0, 50) } : c
          ));
        }
      } else {
        // Show error in chat
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          content: data.error || 'Failed to get response. Please try again.',
          role: 'assistant',
          model: 'error',
          createdAt: new Date().toISOString()
        }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: 'Network error. Please check your connection.',
        role: 'assistant',
        model: 'error',
        createdAt: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const deleteConversation = async (id: string) => {
    try {
      await fetch(`http://31.76.102.116:4000/api/conversations/${id}`, {
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
      {/* Mobile Sidebar Overlay */}
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

      {/* Sidebar */}
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
            <Plus className="w-4 h-4" /> New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
          {conversations.map((conv) => (
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
              <span className="flex-1 text-sm truncate">{conv.title || 'New Chat'}</span>
              <button 
                onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 text-red-400 hover:text-red-600 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {conversations.length === 0 && (
            <div className="text-center py-8 text-mauve-400 text-sm">
              No conversations yet
            </div>
          )}
        </div>

        {/* Models Info */}
        <div className="p-4 border-t border-mauve-100">
          <p className="text-xs text-mauve-400 mb-2 font-medium">Available Models</p>
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

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-mauve-100 bg-white/80 backdrop-blur-sm">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-mauve-50 text-mauve-500"
          >
            <MessageSquare className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h2 className="font-semibold text-mauve-900 truncate">
              {currentConv?.title || 'Select a conversation'}
            </h2>
            {currentConv && (
              <p className="text-xs text-mauve-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(currentConv.updatedAt).toLocaleDateString()}
              </p>
            )}
          </div>
          <a href="/dashboard" className="p-2 rounded-lg hover:bg-mauve-50 text-mauve-500">
            <ArrowLeft className="w-5 h-5" />
          </a>
        </header>

        {/* Messages */}
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
              <h3 className="text-2xl font-bold text-mauve-900 mb-2">Start a Conversation</h3>
              <p className="text-mauve-500 max-w-md mb-8">
                Create a new chat or select an existing one. Our AI will automatically route your tasks to the best model.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {['Write a poem about nature', 'Debug my React code', 'Generate a landscape image', 'Analyze this text'].map(prompt => (
                  <button
                    key={prompt}
                    onClick={() => {
                      if (!currentConv) createConversation();
                      setTimeout(() => setInput(prompt), 500);
                    }}
                    className="px-4 py-2 rounded-xl bg-white border border-mauve-200 text-sm text-mauve-600 hover:bg-mauve-50 hover:border-mauve-300 transition-all"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
              <p className="text-mauve-400">Type your first message...</p>
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
                  <span>Thinking...</span>
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        {currentConv && (
          <div className="p-4 bg-white/80 backdrop-blur-sm border-t border-mauve-100">
            <div className="max-w-4xl mx-auto flex gap-3">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Ask anything — code, images, analysis..."
                disabled={loading}
                className="flex-1 px-5 py-3.5 rounded-xl border border-mauve-200 bg-white focus:outline-none focus:ring-2 focus:ring-mauve-400 focus:border-transparent text-mauve-900 placeholder:text-mauve-300 disabled:opacity-50 transition-all"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="w-12 h-12 rounded-xl btn-primary flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-center text-xs text-mauve-400 mt-2">
              Smart routing: tasks are automatically assigned to the best AI model
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
