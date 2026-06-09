'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Send, Loader2, Wand2, ArrowRight, Zap,
  MessageSquare, Rocket, CheckCircle, Shield, Target,
  BarChart3, Database, Link, Sparkles, ChevronLeft
} from 'lucide-react';
import { GeneratedAgent, ChatMessage } from '../page';
import CollapsibleMessage from '@/components/CollapsibleMessage';

interface BrainDesignerProps {
  generated: GeneratedAgent | null;
  chatMessages: ChatMessage[];
  isStreaming: boolean;
  onSendMessage: (text: string) => void;
  onRegenerate: () => void;
  onProceed: () => void;
  onBack: () => void;
}

interface BrainNode {
  id: string;
  label: string;
  icon: any;
  x: number;
  y: number;
  delay: number;
  category: string;
  description: string;
  color: string;
}

interface BrainEdge {
  from: string;
  to: string;
  delay: number;
}

const BRAIN_CATEGORIES = [
  {
    id: 'purpose',
    label: 'Назначение',
    icon: Target,
    description: 'Основная роль агента в бизнесе',
    color: '#6E56CF',
  },
  {
    id: 'goals',
    label: 'Цели',
    icon: CheckCircle,
    description: 'Конкретные цели и KPI',
    color: '#22C55E',
  },
  {
    id: 'tasks',
    label: 'Задачи',
    icon: Zap,
    description: 'Операционные задачи',
    color: '#3B82F6',
  },
  {
    id: 'behavior',
    label: 'Поведение',
    icon: Brain,
    description: 'Стиль и тон общения',
    color: '#F59E0B',
  },
  {
    id: 'memory',
    label: 'Память',
    icon: Database,
    description: 'Хранение контекста и данных',
    color: '#EC4899',
  },
  {
    id: 'integrations',
    label: 'Интеграции',
    icon: Link,
    description: 'Подключенные каналы и CRM',
    color: '#14B8A6',
  },
  {
    id: 'metrics',
    label: 'Метрики',
    icon: BarChart3,
    description: 'Отслеживание эффективности',
    color: '#8B5CF6',
  },
  {
    id: 'automation',
    label: 'Автоматизации',
    icon: Rocket,
    description: 'Триггеры и сценарии',
    color: '#EF4444',
  },
];

function generateBrainNodes(agent: GeneratedAgent | null): BrainNode[] {
  const nodes: BrainNode[] = [];
  const centerX = 50;
  const centerY = 50;
  const radius = 35;

  // Central node
  nodes.push({
    id: 'center',
    label: agent?.name || 'AI-Агент',
    icon: Brain,
    x: centerX,
    y: centerY,
    delay: 0,
    category: 'center',
    description: 'Центральный узел интеллекта',
    color: '#6E56CF',
  });

  // Category nodes arranged in a circle
  BRAIN_CATEGORIES.forEach((cat, i) => {
    const angle = (i / BRAIN_CATEGORIES.length) * 2 * Math.PI - Math.PI / 2;
    nodes.push({
      id: cat.id,
      label: cat.label,
      icon: cat.icon,
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
      delay: 0.5 + i * 0.15,
      category: cat.id,
      description: cat.description,
      color: cat.color,
    });
  });

  // Add sub-nodes based on agent brainNodes
  const subNodes = agent?.brainNodes || ['greeting', 'faq', 'escalation'];
  subNodes.forEach((nodeType, i) => {
    const parentIdx = i % BRAIN_CATEGORIES.length;
    const parent = BRAIN_CATEGORIES[parentIdx];
    const angle = (parentIdx / BRAIN_CATEGORIES.length) * 2 * Math.PI - Math.PI / 2;
    const subAngle = angle + (Math.random() - 0.5) * 0.5;
    const subRadius = radius + 15 + Math.random() * 10;

    nodes.push({
      id: `sub-${nodeType}-${i}`,
      label: nodeType,
      icon: Sparkles,
      x: centerX + Math.cos(subAngle) * subRadius,
      y: centerY + Math.sin(subAngle) * subRadius,
      delay: 1.5 + i * 0.2,
      category: parent.id,
      description: `Подсистема: ${nodeType}`,
      color: parent.color,
    });
  });

  return nodes;
}

