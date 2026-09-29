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
    <div className="w-14 h-full flex flex-col items-center py-2 px-1 bg-slate-900 border-r border-slate-800 text-slate-300 z-20 flex-shrink-0 select-none">
      {/* Primary CAD / Block Tools */}
      <div className="flex flex-col items-center gap-1.5 w-full">
        {tools.map((tool) => {
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={`relative group w-10 h-10 flex flex-col items-center justify-center rounded-lg transition-all ${
                isActive
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
              }`}
              title={`${tool.label} (${tool.shortcut})`}
            >
              {tool.icon}
              <span className={`text-[8px] font-mono leading-none mt-0.5 ${isActive ? 'text-slate-900' : 'text-slate-500'}`}>
                {tool.label}
              </span>

              {/* Tooltip on Hover */}
              <div className="absolute left-12 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-slate-200 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-xl">
                {tool.label} ({tool.shortcut})
              </div>
            </button>
          );
        })}
      </div>

      <div className="w-8 h-px bg-slate-800 my-2" />

      {/* Undo & Redo Quick Buttons */}
      <div className="flex flex-col items-center gap-1.5 w-full mt-auto">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="w-10 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-25 disabled:hover:bg-transparent transition-colors"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="w-10 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-25 disabled:hover:bg-transparent transition-colors"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
