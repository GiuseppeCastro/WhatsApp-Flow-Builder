import type { Flow } from '../types/schemas';
import { memoryStore } from '../repositories/memoryStore';
import { validateFlowStructure } from '../validators/flow.validator';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { generateId } from '../utils/ids';

export class FlowsService {
  getAllFlows(activeFilter?: boolean): Flow[] {
    return memoryStore.getAllFlows(activeFilter);
  }

  getFlowById(id: string): Flow {
    const flow = memoryStore.getFlowById(id);
    if (!flow) {
      throw new NotFoundError(`Flow with id '${id}' not found`);
    }
    return flow;
  }

  createFlow(data: { name: string }): Flow {
    const now = new Date().toISOString();
    const flow: Flow = {
      id: generateId('flow'),
      name: data.name,
      active: false,
      nodes: [],
      edges: [],
      createdAt: now,
      updatedAt: now,
    };
    memoryStore.createFlow(flow);
    return flow;
  }

  updateFlow(id: string, updates: Partial<Flow>): Flow {
    const existing = this.getFlowById(id);
    const updated: Flow = {
      ...existing,
      ...updates,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };

    memoryStore.updateFlow(id, updated);
    return updated;
  }

  deleteFlow(id: string): void {
    const deleted = memoryStore.deleteFlow(id);
    if (!deleted) {
      throw new NotFoundError(`Flow with id '${id}' not found`);
    }
  }

  activateFlow(id: string): Flow {
    const flow = this.getFlowById(id);
    const validation = validateFlowStructure(flow);
    const hasErrors = validation.errors.some((e) => e.severity === 'error');
    if (hasErrors) {
      throw new BadRequestError('Cannot activate flow with validation errors', validation.errors);
    }
    return this.updateFlow(id, { active: true });
  }

  deactivateFlow(id: string): Flow {
    return this.updateFlow(id, { active: false });
  }

  validateFlow(id: string): ReturnType<typeof validateFlowStructure> {
    const flow = this.getFlowById(id);
    return validateFlowStructure(flow);
  }

  getFlowAnalytics(id: string): { runs: number; lastRunAt?: string } {
    this.getFlowById(id); // ensure exists
    const executions = memoryStore.getExecutionsByFlowId(id);
    return {
      runs: executions.length,
      lastRunAt: executions.length > 0 ? executions[executions.length - 1]?.startedAt : undefined,
    };
  }
}

export const flowsService = new FlowsService();
