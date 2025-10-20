import { FlowSchema } from '../types/schemas';
import type { Flow, ValidationResult, ValidationError } from '../types/schemas';
import { validateNodeConfig } from './node-config.validator';

/**
 * Simplified validation - only essential rules for MVP
 * 1. Has at least one trigger
 * 2. All edges reference valid nodes
 * 3. No self-loops
 * 4. No duplicate IDs
 * 5. Valid node configs
 */
export function validateFlowStructure(flow: Flow): ValidationResult {
  const errors: ValidationError[] = [];

  // Zod schema validation
  const zodResult = FlowSchema.safeParse(flow);
  if (!zodResult.success) {
    errors.push({
      code: 'SCHEMA_INVALID',
      message: `Schema validation failed: ${zodResult.error.message}`,
      severity: 'error',
    });
    return { valid: false, errors };
  }

  for (const node of flow.nodes) {
    if (!node.label || (typeof node.label === 'string' && node.label.trim() === '')) {
      errors.push({
        code: 'EMPTY_NODE_LABEL',
        message: `Node with ID '${node.id}' has an empty or missing label`,
        nodeId: node.id,
        severity: 'error',
      });
    }
  }

  for (const edge of flow.edges) {
    if (!edge.id || (typeof edge.id === 'string' && edge.id.trim() === '')) {
      errors.push({
        code: 'EMPTY_EDGE_ID',
        message: 'An edge has an empty or missing ID',
        severity: 'error',
      });
    }
  }

  const triggerNodes = flow.nodes.filter((n) => n.type === 'TRIGGER');
  if (triggerNodes.length === 0) {
    errors.push({
      code: 'NO_TRIGGER',
      message: 'Flow must have at least one TRIGGER node',
      severity: 'error',
    });
  }

  // 2. All edges reference valid nodes
  const nodeIds = new Set(flow.nodes.map(n => n.id));
  for (const edge of flow.edges) {
    if (!nodeIds.has(edge.source)) {
      errors.push({
        code: 'INVALID_EDGE_REFERENCE',
        message: `Edge '${edge.id}' has invalid source node '${edge.source}'`,
        edgeId: edge.id,
        severity: 'error',
      });
    }
    if (!nodeIds.has(edge.target)) {
      errors.push({
        code: 'INVALID_EDGE_REFERENCE',
        message: `Edge '${edge.id}' has invalid target node '${edge.target}'`,
        edgeId: edge.id,
        severity: 'error',
      });
    }
  }

  // 3. No self-loops
  for (const edge of flow.edges) {
    if (edge.source === edge.target) {
      errors.push({
        code: 'SELF_LOOP',
        message: `Edge '${edge.id}' is a self-loop (source === target)`,
        edgeId: edge.id,
        severity: 'error',
      });
    }
  }

  // 4. No duplicate IDs
  const nodeIdsList = flow.nodes.map(n => n.id);
  const duplicateNodeIds = nodeIdsList.filter((id, index) => nodeIdsList.indexOf(id) !== index);
  if (duplicateNodeIds.length > 0) {
    errors.push({
      code: 'DUPLICATE_NODE_IDS',
      message: `Duplicate node IDs found: ${[...new Set(duplicateNodeIds)].join(', ')}`,
      severity: 'error',
    });
  }

  const edgeIdsList = flow.edges.map(e => e.id);
  const duplicateEdgeIds = edgeIdsList.filter((id, index) => edgeIdsList.indexOf(id) !== index);
  if (duplicateEdgeIds.length > 0) {
    errors.push({
      code: 'DUPLICATE_EDGE_IDS',
      message: `Duplicate edge IDs found: ${[...new Set(duplicateEdgeIds)].join(', ')}`,
      severity: 'error',
    });
  }

  // 5. Valid node configs
  for (const node of flow.nodes) {
    const configValidation = validateNodeConfig(node);
    if (!configValidation.valid) {
      errors.push({
        code: 'INVALID_NODE_CONFIG',
        message: configValidation.error || 'Node config is invalid',
        nodeId: node.id,
        severity: 'error',
      });
    }
  }

  // Additional warnings for best practices
  const actionNodes = flow.nodes.filter((n) => n.type === 'ACTION');
  const conditionNodes = flow.nodes.filter((n) => n.type === 'CONDITION');
  const delayNodes = flow.nodes.filter((n) => n.type === 'DELAY');
  
  if (flow.nodes.length === 0) {
    errors.push({
      code: 'EMPTY_FLOW',
      message: 'Flow contains no nodes',
      severity: 'error',
    });
  }

  if (flow.nodes.length === 1 && triggerNodes.length === 1) {
    errors.push({
      code: 'NO_ACTIONS',
      message: 'Flow only contains a trigger node with no subsequent actions',
      severity: 'warning',
    });
  }

  const disconnectedNodes = flow.nodes.filter((node) => {
    const hasIncoming = flow.edges.some((e) => e.target === node.id);
    const hasOutgoing = flow.edges.some((e) => e.source === node.id);
    return node.type !== 'TRIGGER' && !hasIncoming && !hasOutgoing;
  });

  for (const node of disconnectedNodes) {
    errors.push({
      code: 'DISCONNECTED_NODE',
      message: `Node '${node.label}' is not connected to any other nodes and will never execute`,
      nodeId: node.id,
      severity: 'error',
    });
  }

  const reachableNodes = new Set<string>();
  function markReachable(nodeId: string) {
    if (reachableNodes.has(nodeId)) return;
    reachableNodes.add(nodeId);
    const outgoing = flow.edges.filter((e) => e.source === nodeId);
    for (const edge of outgoing) {
      markReachable(edge.target);
    }
  }

  for (const trigger of triggerNodes) {
    markReachable(trigger.id);
  }

  const unreachableNodes = flow.nodes.filter(
    (node) => node.type !== 'TRIGGER' && !reachableNodes.has(node.id)
  );

  for (const node of unreachableNodes) {
    errors.push({
      code: 'UNREACHABLE_NODE',
      message: `Node '${node.label}' cannot be reached from any trigger and will never execute`,
      nodeId: node.id,
      severity: 'error',
    });
  }

  for (const node of flow.nodes) {
    if (node.type !== 'TRIGGER') {
      const hasIncoming = flow.edges.some((e) => e.target === node.id);
      if (!hasIncoming) {
        errors.push({
          code: 'NO_INCOMING_EDGE',
          message: `Node '${node.label}' has no incoming connections`,
          nodeId: node.id,
          severity: 'error',
        });
      }
    }
    
    if (node.type !== 'ACTION' && node.type !== 'DELAY') {
      const hasOutgoing = flow.edges.some((e) => e.source === node.id);
      if (!hasOutgoing) {
        errors.push({
          code: 'NO_OUTGOING_EDGE',
          message: `Node '${node.label}' has no outgoing connections and flow will end prematurely`,
          nodeId: node.id,
          severity: 'error',
        });
      }
    }
  }

  for (const condNode of conditionNodes) {
    const outgoingEdges = flow.edges.filter((e) => e.source === condNode.id);
    if (outgoingEdges.length < 2) {
      errors.push({
        code: 'INCOMPLETE_CONDITION',
        message: `Condition node '${condNode.label}' must have at least 2 outgoing paths (true/false branches)`,
        nodeId: condNode.id,
        severity: 'error',
      });
    }

    const truePath = outgoingEdges.find((e) => e.conditionPath === 'true');
    const falsePath = outgoingEdges.find((e) => e.conditionPath === 'false');
    
    if (!truePath) {
      errors.push({
        code: 'MISSING_TRUE_PATH',
        message: `Condition node '${condNode.label}' is missing the 'true' branch`,
        nodeId: condNode.id,
        severity: 'error',
      });
    }
    
    if (!falsePath) {
      errors.push({
        code: 'MISSING_FALSE_PATH',
        message: `Condition node '${condNode.label}' is missing the 'false' branch`,
        nodeId: condNode.id,
        severity: 'error',
      });
    }
  }

  const reachableActions = actionNodes.filter((node) => reachableNodes.has(node.id));
  if (reachableActions.length === 0 && actionNodes.length > 0) {
    errors.push({
      code: 'NO_REACHABLE_ACTIONS',
      message: 'Flow has action nodes but none can be reached from triggers',
      severity: 'error',
    });
  }

  if (triggerNodes.length > 0 && actionNodes.length === 0) {
    errors.push({
      code: 'NO_ACTION_NODES',
      message: 'Flow has no action nodes - add at least one action to perform',
      severity: 'error',
    });
  }

  const valid = errors.every((e) => e.severity !== 'error');
  return { valid, errors };
}

