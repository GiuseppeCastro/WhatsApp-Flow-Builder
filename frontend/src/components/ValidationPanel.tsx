import type { ValidationError } from '../types/schemas';

interface ValidationPanelProps {
  errors: ValidationError[];
  onClose: () => void;
}

export default function ValidationPanel({ errors, onClose }: ValidationPanelProps): JSX.Element {
  const errorCount = errors.filter((e) => e.severity === 'error').length;
  const warningCount = errors.filter((e) => e.severity === 'warning').length;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg max-h-64 overflow-y-auto">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold">Validation Results</h3>
            <div className="flex gap-3 text-sm">
              {errorCount > 0 && (
                <span className="text-red-600 font-medium">
                  {errorCount} error{errorCount !== 1 ? 's' : ''}
                </span>
              )}
              {warningCount > 0 && (
                <span className="text-yellow-600 font-medium">
                  {warningCount} warning{warningCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="space-y-2">
          {errors.map((error, idx) => (
            <div
              key={idx}
              className={`p-3 rounded border ${
                error.severity === 'error'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-yellow-50 border-yellow-200'
              }`}
            >
              <div className="flex items-start gap-2">
                <span
                  className={`text-xs font-bold px-2 py-1 rounded ${
                    error.severity === 'error'
                      ? 'bg-red-200 text-red-800'
                      : 'bg-yellow-200 text-yellow-800'
                  }`}
                >
                  {error.severity.toUpperCase()}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-sm">{error.code}</p>
                  <p className="text-sm text-gray-700">{error.message}</p>
                  {(error.nodeId || error.edgeId) && (
                    <p className="text-xs text-gray-500 mt-1">
                      {error.nodeId && `Node: ${error.nodeId}`}
                      {error.edgeId && `Edge: ${error.edgeId}`}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
