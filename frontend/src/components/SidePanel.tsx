import { useState, useEffect } from 'react';
import type { Node, Edge } from '../types/schemas';

interface SidePanelProps {
  selectedNode: Node | null;
  selectedEdge: Edge | null;
  onUpdateNode: (node: Node) => void;
  onUpdateEdge: (edge: Edge) => void;
  onDelete: () => void;
}

export default function SidePanel({
  selectedNode,
  selectedEdge,
  onUpdateNode,
  onUpdateEdge,
  onDelete,
}: SidePanelProps): JSX.Element {
  const [label, setLabel] = useState('');
  const [nodeType, setNodeType] = useState('ACTION');
  const [advancedMode, setAdvancedMode] = useState(false);
  const [configText, setConfigText] = useState('{}');
  const [conditionPath, setConditionPath] = useState('');

  // TRIGGER fields
  const [triggerType, setTriggerType] = useState('NEW_ORDER');

  // ACTION fields
  const [actionType, setActionType] = useState('SEND_MESSAGE');
  const [toField, setToField] = useState('customer.phone');
  const [messageBody, setMessageBody] = useState('');
  const [template, setTemplate] = useState('');
  const [orderId, setOrderId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [noteText, setNoteText] = useState('');

  // CONDITION fields
  const [logicType, setLogicType] = useState('AND');
  const [conditions, setConditions] = useState<Array<{field: string, operator: string, value: string}>>([
    { field: '', operator: 'equals', value: '' }
  ]);

  // DELAY fields
  const [delayAmount, setDelayAmount] = useState('1');
  const [delayUnit, setDelayUnit] = useState('hours');

  // Update local state when selection changes
  useEffect(() => {
    if (selectedNode) {
      setLabel(selectedNode.label);
      setNodeType(selectedNode.type);
      const config = selectedNode.config || {};
      setConfigText(JSON.stringify(config, null, 2));

      // Load config based on type (use any for config access)
      const configData = config as any;
      
      if (selectedNode.type === 'TRIGGER') {
        setTriggerType(configData.triggerType || 'NEW_ORDER');
      } else if (selectedNode.type === 'ACTION') {
        setActionType(configData.actionType || 'SEND_MESSAGE');
        setToField(configData.toField || 'customer.phone');
        setMessageBody(configData.body || '');
        setTemplate(configData.template || '');
        setOrderId(configData.orderId || '');
        setCustomerId(configData.customerId || '');
        setNoteText(configData.note || '');
      } else if (selectedNode.type === 'CONDITION') {
        setLogicType(configData.logic?.type || 'AND');
        if (configData.logic?.clauses && configData.logic.clauses.length > 0) {
          setConditions(configData.logic.clauses.map((c: any) => ({
            field: c.left || '',
            operator: c.op || 'equals',
            value: String(c.right || '')
          })));
        }
      } else if (selectedNode.type === 'DELAY') {
        setDelayAmount(String(configData.amount || '1'));
        setDelayUnit(configData.unit || 'hours');
      }
    } else if (selectedEdge) {
      setLabel(selectedEdge.label || '');
      setConditionPath(selectedEdge.conditionPath || '');
    }
  }, [selectedNode, selectedEdge]);

  function buildConfigFromFields(): any {
    if (selectedNode?.type === 'TRIGGER') {
      return { triggerType };
    } else if (selectedNode?.type === 'ACTION') {
      const config: any = { actionType };
      if (actionType === 'SEND_MESSAGE') {
        config.toField = toField;
        config.body = messageBody;
        if (template) config.template = template;
      } else if (actionType === 'ADD_ORDER_NOTE') {
        config.orderId = orderId;
        config.note = noteText;
      } else if (actionType === 'ADD_CUSTOMER_NOTE') {
        config.customerId = customerId;
        config.note = noteText;
      }
      return config;
    } else if (selectedNode?.type === 'CONDITION') {
      return {
        logic: {
          type: logicType,
          clauses: conditions.filter(c => c.field && c.value).map(c => ({
            left: c.field,
            op: c.operator,
            right: isNaN(Number(c.value)) ? c.value : Number(c.value)
          }))
        }
      };
    } else if (selectedNode?.type === 'DELAY') {
      return {
        amount: Number(delayAmount),
        unit: delayUnit
      };
    }
    return {};
  }

  function handleNodeUpdate(): void {
    if (!selectedNode) return;

    let config;
    if (advancedMode) {
      try {
        config = JSON.parse(configText);
      } catch {
        alert('Invalid JSON in config');
        return;
      }
    } else {
      config = buildConfigFromFields();
    }

    onUpdateNode({
      ...selectedNode,
      label,
      type: nodeType as any,
      config,
    });
  }

  function handleEdgeUpdate(): void {
    if (!selectedEdge) return;

    onUpdateEdge({
      ...selectedEdge,
      label: label || undefined,
      conditionPath: conditionPath || undefined,
    });
  }

  function addCondition(): void {
    setConditions([...conditions, { field: '', operator: 'equals', value: '' }]);
  }

  function removeCondition(index: number): void {
    setConditions(conditions.filter((_, i) => i !== index));
  }

  function updateCondition(index: number, key: string, value: string): void {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], [key]: value };
    setConditions(newConditions);
  }

  if (!selectedNode && !selectedEdge) {
    return (
      <div className="w-96 bg-gradient-to-br from-gray-50 to-gray-100 border-l border-gray-200 p-6">
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
          <p className="text-gray-500 text-sm">Select a node or edge to edit</p>
        </div>
      </div>
    );
  }

  // Get color based on node type
  const getNodeColor = (type: string) => {
    const colors = {
      TRIGGER: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', accent: 'bg-purple-500' },
      ACTION: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', accent: 'bg-blue-500' },
      CONDITION: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', accent: 'bg-amber-500' },
      DELAY: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', accent: 'bg-green-500' },
    };
    return colors[type as keyof typeof colors] || colors.ACTION;
  };

  const nodeColor = selectedNode ? getNodeColor(selectedNode.type) : null;

  return (
    <div className={`w-96 border-l border-gray-200 overflow-y-auto ${selectedNode ? nodeColor?.bg : 'bg-white'}`}>
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          {selectedNode && <div className={`w-1 h-8 rounded ${nodeColor?.accent}`} />}
          <h2 className={`text-lg font-semibold ${selectedNode ? nodeColor?.text : 'text-gray-900'}`}>
            {selectedNode ? `Edit ${selectedNode.type}` : 'Edit Edge'}
          </h2>
        </div>

        {selectedNode && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Configuration Mode</span>
            <button
              onClick={() => setAdvancedMode(!advancedMode)}
              className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${
                advancedMode 
                  ? 'bg-gray-800 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {advancedMode ? '🔧 Advanced (JSON)' : '📝 Simple Mode'}
            </button>
          </div>
        )}
      </div>

      <div className="p-6">
        {selectedNode && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Label
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select
                value={nodeType}
                onChange={(e) => setNodeType(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                <option value="TRIGGER">🟣 TRIGGER</option>
                <option value="ACTION">🔵 ACTION</option>
                <option value="CONDITION">🟡 CONDITION</option>
                <option value="DELAY">🟢 DELAY</option>
              </select>
            </div>

          {/* Simple Mode - Forms for each node type */}
          {!advancedMode && selectedNode.type === 'TRIGGER' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trigger Type
              </label>
              <select
                value={triggerType}
                onChange={(e) => setTriggerType(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
              >
                <option value="NEW_ORDER">🛒 New Order</option>
                <option value="ABANDONED_CART">🛍️ Abandoned Cart</option>
                <option value="CUSTOMER_SIGNUP">👤 Customer Signup</option>
                <option value="ORDER_DELIVERED">📦 Order Delivered</option>
              </select>
            </div>
          )}

          {!advancedMode && selectedNode.type === 'ACTION' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Action Type
                </label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                >
                  <option value="SEND_MESSAGE">💬 Send Message</option>
                  <option value="ADD_ORDER_NOTE">📝 Add Order Note</option>
                  <option value="ADD_CUSTOMER_NOTE">👤 Add Customer Note</option>
                </select>
              </div>

              {actionType === 'SEND_MESSAGE' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      To (Phone Field)
                    </label>
                    <input
                      type="text"
                      value={toField}
                      onChange={(e) => setToField(e.target.value)}
                      placeholder="e.g. customer.phone"
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    />
                    <p className="text-xs text-gray-500 mt-1">Field path to get phone number</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message Body
                    </label>
                    <textarea
                      value={messageBody}
                      onChange={(e) => setMessageBody(e.target.value)}
                      rows={4}
                      placeholder="Hello {{customer.name}}! Your order is ready."
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    />
                    <p className="text-xs text-gray-500 mt-1">Use {'{{field}}'} for variables</p>
                  </div>
                </>
              )}

              {actionType === 'ADD_ORDER_NOTE' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Order ID Field
                    </label>
                    <input
                      type="text"
                      value={orderId}
                      onChange={(e) => setOrderId(e.target.value)}
                      placeholder="e.g. order.id"
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Note Content
                    </label>
                    <textarea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      rows={3}
                      placeholder="Flow executed at {{timestamp}}"
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    />
                  </div>
                </>
              )}

              {actionType === 'ADD_CUSTOMER_NOTE' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Customer ID Field
                    </label>
                    <input
                      type="text"
                      value={customerId}
                      onChange={(e) => setCustomerId(e.target.value)}
                      placeholder="e.g. customer.id"
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Note Content
                    </label>
                    <textarea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      rows={3}
                      placeholder="Customer engaged with flow"
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {!advancedMode && selectedNode.type === 'CONDITION' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logic Type
                </label>
                <select
                  value={logicType}
                  onChange={(e) => setLogicType(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200"
                >
                  <option value="AND">AND (all conditions must be true)</option>
                  <option value="OR">OR (at least one must be true)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Conditions
                  </label>
                  <button
                    onClick={addCondition}
                    className="px-3 py-1 text-xs bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-all duration-200"
                  >
                    + Add Condition
                  </button>
                </div>

                {conditions.map((condition, index) => (
                  <div key={index} className="p-3 bg-white rounded-lg border-2 border-amber-100 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-amber-700">Condition {index + 1}</span>
                      {conditions.length > 1 && (
                        <button
                          onClick={() => removeCondition(index)}
                          className="text-red-500 hover:text-red-700 text-xs"
                        >
                          ✕ Remove
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={condition.field}
                      onChange={(e) => updateCondition(index, 'field', e.target.value)}
                      placeholder="Field (e.g. order.total)"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                    <select
                      value={condition.operator}
                      onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    >
                      <option value="equals">Equals (=)</option>
                      <option value="notEquals">Not Equals (≠)</option>
                      <option value="greaterThan">Greater Than (&gt;)</option>
                      <option value="lessThan">Less Than (&lt;)</option>
                      <option value="contains">Contains</option>
                    </select>
                    <input
                      type="text"
                      value={condition.value}
                      onChange={(e) => updateCondition(index, 'value', e.target.value)}
                      placeholder="Value (e.g. 100)"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {!advancedMode && selectedNode.type === 'DELAY' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delay Amount
                </label>
                <input
                  type="number"
                  value={delayAmount}
                  onChange={(e) => setDelayAmount(e.target.value)}
                  min="1"
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Unit
                </label>
                <select
                  value={delayUnit}
                  onChange={(e) => setDelayUnit(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                >
                  <option value="seconds">⏱️ Seconds</option>
                  <option value="minutes">⏰ Minutes</option>
                  <option value="hours">🕐 Hours</option>
                  <option value="days">📅 Days</option>
                </select>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-800">
                  ⏳ Delay: <strong>{delayAmount} {delayUnit}</strong>
                </p>
              </div>
            </div>
          )}

          {/* Advanced Mode - JSON Editor */}
          {advancedMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Config (JSON)
              </label>
              <textarea
                value={configText}
                onChange={(e) => setConfigText(e.target.value)}
                rows={12}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg font-mono text-sm focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all duration-200 bg-gray-900 text-green-400"
              />
              <p className="text-xs text-gray-500 mt-1">⚠️ Advanced mode: Edit JSON directly</p>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <button
              onClick={handleNodeUpdate}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg hover:scale-105 transition-all duration-200 font-medium"
            >
              ✓ Update Node
            </button>
            <button
              onClick={onDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 hover:shadow-lg hover:scale-105 transition-all duration-200 font-medium"
            >
              🗑️ Delete
            </button>
          </div>
          </div>
        )}

        {selectedEdge && (
          <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Label
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Condition Path
            </label>
            <input
              type="text"
              value={conditionPath}
              onChange={(e) => setConditionPath(e.target.value)}
              placeholder="e.g. 'true', 'false', 'branchA'"
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleEdgeUpdate}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              Update
            </button>
            <button
              onClick={onDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              Delete
            </button>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
