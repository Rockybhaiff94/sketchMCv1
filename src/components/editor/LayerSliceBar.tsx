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
    <div className="flex items-center gap-2.5 px-3 py-1.5">
      <div className="flex items-center gap-1.5">
        <Layers className="w-4 h-4 text-green-400" />
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Slicer</span>
      </div>

      <button
        onClick={togglePlay}
        className={`p-1.5 rounded-lg text-xs transition-colors ${
          isPlaying
            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/25'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-transparent'
        }`}
        title={isPlaying ? 'Pause Construction Timelapse' : 'Play Construction Animation'}
      >
        {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
      </button>

      <button
        onClick={() => onChangeSlice(Math.max(0, currentSlice - 1))}
        disabled={currentSlice <= 0}
        className="p-1 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 border border-transparent disabled:opacity-20 transition-colors"
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
          className="w-44 cursor-pointer"
        />
        <div className="flex items-center gap-1 min-w-[70px]">
          <span className="text-green-400 font-mono text-xs font-semibold">Y = {currentSlice}</span>
          <span className="text-zinc-600 text-xs">/ {maxHeight}</span>
        </div>
      </div>

      <button
        onClick={() => onChangeSlice(Math.min(maxHeight, currentSlice + 1))}
        disabled={currentSlice >= maxHeight}
        className="p-1 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 border border-transparent disabled:opacity-20 transition-colors"
        title="Up 1 Layer"
      >
        <ChevronUp className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={() => onChangeSlice(maxHeight)}
        className="px-2 py-1 text-[11px] font-medium text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg border border-transparent transition-colors"
      >
        Show All
      </button>
    </div>
  );
};
