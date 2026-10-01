import React, { useState } from 'react';
import { Search, Boxes, Sparkles, Filter } from 'lucide-react';
import { MINECRAFT_BLOCKS } from '../../lib/registry.ts';
import { BlockCategory } from '../../types/minecraft.ts';
import { getBlockPreviewThumbnail } from '../../lib/rendering/blockPreviewRenderer.ts';

interface BlockPaletteSelectorProps {
  selectedBlockId: string;
  onSelectBlockId: (id: string) => void;
  selectedVersion?: '1.20' | '1.21';
}

export const BlockPaletteSelector: React.FC<BlockPaletteSelectorProps> = ({
  selectedBlockId,
  onSelectBlockId,
  selectedVersion = '1.21',
}) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'stone', label: 'Stone' },
    { id: 'wood', label: 'Wood' },
    { id: 'building', label: 'Quartz/Frame' },
    { id: 'glass', label: 'Glass' },
    { id: 'concrete', label: 'Concrete' },
    { id: 'nature', label: 'Nature' },
    { id: 'plants', label: 'Plants' },
    { id: 'lighting', label: 'Lighting' },
    { id: 'functional', label: 'Functional' },
  ];

  const filteredBlocks = MINECRAFT_BLOCKS.filter((block) => {
    if (selectedVersion === '1.20' && block.sinceVersion === '1.21') {
      return false;
    }
    const matchesCategory =
      activeCategory === 'all' ||
      block.category === activeCategory ||
      (activeCategory === 'nature' && block.category === 'plants');
    const matchesSearch =
      block.name.toLowerCase().includes(search.toLowerCase()) ||
      block.id.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const activeBlock = MINECRAFT_BLOCKS.find((b) => b.id === selectedBlockId);

  return (
    <div className="flex flex-col h-full text-slate-200 select-none">
      {/* Active Selected Block Spotlight */}
      {activeBlock && (
        <div className="p-3 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded border border-white/20 shadow-inner shrink-0 bg-slate-900 overflow-hidden flex items-center justify-center">
              <img
                src={getBlockPreviewThumbnail(activeBlock.id, activeBlock.defaultState)}
                alt={activeBlock.name}
                className="w-8 h-8 object-contain"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-bold text-slate-100 truncate">
                {activeBlock.name}
              </span>
              <span className="text-[10px] font-mono text-emerald-400 truncate">
                {activeBlock.id}
              </span>
            </div>
            {activeBlock.sinceVersion && (
              <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-slate-800 text-slate-400">
                {activeBlock.sinceVersion}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="p-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Minecraft blocks..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950/70 border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1 mt-2 pb-1 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-2 py-0.5 text-[10px] font-medium rounded-md whitespace-nowrap transition-colors ${
                activeCategory === cat.id
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-950/40 border border-slate-800/80'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Block Swatches Grid */}
      <div className="flex-1 overflow-y-auto px-3 py-1 grid grid-cols-4 gap-2">
        {filteredBlocks.map((block) => {
          const isSelected = block.id === selectedBlockId;
          return (
            <button
              key={block.id}
              onClick={() => onSelectBlockId(block.id)}
              className={`relative flex flex-col items-center justify-center p-1.5 rounded-lg border transition-all group ${
                isSelected
                  ? 'border-emerald-400 ring-2 ring-emerald-500/30 bg-emerald-500/10 shadow-md'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-950/50 hover:bg-slate-950/80'
              }`}
              title={`${block.name}\n${block.id}`}
            >
              <div className="w-9 h-9 rounded-md bg-slate-900/90 border border-slate-700/60 shadow-inner mb-1 flex items-center justify-center overflow-hidden p-0.5 group-hover:scale-105 transition-transform">
                <img
                  src={getBlockPreviewThumbnail(block.id, block.defaultState)}
                  alt={block.name}
                  className="w-8 h-8 object-contain"
                  style={{ imageRendering: 'pixelated' }}
                  loading="lazy"
                />
              </div>
              <span className="text-[9px] text-slate-300 font-medium truncate w-full text-center leading-tight">
                {block.name.replace('Minecraft ', '')}
              </span>

              {/* Shape Badge */}
              {block.shapeType !== 'full_cube' && (
                <span className="absolute top-1 right-1 text-[8px] font-mono leading-none bg-black/80 text-cyan-300 px-1 py-0.5 rounded shadow">
                  {block.shapeType === 'stairs'
                    ? 'Stair'
                    : block.shapeType === 'slab'
                    ? 'Slab'
                    : block.shapeType === 'pane'
                    ? 'Pane'
                    : block.shapeType === 'fence'
                    ? 'Fence'
                    : block.shapeType === 'wall'
                    ? 'Wall'
                    : block.shapeType === 'door'
                    ? 'Door'
                    : block.shapeType === 'lantern'
                    ? 'Light'
                    : block.shapeType}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="p-2 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-[10px] font-mono text-slate-500">
        <span>{filteredBlocks.length} Blocks</span>
        <span>Version: Java {selectedVersion}</span>
      </div>
    </div>
  );
};
