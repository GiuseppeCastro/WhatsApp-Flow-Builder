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

  if (!expanded) {
    return (
      <div className="fixed bottom-4 right-4">
        <button
          onClick={() => setExpanded(true)}
          className="bg-purple-600 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-purple-700"
        >
          🚀 Execution Console ({runs.length})
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
        {/* Trigger Section */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium mb-3">Trigger Flow</h4>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trigger Type
              </label>
              <select
                value={triggerType}
                onChange={(e) => setTriggerType(e.target.value as TriggerType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="NEW_ORDER">New Order</option>
                <option value="ABANDONED_CHECKOUT">Abandoned Checkout</option>
                <option value="CUSTOMER_REGISTRATION">Customer Registration</option>
                <option value="ORDER_STATUS_CHANGE">Order Status Change</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Context (JSON)
              </label>
              <textarea
                value={contextJson}
                onChange={(e) => setContextJson(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-xs"
              />
            </div>

            <button
              onClick={handleTrigger}
              disabled={triggering}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
            >
              {triggering ? 'Triggering...' : 'Trigger Run'}
            </button>
          </div>
        </div>

        {/* Runs List */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium mb-3">Recent Runs ({runs.length})</h4>
          
          {runs.length === 0 ? (
            <p className="text-sm text-gray-500">No runs yet</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {runs.slice().reverse().map((run) => (
                <div
                  key={run.id}
                  onClick={() => setSelectedRun(run)}
                  className={`p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                    selectedRun?.id === run.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-gray-600">{run.id}</span>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        run.status === 'COMPLETED'
                          ? 'bg-green-100 text-green-700'
                          : run.status === 'FAILED'
                          ? 'bg-red-100 text-red-700'
                          : run.status === 'RUNNING'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {run.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(run.startedAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Run Logs */}
        {selectedRun && (
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium mb-3">
              Logs for {selectedRun.id}
            </h4>
            
            <div className="space-y-2 max-h-80 overflow-y-auto bg-gray-50 p-3 rounded">
              {selectedRun.logs.map((log, idx) => (
                <div key={idx} className="text-xs font-mono">
                  <span className="text-gray-500">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>{' '}
                  <span
                    className={`font-semibold ${
                      log.level === 'ERROR'
                        ? 'text-red-600'
                        : log.level === 'WARN'
                        ? 'text-yellow-600'
                        : 'text-blue-600'
                    }`}
                  >
                    [{log.level}]
                  </span>{' '}
                  {log.message}
                  {log.payload && (
                    <pre className="mt-1 text-gray-600 whitespace-pre-wrap break-all">
                      {JSON.stringify(log.payload, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>

            {selectedRun.error && (
              <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                <strong>Error:</strong> {selectedRun.error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
