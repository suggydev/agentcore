'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Bot,
  User,
  ArrowRight,
  Loader2,
  Maximize2,
  Edit3,
  Check,
  X,
  Zap,
  Brain,
  MessageSquare,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  MarkerType,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import DashboardLayout from '../../../../components/DashboardLayout';

// ──────────────── Types ────────────────

interface Agent {
  id: string;
  name: string;
  description?: string;
}

interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
  nodeTriggered?: string;
  reasoningTrace?: string[];
  editing?: boolean;
  editedContent?: string;
}

interface Conversation {
  id: string;
}

// ──────────────── Constants ────────────────

const API_BASE = 'http://31.76.102.116:4000/api';
const HARDCODED_USER_ID = 'usr_9d05c0da797ba45e';

const QUICK_ACTIONS = [
  'What can you help me with?',
  'Tell me about your services',
  'I need help with pricing',
  'How do I get started?',
  'What are your business hours?',
];

const NODE_LABELS = ['Greeting', 'Qualification', 'Answer', 'FollowUp', 'Close'];
const KEYWORDS_BY_NODE: Record<string, string[]> = {
  Greeting: ['hello', 'hi', 'hey', 'welcome', 'greet', 'good morning', 'good afternoon'],
  Qualification: ['help', 'need', 'looking for', 'interested', 'service', 'pricing', 'cost', 'price'],
  Answer: ['answer', 'here is', 'let me explain', 'sure', 'of course', 'absolutely', 'yes'],
  FollowUp: ['anything else', 'another question', 'follow', 'more', 'also', 'additional'],
  Close: ['thanks', 'thank you', 'bye', 'goodbye', 'that is all', 'done'],
};

// ──────────────── Initial Nodes / Edges ────────────────

const createInitialNodes = (): Node[] =>
  NODE_LABELS.map((label, i) => ({
    id: label.toLowerCase(),
    type: 'default',
    position: { x: 60 + (i % 3) * 200, y: 40 + Math.floor(i / 3) * 160 },
    data: { label },
    style: {
      background: '#FDF7FE',
      color: '#5A4D59',
      border: '2px solid #F4D3F9',
      borderRadius: '12px',
      padding: '12px 20px',
      fontSize: '13px',
      fontWeight: 600,
      fontFamily: 'Inter, system-ui, sans-serif',
      width: 140,
      textAlign: 'center' as const,
      transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
    },
  }));

