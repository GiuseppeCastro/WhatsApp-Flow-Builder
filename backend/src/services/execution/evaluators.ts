import type { ConditionLogic, ConditionClause } from '../../types/schemas';

/**
 * Evaluate a condition logic against a context object
 */
export function evaluateCondition(
  logic: ConditionLogic,
  context: Record<string, unknown>
): boolean {
  const results = logic.clauses.map((clause: ConditionClause) => evaluateClause(clause, context));

  if (logic.type === 'AND') {
    return results.every((r: boolean) => r === true);
  } else {
    // OR
    return results.some((r: boolean) => r === true);
  }
}

function evaluateClause(clause: ConditionClause, context: Record<string, unknown>): boolean {
  const leftValue = getNestedValue(context, clause.left);
  const rightValue = clause.right;

  switch (clause.op) {
    case 'equals':
      return leftValue === rightValue;

    case 'contains':
      if (typeof leftValue === 'string' && typeof rightValue === 'string') {
        return leftValue.includes(rightValue);
      }
      return false;

    case 'greater_than':
      if (typeof leftValue === 'number' && typeof rightValue === 'number') {
        return leftValue > rightValue;
      }
      return false;

    case 'less_than':
      if (typeof leftValue === 'number' && typeof rightValue === 'number') {
        return leftValue < rightValue;
      }
      return false;

    default:
      return false;
  }
}

/**
 * Get nested value from object using dot notation
 * e.g. "order.total" from { order: { total: 100 } }
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return current;
}
