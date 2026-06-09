'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { GripVertical, ArrowRight, Settings, Trash2, Eye, EyeOff, Plus, ChevronDown, ChevronUp, AlertCircle, Brain, Bot, MessageCircle, Rocket, Wand2, Zap } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

const NODE_TYPES = [
  { type: 'greeting', label: 'Приветствие', icon: MessageCircle, color: 'bg-brand/10 border-brand/30 text-brand' },
  { type: 'qualification', label: 'Квалификация', icon: Zap, color: 'bg-accent-soft border-brand/20 text-brand' },
  { type: 'faq', label: 'FAQ', icon: Brain, color: 'bg-surface-2 border-border text-text' },
  { type: 'leadCapture', label: 'Сбор лидов', icon: Rocket, color: 'bg-brand/10 border-brand/20 text-brand' },
  { type: 'escalation', label: 'Эскалация', icon: AlertCircle, color: 'bg-warning-soft border-warning-soft text-warning' },
  { type: 'memory', label: 'Память', icon: Wand2, color: 'bg-success-soft border-success-soft text-success' },
  { type: 'integration', label: 'Интеграция', icon: Zap, color: 'bg-brand/10 border-brand/30 text-brand' },
  { type: 'custom', label: 'Пользовательский', icon: Plus, color: 'bg-surface-3 border-border text-text' },
];

export interface BMNode {
  id: string;
  type: string;
  label: string;
  x: number;
  y: number;
  data: {
    responseText: string;
    conditions: string;
    enabled: boolean;
  };
}

export interface BMEdge {
  id: string;
  source: string;
  target: string;
}

interface InlineBrainMapProps {
  nodes: BMNode[];
  edges: BMEdge[];
  onNodesChange: (nodes: BMNode[]) => void;
  onEdgesChange: (edges: BMEdge[]) => void;
  onNodeSelect: (node: BMNode) => void;
  onAddNode: (type: string) => void;
  onDeleteNode: (id: string) => void;
}

