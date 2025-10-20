import type { Flow, ExecutionHistory } from '../types/schemas';

class MemoryStore {
  private flows = new Map<string, Flow>();
  private executions = new Map<string, ExecutionHistory[]>();

  // Flow operations
  getAllFlows(activeFilter?: boolean): Flow[] {
    let flows = Array.from(this.flows.values());
    if (activeFilter !== undefined) {
      flows = flows.filter((f) => f.active === activeFilter);
    }
    return flows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  getFlowById(id: string): Flow | undefined {
    return this.flows.get(id);
  }

  createFlow(flow: Flow): void {
    this.flows.set(flow.id, flow);
  }

  updateFlow(id: string, flow: Flow): void {
    this.flows.set(id, flow);
  }

  deleteFlow(id: string): boolean {
    return this.flows.delete(id);
  }

  // Execution operations
  getExecutionsByFlowId(flowId: string): ExecutionHistory[] {
    return this.executions.get(flowId) ?? [];
  }

  getExecutionById(runId: string): ExecutionHistory | undefined {
    for (const runs of this.executions.values()) {
      const run = runs.find((r) => r.id === runId);
      if (run) return run;
    }
    return undefined;
  }

  createExecution(execution: ExecutionHistory): void {
    const existing = this.executions.get(execution.flowId) ?? [];
    existing.push(execution);
    this.executions.set(execution.flowId, existing);
  }

  updateExecution(runId: string, execution: ExecutionHistory): void {
    for (const [flowId, runs] of this.executions.entries()) {
      const index = runs.findIndex((r) => r.id === runId);
      if (index !== -1) {
        runs[index] = execution;
        this.executions.set(flowId, runs);
        return;
      }
    }
  }
}

export const memoryStore = new MemoryStore();
