'use client';

import { useState, useEffect } from 'react';
import type { ExecutionHistory, TriggerType } from '../types/schemas';
import { api } from '@/lib/api';
import { toast } from '@/lib/toasts';

interface ExecutionConsoleProps {
  flowId: string;
}

export default function ExecutionConsole({ flowId }: ExecutionConsoleProps): JSX.Element {
  const [runs, setRuns] = useState<ExecutionHistory[]>([]);
  const [selectedRun, setSelectedRun] = useState<ExecutionHistory | null>(null);
  const [triggerType, setTriggerType] = useState<TriggerType>('NEW_ORDER');
  const [contextJson, setContextJson] = useState('{\n  "order": {\n    "total": 150\n  }\n}');
  const [triggering, setTriggering] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    loadRuns();
    const interval = setInterval(loadRuns, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, [flowId]);

  async function loadRuns(): Promise<void> {
    try {
      const data = await api.getExecutionsByFlowId(flowId);
      setRuns(data);
      
      // Update selected run if viewing one
      if (selectedRun) {
        const updated = data.find((r) => r.id === selectedRun.id);
        if (updated) {
          setSelectedRun(updated);
        }
      }
    } catch (error) {
      // Silently fail on polling errors
    }
  }

  async function handleTrigger(): Promise<void> {
    let context;
    try {
      context = JSON.parse(contextJson);
    } catch {
      toast.error('Invalid JSON in context');
      return;
    }

    setTriggering(true);
    try {
      const result = await api.triggerFlow(flowId, {
        type: triggerType,
        context,
      });
      toast.success(`Triggered! Run ID: ${result.runId}`);
      loadRuns();
    } catch (error: any) {
      toast.error(error.message || 'Failed to trigger');
    } finally {
      setTriggering(false);
    }
  }

  const getStatusBadge = () => {
    if (runs.length === 0) return null;
    const runningCount = runs.filter(r => r.status === 'RUNNING').length;
    const failedCount = runs.filter(r => r.status === 'FAILED').length;
    
    if (runningCount > 0) {
      return <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">Running: {runningCount}</span>;
    }
    if (failedCount > 0) {
      return <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">Failed: {failedCount}</span>;
    }
    return null;
  };

  if (!expanded) {
    return (
      <div className="fixed bottom-4 right-4">
        <button
          onClick={() => setExpanded(true)}
          className="bg-purple-600 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-purple-700 flex items-center gap-2"
        >
          <span>Execution Console</span>
          <span className="px-2 py-0.5 bg-purple-700 rounded text-sm">{runs.length}</span>
          {getStatusBadge()}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 w-1/3 h-2/3 bg-white border-l border-t border-gray-200 shadow-2xl flex flex-col">
      <div className="bg-purple-600 text-white px-4 py-3 flex justify-between items-center">
        <h3 className="font-semibold">Execution Console</h3>
        <button onClick={() => setExpanded(false)} className="text-white hover:text-gray-200">
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h4 className="font-semibold mb-3 text-gray-800">Trigger Flow Execution</h4>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trigger Type
              </label>
              <select
                value={triggerType}
                onChange={(e) => setTriggerType(e.target.value as TriggerType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="NEW_ORDER">New Order</option>
                <option value="ABANDONED_CHECKOUT">Abandoned Checkout</option>
                <option value="CUSTOMER_REGISTRATION">Customer Registration</option>
                <option value="ORDER_STATUS_CHANGE">Order Status Change</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Execution Context (JSON)
              </label>
              <textarea
                value={contextJson}
                onChange={(e) => setContextJson(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder='{"key": "value"}'
              />
              <p className="text-xs text-gray-500 mt-1">
                Provide context data that will be available during flow execution
              </p>
            </div>

            <button
              onClick={handleTrigger}
              disabled={triggering}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {triggering ? 'Triggering Flow...' : 'Execute Flow'}
            </button>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-800">Execution History</h4>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
              {runs.length} total run{runs.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          {runs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm mb-1">No executions yet</p>
              <p className="text-xs">Trigger a flow to see execution history</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {runs.slice().reverse().map((run) => {
                const duration = run.finishedAt 
                  ? Math.round((new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime()) / 1000)
                  : null;
                
                return (
                  <div
                    key={run.id}
                    onClick={() => setSelectedRun(run)}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedRun?.id === run.id 
                        ? 'border-purple-500 bg-purple-50 shadow-sm' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-gray-600">{run.id}</span>
                      <span
                        className={`text-xs px-2 py-1 rounded font-medium ${
                          run.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : run.status === 'FAILED'
                            ? 'bg-red-100 text-red-700 border border-red-200'
                            : run.status === 'RUNNING'
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'bg-gray-100 text-gray-700 border border-gray-200'
                        }`}
                      >
                        {run.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{new Date(run.startedAt).toLocaleString()}</span>
                      {duration !== null && (
                        <span className="text-gray-400">{duration}s</span>
                      )}
                    </div>
                    {run.logs.length > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        {run.logs.length} log entr{run.logs.length !== 1 ? 'ies' : 'y'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {selectedRun && (
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-800">Execution Details</h4>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs px-2 py-1 rounded font-medium ${
                    selectedRun.status === 'COMPLETED'
                      ? 'bg-green-100 text-green-700'
                      : selectedRun.status === 'FAILED'
                      ? 'bg-red-100 text-red-700'
                      : selectedRun.status === 'RUNNING'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {selectedRun.status}
                </span>
                <button
                  onClick={() => setSelectedRun(null)}
                  className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="mb-3 text-xs space-y-1 bg-gray-50 p-3 rounded">
              <div className="flex justify-between">
                <span className="text-gray-600">Run ID:</span>
                <span className="font-mono text-gray-800">{selectedRun.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Started:</span>
                <span className="text-gray-800">{new Date(selectedRun.startedAt).toLocaleString()}</span>
              </div>
              {selectedRun.finishedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Finished:</span>
                  <span className="text-gray-800">{new Date(selectedRun.finishedAt).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Log Entries:</span>
                <span className="text-gray-800">{selectedRun.logs.length}</span>
              </div>
            </div>
            
            <div className="space-y-1 max-h-80 overflow-y-auto bg-gray-900 p-3 rounded">
              {selectedRun.logs.length === 0 ? (
                <p className="text-xs text-gray-400">No logs available</p>
              ) : (
                selectedRun.logs.map((log, idx) => {
                  const payloadStr = log.payload ? JSON.stringify(log.payload, null, 2) : null;
                  
                  return (
                    <div key={idx} className="text-xs font-mono leading-relaxed">
                      <span className="text-gray-400">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      {' '}
                      <span
                        className={`font-semibold ${
                          log.level === 'ERROR'
                            ? 'text-red-400'
                            : log.level === 'WARN'
                            ? 'text-yellow-400'
                            : 'text-green-400'
                        }`}
                      >
                        [{log.level}]
                      </span>
                      {' '}
                      <span className="text-gray-200">{log.message}</span>
                      {payloadStr && (
                        <pre className="mt-1 ml-4 text-gray-400 whitespace-pre-wrap break-all">
                          {payloadStr}
                        </pre>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {selectedRun.error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                <div className="flex items-start gap-2">
                  <span className="text-xs font-semibold bg-red-200 text-red-800 px-2 py-1 rounded">
                    ERROR
                  </span>
                  <div className="flex-1">
                    <p className="text-sm text-red-700 font-medium">Execution Failed</p>
                    <p className="text-sm text-red-600 mt-1">{selectedRun.error}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