const createInitialEdges = (): Edge[] => [
  { id: 'e-greeting-qualification', source: 'greeting', target: 'qualification', animated: false, style: { stroke: '#D4B6D8', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#D4B6D8' } },
  { id: 'e-qualification-answer', source: 'qualification', target: 'answer', animated: false, style: { stroke: '#D4B6D8', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#D4B6D8' } },
  { id: 'e-answer-followup', source: 'answer', target: 'followup', animated: false, style: { stroke: '#D4B6D8', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#D4B6D8' } },
  { id: 'e-followup-answer', source: 'followup', target: 'answer', animated: false, style: { stroke: '#D4B6D8', strokeWidth: 2, strokeDasharray: '5 5' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#D4B6D8' } },
  { id: 'e-followup-close', source: 'followup', target: 'close', animated: false, style: { stroke: '#D4B6D8', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#D4B6D8' } },
];

// ──────────────── Node Highlighting Helper ────────────────

function matchNodeFromContent(content: string): string | undefined {
  const lower = content.toLowerCase();
  for (const [node, keywords] of Object.entries(KEYWORDS_BY_NODE)) {
    if (keywords.some((kw) => lower.includes(kw))) return node;
  }
  return undefined;
}

// ──────────────── Flow Canvas (Left Panel) ────────────────

function FlowCanvas({
  nodes,
  edges,
  activeNodeId,
  completedNodeIds,
  reasoningPath,
}: {
  nodes: Node[];
  edges: Edge[];
  activeNodeId: string | null;
  completedNodeIds: string[];
  reasoningPath: string[];
}) {
  const { fitView } = useReactFlow();

  const styledNodes = useMemo(
    () =>
      nodes.map((n) => {
        const isActive = activeNodeId === n.id;
        const isCompleted = completedNodeIds.includes(n.id);
        const isOnPath = reasoningPath.includes(n.id);

        let borderColor = '#F4D3F9';
        let bg = '#FDF7FE';
        let shadow = 'none';
        let scale = 1;

        if (isActive) {
          borderColor = '#5A4D59';
          bg = '#F9EEFC';
          shadow = '0 0 0 4px rgba(90,77,89,0.18), 0 0 20px rgba(90,77,89,0.15)';
          scale = 1.08;
        } else if (isCompleted) {
          borderColor = '#D4B6D8';
          bg = '#FDF7FE';
          shadow = '0 0 0 2px rgba(212,182,216,0.25)';
        }

        return {
          ...n,
          style: {
            ...n.style,
            background: bg,
            borderColor,
            borderWidth: isActive ? '2.5px' : '2px',
            boxShadow: shadow,
            transform: `scale(${scale})`,
            transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            color: isActive ? '#5A4D59' : isCompleted ? '#5A4D59' : '#A896AB',
          },
        };
      }),
    [nodes, activeNodeId, completedNodeIds, reasoningPath],
  );

  const styledEdges = useMemo(
    () =>
      edges.map((e) => {
        const sourceIncluded = reasoningPath.includes(e.source);
        const targetIncluded = reasoningPath.includes(e.target);
        const isAnimated = reasoningPath.includes(e.source) && reasoningPath.includes(e.target);
        const isActive = sourceIncluded || targetIncluded;

        return {
          ...e,
          animated: isAnimated,
          style: {
            ...e.style,
            stroke: isActive ? '#5A4D59' : '#D4B6D8',
            strokeWidth: isAnimated ? 3 : 2,
            strokeDasharray: e.style?.strokeDasharray,
            transition: 'stroke 0.35s cubic-bezier(0.16, 1, 0.3, 1), stroke-width 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isActive ? '#5A4D59' : '#D4B6D8',
          },
        };
      }),
    [edges, reasoningPath],
  );

  return (
    <div className="relative w-full h-full">
      <ReactFlow nodes={styledNodes} edges={styledEdges} fitView fitViewOptions={{ padding: 0.3 }} nodesDraggable={false} nodesConnectable={false} elementsSelectable={false} minZoom={0.3} maxZoom={1.8}>
        <Background color="#E8EAEF" gap={20} size={1} />
        <Controls
          className="[&>button]:bg-white [&>button]:border-mauve-200 [&>button]:text-mauve-600 [&>button]:rounded-lg [&>button]:w-8 [&>button]:h-8 [&>button]:shadow-sm [&>button:hover]:bg-mauve-50"
          showInteractive={false}
        />
        <MiniMap
          nodeColor="#FDF7FE"
          maskColor="rgba(248,249,251,0.85)"
          style={{ border: '1px solid #E2E4EB', borderRadius: '10px' }}
        />
      </ReactFlow>
      <button
        type="button"
        onClick={() => fitView({ padding: 0.3, duration: 400 })}
        className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-mauve-600 bg-white/90 backdrop-blur-sm border border-mauve-200 rounded-lg shadow-sm hover:bg-mauve-50 transition-colors"
      >
        <Maximize2 size={13} />
        Fit view
      </button>
      {reasoningPath.length > 0 && (
        <div className="absolute bottom-3 left-3 right-3 z-10 bg-white/90 backdrop-blur-sm border border-mauve-200 rounded-lg px-3 py-2 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs text-mauve-600 flex-wrap">
            <Brain size={13} className="text-mauve-500 flex-shrink-0" />
            <span className="font-semibold">Path:</span>
            {reasoningPath.map((node, i) => (
              <span key={node} className="flex items-center gap-1">
                <span className="px-1.5 py-0.5 rounded-md bg-mauve-100 text-mauve-700 font-medium">{node}</span>
                {i < reasoningPath.length - 1 && <ArrowRight size={10} className="text-mauve-400" />}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────── Chat Panel (Right) ────────────────

function ChatPanel({
  messages,
  loading,
  input,
  setInput,
  handleSend,
  agents,
  selectedAgent,
  setSelectedAgent,
  saveEditedMessage,
  cancelEditing,
  startEditing,
}: {
  messages: Message[];
  loading: boolean;
  input: string;
  setInput: (v: string) => void;
  handleSend: () => void;
  agents: Agent[];
  selectedAgent: string;
  setSelectedAgent: (v: string) => void;
  saveEditedMessage: (id: string) => void;
  cancelEditing: (id: string) => void;
  startEditing: (id: string) => void;
}) {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !loading) handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Agent Selector */}
      <div className="px-4 py-3 border-b border-mauve-100">
        <div className="flex items-center gap-2.5">
          <Bot size={16} className="text-mauve-500 flex-shrink-0" />
          <div className="relative flex-1">
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="w-full appearance-none bg-white border border-mauve-200 rounded-lg px-3 py-2 pr-8 text-sm text-ink-700 font-medium focus:outline-none focus:ring-2 focus:ring-mauve-300/50 focus:border-mauve-400 transition-all cursor-pointer"
            >
              <option value="">Select an agent...</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-mauve-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-1' : 'order-1'}`}>
                {/* Role indicator */}
                <div className={`flex items-center gap-1.5 mb-1 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'user' ? (
                    <>
                      <span className="text-[10px] font-medium text-mauve-400 uppercase tracking-wide">You</span>
                      <User size={11} className="text-mauve-400" />
                    </>
                  ) : (
                    <>
                      <Bot size={11} className="text-mauve-500" />
                      <span className="text-[10px] font-medium text-mauve-500 uppercase tracking-wide">Agent</span>
                      {msg.nodeTriggered && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-mauve-100 text-mauve-600 font-medium">
                          {msg.nodeTriggered}
                        </span>
                      )}
                    </>
                  )}
                </div>

                {/* Bubble */}
                {msg.role === 'user' ? (
                  <div className="px-4 py-2.5 rounded-2xl rounded-br-md bg-mauve-600 text-white text-sm leading-relaxed shadow-sm">
                    {msg.content}
                  </div>
                ) : (
                  <div className="bg-white border border-mauve-100 rounded-2xl rounded-bl-md shadow-sm overflow-hidden">
                    {/* Reasoning trace breadcrumb */}
                    {msg.reasoningTrace && msg.reasoningTrace.length > 0 && (
                      <div className="flex items-center gap-1 px-4 py-2 bg-mauve-50/60 border-b border-mauve-100 text-[10px] text-mauve-500 flex-wrap">
                        {msg.reasoningTrace.map((node, i) => (
                          <span key={node} className="flex items-center gap-1">
                            <span className="font-medium">{node}</span>
                            {i < msg.reasoningTrace!.length - 1 && <ArrowRight size={9} />}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Editable content */}
                    {msg.editing ? (
                      <div className="p-3">
                        <textarea
                          value={msg.editedContent ?? msg.content}
                          onChange={(e) => {
                            msg.editedContent = e.target.value;
                          }}
                          className="w-full bg-mauve-50 border border-mauve-200 rounded-lg px-3 py-2 text-sm text-ink-700 resize-none focus:outline-none focus:ring-2 focus:ring-mauve-300/50 min-h-[60px]"
                          autoFocus
                        />
                        <div className="flex items-center gap-2 mt-2 justify-end">
                          <button
                            type="button"
                            onClick={() => cancelEditing(msg.id)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs text-mauve-400 hover:text-mauve-600 hover:bg-mauve-50 transition-colors"
                          >
                            <X size={12} /> Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => saveEditedMessage(msg.id)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs bg-mauve-600 text-white hover:bg-mauve-500 transition-colors"
                          >
                            <Check size={12} /> Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="px-4 py-2.5 text-sm text-ink-700 leading-relaxed">
                          {msg.content}
                        </div>
                        <button
                          type="button"
                          onClick={() => startEditing(msg.id)}
                          className="flex items-center gap-1 px-4 py-1.5 text-[10px] text-mauve-400 hover:text-mauve-600 hover:bg-mauve-50/60 transition-colors w-full text-left border-t border-mauve-50"
                        >
                          <Edit3 size={10} /> Edit response
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading indicator */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex justify-start"
            >
              <div className="bg-white border border-mauve-100 rounded-2xl rounded-bl-md shadow-sm px-5 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-mauve-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-mauve-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-mauve-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={chatEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto border-t border-mauve-50">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action}
            type="button"
            onClick={() => {
              setInput(action);
              setTimeout(() => textareaRef.current?.focus(), 50);
            }}
            disabled={loading}
            className="flex-shrink-0 px-3 py-1.5 text-[11px] font-medium text-mauve-600 bg-mauve-50 hover:bg-mauve-100 border border-mauve-200 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {action}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="px-4 py-3 border-t border-mauve-100">
        <div className="flex items-end gap-2.5">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={selectedAgent ? 'Type a message... (Shift+Enter for newline)' : 'Select an agent to begin...'}
            rows={1}
            disabled={loading || !selectedAgent}
            className="flex-1 resize-none bg-mauve-50 border border-mauve-200 rounded-xl px-4 py-2.5 text-sm text-ink-700 placeholder:text-mauve-300 focus:outline-none focus:ring-2 focus:ring-mauve-300/50 focus:border-mauve-400 transition-all disabled:opacity-50"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || loading || !selectedAgent}
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-mauve-600 text-white hover:bg-mauve-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
        <p className="text-[10px] text-mauve-300 mt-1.5 text-center">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

// ──────────────── Main Page ────────────────

function AgentTestPage() {
  const [authChecked, setAuthChecked] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState('');

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [convId, setConvId] = useState<string | null>(null);

  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [completedNodeIds, setCompletedNodeIds] = useState<string[]>([]);
  const [reasoningPath, setReasoningPath] = useState<string[]>([]);

  const [nodes] = useState<Node[]>(createInitialNodes);
  const [edges] = useState<Edge[]>(createInitialEdges);

  // Auth check
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    setAuthorized(true);
    setAuthChecked(true);
  }, []);

  // Fetch agents
  useEffect(() => {
    if (!authorized) return;
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/agents`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        const list = Array.isArray(data) ? data : data.agents ?? data.data ?? [];
        setAgents(list);
      })
      .catch(() => {});
  }, [authorized]);

  const createConversation = useCallback(async (): Promise<string> => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ agentId: selectedAgent, userId: HARDCODED_USER_ID, title: 'Agent Test' }),
    });
    if (!res.ok) throw new Error('Failed to create conversation');
    const data = await res.json();
    return data.id ?? data.conversationId ?? data._id;
  }, [selectedAgent]);

  const handleSend = useCallback(async () => {
    const content = input.trim();
    if (!content || loading || !selectedAgent) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      let currentConvId = convId;
      if (!currentConvId) {
        currentConvId = await createConversation();
        setConvId(currentConvId);
      }

      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/conversations/${currentConvId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content, role: 'user' }),
      });

      if (!res.ok) throw new Error('Failed to send message');
      const data = await res.json();

      const aiContent = data.content ?? data.message ?? data.response ?? 'No response received.';
      const matchedNode = matchNodeFromContent(aiContent);
      const activeLabel = matchedNode ? matchedNode.charAt(0).toUpperCase() + matchedNode.slice(1) : undefined;

      const newPath = activeLabel ? [...reasoningPath, activeLabel].slice(-6) : reasoningPath;

      const agentMsg: Message = {
        id: `agent-${Date.now()}`,
        role: 'agent',
        content: aiContent,
        nodeTriggered: activeLabel,
        reasoningTrace: newPath.length > 0 ? newPath : undefined,
      };

      setActiveNodeId(matchedNode ?? null);
      setReasoningPath(newPath);
      if (matchedNode && !completedNodeIds.includes(matchedNode)) {
        setCompletedNodeIds((prev) => [...prev, matchedNode]);
      }

      setMessages((prev) => [...prev, agentMsg]);
    } catch {
      const fallbackContent = 'Thanks for your message! I&apos;m processing your request. How else can I assist?';
      const matchedNode = matchNodeFromContent(fallbackContent);
      const activeLabel = matchedNode ? matchedNode.charAt(0).toUpperCase() + matchedNode.slice(1) : undefined;
      const newPath = activeLabel ? [...reasoningPath, activeLabel].slice(-6) : reasoningPath;

      setActiveNodeId(matchedNode ?? null);
      setReasoningPath(newPath);
      if (matchedNode && !completedNodeIds.includes(matchedNode)) {
        setCompletedNodeIds((prev) => [...prev, matchedNode]);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `agent-${Date.now()}`,
          role: 'agent',
          content: fallbackContent,
          nodeTriggered: activeLabel,
          reasoningTrace: newPath.length > 0 ? newPath : undefined,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, selectedAgent, convId, createConversation, reasoningPath, completedNodeIds]);

  const startEditing = useCallback((id: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, editing: true, editedContent: m.content } : m)),
    );
  }, []);

  const cancelEditing = useCallback((id: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, editing: false, editedContent: undefined } : m)),
    );
  }, []);

  const saveEditedMessage = useCallback((id: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === id && m.editedContent != null ? { ...m, content: m.editedContent, editing: false, editedContent: undefined } : m,
      ),
    );
  }, []);

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-ink-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-mauve-600 animate-spin" />
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-0px)] flex">
        {/* Left Panel — Brain Map */}
        <div className="w-1/2 border-r border-mauve-100 relative bg-ink-50">
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur-sm border border-mauve-200 rounded-lg shadow-sm">
            <Brain size={14} className="text-mauve-500" />
            <span className="text-xs font-semibold text-mauve-600 uppercase tracking-wide">Brain Map</span>
          </div>
          <ReactFlowProvider>
            <FlowCanvas
              nodes={nodes}
              edges={edges}
              activeNodeId={activeNodeId}
              completedNodeIds={completedNodeIds}
              reasoningPath={reasoningPath}
            />
          </ReactFlowProvider>
        </div>

        {/* Right Panel — Chat */}
        <div className="w-1/2 flex flex-col bg-white">
          <div className="px-4 py-3 border-b border-mauve-100 flex items-center gap-2.5 bg-white">
            <MessageSquare size={15} className="text-mauve-500" />
            <span className="text-sm font-semibold text-ink-700">Agent Test Chat</span>
            <span className="flex-1" />
            <button
              type="button"
              onClick={() => {
                setMessages([]);
                setInput('');
                setConvId(null);
                setActiveNodeId(null);
                setCompletedNodeIds([]);
                setReasoningPath([]);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] text-mauve-500 hover:text-mauve-600 hover:bg-mauve-50 transition-colors"
              title="Reset chat"
            >
              <RefreshCw size={12} /> Reset
            </button>
          </div>
          <div className="flex-1 flex flex-col min-h-0">
            <ChatPanel
              messages={messages}
              loading={loading}
              input={input}
              setInput={setInput}
              handleSend={handleSend}
              agents={agents}
              selectedAgent={selectedAgent}
              setSelectedAgent={setSelectedAgent}
              saveEditedMessage={saveEditedMessage}
              cancelEditing={cancelEditing}
              startEditing={startEditing}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default AgentTestPage;
