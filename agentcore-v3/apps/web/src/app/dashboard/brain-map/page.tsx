'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
 Plus, Save, Loader2, ArrowLeft, X, Minus, Grid3X3,
 MessageCircle, Filter, UserPlus, HelpCircle, AlertTriangle,
 Blocks, Database, Users, Undo2, Redo2,
 Maximize2,
} from 'lucide-react';
import ReactFlow, {
 Background,
 Controls,
 MiniMap,
 Node, Edge, Connection,
 useNodesState, useEdgesState, addEdge, MarkerType,
 Handle, Position, NodeProps, ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import InfoTooltip from '../../../components/InfoTooltip';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

const NODE_TYPES_MAP = [
 { type: 'greeting', label: 'Приветствие', icon: MessageCircle, color: 'bg-[var(--accent-soft)] border-[var(--brand)]/30', iconColor: 'text-[var(--brand)]', subtitle: 'Приветствие' },
 { type: 'qualification', label: 'Квалификация', icon: Filter, color: 'bg-[var(--accent-soft)] border-[var(--border)]', iconColor: 'text-[var(--brand)]', subtitle: 'Фильтр и квалификация' },
  { type: 'leadCapture', label: 'Сбор лидов', icon: UserPlus, color: 'bg-[var(--brand-light)] border-[var(--brand-soft)]', iconColor: 'text-[var(--brand)]', subtitle: 'Сбор данных' },
 { type: 'faq', label: 'FAQ', icon: HelpCircle, color: 'bg-[var(--bg)] border-[var(--border)]', iconColor: 'text-[var(--text)]', subtitle: 'Ответы на вопросы' },
  { type: 'escalation', label: 'Эскалация', icon: AlertTriangle, color: 'bg-[var(--warning-soft)] border-[var(--warning-soft)]', iconColor: 'text-[var(--warning)]', subtitle: 'Передать человеку' },
  { type: 'integration', label: 'Интеграция', icon: Blocks, color: 'bg-[var(--brand-light)] border-[var(--brand-soft)]', iconColor: 'text-[var(--brand)]', subtitle: 'API / webhook' },
  { type: 'memory', label: 'Память', icon: Database, color: 'bg-success-soft border-[var(--success-soft)]', iconColor: 'text-success', subtitle: 'Хранение контекста' },
  { type: 'handoff', label: 'Передача', icon: Users, color: 'bg-[var(--warning-soft)] border-[var(--warning-soft)]', iconColor: 'text-[var(--warning)]', subtitle: 'Перехват человеком' },
];

function CustomNode({ data, selected }: NodeProps) {
 const config = NODE_TYPES_MAP.find(t => t.type === data.nodeType) || NODE_TYPES_MAP[0];
 const Icon = config.icon;
 return (
 <div className={`px-4 py-3 rounded-xl border-2 shadow-sm min-w-[160px] transition-all duration-200 ${config.color} ${selected ? 'ring-2 ring-[var(--brand)] scale-105' : ''}`}>
 <Handle type="target" position={Position.Top} className="!bg-[var(--brand)]/30 !w-3 !h-3" />
 <div className="flex items-center gap-2">
 <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${config.iconColor === 'text-[var(--brand)]' ? 'bg-[var(--border)]' : 'bg-surface'}`}>
 <Icon className={`w-3.5 h-3.5 ${config.iconColor}`} />
 </div>
 <div>
 <div className="text-xs font-bold text-[var(--text)]">{data.label}</div>
 <div className="text-[10px] text-[var(--text-muted)]">{config.subtitle}</div>
 </div>
 </div>
 <Handle type="source" position={Position.Bottom} className="!bg-[var(--brand)]/30 !w-3 !h-3" />
 </div>
 );
}

const nodeTypes = { customNode: CustomNode };

const WELCOME_NODES: Node[] = [
 { id: 'start', type: 'customNode', position: { x: 100, y: 50 }, data: { label: 'Старт', nodeType: 'greeting' } },
];

const WELCOME_EDGES: Edge[] = [];

interface PanelData { nodeId: string; label: string; responseText: string; conditions: string; }

interface Agent { id: string; name: string; }

export default function BrainMapPage() {
 const [token, setToken] = useState('');
 const [agents, setAgents] = useState<Agent[]>([]);
 const [selectedAgent, setSelectedAgent] = useState('');
 const [nodes, setNodes, onNodesChange] = useNodesState(WELCOME_NODES);
 const [edges, setEdges, onEdgesChange] = useEdgesState(WELCOME_EDGES);
 const [saving, setSaving] = useState(false);
 const [saveError, setSaveError] = useState('');
 const [panel, setPanel] = useState<PanelData | null>(null);
 const nodesRef = useRef(nodes);
 const edgesRef = useRef(edges);
 nodesRef.current = nodes;
 edgesRef.current = edges;
 const [undoStack, setUndoStack] = useState<{ nodes: Node[]; edges: Edge[] }[]>([]);
 const [redoStack, setRedoStack] = useState<{ nodes: Node[]; edges: Edge[] }[]>([]);
 const [showAddMenu, setShowAddMenu] = useState(false);
 const [showPalette, setShowPalette] = useState(false);

 useEffect(() => {
 const t = localStorage.getItem('token');
 if (!t) { window.location.href = '/login'; return; }
 setToken(t);
 fetch(`${API_BASE}/api/agents`, { headers: { Authorization: `Bearer ${t}` } })
 .then(r => r.ok ? r.json() : [])
 .then(setAgents)
 .catch(err => { console.error('[BrainMapPage] Failed to load agents:', err); setSaveError('Не удалось загрузить список агентов.'); });
 }, []);

 useEffect(() => {
 if (!selectedAgent || !token) return;
 setSaving(true);
 fetch(`${API_BASE}/api/agents/${selectedAgent}`, { headers: { Authorization: `Bearer ${token}` } })
 .then(r => r.ok ? r.json() : null)
 .then(data => {
 if (data?.settings?.brainMap?.nodes && data?.settings?.brainMap?.edges) {
 setNodes(data.settings.brainMap.nodes);
 setEdges(data.settings.brainMap.edges);
 } else {
 setNodes(WELCOME_NODES);
 setEdges(WELCOME_EDGES);
 }
 })
 .catch(() => {
 setNodes(WELCOME_NODES);
 setEdges(WELCOME_EDGES);
 })
 .finally(() => setSaving(false));
 }, [selectedAgent, token]);

 const pushUndo = useCallback(() => {
 setUndoStack(prev => [...prev, { nodes: nodesRef.current, edges: edgesRef.current }]);
 setRedoStack([]);
 }, []);

 const onConnect = useCallback((params: Connection) => {
 pushUndo();
 setEdges(eds => addEdge({
 ...params,
 markerEnd: { type: MarkerType.ArrowClosed, color: '#A896AB' },
 style: { stroke: '#A896AB', strokeWidth: 2 },
 }, eds));
 }, [pushUndo, setEdges]);

 const addNode = (nodeType: string, pos?: { x: number; y: number }) => {
 const config = NODE_TYPES_MAP.find(t => t.type === nodeType) || NODE_TYPES_MAP[0];
 pushUndo();
 setNodes(nds => [...nds, {
 id: `${nodeType}-${Date.now()}`,
 type: 'customNode',
 position: pos || { x: Math.random() * 300 + 200, y: Math.random() * 300 + 100 },
 data: { label: config.label, nodeType },
 }]);
 setShowAddMenu(false);
 };

 const onNodeClick = (_: React.MouseEvent, node: Node) => {
 setPanel({
 nodeId: node.id,
 label: node.data.label,
 responseText: node.data.responseText || '',
 conditions: node.data.conditions || '',
 });
 };

 const savePanel = () => {
 if (!panel) return;
 setNodes(nds => nds.map(n => n.id === panel.nodeId
 ? { ...n, data: { ...n.data, label: panel.label, responseText: panel.responseText, conditions: panel.conditions } }
 : n));
 setPanel(null);
 };

 const undo = () => {
 if (undoStack.length === 0) return;
 const prev = undoStack[undoStack.length - 1];
 setRedoStack(prev => [...prev, { nodes: nodesRef.current, edges: edgesRef.current }]);
 setNodes(prev.nodes);
 setEdges(prev.edges);
 setUndoStack(s => s.slice(0, -1));
 };

 const redo = () => {
 if (redoStack.length === 0) return;
 const next = redoStack[redoStack.length - 1];
 setUndoStack(prev => [...prev, { nodes: nodesRef.current, edges: edgesRef.current }]);
 setNodes(next.nodes);
 setEdges(next.edges);
 setRedoStack(s => s.slice(0, -1));
 };

 const saveFlow = async () => {
 if (!selectedAgent) return;
 setSaving(true);
 try {
 await fetch(`${API_BASE}/api/agents/${selectedAgent}`, {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
 body: JSON.stringify({
 settings: { brainMap: { nodes, edges } },
 }),
 });
 } catch (err) {
  console.error('[BrainMapPage] saveFlow error:', err);
  setSaveError('Не удалось сохранить карту мозга. Проверьте подключение и попробуйте снова.');
 }
 setSaving(false);
 };

 const autoLayout = () => {
 pushUndo();
 const cols = Math.ceil(Math.sqrt(nodes.length));
 setNodes(nodes.map((n, i) => ({
 ...n,
 position: { x: (i % cols) * 220 + 50, y: Math.floor(i / cols) * 160 + 50 },
 })));
 };

 return (
 <>
 <div className="h-screen flex flex-col">
 {/* Toolbar */}
 <div className="flex items-center gap-3 px-5 py-3 bg-surface border-b border-[var(--border)] z-10">
 <ArrowLeft className="w-4 h-4 text-[var(--text-muted)]" />
 <h1 className="font-semibold text-[var(--text)] text-sm">Редактор карты мозга агента <InfoTooltip content="Визуальный редактор логики агента. Добавляйте узлы (приветствие, FAQ, эскалация и др.), соединяйте их рёбрами и настраивайте сценарии диалогов." className="ml-1" /></h1>
 <div className="flex-1" />
 <select
 value={selectedAgent}
 onChange={e => setSelectedAgent(e.target.value)}
 className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs text-[var(--text)] bg-surface focus:ring-2 focus-visible:ring-[var(--brand)]"
 >
 <option value="">Выберите агента...</option>
 {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
 </select>
 <div className="relative">
 <button onClick={() => setShowAddMenu(!showAddMenu)}
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent-soft)] text-[var(--brand)] text-xs font-medium hover:bg-[var(--accent-soft)] transition-colors">
 <Plus className="w-3.5 h-3.5" /> Добавить узел
 </button>
 <AnimatePresence>
 {showAddMenu && (
 <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
 className="absolute top-full mt-1 right-0 bg-surface rounded-xl border border-[var(--border)] shadow-xl p-1.5 z-50 min-w-[180px]">
 {NODE_TYPES_MAP.map(nt => {
 const DdIcon = nt.icon;
 return (
 <button key={nt.type} onClick={() => addNode(nt.type)}
 className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg hover:bg-[var(--accent-soft)] text-xs text-[var(--text)] transition-colors">
 <div className={`w-6 h-6 rounded-md flex items-center justify-center ${nt.iconColor === 'text-[var(--brand)]' ? 'bg-[var(--accent-soft)]' : 'bg-surface border border-[var(--border)]'}`}>
 <DdIcon className={`w-3 h-3 ${nt.iconColor}`} />
 </div>
 <span className="font-medium">{nt.label}</span>
 </button>
 );
 })}
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 <button onClick={undo} disabled={undoStack.length === 0}
 className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text)] disabled:opacity-30 transition-colors">
 <Undo2 className="w-4 h-4" />
 </button>
 <button onClick={redo} disabled={redoStack.length === 0}
 className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text)] disabled:opacity-30 transition-colors">
 <Redo2 className="w-4 h-4" />
 </button>
 <button onClick={() => setShowPalette(!showPalette)}
 className={`p-1.5 rounded-lg transition-colors ${showPalette ? 'bg-[var(--accent-soft)] text-[var(--brand)]' : 'hover:bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text)]'}`}>
 <Grid3X3 className="w-4 h-4" />
 </button>
 <button onClick={autoLayout}
 className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
 <Maximize2 className="w-4 h-4" />
 </button>
 {saveError && (
  <span className="text-xs text-red-500 mr-2">{saveError}</span>
  )}
<button onClick={saveFlow} disabled={!selectedAgent || saving}
 className="btn-primary text-xs py-1.5 px-4 gap-1.5 disabled:opacity-50">
 {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
 Сохранить
 </button>
 </div>

 {/* Canvas */}
 <div className="flex-1 relative flex">
 {/* Node Palette sidebar */}
 <AnimatePresence>
 {showPalette && (
 <motion.div
 initial={{ x: -200, opacity: 0 }}
 animate={{ x: 0, opacity: 1 }}
 exit={{ x: -200, opacity: 0 }}
 transition={{ type: 'spring', damping: 25 }}
 className="w-52 bg-surface border-r border-[var(--border)] overflow-y-auto flex-shrink-0 z-20 shadow-lg"
 >
 <div className="p-3">
 <div className="flex items-center justify-between mb-3">
 <div className="flex items-center gap-1">
 <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Узлы</h3>
 <InfoTooltip content="Типы узлов: Приветствие — начало диалога, FAQ — ответы на вопросы, Эскалация — передача человеку, Интеграция — вызов API, Память — сохранение контекста." iconSize={11} />
 </div>
 <button onClick={() => setShowPalette(false)} className="p-1 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text-muted)]">
 <X className="w-3.5 h-3.5" />
 </button>
 </div>
 <div className="space-y-1">
 {NODE_TYPES_MAP.map(nt => {
 const NIcon = nt.icon;
 return (
 <button
 key={nt.type}
 draggable
 onDragStart={(e) => {
 e.dataTransfer.setData('nodeType', nt.type);
 e.dataTransfer.effectAllowed = 'move';
 }}
 onClick={() => addNode(nt.type)}
 className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg hover:bg-[var(--accent-soft)] text-xs text-[var(--text)] transition-colors text-left group"
 >
 <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${nt.iconColor === 'text-[var(--brand)]' ? 'bg-[var(--accent-soft)] group-hover:bg-[var(--border)]' : 'bg-surface border border-[var(--border)] group-hover:border-[var(--border)]'}`}>
 <NIcon className={`w-3.5 h-3.5 ${nt.iconColor}`} />
 </div>
 <div className="min-w-0">
 <div className="font-medium text-[var(--text)]">{nt.label}</div>
 <div className="text-[10px] text-[var(--text-muted)] truncate">{nt.subtitle}</div>
 </div>
 </button>
 );
 })}
 </div>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 <div className="flex-1 relative">
 <ReactFlowProvider>
 <ReactFlow
 nodes={nodes}
 edges={edges}
 onNodesChange={onNodesChange}
 onEdgesChange={onEdgesChange}
 onConnect={onConnect}
 onNodeClick={onNodeClick}
 onPaneClick={() => { setShowAddMenu(false); }}
 onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
 onDrop={(e) => {
 e.preventDefault();
 const nodeType = e.dataTransfer.getData('nodeType');
 if (nodeType && NODE_TYPES_MAP.some(nt => nt.type === nodeType)) {
 const bounds = (e.target as HTMLElement)?.closest('.react-flow__pane')?.getBoundingClientRect();
 if (bounds) {
 addNode(nodeType, { x: e.clientX - bounds.left - 80, y: e.clientY - bounds.top - 20 });
 } else {
 addNode(nodeType);
 }
 }
 }}
 nodeTypes={nodeTypes}
 fitView
 fitViewOptions={{ padding: 0.4 }}
 minZoom={0.2}
 maxZoom={2}
 deleteKeyCode="Delete"
 >
 <Background color="#E8EAEF" gap={24} size={1} />
 <Controls className="[&>button]:bg-surface [&>button]:border-[var(--border)] [&>button]:text-[var(--brand)] [&>button]:rounded-lg [&>button]:shadow-sm [&>button:hover]:bg-[var(--accent-soft)]" />
 <MiniMap nodeColor="#FDF7FE" maskColor="rgba(248,249,251,0.85)"
 style={{ border: '1px solid #E2E4EB', borderRadius: '10px' }} />
 </ReactFlow>
 </ReactFlowProvider>
 </div>
 </div>

 {/* Node Edit Panel */}
 <AnimatePresence>
 {panel && (
 <motion.div initial={{ x: 400, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 400, opacity: 0 }}
 transition={{ type: 'spring', damping: 25 }}
 className="fixed right-0 top-0 bottom-0 w-80 bg-surface border-l border-[var(--border)] shadow-2xl z-50 overflow-y-auto">
 <div className="p-5">
 <div className="flex items-center justify-between mb-5">
 <h3 className="font-semibold text-[var(--text)] text-sm">Редактировать узел</h3>
 <button onClick={() => setPanel(null)} className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text-muted)]">
 <X className="w-4 h-4" />
 </button>
 </div>
 <div className="space-y-4">
 <div>
 <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5 block">Метка</label>
 <input
 value={panel.label}
 onChange={e => setPanel({ ...panel, label: e.target.value })}
 className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] text-sm focus:ring-2 focus-visible:ring-[var(--brand)] text-[var(--text)] bg-[var(--accent-soft)]/30 transition-all duration-200"
 />
 </div>
 <div>
 <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5 block">Текст ответа</label>
 <textarea
 value={panel.responseText}
 onChange={e => setPanel({ ...panel, responseText: e.target.value })}
 rows={4}
 placeholder="Что ответит агент..."
 className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] text-sm focus:ring-2 focus-visible:ring-[var(--brand)] text-[var(--text)] bg-[var(--accent-soft)]/30 resize-none placeholder:text-[var(--text-muted)] transition-all duration-200"
 />
 </div>
 <div>
 <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5 block">Условия</label>
 <input
 value={panel.conditions}
 onChange={e => setPanel({ ...panel, conditions: e.target.value })}
 className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] text-sm focus:ring-2 focus-visible:ring-[var(--brand)] text-[var(--text)] bg-[var(--accent-soft)]/30 transition-all duration-200"
 placeholder="привет, цена, помощь"
 />
 <p className="text-[10px] text-[var(--text-muted)] mt-1">Ключевые слова через запятую</p>
 </div>
 <button
 onClick={savePanel}
 disabled={!panel.label.trim()}
 className="btn-primary w-full text-sm gap-2 py-2.5 disabled:opacity-40"
 >
 <Save className="w-4 h-4" /> Сохранить
 </button>
 <div className="border-t border-[var(--border)] pt-3">
 <button onClick={() => { pushUndo(); setNodes(nds => nds.filter(n => n.id !== panel.nodeId)); setPanel(null); }}
 className="w-full py-2.5 rounded-xl border border-danger-soft text-danger text-sm font-medium hover:bg-danger-soft hover:border-[var(--danger-soft)] transition-all duration-200">
 Удалить узел
 </button>
 </div>
 </div>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 </>
 );
}
