'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, Plus, Loader2, Trash2, ArrowRight, ArrowLeft, Brain,
  MessageCircle, Shield, Zap, Smile, AlertTriangle, Clock,
  Sparkles, FileText, Globe, BookOpen, Check, Pen, X, Save,
} from 'lucide-react';
import DashboardLayout from '../../../components/DashboardLayout';

const API_BASE = 'http://31.76.102.116:4000';

const STEPS = ['Role & Personality', 'Knowledge', 'Review'];

interface Agent {
  id: string; name: string; description: string | null; model: string;
  systemPrompt: string; temperature: number; isActive: boolean; createdAt: string;
}

export default function AgentsPage() {
  const [step, setStep] = useState(0);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [token, setToken] = useState('');

  const [form, setForm] = useState({
    name: '', description: '', model: '',
    communicationStyle: 'friendly', forbiddenWords: '',
    aggressionHandling: 'defuse', canJoke: true,
    canExpressEmotion: true, responseSpeed: 'thoughtful',
    useEmoji: false, greeting: '',
    knowledgeDocs: [] as string[],
    systemPrompt: 'You are a helpful AI assistant.',
    temperature: 0.7,
  });

  useEffect(() => {
    const t = localStorage.getItem('token');
    if (!t) { window.location.href = '/login'; return; }
    setToken(t);
    loadAgents(t);
  }, []);

  const loadAgents = async (t: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/agents`, {
        headers: { Authorization: `Bearer ${t}` }
      });
      if (res.ok) setAgents(await res.json());
    } catch {}
    setLoading(false);
  };

  const createAgent = async () => {
    setCreating(true);
    const prompt = buildSystemPrompt();
    try {
      const res = await fetch(`${API_BASE}/api/agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          model: form.model || 'accounts/fireworks/models/glm-5p1',
          systemPrompt: prompt,
          temperature: form.temperature,
        })
      });
      if (res.ok) {
        const agent = await res.json();
        setAgents(prev => [agent, ...prev]);
        resetForm();
        setStep(0);
      }
    } catch {}
    setCreating(false);
  };

  const buildSystemPrompt = () => {
    const parts = [
      'You are an AI agent named ' + (form.name || 'Assistant') + '.',
      'Role: ' + (form.description || 'General assistant') + '.',
      '',
      'COMMUNICATION STYLE:',
      form.communicationStyle === 'formal' && '- Be formal and professional. Use proper titles and formal address.',
      form.communicationStyle === 'friendly' && '- Be friendly and warm. Use conversational tone.',
      form.communicationStyle === 'expert' && '- Be authoritative and knowledgeable. Cite facts confidently.',
      form.communicationStyle === 'consultative' && '- Be consultative. Ask questions, understand needs first.',
      form.communicationStyle === 'reserved' && '- Be reserved and concise. Minimal words, maximum clarity.',
      '',
      form.forbiddenWords && 'FORBIDDEN: Never use these words/phrases: ' + form.forbiddenWords + '.',
      '',
      'AGGRESSION HANDLING:',
      form.aggressionHandling === 'defuse' && 'When facing aggression: politely defuse, acknowledge concerns, stay professional.',
      form.aggressionHandling === 'escalate' && 'When facing aggression: immediately escalate to human operator.',
      form.aggressionHandling === 'neutral' && 'When facing aggression: remain neutral, do not engage, redirect to topic.',
      form.aggressionHandling === 'end' && 'When facing aggression: politely end the conversation.',
      '',
      'ADDITIONAL BEHAVIORS:',
      form.canJoke ? '- You may use appropriate humor.' : '- Do NOT joke.',
      form.canExpressEmotion ? '- You may express emotions naturally.' : '- Keep emotions neutral.',
      form.useEmoji ? '- You may use emojis when appropriate.' : '- Do NOT use emojis.',
      form.responseSpeed === 'instant' && '- Respond instantly, no delays.',
      form.responseSpeed === 'thoughtful' && '- Take a moment to think before responding.',
      form.responseSpeed === 'deliberate' && '- Be thorough and deliberate in responses.',
      '',
      'GENERAL RULES:',
      '- Sound human, not like a bot.',
      '- Adapt to the users communication style.',
      '- Remember context throughout the conversation.',
      '- Admit when you do not know something.',
      '- Be helpful but not pushy.',
      form.greeting && 'GREETING: ' + form.greeting,
    ].filter(Boolean);
    return parts.join('\n');
  };

  const resetForm = () => setForm({
    name: '', description: '', model: '',
    communicationStyle: 'friendly', forbiddenWords: '',
    aggressionHandling: 'defuse', canJoke: true,
    canExpressEmotion: true, responseSpeed: 'thoughtful',
    useEmoji: false, greeting: '',
    knowledgeDocs: [],
    systemPrompt: 'You are a helpful AI assistant.',
    temperature: 0.7,
  });

  const deleteAgent = async (id: string) => {
    await fetch(`${API_BASE}/api/agents/${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
    });
    setAgents(prev => prev.filter(a => a.id !== id));
  };

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-mauve-500 animate-spin" />
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-10 max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-display font-bold text-ink-900">AI Agents</h1>
              <p className="text-ink-400 text-sm mt-1">Create and manage your digital employees</p>
            </div>
            <button
              onClick={() => { resetForm(); setStep(0); }}
              className="btn-primary text-sm gap-2"
            >
              <Plus className="w-4 h-4" /> Create Agent
            </button>
          </div>
        </motion.div>

        {/* Wizard */}
        <AnimatePresence mode="wait">
          {step > 0 || form.name ? (
            <motion.div
              key="wizard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl border border-mauve-100 shadow-sm overflow-hidden"
            >
              {/* Step indicator */}
              <div className="px-6 pt-6 pb-4 border-b border-ink-100">
                <div className="flex items-center gap-1 mb-2">
                  {STEPS.map((s, i) => (
                    <button key={s} onClick={() => i < 2 && setStep(i)} className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        i <= step ? 'bg-mauve-600 text-white' : 'bg-ink-100 text-ink-400'
                      }`}>
                        {i + 1}
                      </div>
                      <span className={`text-xs font-medium hidden sm:block ${i <= step ? 'text-mauve-600' : 'text-ink-400'}`}>{s}</span>
                      {i < 2 && <div className={`w-8 h-px ${i < step ? 'bg-mauve-600' : 'bg-ink-200'}`} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 0: Role */}
              <AnimatePresence mode="wait">
                {step === 0 && (
                  <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-6 space-y-5">
                    <h3 className="font-semibold text-ink-900">Define your agents identity</h3>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-ink-700">Agent Name *</label>
                        <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                          className="w-full mt-1.5 px-4 py-2.5 rounded-xl border border-mauve-200 focus:ring-2 focus:ring-mauve-400/30 focus:border-mauve-400 text-ink-900 placeholder:text-ink-300 text-sm"
                          placeholder="e.g. SalesBot Pro" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-ink-700">Purpose</label>
                        <input value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                          className="w-full mt-1.5 px-4 py-2.5 rounded-xl border border-mauve-200 focus:ring-2 focus:ring-mauve-400/30 focus:border-mauve-400 text-ink-900 placeholder:text-ink-300 text-sm"
                          placeholder="e.g. Sales qualification assistant" />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-ink-700 mb-2 block">Communication Style</label>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        {['formal', 'friendly', 'expert', 'consultative', 'reserved'].map(s => (
                          <button key={s} onClick={() => setForm({...form, communicationStyle: s})}
                            className={`px-3 py-2.5 rounded-lg text-xs font-medium capitalize transition-all ${
                              form.communicationStyle === s
                                ? 'bg-mauve-600 text-white shadow-md'
                                : 'bg-ink-50 text-ink-500 hover:bg-mauve-50 hover:text-mauve-600 border border-ink-100'
                            }`}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-ink-700">Forbidden words/phrases</label>
                      <input value={form.forbiddenWords} onChange={e => setForm({...form, forbiddenWords: e.target.value})}
                        className="w-full mt-1.5 px-4 py-2.5 rounded-xl border border-mauve-200 focus:ring-2 focus:ring-mauve-400/30 focus:border-mauve-400 text-ink-900 placeholder:text-ink-300 text-sm"
                        placeholder="Comma-separated: stupid, whatever, ..." />
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-ink-700 block mb-2">Aggression</label>
                        <select value={form.aggressionHandling} onChange={e => setForm({...form, aggressionHandling: e.target.value})}
                          className="w-full px-4 py-2.5 rounded-xl border border-mauve-200 bg-white focus:ring-2 focus:ring-mauve-400/30 text-sm text-ink-900">
                          <option value="defuse">Defuse politely</option>
                          <option value="escalate">Escalate immediately</option>
                          <option value="neutral">Stay neutral</option>
                          <option value="end">End conversation</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-ink-700 block mb-2">Response Speed</label>
                        <select value={form.responseSpeed} onChange={e => setForm({...form, responseSpeed: e.target.value})}
                          className="w-full px-4 py-2.5 rounded-xl border border-mauve-200 bg-white focus:ring-2 focus:ring-mauve-400/30 text-sm text-ink-900">
                          <option value="instant">Instant</option>
                          <option value="thoughtful">Thoughtful</option>
                          <option value="deliberate">Deliberate</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-ink-700 block mb-2">Custom Greeting</label>
                        <input value={form.greeting} onChange={e => setForm({...form, greeting: e.target.value})}
                          className="w-full px-4 py-2.5 rounded-xl border border-mauve-200 focus:ring-2 focus:ring-mauve-400/30 text-sm text-ink-900"
                          placeholder="Hello! How can I help?" />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {[
                        { label: 'Can joke', key: 'canJoke', icon: Smile },
                        { label: 'Express emotion', key: 'canExpressEmotion', icon: Sparkles },
                        { label: 'Use emoji', key: 'useEmoji', icon: Pen },
                      ].map(t => (
                        <button key={t.key} onClick={() => setForm({...form, [t.key]: !(form as any)[t.key]})}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                            (form as any)[t.key] ? 'bg-mauve-50 border-mauve-300 text-mauve-600' : 'bg-white border-ink-200 text-ink-500'
                          }`}>
                          <t.icon className="w-3.5 h-3.5" /> {t.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex justify-end pt-2">
                      <button onClick={() => setStep(1)} disabled={!form.name}
                        className="btn-primary text-sm gap-2 disabled:opacity-50">
                        Continue <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Step 1: Knowledge */}
                {step === 1 && (
                  <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-6 space-y-5">
                    <h3 className="font-semibold text-ink-900">Knowledge Base</h3>

                    <div className="border-2 border-dashed border-mauve-200 rounded-2xl p-8 text-center hover:border-mauve-400 transition-colors cursor-pointer">
                      <FileText className="w-10 h-10 text-mauve-400 mx-auto mb-3" />
                      <p className="text-sm text-ink-500">Drag & drop files here, or click to upload</p>
                      <p className="text-xs text-ink-400 mt-1">PDF, CSV, TXT, DOCX</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-3">
                      {[
                        { icon: Globe, label: 'Website URL', action: 'Parse' },
                        { icon: BookOpen, label: 'Notion', action: 'Connect' },
                        { icon: Bot, label: 'Google Drive', action: 'Connect' },
                      ].map(src => (
                        <button key={src.label}
                          className="flex items-center gap-3 p-3 rounded-xl border border-mauve-100 hover:border-mauve-300 bg-white hover:bg-mauve-50 transition-all text-sm">
                          <src.icon className="w-5 h-5 text-mauve-500" />
                          <div className="text-left flex-1">
                            <div className="font-medium text-ink-700">{src.label}</div>
                            <div className="text-xs text-mauve-500">{src.action}</div>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="flex justify-between pt-2">
                      <button onClick={() => setStep(0)} className="btn-secondary text-sm gap-2">
                        <ArrowLeft className="w-4 h-4" /> Back
                      </button>
                      <button onClick={() => setStep(2)} className="btn-primary text-sm gap-2">
                        Review <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Review */}
                {step === 2 && (
                  <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-6 space-y-5">
                    <h3 className="font-semibold text-ink-900">Review Your Agent</h3>

                    <div className="bg-ink-50 rounded-xl p-5 space-y-3">
                      {[
                        { label: 'Name', value: form.name },
                        { label: 'Purpose', value: form.description || '-' },
                        { label: 'Style', value: form.communicationStyle },
                        { label: 'Aggression', value: form.aggressionHandling },
                        { label: 'Speed', value: form.responseSpeed },
                        { label: 'Jokes', value: form.canJoke ? 'Yes' : 'No' },
                        { label: 'Emotions', value: form.canExpressEmotion ? 'Yes' : 'No' },
                        { label: 'Emoji', value: form.useEmoji ? 'Yes' : 'No' },
                      ].map(item => (
                        <div key={item.label} className="flex justify-between text-sm">
                          <span className="text-ink-500">{item.label}</span>
                          <span className="font-medium text-ink-900">{item.value}</span>
                        </div>
                      ))}
                    </div>

                    <div className="bg-mauve-50 rounded-xl p-4 border border-mauve-100">
                      <p className="text-sm font-medium text-mauve-600 mb-1">System Prompt Preview</p>
                      <pre className="text-xs text-mauve-800 whitespace-pre-wrap max-h-40 overflow-y-auto">{buildSystemPrompt()}</pre>
                    </div>

                    <div className="flex justify-between pt-2">
                      <button onClick={() => setStep(1)} className="btn-secondary text-sm gap-2">
                        <ArrowLeft className="w-4 h-4" /> Back
                      </button>
                      <button onClick={createAgent} disabled={creating}
                        className="btn-primary text-sm gap-2 disabled:opacity-50">
                        {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {creating ? 'Creating...' : 'Create Agent'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            /* Agent List */
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.map((agent, i) => (
                <motion.div key={agent.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }} className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-5 group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-mauve-500 to-mauve-300 flex items-center justify-center">
                      <Brain className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => deleteAgent(agent.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-ink-400 hover:text-red-600 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-bold text-ink-900">{agent.name}</h3>
                  <p className="text-ink-400 text-sm mt-1 line-clamp-2">{agent.description || 'No description'}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-mauve-100 text-mauve-700 font-medium">
                      {agent.model.split('/').pop() || 'Auto'}
                    </span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                      agent.isActive ? 'bg-green-50 text-green-700' : 'bg-ink-100 text-ink-500'
                    }`}>
                      {agent.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <a href={`/dashboard/brain-map?agent=${agent.id}`}
                      className="flex-1 text-center text-xs font-medium px-3 py-1.5 rounded-lg bg-mauve-50 text-mauve-600 hover:bg-mauve-100 transition-colors">
                      Brain Map
                    </a>
                    <a href={`/dashboard/brain-map/test?agent=${agent.id}`}
                      className="flex-1 text-center text-xs font-medium px-3 py-1.5 rounded-lg bg-ink-50 text-ink-600 hover:bg-ink-100 transition-colors">
                      Test
                    </a>
                  </div>
                </motion.div>
              ))}
              {agents.length === 0 && (
                <div className="col-span-full text-center py-16">
                  <Brain className="w-12 h-12 text-mauve-300 mx-auto mb-4" />
                  <p className="text-ink-500 mb-4">No agents yet. Create your first digital employee!</p>
                  <button onClick={() => setStep(0)} className="btn-primary text-sm">
                    <Plus className="w-4 h-4" /> Create Agent
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
