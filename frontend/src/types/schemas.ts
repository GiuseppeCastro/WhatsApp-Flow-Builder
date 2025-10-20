import { z } from 'zod';

export const NodeTypeSchema = z.enum(['TRIGGER', 'ACTION', 'CONDITION', 'DELAY', 'END']);
export type NodeType = z.infer<typeof NodeTypeSchema>;

export const OperatorSchema = z.enum([
  'equals',
  'contains',
  'greater_than',
  'less_than',
]);
export type Operator = z.infer<typeof OperatorSchema>;

export const RunStatusSchema = z.enum(['PENDING', 'RUNNING', 'COMPLETED', 'FAILED']);
export type RunStatus = z.infer<typeof RunStatusSchema>;

export const TriggerTypeSchema = z.enum([
  'NEW_ORDER',
  'ABANDONED_CHECKOUT',
  'CUSTOMER_REGISTRATION',
  'ORDER_STATUS_CHANGE',
]);
export type TriggerType = z.infer<typeof TriggerTypeSchema>;

export const LogLevelSchema = z.enum(['INFO', 'WARN', 'ERROR']);
export type LogLevel = z.infer<typeof LogLevelSchema>;

export const ConditionClauseSchema = z.object({
  left: z.string(),
  op: OperatorSchema,
  right: z.union([z.string(), z.number()]),
});
export type ConditionClause = z.infer<typeof ConditionClauseSchema>;

export const ConditionLogicSchema = z.object({
  type: z.enum(['AND', 'OR']),
  clauses: z.array(ConditionClauseSchema),
});
export type ConditionLogic = z.infer<typeof ConditionLogicSchema>;

export const NodeSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  type: NodeTypeSchema,
  config: z.record(z.unknown()).optional(),
});
export type Node = z.infer<typeof NodeSchema>;

export const EdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  label: z.string().optional(),
  conditionPath: z.string().optional(),
});
export type Edge = z.infer<typeof EdgeSchema>;

export const FlowSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  active: z.boolean(),
  nodes: z.array(NodeSchema),
  edges: z.array(EdgeSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Flow = z.infer<typeof FlowSchema>;

export const LogEntrySchema = z.object({
  timestamp: z.string().datetime(),
  level: LogLevelSchema,
  message: z.string(),
  payload: z.unknown().optional(),
});
export type LogEntry = z.infer<typeof LogEntrySchema>;

export const ExecutionHistorySchema = z.object({
  id: z.string().min(1),
  flowId: z.string().min(1),
  startedAt: z.string().datetime(),
  finishedAt: z.string().datetime().optional(),
  status: RunStatusSchema,
  logs: z.array(LogEntrySchema),
  currentNodeIds: z.array(z.string()).optional(),
  error: z.string().optional(),
});
export type ExecutionHistory = z.infer<typeof ExecutionHistorySchema>;

export const TriggerPayloadSchema = z.object({
  type: TriggerTypeSchema,
  context: z.record(z.unknown()),
});
export type TriggerPayload = z.infer<typeof TriggerPayloadSchema>;

export const ValidationErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  nodeId: z.string().optional(),
  edgeId: z.string().optional(),
  severity: z.enum(['error', 'warning']),
});
export type ValidationError = z.infer<typeof ValidationErrorSchema>;

export const ValidationResultSchema = z.object({
  valid: z.boolean(),
  errors: z.array(ValidationErrorSchema),
});
export type ValidationResult = z.infer<typeof ValidationResultSchema>;