export default function InlineBrainMap({
  nodes, edges, onNodesChange, onEdgesChange, onNodeSelect, onAddNode, onDeleteNode,
}: InlineBrainMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [showPalette, setShowPalette] = useState(false);

  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId);
    if (!node || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setDraggingId(nodeId);
    setDragOffset({
      x: e.clientX - rect.left - node.x,
      y: e.clientY - rect.top - node.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingId || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newX = e.clientX - rect.left - dragOffset.x;
    const newY = e.clientY - rect.top - dragOffset.y;
    onNodesChange(nodes.map(n =>
      n.id === draggingId
        ? { ...n, x: Math.max(20, Math.min(newX, rect.width - 180)), y: Math.max(20, Math.min(newY, rect.height - 80)) }
        : n
    ));
  };

  const handleMouseUp = () => setDraggingId(null);

  const handleNodeClick = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    if (draggingId) return;
    if (connectingFrom) {
      if (connectingFrom !== nodeId) {
        const exists = edges.find(ed => ed.source === connectingFrom && ed.target === nodeId);
        if (!exists) {
          onEdgesChange([...edges, { id: `e-${connectingFrom}-${nodeId}-${Date.now()}`, source: connectingFrom, target: nodeId }]);
        }
      }
      setConnectingFrom(null);
    } else {
      const node = nodes.find(n => n.id === nodeId);
      if (node) onNodeSelect(node);
    }
  };

  const handleBgClick = () => {
    setConnectingFrom(null);
    setShowPalette(false);
  };

  const startConnect = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setConnectingFrom(connectingFrom === nodeId ? null : nodeId);
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 relative bg-bg rounded-xl border border-[var(--border)] overflow-hidden cursor-grab active:cursor-grabbing"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleBgClick}
    >
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
        {edges.map(edge => {
          const src = nodes.find(n => n.id === edge.source);
          const tgt = nodes.find(n => n.id === edge.target);
          if (!src || !tgt) return null;
          return (
            <g key={edge.id}>
              <line x1={src.x + 80} y1={src.y + 35} x2={tgt.x + 80} y2={tgt.y + 35} stroke="var(--brand)" strokeWidth="2" opacity="0.4" />
              <circle cx={tgt.x + 80} cy={tgt.y + 35} r="3" fill="var(--brand)" opacity="0.6" />
            </g>
          );
        })}
        {connectingFrom && (
          nodes.filter(n => n.id !== connectingFrom).map(n => (
            <circle
              key={`target-${n.id}`}
              cx={n.x + 160}
              cy={n.y + 35}
              r="8"
              fill="transparent"
              stroke="var(--brand)"
              strokeWidth="2"
              strokeDasharray="4"
              className="animate-pulse"
              style={{ pointerEvents: 'all', cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                const exists = edges.find(ed => ed.source === connectingFrom && ed.target === n.id);
                if (!exists) {
                  onEdgesChange([...edges, { id: `e-${connectingFrom}-${n.id}-${Date.now()}`, source: connectingFrom, target: n.id }]);
                }
                setConnectingFrom(null);
              }}
            />
          ))
        )}
      </svg>

      {nodes.map(node => {
        const config = NODE_TYPES.find(nt => nt.type === node.type) || NODE_TYPES[NODE_TYPES.length - 1];
        const Icon = config.icon;
        const isConnecting = connectingFrom === node.id;
        return (
          <motion.div
            key={node.id}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`absolute z-10 select-none ${draggingId === node.id ? 'z-20' : ''}`}
            style={{ left: node.x, top: node.y, width: 160 }}
            onMouseDown={(e) => handleMouseDown(e, node.id)}
            onClick={(e) => handleNodeClick(e, node.id)}
          >
            <div className={`rounded-xl border-2 p-3 shadow-sm cursor-grab active:cursor-grabbing transition-all ${config.color} ${isConnecting ? 'ring-2 ring-brand scale-105' : ''} ${!node.data.enabled ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-2 mb-1">
                <GripVertical size={14} className="text-text-muted cursor-grab" />
                <Icon size={14} className="flex-shrink-0" />
                <span className="text-[11px] font-semibold truncate flex-1">{node.label}</span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <button
                  onClick={(e) => { e.stopPropagation(); startConnect(e, node.id); }}
                  className={`p-1 rounded-md transition-colors ${isConnecting ? 'bg-brand text-white' : 'hover:bg-brand/10 text-text-muted'}`}
                  title={isConnecting ? 'Отменить соединение' : 'Соединить'}
                >
                  <ArrowRight size={10} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onNodeSelect(node); }}
                  className="p-1 rounded-md hover:bg-brand/10 text-text-muted transition-colors"
                  title="Настроить"
                >
                  <Settings size={10} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteNode(node.id); }}
                  className="p-1 rounded-md hover:bg-danger/10 text-text-muted hover:text-danger transition-colors"
                  title="Удалить"
                >
                  <Trash2 size={10} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onNodesChange(nodes.map(n => n.id === node.id ? { ...n, data: { ...n.data, enabled: !n.data.enabled } } : n));
                  }}
                  className="p-1 rounded-md hover:bg-brand/10 text-text-muted transition-colors ml-auto"
                  title={node.data.enabled ? 'Отключить' : 'Включить'}
                >
                  {node.data.enabled ? <Eye size={10} /> : <EyeOff size={10} />}
                </button>
              </div>
            </div>
          </motion.div>
        );
      })}

      <div className="absolute bottom-4 left-4 z-30">
        <button
          onClick={() => setShowPalette(!showPalette)}
          className="w-10 h-10 rounded-xl bg-brand text-white shadow-lg flex items-center justify-center hover:bg-brand-hover transition-colors"
        >
          <Plus size={20} />
        </button>
        <AnimatePresence>
          {showPalette && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              className="absolute bottom-full mb-2 left-0 bg-surface rounded-xl border border-[var(--border)] shadow-xl p-2 min-w-[180px]"
            >
              {NODE_TYPES.map(nt => {
                const NIcon = nt.icon;
                return (
                  <button
                    key={nt.type}
                    onClick={() => { onAddNode(nt.type); setShowPalette(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-accent-soft text-[12px] text-text transition-colors"
                  >
                    <NIcon size={14} />
                    {nt.label}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {connectingFrom && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-brand text-white px-4 py-2 rounded-full text-[12px] font-medium shadow-lg z-30">
          Выберите узел для соединения
        </div>
      )}
    </div>
  );
}
