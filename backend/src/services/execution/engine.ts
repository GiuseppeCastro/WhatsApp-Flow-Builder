import type { Flow, Node, ExecutionHistory, LogEntry, TriggerPayload } from '../../types/schemas';
import { generateId } from '../../utils/ids';
import { memoryStore } from '../../repositories/memoryStore';
import { stateStore } from './state-store';
import { scheduler } from './scheduler';
import { evaluateCondition } from './evaluators';
import { mocksService } from '../mocks.service';
import { logger } from '../../logger/logger';

export class ExecutionEngine {
  async startRun(flow: Flow, payload: TriggerPayload): Promise<string> {
    const runId = generateId('run');
    const now = new Date().toISOString();

    const execution: ExecutionHistory = {
      id: runId,
      flowId: flow.id,
      startedAt: now,
      status: 'PENDING',
      logs: [],
      currentNodeIds: [],
    };

    stateStore.set(runId, execution);
    memoryStore.createExecution(execution);

    this.addLog(runId, 'INFO', `Starting run for flow: ${flow.name}`);

    this.executeFlow(runId, flow, payload).catch((error) => {
      logger.error('Execution error:', error);
      this.failRun(runId, error instanceof Error ? error.message : 'Unknown error');
    });

    return runId;
  }

  private async executeFlow(runId: string, flow: Flow, payload: TriggerPayload): Promise<void> {
    this.updateStatus(runId, 'RUNNING');

    const triggerNodes = flow.nodes.filter((n: { type: string }) => n.type === 'TRIGGER');
    if (triggerNodes.length === 0) {
      this.failRun(runId, 'No TRIGGER node found');
      return;
    }

    const triggerNode = triggerNodes[0];
    this.addLog(runId, 'INFO', `Triggered by: ${triggerNode.label}`, { payload });

    const successors = this.getSuccessors(flow, triggerNode.id);
    
    for (const nodeId of successors) {
      await this.processNode(runId, flow, nodeId, payload.context);
    }

    this.completeRun(runId);
  }

  private async processNode(
    runId: string,
    flow: Flow,
    nodeId: string,
    context: Record<string, unknown>
  ): Promise<void> {
    const node = flow.nodes.find((n: { id: string }) => n.id === nodeId);
    if (!node) {
      this.addLog(runId, 'ERROR', `Node ${nodeId} not found`);
      return;
    }

    this.addLog(runId, 'INFO', `Processing node: ${node.label} (${node.type})`);

    try {
      switch (node.type) {
        case 'ACTION':
          await this.executeAction(runId, node, context);
          break;

        case 'CONDITION':
          await this.executeCondition(runId, flow, node, context);
          return;

        case 'DELAY':
          await this.executeDelay(runId, flow, node, context);
          return;

        case 'END':
          this.addLog(runId, 'INFO', `Reached END node: ${node.label}`);
          return;

        case 'TRIGGER':
          break;
      }
      const successors = this.getSuccessors(flow, nodeId);
      for (const nextId of successors) {
        await this.processNode(runId, flow, nextId, context);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.addLog(runId, 'ERROR', `Error in node ${node.label}: ${message}`);
      throw error;
    }
  }

  private async executeAction(
    runId: string,
    node: Node,
    context: Record<string, unknown>
  ): Promise<void> {
    const config = node.config as { toField?: string; body?: string; template?: string } | undefined;
    
    if (!config || !config.toField) {
      this.addLog(runId, 'WARN', `ACTION node missing toField config`);
      return;
    }

    const result = await mocksService.sendWhatsAppMessage({
      to: config.toField,
      body: config.body || 'Default message',
      template: config.template,
    });

    this.addLog(runId, 'INFO', `Sent message via WhatsApp`, { result });
  }

  private async executeCondition(
    runId: string,
    flow: Flow,
    node: Node,
    context: Record<string, unknown>
  ): Promise<void> {
    const config = node.config as { logic?: any } | undefined;
    
    if (!config || !config.logic) {
      this.addLog(runId, 'ERROR', `CONDITION node missing logic config`);
      return;
    }

    const result = evaluateCondition(config.logic, context);
    this.addLog(runId, 'INFO', `Condition evaluated to: ${result}`);

    const outgoingEdges = flow.edges.filter((e: { source: string }) => e.source === node.id);
    const conditionValue = result ? 'yes' : 'no';
    const matchingEdges = outgoingEdges.filter(
      (e: { conditionPath?: string; sourceHandle?: string }) => 
        e.conditionPath === String(result) || 
        e.conditionPath === conditionValue ||
        e.sourceHandle === conditionValue
    );

    for (const edge of matchingEdges) {
      await this.processNode(runId, flow, edge.target, context);
    }
  }

  private async executeDelay(
    runId: string,
    flow: Flow,
    node: Node,
    context: Record<string, unknown>
  ): Promise<void> {
    const config = node.config as { delay?: { amount: number; unit: string } } | undefined;
    
    if (!config || !config.delay) {
      this.addLog(runId, 'ERROR', `DELAY node missing delay config`);
      return;
    }

    const { amount, unit } = config.delay;
    const delayMs = this.convertToMilliseconds(amount, unit);

    this.addLog(runId, 'INFO', `Delaying for ${amount} ${unit} (${delayMs}ms)`);

    scheduler.schedule(runId, node.id, delayMs, () => {
      this.addLog(runId, 'INFO', `Delay completed for ${node.label}`);
      
      const successors = this.getSuccessors(flow, node.id);
      for (const nextId of successors) {
        this.processNode(runId, flow, nextId, context).catch((error) => {
          logger.error('Error processing delayed node:', error);
        });
      }
    });
  }

  private convertToMilliseconds(amount: number, unit: string): number {
    const multipliers: Record<string, number> = {
      seconds: 1000,
      minutes: 60 * 1000,
      hours: 60 * 60 * 1000,
      days: 24 * 60 * 60 * 1000,
    };
    return (multipliers[unit] || 1000) * amount;
  }

  private getSuccessors(flow: Flow, nodeId: string): string[] {
    return flow.edges
      .filter((e: { source: string }) => e.source === nodeId)
      .map((e: { target: string }) => e.target);
  }

  private addLog(runId: string, level: 'INFO' | 'WARN' | 'ERROR', message: string, payload?: unknown): void {
    const execution = stateStore.get(runId);
    if (!execution) return;

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      payload,
    };

    execution.logs.push(logEntry);
    stateStore.set(runId, execution);
    memoryStore.updateExecution(runId, execution);
  }

  private updateStatus(runId: string, status: 'RUNNING' | 'COMPLETED' | 'FAILED'): void {
    stateStore.update(runId, { status });
    const execution = stateStore.get(runId);
    if (execution) {
      memoryStore.updateExecution(runId, execution);
    }
  }

  private completeRun(runId: string): void {
    this.addLog(runId, 'INFO', 'Run completed successfully');
    stateStore.update(runId, {
      status: 'COMPLETED',
      finishedAt: new Date().toISOString(),
    });
    const execution = stateStore.get(runId);
    if (execution) {
      memoryStore.updateExecution(runId, execution);
    }
  }

  private failRun(runId: string, error: string): void {
    this.addLog(runId, 'ERROR', `Run failed: ${error}`);
    stateStore.update(runId, {
      status: 'FAILED',
      finishedAt: new Date().toISOString(),
      error,
    });
    const execution = stateStore.get(runId);
    if (execution) {
      memoryStore.updateExecution(runId, execution);
    }
  }
}

export const executionEngine = new ExecutionEngine();
