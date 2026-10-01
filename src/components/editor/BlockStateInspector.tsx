import React from 'react';
import { BlockPlacement } from '../../types/minecraft.ts';
import {
  getMinecraftBlock,
  resolveBlockModel,
  resolveBlockTexture,
  MINECRAFT_VERSION,
  REGISTRY_SNAPSHOT_ID,
} from '../../lib/registry.ts';
import { getBlockPreviewThumbnail } from '../../lib/rendering/blockPreviewRenderer.ts';
import { Sliders, Box, Layers, Compass, CheckCircle2, RotateCw, Trash2, Cpu } from 'lucide-react';

interface BlockStateInspectorProps {
  selectedBlock: BlockPlacement | null;
  onUpdateBlockState: (position: { x: number; y: number; z: number }, newState: Record<string, string>) => void;
  onDeleteBlock?: (blockId: string, position: { x: number; y: number; z: number }) => void;
  onClose?: () => void;
}

export const BlockStateInspector: React.FC<BlockStateInspectorProps> = ({
  selectedBlock,
  onUpdateBlockState,
  onDeleteBlock,
}) => {
  if (!selectedBlock) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center h-full text-slate-500">
        <Box className="w-10 h-10 mb-3 text-slate-600 stroke-[1.5]" />
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
          No Block Selected
        </h4>
        <p className="text-[11px] text-slate-500 max-w-[200px] leading-relaxed">
          Click any block in the 3D viewport with the Select (V) tool to inspect and adjust its Minecraft block state.
        </p>
      </div>
    );
  }

  const blockDef = getMinecraftBlock(selectedBlock.blockId);
  const blockName = blockDef?.name || selectedBlock.blockId.replace('minecraft:', '');
  const properties = blockDef?.properties || {};
  const currentState = selectedBlock.state || {};

  const resolvedModel = resolveBlockModel(selectedBlock.blockId, currentState);
  const resolvedTexture = resolveBlockTexture(selectedBlock.blockId, currentState);

  const handleStateChange = (propKey: string, newValue: string) => {
    const updated = {
      ...currentState,
      [propKey]: newValue,
    };
    onUpdateBlockState(selectedBlock.position, updated);
  };

  const handleRotateFacing = () => {
    const currentFacing = currentState.facing || 'north';
    const facings = ['north', 'east', 'south', 'west'];
    const nextIdx = (facings.indexOf(currentFacing) + 1) % facings.length;
    handleStateChange('facing', facings[nextIdx]);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/90 text-slate-200 select-none overflow-y-auto">
      {/* Block Header Card with Authentic 3D Preview */}
      <div className="p-3 border-b border-slate-800 bg-slate-950/40">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-lg border border-slate-700/80 bg-slate-950 flex items-center justify-center shadow-inner flex-shrink-0 overflow-hidden p-1">
            <img
              src={getBlockPreviewThumbnail(selectedBlock.blockId, currentState, 96)}
              alt={blockName}
              className="w-10 h-10 object-contain"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-slate-100 truncate" title={blockName}>
              {blockName}
            </h4>
            <span className="text-[10px] font-mono text-emerald-400 block truncate" title={selectedBlock.blockId}>
              {selectedBlock.blockId}
            </span>
            <div className="flex items-center gap-1.5 mt-1 text-[10px] font-mono text-slate-400">
              <span className="text-slate-500">POS:</span>
              <span className="text-slate-300">
                X:{selectedBlock.position.x} Y:{selectedBlock.position.y} Z:{selectedBlock.position.z}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Minecraft Technical Metadata Inspector */}
      <div className="px-3 py-2 border-b border-slate-800/80 bg-slate-950/60 space-y-1 text-[10px] font-mono">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Version:</span>
          <span className="text-emerald-400 font-semibold">{MINECRAFT_VERSION} (Java Edition)</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Model:</span>
          <span className="text-cyan-300 truncate max-w-[190px]" title={resolvedModel}>
            {resolvedModel}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Texture:</span>
          <span className="text-amber-300 truncate max-w-[190px]" title={resolvedTexture}>
            {resolvedTexture}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Source:</span>
          <span className="text-slate-300 truncate max-w-[190px]" title={`Minecraft Asset Registry (${REGISTRY_SNAPSHOT_ID})`}>
            VoxelForge Java Registry
          </span>
        </div>
        {Object.keys(currentState).length > 0 && (
          <div className="pt-1 border-t border-slate-800/60 flex items-start justify-between">
            <span className="text-slate-400">State:</span>
            <span className="text-slate-300 text-right font-medium">
              {Object.entries(currentState).map(([k, v]) => `${k}=${v}`).join(', ')}
            </span>
          </div>
        )}
      </div>

      {/* State Properties Editor */}
      <div className="p-3 flex-1 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="w-3 h-3 text-cyan-400" />
            <span>Block States</span>
          </span>
          {properties['facing'] && (
            <button
              onClick={handleRotateFacing}
              className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/60 px-2 py-0.5 rounded transition-colors"
              title="Rotate 90 degrees clockwise"
            >
              <RotateCw className="w-2.5 h-2.5" />
              <span>Rotate</span>
            </button>
          )}
        </div>

        {Object.keys(properties).length === 0 ? (
          <div className="py-4 text-center text-slate-500 text-[11px]">
            This block has no variable block states.
          </div>
        ) : (
          Object.entries(properties).map(([propKey, validValues]) => {
            const currentVal = currentState[propKey] || blockDef?.defaultState?.[propKey] || validValues[0];

            return (
              <div key={propKey} className="p-2 rounded bg-slate-950/50 border border-slate-800/80">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-medium text-slate-300 font-mono capitalize">
                    {propKey}
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400">
                    {currentVal}
                  </span>
                </div>

                {/* Property Value Pill Selector */}
                <div className="grid grid-cols-2 gap-1">
                  {validValues.map((val) => {
                    const isSelected = currentVal === val;
                    return (
                      <button
                        key={val}
                        onClick={() => handleStateChange(propKey, val)}
                        className={`px-2 py-1 text-[10px] font-mono rounded text-center transition-all ${
                          isSelected
                            ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/50 shadow-sm font-semibold'
                            : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                        }`}
                      >
                        {val}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete / Actions Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <button
          onClick={() => onDeleteBlock?.(selectedBlock.id, selectedBlock.position)}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 rounded text-xs font-medium transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete Block</span>
        </button>
      </div>
    </div>
  );
};
