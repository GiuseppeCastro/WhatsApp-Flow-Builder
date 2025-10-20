import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

const nodeColors = {
  TRIGGER: {
    bg: 'bg-purple-500',
    border: 'border-purple-600',
    text: 'text-white',
    shadow: 'shadow-purple-500/50',
    hoverShadow: 'hover:shadow-purple-500/70',
    ring: 'ring-purple-400',
  },
  ACTION: {
    bg: 'bg-blue-500',
    border: 'border-blue-600',
    text: 'text-white',
    shadow: 'shadow-blue-500/50',
    hoverShadow: 'hover:shadow-blue-500/70',
    ring: 'ring-blue-400',
  },
  CONDITION: {
    bg: 'bg-amber-500',
    border: 'border-amber-600',
    text: 'text-white',
    shadow: 'shadow-amber-500/50',
    hoverShadow: 'hover:shadow-amber-500/70',
    ring: 'ring-amber-400',
  },
  DELAY: {
    bg: 'bg-green-500',
    border: 'border-green-600',
    text: 'text-white',
    shadow: 'shadow-green-500/50',
    hoverShadow: 'hover:shadow-green-500/70',
    ring: 'ring-green-400',
  },
  END: {
    bg: 'bg-gray-600',
    border: 'border-gray-700',
    text: 'text-white',
    shadow: 'shadow-gray-500/50',
    hoverShadow: 'hover:shadow-gray-500/70',
    ring: 'ring-gray-400',
  },
};

type NodeType = keyof typeof nodeColors;

function CustomNode({ data, selected }: NodeProps) {
  const nodeType = (data.type || 'ACTION') as NodeType;
  const colors = nodeColors[nodeType] || nodeColors.ACTION;
  const isCondition = nodeType === 'CONDITION';
  const isEnd = nodeType === 'END';

  return (
    <div
      className={`
        px-4 py-3 rounded-lg border-2 min-w-[150px]
        ${colors.bg} ${colors.border} ${colors.text}
        shadow-lg ${colors.shadow}
        ${colors.hoverShadow}
        hover:shadow-xl
        hover:scale-105
        transition-all duration-200 ease-in-out
        ${selected ? `ring-4 ${colors.ring} ring-opacity-50 scale-105` : ''}
        ${isCondition ? '!rounded-lg' : ''}
        ${isEnd ? '!rounded-full' : ''}
      `}
    >
      {nodeType !== 'TRIGGER' && (
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 !bg-white border-2 border-gray-400"
        />
      )}

      <div className="flex flex-col gap-1">
        <div className="text-xs font-semibold uppercase opacity-75">
          {nodeType}
        </div>
        <div className="font-medium">
          {data.label || data.id}
        </div>
      </div>

      {isCondition && (
        <>
          <Handle
            type="source"
            position={Position.Bottom}
            id="yes"
            style={{ left: '30%' }}
            className="w-3 h-3 !bg-green-400 border-2 border-green-600"
          />
          <div 
            className="absolute bottom-[-20px] left-[30%] transform -translate-x-1/2 text-xs font-bold text-green-600 bg-white px-1 rounded"
          >
            Yes
          </div>
          
          <Handle
            type="source"
            position={Position.Bottom}
            id="no"
            style={{ left: '70%' }}
            className="w-3 h-3 !bg-red-400 border-2 border-red-600"
          />
          <div 
            className="absolute bottom-[-20px] left-[70%] transform -translate-x-1/2 text-xs font-bold text-red-600 bg-white px-1 rounded"
          >
            No
          </div>
        </>
      )}

      {!isEnd && !isCondition && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 !bg-white border-2 border-gray-400"
        />
      )}
    </div>
  );
}

export default memo(CustomNode);
