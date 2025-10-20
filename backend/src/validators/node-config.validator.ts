import { z } from 'zod';
import type { Node } from '../types/schemas';

export const DelayConfigSchema = z.object({
  delay: z.object({
    amount: z.number().int().positive().max(365),
    unit: z.enum(['seconds', 'minutes', 'hours', 'days']),
  }),
});

export const SendMessageConfigSchema = z.object({
  toField: z.string().min(1),
  template: z.string().optional(),
  body: z.string().optional(),
});

export const ActionConfigSchema = z.union([
  SendMessageConfigSchema,
  z.record(z.unknown()),
]);

export const ConditionConfigSchema = z.object({
  logic: z.object({
    type: z.enum(['AND', 'OR']),
    clauses: z.array(
      z.object({
        left: z.string(),
        op: z.enum(['equals', 'contains', 'greater_than', 'less_than']),
        right: z.union([z.string(), z.number()]),
      })
    ),
  }),
});

export function validateNodeConfig(node: Node): {
  valid: boolean;
  error?: string;
} {
  try {
    switch (node.type) {
      case 'DELAY': {
        if (!node.config) {
          return { valid: false, error: 'DELAY node requires config with delay settings' };
        }
        DelayConfigSchema.parse(node.config);
        return { valid: true };
      }

      case 'ACTION': {
        if (!node.config) {
          return { valid: false, error: 'ACTION node requires config with action details' };
        }
        ActionConfigSchema.parse(node.config);
        return { valid: true };
      }

      case 'CONDITION': {
        if (!node.config || !node.config.logic) {
          return { valid: false, error: 'CONDITION node requires config.logic' };
        }
        ConditionConfigSchema.parse(node.config);
        return { valid: true };
      }

      case 'TRIGGER':
      case 'END':
        return { valid: true };

      default:
        return { valid: true };
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0]?.message || 'Config validation failed' };
    }
    return { valid: false, error: 'Unknown validation error' };
  }
}