function generateBrainEdges(nodes: BrainNode[]): BrainEdge[] {
  const edges: BrainEdge[] = [];
  const center = nodes.find(n => n.id === 'center');
  if (!center) return edges;

  // Connect center to categories
  BRAIN_CATEGORIES.forEach((cat, i) => {
    edges.push({
      from: 'center',
      to: cat.id,
      delay: 0.3 + i * 0.15,
    });
  });

  // Connect categories to sub-nodes
  nodes.filter(n => n.id.startsWith('sub-')).forEach((sub, i) => {
    edges.push({
      from: sub.category,
      to: sub.id,
      delay: 1.7 + i * 0.2,
    });
  });

  return edges;
}

export default function BrainDesigner({ generated, chatMessages, isStreaming, onSendMessage, onRegenerate, onProceed, onBack }: BrainDesignerProps) {
  const [chatInput, setChatInput] = useState('');
  const [mapReady, setMapReady] = useState(false);
  const [selectedNode, setSelectedNode] = useState<BrainNode | null>(null);
  const [particles, setParticles] = useState<{id: number; x: number; y: number; size: number; delay: number}[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const nodes = generateBrainNodes(generated);
  const edges = generateBrainEdges(nodes);

  useEffect(() => {
    const pts = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 3,
      delay: Math.random() * 8,
    }));
    setParticles(pts);

    const timer = setTimeout(() => setMapReady(true), 2000);
    return () => clearTimeout(timer);
  }, [generated]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isStreaming]);

  const handleSend = () => {
    if (!chatInput.trim() || isStreaming) return;
    onSendMessage(chatInput);
    setChatInput('');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen flex flex-col lg:flex-row"
    >
      {/* Left: Brain Map */}
      <div className="flex-1 relative bg-bg overflow-hidden min-h-[50vh] lg:min-h-screen">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          {particles.map(p => (
            <motion.div
              key={p.id}
              className="absolute rounded-full"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                background: 'var(--brand)',
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.1, 0.4, 0.1],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 5 + Math.random() * 4,
                repeat: Infinity,
                delay: p.delay,
                ease: 'easeInOut',
              }}
            />
          ))}
          <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-brand/3 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/3 right-1/3 w-[400px] h-[400px] bg-purple-500/3 rounded-full blur-[100px]" />
        </div>

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4 z-20">
          <button onClick={onBack} className="flex items-center gap-2 text-text-muted hover:text-text transition-colors text-sm">
            <ChevronLeft size={16} /> Назад
          </button>
          <div className="text-xs text-text-muted font-mono">ШАГ 3 ИЗ 5</div>
        </div>

        {/* Title */}
        <div className="absolute top-16 left-0 right-0 text-center z-10 px-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand/10 border border-brand/20 text-xs text-brand mb-3">
            <Wand2 size={12} /> Agent Brain Designer
          </div>
          <h2 className="text-xl font-bold text-text mb-1">Проектирование цифрового мозга</h2>
          <p className="text-xs text-text-muted">Наблюдайте, как AI строит архитектуру вашего агента</p>
        </div>

        {/* SVG Brain Map */}
        <div className="absolute inset-0 flex items-center justify-center pt-24 pb-8 px-4">
          <svg
            viewBox="0 0 100 100"
            className="w-full max-w-2xl h-auto"
            style={{ filter: 'drop-shadow(0 0 30px rgba(110, 86, 207, 0.1))' }}
          >
            <defs>
              <linearGradient id="centerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6E56CF" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#6E56CF" stopOpacity="0.1" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="0.5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Edges */}
            {edges.map((edge, i) => {
              const fromNode = nodes.find(n => n.id === edge.from);
              const toNode = nodes.find(n => n.id === edge.to);
              if (!fromNode || !toNode) return null;
              return (
                <motion.line
                  key={`edge-${i}`}
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke={toNode.color}
                  strokeWidth="0.3"
                  strokeOpacity="0.6"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.2, delay: edge.delay, ease: 'easeInOut' }}
                />
              );
            })}

            {/* Nodes */}
            {nodes.map((node, i) => {
              const isCenter = node.id === 'center';
              const isCategory = BRAIN_CATEGORIES.some(c => c.id === node.id);
              const isSub = node.id.startsWith('sub-');
              const radius = isCenter ? 6 : isCategory ? 4 : 2.5;

              return (
                <motion.g
                  key={node.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: node.delay, ease: 'backOut' }}
                  className="cursor-pointer"
                  onClick={() => setSelectedNode(node)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Glow */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={radius + 1}
                    fill={node.color}
                    opacity="0.2"
                    filter="url(#glow)"
                  />
                  {/* Main circle */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={radius}
                    fill={isCenter ? 'url(#centerGrad)' : `${node.color}20`}
                    stroke={node.color}
                    strokeWidth={isCenter ? 0.4 : 0.25}
                  />
                  {/* Pulse animation for center */}
                  {isCenter && (
                    <motion.circle
                      cx={node.x}
                      cy={node.y}
                      r={radius}
                      fill="none"
                      stroke={node.color}
                      strokeWidth="0.2"
                      animate={{ r: [radius, radius + 2, radius], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  )}
                  {/* Label */}
                  {isCenter && (
                    <text
                      x={node.x}
                      y={node.y + radius + 3}
                      textAnchor="middle"
                      fill="var(--text)"
                      fontSize="2.5"
                      fontWeight="600"
                    >
                      {node.label}
                    </text>
                  )}
                  {isCategory && (
                    <text
                      x={node.x}
                      y={node.y + radius + 2.5}
                      textAnchor="middle"
                      fill={node.color}
                      fontSize="1.8"
                      fontWeight="500"
                    >
                      {node.label}
                    </text>
                  )}
                </motion.g>
              );
            })}
          </svg>
        </div>

        {/* Bottom actions */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-3 z-20 px-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onRegenerate}
            className="px-4 py-2.5 rounded-xl bg-surface border border-border text-text-muted text-sm hover:text-text transition-colors flex items-center gap-2"
          >
            <Wand2 size={14} /> Пересоздать
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onProceed}
            disabled={!mapReady}
            className="px-6 py-2.5 rounded-xl bg-brand text-white text-sm font-medium hover:bg-brand-hover disabled:opacity-40 transition-all flex items-center gap-2 shadow-lg shadow-brand/20"
          >
            <Rocket size={14} />
            {mapReady ? 'Отправить в разработку' : 'Проектирование...'}
            <ArrowRight size={14} />
          </motion.button>
        </div>

        {/* Node detail panel */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-surface/90 backdrop-blur-xl border border-border rounded-2xl p-4 shadow-2xl max-w-xs z-30"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${selectedNode.color}20`, color: selectedNode.color }}>
                  <selectedNode.icon size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text">{selectedNode.label}</h3>
                  <p className="text-[10px] text-text-muted">{selectedNode.description}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="w-full py-1.5 text-xs text-text-muted hover:text-text transition-colors"
              >
                Закрыть
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right: Chat */}
      <div className="w-full lg:w-[400px] xl:w-[450px] bg-surface border-l border-border flex flex-col min-h-[50vh] lg:min-h-screen">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2 flex-shrink-0">
          <Brain size={16} className="text-brand" />
          <span className="text-sm font-medium text-text">AI-архитектор</span>
          {isStreaming && <span className="text-xs text-brand animate-pulse ml-auto">проектирует...</span>}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {chatMessages.length === 0 && !isStreaming && (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center mx-auto mb-3">
                <Sparkles size={20} className="text-brand" />
              </div>
              <p className="text-sm text-text-muted">AI проектирует архитектуру агента...</p>
            </div>
          )}
          {chatMessages.map(msg => <CollapsibleMessage key={msg.id} msg={msg} />)}
          {isStreaming && !chatMessages.some(m => m.isStreaming) && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-brand/10 flex items-center justify-center">
                <Brain size={16} className="text-brand" />
              </div>
              <div className="bg-surface-2 border border-border rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-brand/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-brand/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-brand/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="text-xs text-text-muted ml-1">проектирует...</span>
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="px-4 py-3 border-t border-border flex-shrink-0">
          <div className="flex items-end gap-2 bg-bg rounded-xl border border-border p-2">
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
              placeholder="Попросите изменить..."
              className="flex-1 bg-transparent px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none"
              disabled={isStreaming}
            />
            <button
              onClick={handleSend}
              disabled={!chatInput.trim() || isStreaming}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-brand text-white hover:bg-brand-hover disabled:opacity-40 transition-colors"
            >
              {isStreaming ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
