import React from 'react';
import { X, Copy, Check, Box, Archive } from 'lucide-react';
import { MinecraftBuild } from '../../types/minecraft.ts';
import { calculateMaterialBOM } from '../../lib/schematicExporter.ts';

interface MaterialBOMModalProps {
  build: MinecraftBuild;
  isOpen: boolean;
  onClose: () => void;
}

export const MaterialBOMModal: React.FC<MaterialBOMModalProps> = ({
  build,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const bom = calculateMaterialBOM(build);

  const copyToClipboard = () => {
    const text = [
      `=== MINECRAFT RESOURCE BILL: ${build.name} ===`,
      `Total Blocks: ${bom.totalBlocks.toLocaleString()}`,
      `Total Stacks: ${bom.totalStacks} (${bom.doubleChestsNeeded} Double Chests)`,
      '',
      ...bom.items.map(
        (item) =>
          `- ${item.name}: ${item.count} blocks (${item.stacks} stacks + ${item.remainder})`
      ),
    ].join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="flex flex-col w-full max-w-xl max-h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-100">Material Requirements (BOM)</h3>
            <p className="text-xs text-slate-400">Total resources needed to build in Survival Minecraft</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-3 px-6 py-3 bg-slate-950/60 border-b border-slate-800/80">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900 border border-slate-800">
            <Box className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="text-[11px] text-slate-500 font-mono">TOTAL BLOCKS</div>
              <div className="text-sm font-bold text-slate-100 font-mono tabular-nums">
                {bom.totalBlocks.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900 border border-slate-800">
            <Archive className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <div className="text-[11px] text-slate-500 font-mono">TOTAL STACKS</div>
              <div className="text-sm font-bold text-slate-100 font-mono tabular-nums">
                {bom.totalStacks} <span className="text-xs text-slate-500">(@64)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900 border border-slate-800">
            <Archive className="w-5 h-5 text-sky-400 shrink-0" />
            <div>
              <div className="text-[11px] text-slate-500 font-mono">CHESTS REQ.</div>
              <div className="text-sm font-bold text-slate-100 font-mono tabular-nums">
                {bom.doubleChestsNeeded} <span className="text-xs text-slate-500">double</span>
              </div>
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
          {bom.items.map((item) => (
            <div
              key={item.blockId}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-5 h-5 rounded border border-white/20 shadow-inner shrink-0"
                  style={{ backgroundColor: item.colorHex }}
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-slate-200 truncate">{item.name}</span>
                  <span className="text-[10px] font-mono text-slate-500 truncate">{item.blockId}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-right shrink-0">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {item.count.toLocaleString()} blocks
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {item.stacks > 0 ? `${item.stacks}st ` : ''}
                    {item.remainder > 0 ? `+ ${item.remainder}` : ''}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/50">
          <span className="text-xs text-slate-500">
            Calculated across {bom.items.length} unique Minecraft block types
          </span>
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors font-semibold shadow-md"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied to Clipboard' : 'Copy Resource List'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
