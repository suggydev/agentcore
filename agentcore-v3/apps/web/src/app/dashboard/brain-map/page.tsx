'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Workflow, Plus, Save, Loader2, ArrowLeft, Settings, X,
  MessageCircle, Filter, UserPlus, HelpCircle, AlertTriangle,
  Blocks, Database, Users, ArrowRight, Undo2, Redo2,
  Maximize2,
} from 'lucide-react';
import ReactFlow, {
  Background, Controls, MiniMap, Node, Edge, Connection,
  useNodesState, useEdgesState, addEdge, MarkerType,
  Handle, Position, NodeProps, ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import DashboardLayout from '../../../components/DashboardLayout';

const API_BASE = 'http://31.76.102.116:4000';

const NODE_TYPES_MAP = [
  { type: 'greeting', label: 'Greeting', icon: MessageCircle, color: 'bg-mauve-100 border-mauve-300', iconColor: 'text-mauve-600', subtitle: 'Welcome message' },
  { type: 'qualification', label: 'Qualification', icon: Filter, color: 'bg-mauve-50 border-mauve-200', iconColor: 'text-mauve-500', subtitle: 'Filter & qualify' },
  { type: 'leadCapture', label: 'Lead Capture', icon: UserPlus, color: 'bg-blue-50 border-blue-200', iconColor: 'text-blue-600', subtitle: 'Capture info' },
  { type: 'faq', label: 'FAQ', icon: HelpCircle, color: 'bg-ink-50 border-ink-200', iconColor: 'text-ink-600', subtitle: 'Answer questions' },
  { type: 'escalation', label: 'Escalation', icon: AlertTriangle, color: 'bg-amber-50 border-amber-200', iconColor: 'text-amber-600', subtitle: 'Escalate to human' },
  { type: 'integration', label: 'Integration', icon: Blocks, color: 'bg-blue-50 border-blue-200', iconColor: 'text-blue-600', subtitle: 'API / webhook' },
  { type: 'memory', label: 'Memory', icon: Database, color: 'bg-green-50 border-green-200', iconColor: 'text-green-600', subtitle: 'Store context' },
  { type: 'handoff', label: 'Handoff', icon: Users, color: 'bg-orange-50 border-orange-200', iconColor: 'text-orange-600', subtitle: 'Human takeover' },
];

function CustomNode({ data, selected }: NodeProps) {
  const config = NODE_TYPES_MAP.find(t => t.type === data.nodeType) || NODE_TYPES_MAP[0];
  const Icon = config.icon;
  return (
    <div className={`px-4 py-3 rounded-xl border-2 shadow-sm min-w-[160px] transition-all duration-200 ${config.color} ${selected ? 'ring-2 ring-mauve-400 scale-105' : ''}`}>
      <Handle type="target" position={Position.Top} className="!bg-mauve-400 !w-3 !h-3" />
      <div className="flex items-center gap-2">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${config.iconColor === 'text-mauve-600' ? 'bg-mauve-200' : 'bg-white'}`}>
          <Icon className={`w-3.5 h-3.5 ${config.iconColor}`} />
        </div>
        <div>
          <div className="text-xs font-bold text-ink-900">{data.label}</div>
          <div className="text-[10px] text-ink-400">{config.subtitle}</div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-mauve-400 !w-3 !h-3" />
    </div>
  );
}

const nodeTypes = { customNode: CustomNode };

const INITIAL_NODES: Node[] = [
  { id: 'start', type: 'customNode', position: { x: 100, y: 50 }, data: { label: 'Start', nodeType: 'greeting' } },
  { id: 'qualify', type: 'customNode', position: { x: 300, y: 50 }, data: { label: 'Qualify Lead', nodeType: 'qualification' } },
  { id: 'faq', type: 'customNode', position: { x: 100, y: 220 }, data: { label: 'Answer FAQ', nodeType: 'faq' } },
  { id: 'capture', type: 'customNode', position: { x: 300, y: 220 }, data: { label: 'Capture Lead', nodeType: 'leadCapture' } },
  { id: 'escalate', type: 'customNode', position: { x: 500, y: 50 }, data: { label: 'Escalate', nodeType: 'escalation' } },
];

const INITIAL_EDGES: Edge[] = [
  { id: 'e1', source: 'start', target: 'qualify', markerEnd: { type: MarkerType.ArrowClosed, color: '#A896AB' }, style: { stroke: '#A896AB', strokeWidth: 2 } },
  { id: 'e2', source: 'start', target: 'faq', markerEnd: { type: MarkerType.ArrowClosed, color: '#A896AB' }, style: { stroke: '#A896AB', strokeWidth: 2 } },
  { id: 'e3', source: 'qualify', target: 'capture', markerEnd: { type: MarkerType.ArrowClosed, color: '#A896AB' }, style: { stroke: '#A896AB', strokeWidth: 2 } },
  { id: 'e4', source: 'qualify', target: 'escalate', markerEnd: { type: MarkerType.ArrowClosed, color: '#A896AB' }, style: { stroke: '#A896AB', strokeWidth: 2 } },
  { id: 'e5', source: 'faq', target: 'qualify', markerEnd: { type: MarkerType.ArrowClosed, color: '#A896AB' }, style: { stroke: '#A896AB', strokeWidth: 2, strokeDasharray: '5,5' } },
];

interface PanelData { nodeId: string; label: string; responseText: string; conditions: string; }

export default function BrainMapPage() {
  const [token, setToken] = useState('');
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);
  const [saving, setSaving] = useState(false);
  const [panel, setPanel] = useState<PanelData | null>(null);
  const [undoStack, setUndoStack] = useState<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const [showAddMenu, setShowAddMenu] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem('token');
    if (!t) { window.location.href = '/login'; return; }
    setToken(t);
    fetch(`${API_BASE}/api/agents`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.ok ? r.json() : [])
      .then(setAgents)
      .catch(() => {});
  }, []);

  const onConnect = useCallback((params: Connection) => {
    setUndoStack(prev => [...prev, { nodes, edges }]);
    setEdges(eds => addEdge({
      ...params,
      markerEnd: { type: MarkerType.ArrowClosed, color: '#A896AB' },
      style: { stroke: '#A896AB', strokeWidth: 2 },
    }, eds));
  }, [nodes, edges, setEdges]);

  const addNode = (nodeType: string) => {
    const config = NODE_TYPES_MAP.find(t => t.type === nodeType) || NODE_TYPES_MAP[0];
    setUndoStack(prev => [...prev, { nodes, edges }]);
    setNodes(nds => [...nds, {
      id: `${nodeType}-${Date.now()}`,
      type: 'customNode',
      position: { x: Math.random() * 300 + 200, y: Math.random() * 300 + 100 },
      data: { label: config.label, nodeType },
    }]);
    setShowAddMenu(false);
  };

  const onNodeClick = (_: any, node: Node) => {
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
    setNodes(prev.nodes);
    setEdges(prev.edges);
    setUndoStack(s => s.slice(0, -1));
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
    } catch {}
    setSaving(false);
  };

  const autoLayout = () => {
    setUndoStack(prev => [...prev, { nodes, edges }]);
    const cols = Math.ceil(Math.sqrt(nodes.length));
    setNodes(nodes.map((n, i) => ({
      ...n,
      position: { x: (i % cols) * 220 + 50, y: Math.floor(i / cols) * 160 + 50 },
    })));
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-0px)] flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-3 bg-white border-b border-ink-100 z-10">
          <ArrowLeft className="w-4 h-4 text-ink-400" />
          <h1 className="font-semibold text-ink-900 text-sm">Brain Map Editor</h1>
          <div className="flex-1" />
          <select
            value={selectedAgent}
            onChange={e => setSelectedAgent(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-mauve-200 text-xs text-ink-700 bg-white focus:ring-2 focus:ring-mauve-400/30"
          >
            <option value="">Select agent...</option>
            {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <div className="relative">
            <button onClick={() => setShowAddMenu(!showAddMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-mauve-50 text-mauve-600 text-xs font-medium hover:bg-mauve-100 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add Node
            </button>
            <AnimatePresence>
              {showAddMenu && (
                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="absolute top-full mt-1 right-0 bg-white rounded-xl border border-ink-200 shadow-xl p-1.5 z-50 min-w-[180px]">
                  {NODE_TYPES_MAP.map(nt => (
                    <button key={nt.type} onClick={() => addNode(nt.type)}
                      className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-mauve-50 text-xs text-ink-700 transition-colors">
                      <nt.icon className="w-3.5 h-3.5" /> {nt.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button onClick={undo} disabled={undoStack.length === 0}
            className="p-1.5 rounded-lg hover:bg-ink-50 text-ink-400 hover:text-ink-600 disabled:opacity-30 transition-colors">
            <Undo2 className="w-4 h-4" />
          </button>
          <button onClick={autoLayout}
            className="p-1.5 rounded-lg hover:bg-ink-50 text-ink-400 hover:text-ink-600 transition-colors">
            <Maximize2 className="w-4 h-4" />
          </button>
          <button onClick={saveFlow} disabled={!selectedAgent || saving}
            className="btn-primary text-xs py-1.5 px-4 gap-1.5 disabled:opacity-50">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save
          </button>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative">
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onPaneClick={() => setShowAddMenu(false)}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.4 }}
              minZoom={0.2}
              maxZoom={2}
              deleteKeyCode="Delete"
            >
              <Background color="#E8EAEF" gap={24} size={1} />
              <Controls className="[&>button]:bg-white [&>button]:border-mauve-200 [&>button]:text-mauve-600 [&>button]:rounded-lg [&>button]:shadow-sm [&>button:hover]:bg-mauve-50" />
              <MiniMap nodeColor="#FDF7FE" maskColor="rgba(248,249,251,0.85)"
                style={{ border: '1px solid #E2E4EB', borderRadius: '10px' }} />
            </ReactFlow>
          </ReactFlowProvider>
        </div>

        {/* Node Edit Panel */}
        <AnimatePresence>
          {panel && (
            <motion.div initial={{ x: 400, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 400, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed right-0 top-0 bottom-0 w-80 bg-white border-l border-ink-200 shadow-2xl z-50 overflow-y-auto">
              <div className="p-5">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-semibold text-ink-900 text-sm">Edit Node</h3>
                  <button onClick={() => setPanel(null)} className="p-1.5 rounded-lg hover:bg-ink-50 text-ink-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-ink-500 mb-1.5 block">Label</label>
                    <input value={panel.label} onChange={e => setPanel({ ...panel, label: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-mauve-200 text-sm focus:ring-2 focus:ring-mauve-400/30 text-ink-900" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-ink-500 mb-1.5 block">Response Text</label>
                    <textarea value={panel.responseText} onChange={e => setPanel({ ...panel, responseText: e.target.value })}
                      rows={4} className="w-full px-3 py-2 rounded-lg border border-mauve-200 text-sm focus:ring-2 focus:ring-mauve-400/30 text-ink-900 resize-none" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-ink-500 mb-1.5 block">Conditions (keywords, comma-separated)</label>
                    <input value={panel.conditions} onChange={e => setPanel({ ...panel, conditions: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-mauve-200 text-sm focus:ring-2 focus:ring-mauve-400/30 text-ink-900"
                      placeholder="hello, pricing, help" />
                  </div>
                  <button onClick={savePanel} className="btn-primary w-full text-sm gap-2">
                    <Save className="w-4 h-4" /> Save Changes
                  </button>
                  <button onClick={() => { setNodes(nds => nds.filter(n => n.id !== panel.nodeId)); setPanel(null); }}
                    className="w-full py-2.5 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors">
                    Delete Node
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
