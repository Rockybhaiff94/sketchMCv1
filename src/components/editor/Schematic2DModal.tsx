import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Layers, Download } from 'lucide-react';
import { MinecraftBuild, BlockPlacement } from '../../types/minecraft.ts';
import { getMinecraftBlock } from '../../lib/registry.ts';

interface Schematic2DModalProps {
  build: MinecraftBuild;
  isOpen: boolean;
  onClose: () => void;
  initialY?: number;
}

export const Schematic2DModal: React.FC<Schematic2DModalProps> = ({
  build,
  isOpen,
  onClose,
  initialY = 0,
}) => {
  const [selectedY, setSelectedY] = useState(initialY);
  const [hoveredCell, setHoveredCell] = useState<{ x: number; z: number; block?: BlockPlacement } | null>(null);

  if (!isOpen) return null;

  // Determine coordinate bounds
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  for (const b of build.blocks) {
    if (b.position.x < minX) minX = b.position.x;
    if (b.position.x > maxX) maxX = b.position.x;
    if (b.position.y < minY) minY = b.position.y;
    if (b.position.y > maxY) maxY = b.position.y;
    if (b.position.z < minZ) minZ = b.position.z;
    if (b.position.z > maxZ) maxZ = b.position.z;
  }

  // Filter blocks on layer selectedY
  const layerBlocks = build.blocks.filter((b) => b.position.y === selectedY);
  const layerMap = new Map<string, BlockPlacement>();
  for (const b of layerBlocks) {
    layerMap.set(`${b.position.x},${b.position.z}`, b);
  }

  // Legend of blocks in this slice
  const uniqueInLayer = new Map<string, number>();
  for (const b of layerBlocks) {
    uniqueInLayer.set(b.blockId, (uniqueInLayer.get(b.blockId) || 0) + 1);
  }

  const exportLayerPNG = () => {
    // Generate an HTML5 Canvas and download as PNG
    const cols = maxX - minX + 1;
    const rows = maxZ - minZ + 1;
    const cellSize = 24;
    const canvas = document.createElement('canvas');
    canvas.width = cols * cellSize + 80;
    canvas.height = rows * cellSize + 80;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(`${build.name} - Blueprint Layer Y=${selectedY}`, 20, 25);

    // Grid
    for (let z = minZ; z <= maxZ; z++) {
      for (let x = minX; x <= maxX; x++) {
        const posX = 40 + (x - minX) * cellSize;
        const posZ = 45 + (z - minZ) * cellSize;

        const block = layerMap.get(`${x},${z}`);
        if (block) {
          const def = getMinecraftBlock(block.blockId);
          ctx.fillStyle = def?.colorHex || '#64748b';
          ctx.fillRect(posX, posZ, cellSize - 1, cellSize - 1);
        } else {
          ctx.strokeStyle = '#1e293b';
          ctx.strokeRect(posX, posZ, cellSize, cellSize);
        }
      }
    }

    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `${build.name}_layer_Y${selectedY}.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl">
      <div className="flex flex-col w-full max-w-3xl max-h-[90vh] bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-sky-400" />
            <div>
              <h3 className="text-base font-bold text-zinc-100">2D Blueprint Slices</h3>
              <p className="text-xs text-zinc-400">Step-by-step layer construction schematic</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Layer Controls Bar */}
        <div className="flex items-center justify-between px-6 py-3 bg-zinc-950/60 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedY(Math.max(minY, selectedY - 1))}
              disabled={selectedY <= minY}
              className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white disabled:opacity-30 transition-colors"
              title="Previous Layer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="font-mono text-sm font-bold text-green-400 min-w-[90px] text-center">
              Layer Y = {selectedY}
            </span>

            <button
              onClick={() => setSelectedY(Math.min(maxY, selectedY + 1))}
              disabled={selectedY >= maxY}
              className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white disabled:opacity-30 transition-colors"
              title="Next Layer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-zinc-400">
              Blocks in Layer: <strong className="text-zinc-200">{layerBlocks.length}</strong>
            </span>
            <button
              onClick={exportLayerPNG}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 rounded-xl transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Layer PNG</span>
            </button>
          </div>
        </div>

        {/* 2D Voxel Grid Canvas */}
        <div className="flex-1 overflow-auto p-6 bg-zinc-950/80 flex items-center justify-center min-h-[340px]">
          <div className="inline-block border border-zinc-800/80 bg-zinc-900/50 p-4 rounded-xl shadow-inner">
            <div className="flex flex-col gap-1">
              {Array.from({ length: maxZ - minZ + 1 }).map((_, rIdx) => {
                const z = minZ + rIdx;
                return (
                  <div key={z} className="flex gap-1">
                    {Array.from({ length: maxX - minX + 1 }).map((_, cIdx) => {
                      const x = minX + cIdx;
                      const block = layerMap.get(`${x},${z}`);
                      const def = block ? getMinecraftBlock(block.blockId) : null;

                      return (
                        <div
                          key={x}
                          onMouseEnter={() => setHoveredCell({ x, z, block })}
                          onMouseLeave={() => setHoveredCell(null)}
                          className={`w-6 h-6 rounded-sm border flex items-center justify-center transition-all ${
                            block
                              ? 'border-white/20 shadow-sm cursor-pointer hover:ring-2 hover:ring-green-400'
                              : 'border-zinc-800/40 bg-zinc-950/20'
                          }`}
                          style={{
                            backgroundColor: def ? def.colorHex : 'transparent',
                            opacity: def?.opacity ?? (block ? 1 : 0.1),
                          }}
                          title={
                            block
                              ? `(${x}, ${selectedY}, ${z})\n${block.blockId}`
                              : `(${x}, ${selectedY}, ${z}) [Air]`
                          }
                        >
                          {def && def.shapeType !== 'full_cube' && (
                            <span className="text-[7px] font-mono font-bold text-black/70">
                              {def.shapeType === 'stairs' ? 'S' : def.shapeType === 'slab' ? '½' : 'P'}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Legend & Inspector */}
        <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
            <span className="text-zinc-500 font-mono">LEGEND:</span>
            {Array.from(uniqueInLayer.entries()).map(([blockId, count]) => {
              const def = getMinecraftBlock(blockId);
              return (
                <div key={blockId} className="flex items-center gap-1.5 shrink-0">
                  <div
                    className="w-3.5 h-3.5 rounded-sm border border-white/20"
                    style={{ backgroundColor: def?.colorHex || '#888' }}
                  />
                  <span className="text-zinc-300 font-medium">
                    {def?.name || blockId.replace('minecraft:', '')} ({count})
                  </span>
                </div>
              );
            })}
          </div>

          <div className="font-mono text-xs text-zinc-400 shrink-0 ml-4">
            {hoveredCell ? (
              <span>
                X: {hoveredCell.x} Z: {hoveredCell.z}{' '}
                {hoveredCell.block ? (
                  <strong className="text-green-400">
                    [{hoveredCell.block.blockId.replace('minecraft:', '')}]
                  </strong>
                ) : (
                  <span className="text-zinc-600">[Air]</span>
                )}
              </span>
            ) : (
              <span className="text-zinc-600">Hover cell to inspect</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
