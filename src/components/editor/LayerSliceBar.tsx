import React, { useEffect, useState } from 'react';
import { Play, Pause, ChevronUp, ChevronDown, Layers } from 'lucide-react';

interface LayerSliceBarProps {
  maxHeight: number;
  currentSlice: number;
  onChangeSlice: (slice: number) => void;
}

export const LayerSliceBar: React.FC<LayerSliceBarProps> = ({
  maxHeight,
  currentSlice,
  onChangeSlice,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      if (currentSlice >= maxHeight) {
        setIsPlaying(false);
      } else {
        onChangeSlice(currentSlice + 1);
      }
    }, 400);

    return () => clearInterval(interval);
  }, [isPlaying, currentSlice, maxHeight, onChangeSlice]);

  const togglePlay = () => {
    if (!isPlaying && currentSlice >= maxHeight) {
      onChangeSlice(0);
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl shadow-xl text-slate-200">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
        <Layers className="w-4 h-4 text-emerald-400" />
        <span>SLICER:</span>
      </div>

      <button
        onClick={togglePlay}
        className={`p-1.5 rounded-lg text-xs transition-colors ${
          isPlaying ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-300 hover:text-white'
        }`}
        title={isPlaying ? 'Pause Construction Timelapse' : 'Play Construction Animation'}
      >
        {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
      </button>

      <button
        onClick={() => onChangeSlice(Math.max(0, currentSlice - 1))}
        disabled={currentSlice <= 0}
        className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30"
        title="Down 1 Layer"
      >
        <ChevronDown className="w-3.5 h-3.5" />
      </button>

      {/* Horizontal Slider */}
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={0}
          max={maxHeight}
          value={currentSlice}
          onChange={(e) => onChangeSlice(parseInt(e.target.value, 10))}
          className="w-48 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />
        <div className="flex items-center gap-1 font-mono text-xs text-emerald-400 min-w-[70px]">
          <span>Y = {currentSlice}</span>
          <span className="text-slate-600">/ {maxHeight}</span>
        </div>
      </div>

      <button
        onClick={() => onChangeSlice(Math.min(maxHeight, currentSlice + 1))}
        disabled={currentSlice >= maxHeight}
        className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30"
        title="Up 1 Layer"
      >
        <ChevronUp className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={() => onChangeSlice(maxHeight)}
        className="px-2 py-1 text-[11px] font-medium text-slate-400 hover:text-slate-200 bg-slate-800/80 rounded transition-colors"
      >
        Show All
      </button>
    </div>
  );
};
