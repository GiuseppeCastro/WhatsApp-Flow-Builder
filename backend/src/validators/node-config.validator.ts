import { z } from 'zod';
import type { Node } from '../types/schemas';

export const DelayConfigSchema = z.object({
  delay: z.object({
    amount: z.number().int().positive().max(365).refine((val) => val > 0, {
      message: 'Delay amount must be greater than 0',
    }),
    unit: z.enum(['seconds', 'minutes', 'hours', 'days'], {
      errorMap: () => ({ message: 'Delay unit must be seconds, minutes, hours, or days' }),
    }),
  }).refine((data) => data.amount && data.unit, {
    message: 'Delay must have both amount and unit configured',
  }),
});

export const SendMessageConfigSchema = z.object({
  toField: z.string().min(1, 'Recipient field (toField) is required and cannot be empty'),
  template: z.string().optional(),
  body: z.string().min(1, 'Message body cannot be empty').optional(),
}).refine((data) => data.template || data.body, {
  message: 'ACTION node must have either a template or body configured',
});

export const ActionConfigSchema = SendMessageConfigSchema;

export const ConditionConfigSchema = z.object({
  logic: z.object({
    type: z.enum(['AND', 'OR'], {
      errorMap: () => ({ message: 'Condition logic type must be AND or OR' }),
    }),
    clauses: z.array(
      z.object({
        left: z.string().min(1, 'Left operand cannot be empty'),
        op: z.enum(['equals', 'contains', 'greater_than', 'less_than'], {
          errorMap: () => ({ message: 'Invalid operator' }),
        }),
        right: z.union([
          z.string().min(1, 'Right operand cannot be empty'),
          z.number()
        ]),
      })
    ).min(1, 'CONDITION node must have at least one clause'),
  }).refine((data) => data.clauses.length > 0, {
    message: 'CONDITION node must have at least one condition clause',
  }),
});

/**
 * Validate node config based on node type
 */
export function validateNodeConfig(node: Node): {
  valid: boolean;
  error?: string;
} {
  try {
    switch (node.type) {
      case 'DELAY': {
        if (!node.config) {
          return { valid: false, error: `DELAY node '${node.label}' is missing configuration` };
        }
        if (!node.config.delay) {
          return { valid: false, error: `DELAY node '${node.label}' requires delay configuration` };
        }
        DelayConfigSchema.parse(node.config);
        return { valid: true };
      }

      case 'ACTION': {
        if (!node.config) {
          return { valid: false, error: `ACTION node '${node.label}' is missing configuration` };
        }
        if (!node.config.toField || (typeof node.config.toField === 'string' && node.config.toField.trim() === '')) {
          return { valid: false, error: `ACTION node '${node.label}' requires recipient field (toField)` };
        }
        const hasTemplate = node.config.template && typeof node.config.template === 'string' && node.config.template.trim() !== '';
        const hasBody = node.config.body && typeof node.config.body === 'string' && node.config.body.trim() !== '';
        if (!hasTemplate && !hasBody) {
          return { valid: false, error: `ACTION node '${node.label}' must have either template or body configured` };
        }
        ActionConfigSchema.parse(node.config);
        return { valid: true };
      }

      case 'CONDITION': {
        if (!node.config) {
          return { valid: false, error: `CONDITION node '${node.label}' is missing configuration` };
        }
        const logic = node.config.logic as any;
        if (!logic) {
          return { valid: false, error: `CONDITION node '${node.label}' requires logic configuration` };
        }
        if (!logic.type) {
          return { valid: false, error: `CONDITION node '${node.label}' requires logic type (AND/OR)` };
        }
        if (!logic.clauses || !Array.isArray(logic.clauses) || logic.clauses.length === 0) {
          return { valid: false, error: `CONDITION node '${node.label}' requires at least one condition clause` };
        }
        for (let i = 0; i < logic.clauses.length; i++) {
          const clause = logic.clauses[i];
          if (!clause.left || (typeof clause.left === 'string' && clause.left.trim() === '')) {
            return { valid: false, error: `CONDITION node '${node.label}' clause ${i + 1} has empty left operand` };
          }
          if (!clause.op) {
            return { valid: false, error: `CONDITION node '${node.label}' clause ${i + 1} has no operator` };
          }
          if (clause.right === undefined || clause.right === null || (typeof clause.right === 'string' && clause.right.trim() === '')) {
            return { valid: false, error: `CONDITION node '${node.label}' clause ${i + 1} has empty right operand` };
          }
        }
        ConditionConfigSchema.parse(node.config);
        return { valid: true };
      }

      case 'TRIGGER': {
        return { valid: true };
      }

      default:
        return { valid: true };
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      const path = firstError?.path.join('.') || '';
      const message = firstError?.message || 'Config validation failed';
      return { valid: false, error: `Node '${node.label}' ${path ? `field '${path}'` : ''}: ${message}` };
    }
    return { valid: false, error: `Node '${node.label}' has invalid configuration` };
  }
}
