import React from 'react';
import {
  MousePointer,
  Move,
  RotateCw,
  Scaling,
  PlusSquare,
  Trash2,
  Box,
  Paintbrush,
  Pipette,
  Undo2,
  Redo2,
} from 'lucide-react';
import { ToolMode } from '../viewport/ThreeViewport.tsx';

interface ToolbarProps {
  activeTool: ToolMode;
  setActiveTool: (tool: ToolMode) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  setActiveTool,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}) => {
  const tools: { id: ToolMode; label: string; icon: React.ReactNode; shortcut: string }[] = [
    { id: 'select', label: 'Select', icon: <MousePointer className="w-4 h-4" />, shortcut: 'V' },
    { id: 'move', label: 'Move', icon: <Move className="w-4 h-4" />, shortcut: 'G' },
    { id: 'rotate', label: 'Rotate', icon: <RotateCw className="w-4 h-4" />, shortcut: 'R' },
    { id: 'scale', label: 'Scale', icon: <Scaling className="w-4 h-4" />, shortcut: 'S' },
    { id: 'add', label: 'Build', icon: <PlusSquare className="w-4 h-4" />, shortcut: 'A' },
    { id: 'delete', label: 'Erase', icon: <Trash2 className="w-4 h-4" />, shortcut: 'E' },
    { id: 'fill', label: 'Fill', icon: <Box className="w-4 h-4" />, shortcut: 'X' },
    { id: 'paint', label: 'Replace', icon: <Paintbrush className="w-4 h-4" />, shortcut: 'B' },
    { id: 'eyedropper', label: 'Measure', icon: <Pipette className="w-4 h-4" />, shortcut: 'I' },
  ];

  return (
    <div className="w-14 h-full flex flex-col items-center py-3 px-1.5 bg-zinc-900 border-r border-zinc-800 z-20 flex-shrink-0 select-none gap-0.5">
      {/* Tool buttons */}
      <div className="flex flex-col items-center gap-1 w-full">
        {tools.map((tool) => {
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={`relative group w-10 h-10 flex flex-col items-center justify-center rounded-xl transition-all duration-150 ${
                isActive
                  ? 'bg-green-500/20 text-green-400 border border-green-500/40 shadow-sm shadow-green-500/10'
                  : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 border border-transparent'
              }`}
              title={`${tool.label} (${tool.shortcut})`}
            >
              {tool.icon}
              <span className={`text-[8px] font-mono leading-none mt-0.5 ${isActive ? 'text-green-400' : 'text-zinc-600'}`}>
                {tool.label}
              </span>
              {/* Tooltip */}
              <div className="absolute left-12 px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs font-medium text-zinc-200 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-xl shadow-black/50">
                {tool.label}
                <span className="ml-1.5 text-zinc-500 font-mono">{tool.shortcut}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="w-6 h-px bg-zinc-800 my-2" />

      {/* Undo/Redo */}
      <div className="flex flex-col items-center gap-1 w-full mt-auto">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="relative group w-10 h-9 flex items-center justify-center rounded-xl text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 border border-transparent disabled:opacity-20 disabled:cursor-not-allowed transition-all"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
          <div className="absolute left-12 px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs font-medium text-zinc-200 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-xl">
            Undo <span className="text-zinc-500">Ctrl+Z</span>
          </div>
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="relative group w-10 h-9 flex items-center justify-center rounded-xl text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 border border-transparent disabled:opacity-20 disabled:cursor-not-allowed transition-all"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
          <div className="absolute left-12 px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs font-medium text-zinc-200 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-xl">
            Redo <span className="text-zinc-500">Ctrl+Y</span>
          </div>
        </button>
      </div>
    </div>
  );
};
