import type { Flow } from '../types/schemas';

interface ToolbarProps {
  flow: Flow;
  saving: boolean;
  onSave: () => void;
  onValidate: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
  onBack: () => void;
  onAddNode: (type: string) => void;
  onAutoOrganize: () => void;
}

export default function Toolbar({
  flow,
  saving,
  onSave,
  onValidate,
  onActivate,
  onDeactivate,
  onBack,
  onAddNode,
  onAutoOrganize,
}: ToolbarProps): JSX.Element {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="text-gray-600 hover:text-gray-900"
        >
          ← Back
        </button>
        <h1 className="text-xl font-semibold text-gray-900">{flow.name}</h1>
        <span
          className={`px-3 py-1 text-sm rounded-full ${
            flow.active
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {flow.active ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex gap-2 mr-4">
          <button
            onClick={() => onAddNode('TRIGGER')}
            className="px-3 py-2 text-sm bg-purple-500 text-white rounded-lg shadow-md shadow-purple-500/30 hover:bg-purple-600 hover:shadow-lg hover:shadow-purple-500/50 hover:scale-105 transition-all duration-200"
          >
            + Trigger
          </button>
          <button
            onClick={() => onAddNode('ACTION')}
            className="px-3 py-2 text-sm bg-blue-500 text-white rounded-lg shadow-md shadow-blue-500/30 hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/50 hover:scale-105 transition-all duration-200"
          >
            + Action
          </button>
          <button
            onClick={() => onAddNode('CONDITION')}
            className="px-3 py-2 text-sm bg-amber-500 text-white rounded-lg shadow-md shadow-amber-500/30 hover:bg-amber-600 hover:shadow-lg hover:shadow-amber-500/50 hover:scale-105 transition-all duration-200"
          >
            + Condition
          </button>
          <button
            onClick={() => onAddNode('DELAY')}
            className="px-3 py-2 text-sm bg-green-500 text-white rounded-lg shadow-md shadow-green-500/30 hover:bg-green-600 hover:shadow-lg hover:shadow-green-500/50 hover:scale-105 transition-all duration-200"
          >
            + Delay
          </button>
          <button
            onClick={() => onAddNode('END')}
            className="px-3 py-2 text-sm bg-gray-600 text-white rounded-lg shadow-md shadow-gray-500/30 hover:bg-gray-700 hover:shadow-lg hover:shadow-gray-500/50 hover:scale-105 transition-all duration-200"
          >
            + End
          </button>
        </div>

        <button
          onClick={onAutoOrganize}
          className="px-4 py-2 border-2 border-indigo-300 text-indigo-700 rounded-lg hover:bg-indigo-50 hover:border-indigo-400 hover:shadow-md transition-all duration-200 flex items-center gap-2"
        >
          Auto Organize
        </button>

        <button
          onClick={onValidate}
          className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 hover:shadow-md transition-all duration-200"
        >
          Validate
        </button>

        <button
          onClick={onSave}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all duration-200"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>

        {flow.active ? (
          <button
            onClick={onDeactivate}
            className="px-4 py-2 border-2 border-red-300 text-red-700 rounded-lg hover:bg-red-50 hover:border-red-400 hover:shadow-md transition-all duration-200"
          >
            Deactivate
          </button>
        ) : (
          <button
            onClick={onActivate}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 hover:shadow-lg hover:scale-105 transition-all duration-200"
          >
            Activate
          </button>
        )}
      </div>
    </div>
  );
}
