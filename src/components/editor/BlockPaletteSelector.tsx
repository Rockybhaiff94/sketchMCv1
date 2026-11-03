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
    <div className="flex flex-col h-full text-zinc-200 select-none">
      {/* Active Selected Block Spotlight */}
      {activeBlock && (
        <div className="p-3 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl border border-white/10 shadow-inner shrink-0 bg-zinc-900 overflow-hidden flex items-center justify-center">
              <img
                src={getBlockPreviewThumbnail(activeBlock.id, activeBlock.defaultState)}
                alt={activeBlock.name}
                className="w-8 h-8 object-contain"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-bold text-zinc-100 truncate">
                {activeBlock.name}
              </span>
              <span className="text-[10px] font-mono text-green-400 truncate">
                {activeBlock.id}
              </span>
            </div>
            {activeBlock.sinceVersion && (
              <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-zinc-800 text-zinc-400">
                {activeBlock.sinceVersion}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="p-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Minecraft blocks..."
            className="w-full px-3 py-2 pl-8 text-sm bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/15"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1 mt-2 pb-1 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-2 py-0.5 text-[10px] font-medium rounded-lg whitespace-nowrap transition-colors border ${
                activeCategory === cat.id
                  ? 'bg-green-500/15 text-green-400 border-green-500/30 font-semibold'
                  : 'text-zinc-500 hover:text-zinc-300 border-transparent hover:bg-zinc-800'
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
              className={`relative flex flex-col items-center justify-center p-1.5 rounded-xl border transition-all group ${
                isSelected
                  ? 'border-green-500/35 bg-green-500/15 shadow-sm'
                  : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/50 hover:bg-zinc-800'
              }`}
              title={`${block.name}\n${block.id}`}
            >
              <div className="w-9 h-9 rounded-xl bg-zinc-900/90 border border-zinc-700/60 shadow-inner mb-1 flex items-center justify-center overflow-hidden p-0.5 group-hover:scale-105 transition-transform">
                <img
                  src={getBlockPreviewThumbnail(block.id, block.defaultState)}
                  alt={block.name}
                  className="w-8 h-8 object-contain"
                  style={{ imageRendering: 'pixelated' }}
                  loading="lazy"
                />
              </div>
              <span className="text-[9px] text-zinc-300 font-medium truncate w-full text-center leading-tight">
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

      <div className="p-2 border-t border-zinc-800 bg-zinc-950/40 flex items-center justify-between text-[10px] font-mono text-zinc-500">
        <span>{filteredBlocks.length} Blocks</span>
        <span>Version: Java {selectedVersion}</span>
      </div>
    </div>
  );
};
