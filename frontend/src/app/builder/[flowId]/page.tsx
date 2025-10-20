'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ReactFlow, {
  Node as RFNode,
  Edge as RFEdge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import type { Flow, Node, Edge } from '../../../types/schemas';
import { api } from '@/lib/api';
import { toast } from '@/lib/toasts';
import Toolbar from '@/components/Toolbar';
import SidePanel from '@/components/SidePanel';
import ValidationPanel from '@/components/ValidationPanel';
import ExecutionConsole from '@/components/ExecutionConsole';
import CustomNode from '@/components/CustomNode';

export default function BuilderPage(): JSX.Element {
  const router = useRouter();
  const params = useParams();
  const flowId = params.flowId as string;

  const nodeTypes = useMemo(() => ({
    custom: CustomNode,
  }), []);

  const [flow, setFlow] = useState<Flow | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadFlow();
  }, [flowId]);

  async function loadFlow(): Promise<void> {
    try {
      const data = await api.getFlowById(flowId);
      setFlow(data);
      setNodes(convertToRFNodes(data.nodes));
      setEdges(convertToRFEdges(data.edges));
    } catch (error) {
      toast.error('Failed to load flow');
      console.error(error);
    }
  }

  const onConnect = useCallback(
    (connection: Connection) => {
      if (connection.source === connection.target) {
        toast.error('Self-loops are not allowed');
        return;
      }

      const newEdge: RFEdge = {
        ...connection,
        id: `edge_${Date.now()}`,
      } as RFEdge;

      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  async function handleSave(): Promise<void> {
    if (!flow) return;

    setSaving(true);
    try {
      const updated = await api.updateFlow(flowId, {
        nodes: convertFromRFNodes(nodes),
        edges: convertFromRFEdges(edges),
      });
      setFlow(updated);
      toast.success('Flow saved');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save flow');
    } finally {
      setSaving(false);
    }
  }

  async function handleValidate(): Promise<void> {
    try {
      const result = await api.validateFlow(flowId);
      setValidationErrors(result.errors);
      if (result.valid) {
        toast.success('Flow is valid');
      } else {
        const errorCount = result.errors.filter((e) => e.severity === 'error').length;
        toast.error(`Validation failed: ${errorCount} errors`);
      }
    } catch (error) {
      toast.error('Validation failed');
    }
  }

  async function handleActivate(): Promise<void> {
    if (!flow) return;
    try {
      const updated = await api.activateFlow(flowId);
      setFlow(updated);
      toast.success('Flow activated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to activate');
    }
  }

  async function handleDeactivate(): Promise<void> {
    if (!flow) return;
    try {
      const updated = await api.deactivateFlow(flowId);
      setFlow(updated);
      toast.success('Flow deactivated');
    } catch (error) {
      toast.error('Failed to deactivate');
    }
  }

  function handleNodeClick(_event: React.MouseEvent, node: RFNode): void {
    const flowNode = convertFromRFNodes([node])[0];
    setSelectedNode(flowNode);
    setSelectedEdge(null);
  }

  function handleEdgeClick(_event: React.MouseEvent, edge: RFEdge): void {
    const flowEdge = convertFromRFEdges([edge])[0];
    setSelectedEdge(flowEdge);
    setSelectedNode(null);
  }

  function handlePaneClick(): void {
    setSelectedNode(null);
    setSelectedEdge(null);
  }

  function handleUpdateNode(updated: Node): void {
    setNodes((nds) =>
      nds.map((n) => 
        n.id === updated.id 
          ? { 
              ...n, 
              data: { 
                ...updated,
                id: updated.id,
                type: updated.type,
              } 
            } 
          : n
      )
    );
    setSelectedNode(updated);
  }

  function handleUpdateEdge(updated: Edge): void {
    setEdges((eds) =>
      eds.map((e) => (e.id === updated.id ? { ...e, label: updated.label, data: updated } : e))
    );
    setSelectedEdge(updated);
  }

  function handleDeleteSelected(): void {
    if (selectedNode) {
      setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
      setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
      setSelectedNode(null);
    } else if (selectedEdge) {
      setEdges((eds) => eds.filter((e) => e.id !== selectedEdge.id));
      setSelectedEdge(null);
    }
  }

  function handleAddNode(type: string): void {
    const newNode: RFNode = {
      id: `node_${Date.now()}`,
      type: 'custom',
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: { 
        id: `node_${Date.now()}`,
        label: `New ${type}`, 
        type,
        config: {},
      },
    };
    setNodes((nds) => [...nds, newNode]);
  }

  function handleAutoOrganize(): void {
    if (nodes.length === 0) return;

    const adjacencyList: Record<string, string[]> = {};
    nodes.forEach(n => adjacencyList[n.id] = []);
    edges.forEach(e => {
      if (e.source && adjacencyList[e.source]) {
        adjacencyList[e.source].push(e.target!);
      }
    });

    const triggerNodes = nodes.filter(n => n.data.type === 'TRIGGER');
    if (triggerNodes.length === 0) {
      toast.error('No trigger node found to organize from');
      return;
    }

    const levels: Record<string, number> = {};
    const visited = new Set<string>();
    const queue: { id: string; level: number }[] = [];

    triggerNodes.forEach(trigger => {
      queue.push({ id: trigger.id, level: 0 });
      visited.add(trigger.id);
      levels[trigger.id] = 0;
    });

    let maxLevel = 0;
    while (queue.length > 0) {
      const { id, level } = queue.shift()!;
      const children = adjacencyList[id] || [];
      
      children.forEach(childId => {
        if (!visited.has(childId)) {
          visited.add(childId);
          levels[childId] = level + 1;
          maxLevel = Math.max(maxLevel, level + 1);
          queue.push({ id: childId, level: level + 1 });
        }
      });
    }

    const nodesByLevel: Record<number, RFNode[]> = {};
    nodes.forEach(node => {
      const level = levels[node.id] ?? maxLevel + 1;
      if (!nodesByLevel[level]) nodesByLevel[level] = [];
      nodesByLevel[level].push(node);
    });

    const HORIZONTAL_SPACING = 250;
    const VERTICAL_SPACING = 150;
    const START_X = 100;
    const START_Y = 100;

    const organizedNodes = nodes.map(node => {
      const level = levels[node.id] ?? maxLevel + 1;
      const nodesInLevel = nodesByLevel[level];
      const indexInLevel = nodesInLevel.indexOf(node);
      const totalInLevel = nodesInLevel.length;

      const offsetX = (totalInLevel - 1) * HORIZONTAL_SPACING / 2;
      
      return {
        ...node,
        position: {
          x: START_X + (indexInLevel * HORIZONTAL_SPACING) - offsetX + (level * 50),
          y: START_Y + (level * VERTICAL_SPACING),
        },
      };
    });

    setNodes(organizedNodes);
    toast.success('Nodes organized automatically');
  }

  if (!flow) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }  return (
    <div className="h-screen flex flex-col">
      <Toolbar
        flow={flow}
        saving={saving}
        onSave={handleSave}
        onValidate={handleValidate}
        onActivate={handleActivate}
        onDeactivate={handleDeactivate}
        onBack={() => router.push('/')}
        onAddNode={handleAddNode}
        onAutoOrganize={handleAutoOrganize}
      />

      <div className="flex-1 flex">
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={handleNodeClick}
            onEdgeClick={handleEdgeClick}
            onPaneClick={handlePaneClick}
            fitView
          >
            <Controls />
            <Background variant={BackgroundVariant.Dots} />
          </ReactFlow>
        </div>

        <SidePanel
          selectedNode={selectedNode}
          selectedEdge={selectedEdge}
          onUpdateNode={handleUpdateNode}
          onUpdateEdge={handleUpdateEdge}
          onDelete={handleDeleteSelected}
        />
      </div>

      {validationErrors.length > 0 && (
        <ValidationPanel errors={validationErrors} onClose={() => setValidationErrors([])} />
      )}

      <ExecutionConsole flowId={flowId} />
    </div>
  );
}

function convertToRFNodes(nodes: Node[]): RFNode[] {
  return nodes.map((n, index) => ({
    id: n.id,
    type: 'custom',
    position: { x: 100 + (index % 3) * 250, y: 100 + Math.floor(index / 3) * 150 },
    data: { 
      ...n,
      id: n.id,
      label: n.label,
      type: n.type,
    },
  }));
}

function convertToRFEdges(edges: Edge[]): RFEdge[] {
  return edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    sourceHandle: (e as any).sourceHandle,
    data: e,
  }));
}

function convertFromRFNodes(rfNodes: RFNode[]): Node[] {
  return rfNodes.map((n) => ({
    id: n.id,
    label: n.data.label || n.id,
    type: n.data.type || 'ACTION',
    config: n.data.config,
  }));
}

function convertFromRFEdges(rfEdges: RFEdge[]): Edge[] {
  return rfEdges.map((e) => ({
    id: e.id,
    source: e.source!,
    target: e.target!,
    label: e.label as string | undefined,
    conditionPath: e.sourceHandle || e.data?.conditionPath,
  }));
}
