'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Plus, Loader2, ArrowLeft, Trash2 } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  description: string | null;
  model: string;
  systemPrompt: string;
  temperature: number;
  isActive: boolean;
  createdAt: string;
}

interface Model {
  id: string;
  name: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [models, setModels] = useState<Model[]>([]);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem('token'));
  }, []);

  const [newAgent, setNewAgent] = useState({
    name: '',
    description: '',
    model: '',
    systemPrompt: 'Вы полезный AI-ассистент.',
    temperature: 0.7,
  });

  useEffect(() => {
    if (token === null) return;
    if (!token) { window.location.href = '/login'; return; }
    loadAgents();
    fetchModels();
  }, [token]);

  const fetchModels = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/models`);
      const data = await res.json();
      setModels(data.data || []);
    } catch {}
  };

  const loadAgents = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/agents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setAgents(await res.json());
    } catch {}
    setLoading(false);
  };

  const createAgent = async () => {
    if (!newAgent.name) return;
    setCreating(true);
    try {
      const res = await fetch(`${API_BASE}/api/agents`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newAgent)
      });
      if (res.ok) {
        const agent = await res.json();
        setAgents(prev => [agent, ...prev]);
        setNewAgent({ name: '', description: '', model: '', systemPrompt: 'Вы полезный AI-ассистент.', temperature: 0.7 });
      }
    } catch {}
    setCreating(false);
  };

  const deleteAgent = async (id: string) => {
    try {
      await fetch(`${API_BASE}/api/agents/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setAgents(prev => prev.filter(a => a.id !== id));
    } catch {}
  };

  const getModelName = (id?: string) => {
    if (!id) return 'Auto';
    const parts = id.split('/');
    return parts[parts.length - 1] || id;
  };

  if (loading) return (
    <div className="min-h-screen bg-[#faf8fb] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-mauve-500 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf8fb]">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <a href="/dashboard" className="text-sm text-mauve-500 hover:text-mauve-700 flex items-center gap-1 mb-2">
              <ArrowLeft className="w-4 h-4" /> Назад в панель управления
            </a>
            <h1 className="text-3xl font-bold text-mauve-900">AI-агенты</h1>
          </div>
        </div>

        {/* Create Agent Form */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-6 mb-8"
        >
          <h2 className="text-lg font-bold text-mauve-900 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5" /> Создать нового агента
          </h2>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Имя агента"
              value={newAgent.name}
              onChange={e => setNewAgent({ ...newAgent, name: e.target.value })}
              className="px-4 py-3 rounded-xl border border-mauve-200 focus:outline-none focus:ring-2 focus:ring-mauve-400 text-mauve-900 placeholder:text-mauve-300"
            />
            <select
              value={newAgent.model}
              onChange={e => setNewAgent({ ...newAgent, model: e.target.value })}
              className="px-4 py-3 rounded-xl border border-mauve-200 focus:outline-none focus:ring-2 focus:ring-mauve-400 text-mauve-900 bg-white"
            >
              <option value="">Автоподбор модели</option>
              {models.map(m => (
                <option key={m.id} value={m.id}>{getModelName(m.id)}</option>
              ))}
            </select>
          </div>
          <textarea
            placeholder="Системный промпт"
            value={newAgent.systemPrompt}
            onChange={e => setNewAgent({ ...newAgent, systemPrompt: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-mauve-200 focus:outline-none focus:ring-2 focus:ring-mauve-400 text-mauve-900 placeholder:text-mauve-300 mb-4"
          />
          <button 
            onClick={createAgent}
            disabled={creating || !newAgent.name}
            className="btn-primary disabled:opacity-50 flex items-center gap-2"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Создать агента
          </button>
        </motion.div>

        {/* Agents List */}
        <div className="grid md:grid-cols-2 gap-4">
          {agents.map((agent, i) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-6 group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-mauve-500 to-mauve-300 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => deleteAgent(agent.id)}
                    className="p-2 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="font-bold text-mauve-900 text-lg">{agent.name}</h3>
              <p className="text-mauve-500 text-sm mt-1">{agent.description || 'Без описания'}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="text-xs px-2 py-1 rounded-full bg-mauve-100 text-mauve-700 font-medium">
                  {getModelName(agent.model)}
                </span>
                <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700">
                  темп: {agent.temperature}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${agent.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'}`}>
                  {agent.isActive ? 'Активен' : 'Неактивен'}
                </span>
              </div>
              <p className="text-xs text-mauve-400 mt-3 line-clamp-2">{agent.systemPrompt}</p>
            </motion.div>
          ))}
        </div>

        {agents.length === 0 && (
          <div className="text-center py-16">
            <Brain className="w-12 h-12 text-mauve-300 mx-auto mb-4" />
            <p className="text-mauve-500">Пока нет агентов. Создайте своего первого AI-агента выше!</p>
          </div>
        )}
      </div>
    </div>
  );
}
