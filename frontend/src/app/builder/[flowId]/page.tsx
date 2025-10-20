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

  // Custom node types with our styled components
  const nodeTypes = useMemo(() => ({
    custom: CustomNode,
  }), []);

  const [flow, setFlow] = useState<Flow | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
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
      // Client-side validation
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

    const flowNodes = convertFromRFNodes(nodes);
    const flowEdges = convertFromRFEdges(edges);

    const emptyLabelNodes = flowNodes.filter(n => !n.label || n.label.trim() === '');
    if (emptyLabelNodes.length > 0) {
      toast.error('Cannot save: Some nodes have empty labels');
      return;
    }

    setSaving(true);
    try {
      const updated = await api.updateFlow(flowId, {
        nodes: flowNodes,
        edges: flowEdges,
      });
      setFlow(updated);
      toast.success('Flow saved successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save flow');
    } finally {
      setSaving(false);
    }
  }

  async function handleValidate(): Promise<void> {
    try {
      const result = await api.validateFlow(flowId);
      setValidationResult(result);
      if (result.valid) {
        toast.success('Flow validation passed');
      } else {
        const errorCount = result.errors.filter((e: any) => e.severity === 'error').length;
        toast.error(`Validation failed: ${errorCount} errors found`);
      }
    } catch (error) {
      toast.error('Validation request failed');
    }
  }

  async function handleActivate(): Promise<void> {
    if (!flow) return;
    
    try {
      const validationResult = await api.validateFlow(flowId);
      
      if (!validationResult.valid) {
        const errorCount = validationResult.errors.filter((e: any) => e.severity === 'error').length;
        toast.error(`Cannot activate: Flow has ${errorCount} validation error${errorCount !== 1 ? 's' : ''}`);
        setValidationResult(validationResult);
        return;
      }
      
      const updated = await api.activateFlow(flowId);
      setFlow(updated);
      toast.success('Flow activated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to activate flow');
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
                type: updated.type, // Ensure type is preserved for colors
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

  function handleAutoLayout(): void {
    const flowNodes = convertFromRFNodes(nodes);
    const flowEdges = convertFromRFEdges(edges);

    const triggerNodes = flowNodes.filter((n) => n.type === 'TRIGGER');
    if (triggerNodes.length === 0) {
      toast.error('No trigger nodes to organize');
      return;
    }

    const positioned = new Map<string, { x: number; y: number; level: number }>();
    const levelWidth = 300;
    const levelHeight = 150;
    const nodeSpacing = 100;
    let currentLevel = 0;

    function calculateLevel(nodeId: string, level: number = 0): number {
      if (positioned.has(nodeId)) {
        return positioned.get(nodeId)!.level;
      }

      const outgoing = flowEdges.filter((e) => e.source === nodeId);
      if (outgoing.length === 0) {
        return level;
      }

      let maxChildLevel = level;
      for (const edge of outgoing) {
        const childLevel = calculateLevel(edge.target, level + 1);
        maxChildLevel = Math.max(maxChildLevel, childLevel);
      }
      return maxChildLevel;
    }

    function layoutNode(nodeId: string, level: number, parentY: number = 0): void {
      if (positioned.has(nodeId)) return;

      const node = flowNodes.find((n) => n.id === nodeId);
      if (!node) return;

      const nodesAtLevel = Array.from(positioned.values()).filter((p) => p.level === level).length;
      
      const y = parentY !== 0 ? parentY : nodesAtLevel * (levelHeight + nodeSpacing);
      const x = level * levelWidth;

      positioned.set(nodeId, { x, y, level });

      const outgoing = flowEdges.filter((e) => e.source === nodeId);
      
      if (outgoing.length === 1) {
        layoutNode(outgoing[0].target, level + 1, y);
      } else if (outgoing.length > 1) {
        outgoing.forEach((edge, index) => {
          const branchY = y + (index - (outgoing.length - 1) / 2) * (levelHeight + nodeSpacing);
          layoutNode(edge.target, level + 1, branchY);
        });
      }
    }

    triggerNodes.forEach((trigger, index) => {
      layoutNode(trigger.id, 0, index * (levelHeight * 2 + nodeSpacing));
    });

    const updatedNodes = nodes.map((node) => {
      const pos = positioned.get(node.id);
      if (pos) {
        return { ...node, position: { x: pos.x, y: pos.y } };
      }
      return node;
    });

    setNodes(updatedNodes);
    toast.success('Layout organized');
  }

  function handleAddNode(type: string): void {
    const newNode: RFNode = {
      id: `node_${Date.now()}`,
      type: 'custom', // Use custom node type to apply colors
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

  if (!flow) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="h-screen flex flex-col">
      <Toolbar
        flow={flow}
        saving={saving}
        onSave={handleSave}
        onValidate={handleValidate}
        onActivate={handleActivate}
        onDeactivate={handleDeactivate}
        onAutoLayout={handleAutoLayout}
        onBack={() => router.push('/')}
        onAddNode={handleAddNode}
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

      {validationResult && (
        <ValidationPanel result={validationResult} onClose={() => setValidationResult(null)} />
      )}

      <ExecutionConsole flowId={flowId} />
    </div>
  );
}

// Conversion helpers
function convertToRFNodes(nodes: Node[]): RFNode[] {
  return nodes.map((n) => ({
    id: n.id,
    type: 'custom', // Always use custom node type for colored styling
    position: { x: Math.random() * 500, y: Math.random() * 500 },
    data: { 
      ...n,
      id: n.id,
      label: n.label,
      type: n.type, // Pass the actual node type (TRIGGER, ACTION, etc.) in data
    },
  }));
}

function convertToRFEdges(edges: Edge[]): RFEdge[] {
  return edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
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
    conditionPath: e.data?.conditionPath,
  }));
}
