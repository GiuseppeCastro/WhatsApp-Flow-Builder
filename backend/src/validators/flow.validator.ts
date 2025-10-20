import { FlowSchema } from '../types/schemas';
import type { Flow, ValidationResult, ValidationError } from '../types/schemas';
import { validateNodeConfig } from './node-config.validator';

export function validateFlowStructure(flow: Flow): ValidationResult {
  const errors: ValidationError[] = [];

  const zodResult = FlowSchema.safeParse(flow);
  if (!zodResult.success) {
    errors.push({
      code: 'SCHEMA_INVALID',
      message: `Schema validation failed: ${zodResult.error.message}`,
      severity: 'error',
    });
    return { valid: false, errors };
  }

  const triggerNodes = flow.nodes.filter((n) => n.type === 'TRIGGER');
  if (triggerNodes.length === 0) {
    errors.push({
      code: 'NO_TRIGGER',
      message: 'Flow must have at least one TRIGGER node',
      severity: 'error',
    });
  }

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

  const valid = errors.every((e) => e.severity !== 'error');
  return { valid, errors };
}