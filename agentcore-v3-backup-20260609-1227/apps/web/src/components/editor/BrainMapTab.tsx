'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, MessageCircle, Zap, HelpCircle, Rocket, AlertTriangle, Blocks, Database, Wand2, Users, Plus, Trash2, Link2, Unlink, Sparkles, CheckCircle2, X, ChevronRight, ZoomIn, ZoomOut, Move, Info, MousePointer2, Hand
} from 'lucide-react';

const NODE_TYPES = [
  { type: 'greeting', label: 'Приветствие', icon: MessageCircle, color: '#6E56CF', bg: '#6E56CF', desc: 'Первое сообщение при начале диалога' },
  { type: 'qualification', label: 'Квалификация', icon: Zap, color: '#6E56CF', bg: '#6E56CF', desc: 'Вопросы для понимания потребности клиента' },
  { type: 'faq', label: 'FAQ', icon: HelpCircle, color: '#3A8F7A', bg: '#3A8F7A', desc: 'Ответы на частые вопросы' },
  { type: 'leadCapture', label: 'Сбор лидов', icon: Rocket, color: '#6E56CF', bg: '#6E56CF', desc: 'Сохранение контактных данных' },
  { type: 'escalation', label: 'Эскалация', icon: AlertTriangle, color: '#D97706', bg: '#D97706', desc: 'Передача оператору при сложных случаях' },
  { type: 'integration', label: 'Интеграция', icon: Blocks, color: '#6E56CF', bg: '#6E56CF', desc: 'Вызов внешних API (CRM, календари)' },
  { type: 'memory', label: 'Память', icon: Database, color: '#3A8F7A', bg: '#3A8F7A', desc: 'Сохранение данных в контекст диалога' },
  { type: 'handoff', label: 'Передача', icon: Users, color: '#D97706', bg: '#D97706', desc: 'Переключение на человека' },
  { type: 'custom', label: 'Пользовательский', icon: Wand2, color: '#7C7F86', bg: '#7C7F86', desc: 'Произвольная логика через JavaScript' },
];

interface BrainNode {
  id: string;
  type: string;
  label?: string;
  x: number;
  y: number;
  active: boolean;
  parentId?: string | null;
}

interface BrainMapTabProps {
  agent: any;
  container: any;
  item: any;
  onUpdate: (agent: any) => void;
}

const NODE_WIDTH = 140;
const NODE_HEIGHT = 60;
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 3;

