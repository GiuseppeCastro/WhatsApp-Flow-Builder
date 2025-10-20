import type { ValidationError, ValidationResult } from '../types/schemas';

interface ValidationPanelProps {
  result: ValidationResult | null;
  onClose: () => void;
}

export default function ValidationPanel({ result, onClose }: ValidationPanelProps): JSX.Element {
  if (!result) return <></>;

  const errorCount = result.errors.filter((e) => e.severity === 'error').length;
  const warningCount = result.errors.filter((e) => e.severity === 'warning').length;
  const isValid = result.valid;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg max-h-96 overflow-y-auto">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold">Validation Results</h3>
            <div className="flex gap-3 text-sm items-center">
              {isValid && errorCount === 0 && (
                <span className="text-green-600 font-medium px-3 py-1 bg-green-50 rounded-md border border-green-200">
                  Valid Flow
                </span>
              )}
              {errorCount > 0 && (
                <span className="text-red-600 font-medium px-3 py-1 bg-red-50 rounded-md border border-red-200">
                  {errorCount} error{errorCount !== 1 ? 's' : ''}
                </span>
              )}
              {warningCount > 0 && (
                <span className="text-yellow-600 font-medium px-3 py-1 bg-yellow-50 rounded-md border border-yellow-200">
                  {warningCount} warning{warningCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {isValid && errorCount === 0 && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">Flow Validation Passed</h4>
            <p className="text-sm text-green-700 mb-3">
              This flow meets all structural requirements and can be activated for execution.
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Status:</span>
                <span className="ml-2 font-medium text-green-700">Ready for deployment</span>
              </div>
              <div>
                <span className="text-gray-600">Issues found:</span>
                <span className="ml-2 font-medium text-green-700">None</span>
              </div>
            </div>
          </div>
        )}

        {result.errors.length > 0 && (
          <div className="space-y-2">
            {result.errors.map((error, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border ${
                  error.severity === 'error'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-yellow-50 border-yellow-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded ${
                      error.severity === 'error'
                        ? 'bg-red-200 text-red-800'
                        : 'bg-yellow-200 text-yellow-800'
                    }`}
                  >
                    {error.severity.toUpperCase()}
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold text-sm mb-1">{error.code}</p>
                    <p className="text-sm text-gray-700 mb-1">{error.message}</p>
                    {(error.nodeId || error.edgeId) && (
                      <div className="text-xs text-gray-500 mt-2 font-mono">
                        {error.nodeId && <div>Node ID: {error.nodeId}</div>}
                        {error.edgeId && <div>Edge ID: {error.edgeId}</div>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