export default function BrainMapTab({ agent, container, item, onUpdate }: BrainMapTabProps) {
  const [nodes, setNodes] = useState<BrainNode[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [panning, setPanning] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [linkingMode, setLinkingMode] = useState(false);
  const [linkingSource, setLinkingSource] = useState<string | null>(null);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [tooltipNode, setTooltipNode] = useState<BrainNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const getNodeMeta = (type: string) => NODE_TYPES.find(n => n.type === type) || NODE_TYPES[NODE_TYPES.length - 1];

  useEffect(() => {
    if (!agent?.settings?.brainMap?.nodes) {
      const defaults = [
        { id: 'greeting', type: 'greeting', x: 0, y: -80, active: true },
        { id: 'qualification', type: 'qualification', x: 200, y: -150, active: true, parentId: 'greeting' },
        { id: 'faq', type: 'faq', x: 200, y: -10, active: true, parentId: 'greeting' },
        { id: 'escalation', type: 'escalation', x: 450, y: -180, active: true, parentId: 'qualification' },
        { id: 'leadCapture', type: 'leadCapture', x: 450, y: -120, active: false, parentId: 'qualification' },
        { id: 'memory', type: 'memory', x: 200, y: 100, active: true, parentId: 'greeting' },
      ];
      setNodes(defaults);
    } else {
      setNodes(agent.settings.brainMap.nodes);
    }
  }, [agent]);

  const saveNodes = useCallback((newNodes: BrainNode[]) => {
    setNodes(newNodes);
    if (onUpdate) {
      onUpdate({
        ...agent,
        settings: { ...agent.settings, brainMap: { nodes: newNodes } }
      });
    }
  }, [agent, onUpdate]);

  const addNode = (type: string) => {
    const meta = getNodeMeta(type);
    const newNode: BrainNode = {
      id: `${type}-${Date.now()}`,
      type,
      label: meta.label,
      x: -pan.x / zoom + 100 + Math.random() * 50,
      y: -pan.y / zoom + Math.random() * 50,
      active: true,
    };
    saveNodes([...nodes, newNode]);
    setShowAddPanel(false);
  };

  const removeNode = (id: string) => {
    const filtered = nodes.filter(n => n.id !== id).map(n => n.parentId === id ? { ...n, parentId: null } : n);
    saveNodes(filtered);
    setSelectedId(null);
  };

  const toggleActive = (id: string) => {
    saveNodes(nodes.map(n => n.id === id ? { ...n, active: !n.active } : n));
  };

  const startLinking = (id: string) => {
    if (linkingMode && linkingSource === id) {
      setLinkingMode(false); setLinkingSource(null);
    } else if (linkingMode && linkingSource) {
      saveNodes(nodes.map(n => n.id === id ? { ...n, parentId: linkingSource } : n));
      setLinkingMode(false); setLinkingSource(null);
    } else {
      setLinkingMode(true); setLinkingSource(id);
    }
  };

  const screenToWorld = (sx: number, sy: number) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: (sx - rect.left - pan.x) / zoom,
      y: (sy - rect.top - pan.y) / zoom
    };
  };

  const handleMouseDown = (e: React.MouseEvent, nodeId?: string) => {
    if (e.button !== 0) return;
    const pos = screenToWorld(e.clientX, e.clientY);
    if (nodeId) {
      setDraggingId(nodeId);
      setSelectedId(nodeId);
    } else {
      setPanning(true);
    }
    setLastMouse({ x: pos.x, y: pos.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const pos = screenToWorld(e.clientX, e.clientY);
    if (draggingId) {
      const dx = pos.x - lastMouse.x;
      const dy = pos.y - lastMouse.y;
      setNodes(prev => prev.map(n => n.id === draggingId ? { ...n, x: n.x + dx, y: n.y + dy } : n));
      setLastMouse({ x: pos.x, y: pos.y });
    } else if (panning) {
      const dx = e.clientX - lastMouse.x;
      const dy = e.clientY - lastMouse.y;
      setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setLastMouse({ x: e.clientX, y: e.clientY });
    }

    // Tooltip
    const hovered = nodes.find(n => {
      const dx = pos.x - n.x;
      const dy = pos.y - n.y;
      return Math.abs(dx) < NODE_WIDTH/2 && Math.abs(dy) < NODE_HEIGHT/2;
    });
    if (hovered && !draggingId && !panning) {
      setTooltipNode(hovered);
      setTooltipPos({ x: e.clientX + 16, y: e.clientY + 16 });
    } else {
      setTooltipNode(null);
    }
  };

  const handleMouseUp = () => {
    if (draggingId) {
      saveNodes(nodes);
      setDraggingId(null);
    }
    setPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const worldX = (mouseX - pan.x) / zoom;
    const worldY = (mouseY - pan.y) / zoom;
    const delta = -e.deltaY * 0.001;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom + delta));
    const newPanX = mouseX - worldX * newZoom;
    const newPanY = mouseY - worldY * newZoom;
    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  const connections = useMemo(() => {
    return nodes.filter(n => n.parentId).map(n => {
      const parent = nodes.find(p => p.id === n.parentId);
      return parent ? { from: parent, to: n } : null;
    }).filter(Boolean) as { from: BrainNode; to: BrainNode }[];
  }, [nodes]);

  const selectedNode = nodes.find(n => n.id === selectedId);
  const viewBoxW = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const viewBoxH = typeof window !== 'undefined' ? window.innerHeight - 200 : 600;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="h-full flex flex-col" ref={containerRef}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-3 px-4 pt-3">
        <div className="w-9 h-9 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center ring-1 ring-[var(--border)]/60">
          <Brain className="w-4 h-4 text-[var(--brand)]" />
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text)] text-sm">Brain Map</h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Интерактивная логика работы агента</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <button onClick={() => setZoom(z => Math.max(MIN_ZOOM, z - 0.2))} className="p-1.5 rounded-lg bg-surface-2 text-text hover:bg-surface-3 transition-colors" title="Уменьшить">
            <ZoomOut size={14} />
          </button>
          <span className="text-[11px] text-text-muted w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(MAX_ZOOM, z + 0.2))} className="p-1.5 rounded-lg bg-surface-2 text-text hover:bg-surface-3 transition-colors" title="Увеличить">
            <ZoomIn size={14} />
          </button>
          <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="p-1.5 rounded-lg bg-surface-2 text-text hover:bg-surface-3 transition-colors" title="Центрировать">
            <Move size={14} />
          </button>
          <div className="w-px h-5 bg-border mx-1" />
          <button onClick={() => setLinkingMode(!linkingMode)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${linkingMode ? 'bg-brand text-white' : 'bg-surface-2 text-text hover:bg-surface-3'}`}>
            {linkingMode ? 'Выберите цель' : <><Link2 size={12} className="inline mr-1" />Связать</>}
          </button>
          <button onClick={() => setShowAddPanel(!showAddPanel)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-brand text-white hover:bg-brand-hover transition-colors">
            <Plus size={12} className="inline mr-1" />Добавить
          </button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0 px-4 pb-3 gap-3">
        {/* Canvas */}
        <div className="flex-1 relative bg-[var(--surface-2)] rounded-2xl border border-[var(--border)] overflow-hidden cursor-grab active:cursor-grabbing select-none"
          onMouseDown={e => handleMouseDown(e)}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => { setPanning(false); setDraggingId(null); setTooltipNode(null); }}
          onWheel={handleWheel}
        >
          <svg ref={svgRef} className="w-full h-full touch-none" style={{ cursor: draggingId ? 'grabbing' : panning ? 'grabbing' : 'grab' }}>
            <defs>
              <pattern id="grid" width={40 * zoom} height={40 * zoom} patternUnits="userSpaceOnUse">
                <circle cx={20 * zoom} cy={20 * zoom} r={1 * zoom} fill="var(--text-muted)" opacity="0.12" />
              </pattern>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="var(--brand)" opacity="0.5" />
              </marker>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="var(--text)" floodOpacity="0.08" />
              </filter>
            </defs>

            <rect x={-10000} y={-10000} width={20000} height={20000} fill="url(#grid)" />

            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              {/* Connections */}
              {connections.map((conn, i) => {
                const fromX = conn.from.x;
                const fromY = conn.from.y + NODE_HEIGHT / 2;
                const toX = conn.to.x;
                const toY = conn.to.y - NODE_HEIGHT / 2;
                const midY = (fromY + toY) / 2;
                return (
                  <g key={`conn-${i}`}>
                    <path
                      d={`M ${fromX} ${fromY} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${toY}`}
                      fill="none"
                      stroke={conn.to.active ? 'var(--brand)' : 'var(--text-muted)'}
                      strokeWidth={conn.to.active ? 2.5 : 1.5}
                      opacity={conn.to.active ? 0.6 : 0.25}
                      strokeDasharray={conn.to.active ? 'none' : '6 4'}
                      markerEnd={conn.to.active ? "url(#arrowhead)" : undefined}
                    />
                    {/* Animated dash for active */}
                    {conn.to.active && (
                      <path
                        d={`M ${fromX} ${fromY} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${toY}`}
                        fill="none"
                        stroke="var(--brand)"
                        strokeWidth={2}
                        opacity={0.3}
                        strokeDasharray="10 20"
                        strokeLinecap="round"
                      >
                        <animate attributeName="stroke-dashoffset" from="0" to="-30" dur="1s" repeatCount="indefinite" />
                      </path>
                    )}
                  </g>
                );
              })}

              {/* Pending link */}
              {linkingMode && linkingSource && (() => {
                const src = nodes.find(n => n.id === linkingSource);
                if (!src) return null;
                return (
                  <line x1={src.x} y1={src.y} x2={src.x + 80} y2={src.y} stroke="var(--brand)" strokeWidth={2} strokeDasharray="8 4" opacity={0.6}>
                    <animate attributeName="x2" values={`${src.x + 40};${src.x + 120};${src.x + 40}`} dur="2s" repeatCount="indefinite" />
                    <animate attributeName="y2" values={`${src.y - 30};${src.y + 30};${src.y - 30}`} dur="2s" repeatCount="indefinite" />
                  </line>
                );
              })()}

              {/* Nodes */}
              {nodes.map(node => {
                const meta = getNodeMeta(node.type);
                const isSelected = selectedId === node.id;
                const isLinking = linkingMode && linkingSource === node.id;
                const isTarget = linkingMode && linkingSource && linkingSource !== node.id;
                const Icon = meta.icon;
                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    onMouseDown={e => { e.stopPropagation(); handleMouseDown(e, node.id); }}
                    style={{ cursor: isTarget ? 'crosshair' : 'grab' }}
                    filter="url(#shadow)"
                  >
                    {/* Glow */}
                    {isSelected && (
                      <rect x={-NODE_WIDTH/2 - 6} y={-NODE_HEIGHT/2 - 6} width={NODE_WIDTH + 12} height={NODE_HEIGHT + 12} rx={18} fill="none" stroke="var(--brand)" strokeWidth={2} opacity={0.3}>
                        <animate attributeName="opacity" values="0.3;0.6;0.3" dur="2s" repeatCount="indefinite" />
                      </rect>
                    )}
                    {isLinking && (
                      <rect x={-NODE_WIDTH/2 - 8} y={-NODE_HEIGHT/2 - 8} width={NODE_WIDTH + 16} height={NODE_HEIGHT + 16} rx={20} fill="none" stroke="var(--brand)" strokeWidth={2} strokeDasharray="6 4" opacity={0.5}>
                        <animate attributeName="opacity" values="0.5;0.8;0.5" dur="1s" repeatCount="indefinite" />
                      </rect>
                    )}
                    {/* Body */}
                    <rect
                      x={-NODE_WIDTH/2} y={-NODE_HEIGHT/2}
                      width={NODE_WIDTH} height={NODE_HEIGHT}
                      rx={14}
                      fill={node.active ? 'var(--surface)' : 'var(--surface-2)'}
                      stroke={isSelected ? 'var(--brand)' : node.active ? meta.color : 'var(--text-muted)'}
                      strokeWidth={isSelected ? 2.5 : 2}
                      opacity={node.active ? 1 : 0.5}
                      className={isTarget ? 'animate-pulse' : ''}
                    />
                    {/* Icon circle */}
                    <circle cx={-NODE_WIDTH/2 + 22} cy={0} r={14} fill={node.active ? meta.bg + '20' : 'var(--surface-2)'} stroke={node.active ? meta.color : 'var(--text-muted)'} strokeWidth={1.5} opacity={node.active ? 0.3 : 0.15} />
                    {/* Text icon */}
                    <text x={-NODE_WIDTH/2 + 22} y={4} textAnchor="middle" fontSize={12} fontFamily="sans-serif" fill={node.active ? meta.color : 'var(--text-muted)'} opacity={0.8}>★</text>
                    {/* Label */}
                    <text x={-NODE_WIDTH/2 + 44} y={-3} textAnchor="start" fill={node.active ? 'var(--text)' : 'var(--text-muted)'} fontSize={11} fontWeight={600} fontFamily="sans-serif">{meta.label}</text>
                    <text x={-NODE_WIDTH/2 + 44} y={12} textAnchor="start" fill={node.active ? 'var(--text-muted)' : 'var(--text-muted)'} fontSize={8} fontFamily="sans-serif" opacity={0.7}>ID: {node.id.slice(0, 6)}</text>
                    {/* Active dot */}
                    {node.active && (
                      <circle cx={NODE_WIDTH/2 - 8} cy={-NODE_HEIGHT/2 + 10} r={4} fill="#3A8F7A">
                        <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
                      </circle>
                    )}
                    {/* Click target */}
                    {isTarget && (
                      <rect x={-NODE_WIDTH/2 - 4} y={-NODE_HEIGHT/2 - 4} width={NODE_WIDTH + 8} height={NODE_HEIGHT + 8} rx={16} fill="transparent" onClick={() => startLinking(node.id)} style={{ cursor: 'crosshair' }} />
                    )}
                    {!isTarget && !linkingMode && (
                      <rect x={-NODE_WIDTH/2} y={-NODE_HEIGHT/2} width={NODE_WIDTH} height={NODE_HEIGHT} rx={14} fill="transparent" onClick={() => setSelectedId(node.id)} />
                    )}
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Legend */}
          <div className="absolute bottom-3 left-3 bg-surface/95 backdrop-blur-sm rounded-xl px-3 py-2.5 border border-border text-[10px] text-text-muted space-y-1.5 shadow-lg">
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: '#6E56CF' }} /> Основная логика</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: '#3A8F7A' }} /> Данные/Память</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: '#D97706' }} /> Эскалация</div>
            <div className="mt-1 pt-1 border-t border-border/50 flex items-center gap-1"><MousePointer2 size={10} /> Клик — выбрать</div>
            <div className="flex items-center gap-1"><Hand size={10} /> Drag — перетащить/панорама</div>
            <div className="flex items-center gap-1"><ZoomIn size={10} /> Колёсико — зум</div>
          </div>
        </div>

        {/* Sidebar */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-surface rounded-2xl border border-border overflow-hidden flex flex-col shadow-lg"
            >
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center`} style={{ background: getNodeMeta(selectedNode.type).bg + '20' }}>
                      <span style={{ color: getNodeMeta(selectedNode.type).color, fontSize: 14 }}>★</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text">{getNodeMeta(selectedNode.type).label}</p>
                      <p className="text-[10px] text-text-muted">{getNodeMeta(selectedNode.type).desc}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedId(null)} className="text-text-muted hover:text-text p-1">
                    <X size={16} />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleActive(selectedNode.id)} className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${selectedNode.active ? 'bg-success/15 text-success' : 'bg-surface-3 text-text-muted'}`}>
                    {selectedNode.active ? <><CheckCircle2 size={12} /> Активно</> : <><X size={12} /> Отключено</>}
                  </button>
                  <button onClick={() => startLinking(selectedNode.id)} className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${linkingMode && linkingSource === selectedNode.id ? 'bg-brand text-white' : 'bg-surface-3 text-text hover:bg-surface-2'}`}>
                    <Link2 size={14} />
                  </button>
                  <button onClick={() => removeNode(selectedNode.id)} className="px-3 py-2 rounded-lg text-xs font-medium bg-danger/15 text-danger hover:bg-danger/25 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="p-4 flex-1 overflow-y-auto space-y-4">
                <div>
                  <label className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-1.5 block">Позиция</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="px-3 py-2 bg-surface-2 rounded-lg text-xs text-text font-mono">X: {Math.round(selectedNode.x)}</div>
                    <div className="px-3 py-2 bg-surface-2 rounded-lg text-xs text-text font-mono">Y: {Math.round(selectedNode.y)}</div>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-1.5 block">Связи</label>
                  <div className="space-y-1.5">
                    {connections.filter(c => c.from.id === selectedNode.id || c.to.id === selectedNode.id).map((conn, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 bg-surface-2 rounded-lg text-xs text-text">
                        <span className="text-text-muted">{conn.from.id === selectedNode.id ? '→' : '←'}</span>
                        <span>{getNodeMeta(conn.from.id === selectedNode.id ? conn.to.type : conn.from.type).label}</span>
                      </div>
                    ))}
                    {connections.filter(c => c.from.id === selectedNode.id || c.to.id === selectedNode.id).length === 0 && (
                      <p className="text-[11px] text-text-muted italic">Нет связей</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-1.5 block">Дочерние узлы</label>
                  <div className="space-y-1.5">
                    {nodes.filter(n => n.parentId === selectedNode.id).map(child => (
                      <div key={child.id} className="flex items-center gap-2 px-3 py-2 bg-surface-2 rounded-lg text-xs text-text">
                        <ChevronRight size={10} className="text-brand" />
                        <span>{getNodeMeta(child.type).label}</span>
                        <span className={`ml-auto w-1.5 h-1.5 rounded-full ${child.active ? 'bg-success' : 'bg-text-muted'}`} />
                      </div>
                    ))}
                    {nodes.filter(n => n.parentId === selectedNode.id).length === 0 && (
                      <p className="text-[11px] text-text-muted italic">Нет дочерних узлов</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add Panel */}
      <AnimatePresence>
        {showAddPanel && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border bg-surface-2 px-4 py-3"
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} className="text-brand" />
              <span className="text-sm font-medium text-text">Добавить логический блок</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
              {NODE_TYPES.map(nodeType => (
                <button
                  key={nodeType.type}
                  onClick={() => addNode(nodeType.type)}
                  className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-surface border border-border hover:border-brand/50 hover:bg-surface-3 transition-all group"
                  title={nodeType.desc}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform" style={{ background: nodeType.bg + '20' }}>
                    <span style={{ color: nodeType.color, fontSize: 14 }}>★</span>
                  </div>
                  <span className="text-[10px] font-medium text-text">{nodeType.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tooltip */}
      <AnimatePresence>
        {tooltipNode && !draggingId && !panning && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed pointer-events-none z-50 bg-surface/95 backdrop-blur-sm border border-border rounded-xl px-3 py-2 shadow-xl max-w-xs"
            style={{ left: tooltipPos.x, top: tooltipPos.y }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span style={{ color: getNodeMeta(tooltipNode.type).color }}>★</span>
              <span className="text-xs font-semibold text-text">{getNodeMeta(tooltipNode.type).label}</span>
            </div>
            <p className="text-[10px] text-text-muted">{getNodeMeta(tooltipNode.type).desc}</p>
            <p className="text-[10px] text-text-muted mt-1 opacity-60">{tooltipNode.active ? 'Активно' : 'Отключено'}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
