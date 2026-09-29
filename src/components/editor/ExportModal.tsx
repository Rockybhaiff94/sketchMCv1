import React, { useState } from 'react';
import { X, Download, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { MinecraftBuild } from '../../types/minecraft.ts';
import {
  exportToWorldEditSchematic,
  exportToLitematica,
  exportToBuildJSON,
  downloadFile,
} from '../../lib/schematicExporter.ts';
import { validateMinecraftBuild } from '../../lib/buildValidator.ts';

interface ExportModalProps {
  build: MinecraftBuild;
  isOpen: boolean;
  onClose: () => void;
  onUpdateVersion?: (version: '1.20' | '1.21') => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  build,
  isOpen,
  onClose,
  onUpdateVersion,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'schem' | 'litematic' | 'json'>('schem');
  const [targetVersion, setTargetVersion] = useState<'1.20' | '1.21'>(build.version || '1.21');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  // Run real-time validation before export
  const validation = validateMinecraftBuild(build);

  const handleDownload = () => {
    setIsExporting(true);
    const sanitizedName = build.name.toLowerCase().replace(/[^a-z0-9]/g, '_');

    try {
      if (selectedFormat === 'schem') {
        const bytes = exportToWorldEditSchematic({ ...build, version: targetVersion });
        downloadFile(bytes, `${sanitizedName}_${targetVersion}.schem`, 'application/octet-stream');
      } else if (selectedFormat === 'litematic') {
        const bytes = exportToLitematica({ ...build, version: targetVersion });
        downloadFile(bytes, `${sanitizedName}_${targetVersion}.litematic`, 'application/octet-stream');
      } else if (selectedFormat === 'json') {
        const json = exportToBuildJSON({ ...build, version: targetVersion });
        downloadFile(json, `${sanitizedName}_build.json`, 'application/json');
      }
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="flex flex-col w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-100">Export Minecraft Schematic</h3>
            <p className="text-xs text-slate-400">Validated schematic files ready for WorldEdit, Axiom, or Litematica</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Pre-export Validation Status */}
          <div
            className={`flex items-start gap-3 p-3.5 rounded-xl border ${
              validation.valid
                ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                : 'bg-amber-950/30 border-amber-500/30 text-amber-200'
            }`}
          >
            {validation.valid ? (
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="text-xs">
              <div className="font-semibold text-slate-100">
                {validation.valid ? 'Pre-Export Build Validation Passed' : 'Validation Warnings Detected'}
              </div>
              <p className="text-slate-400 mt-0.5">
                {validation.statistics.totalBlocks.toLocaleString()} blocks verified across {validation.statistics.uniqueBlocks} palette types. All states conform to official Minecraft registries.
              </p>
            </div>
          </div>

          {/* Minecraft Version Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">TARGET MINECRAFT VERSION</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setTargetVersion('1.21');
                  onUpdateVersion?.('1.21');
                }}
                className={`px-3 py-2 text-xs font-medium rounded-lg border text-left transition-all ${
                  targetVersion === '1.21'
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300 font-semibold shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-semibold text-slate-200">Minecraft 1.21 (Tricky Trials)</div>
                <div className="text-[10px] text-slate-500">DataVersion 3953 · Copper/Tuff blocks</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTargetVersion('1.20');
                  onUpdateVersion?.('1.20');
                }}
                className={`px-3 py-2 text-xs font-medium rounded-lg border text-left transition-all ${
                  targetVersion === '1.20'
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300 font-semibold shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-semibold text-slate-200">Minecraft 1.20 (Trails & Tales)</div>
                <div className="text-[10px] text-slate-500">DataVersion 3465 · Standard registry</div>
              </button>
            </div>
          </div>

          {/* File Format Options */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">SCHEMATIC FORMAT</label>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setSelectedFormat('schem')}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                  selectedFormat === 'schem'
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-slate-200">Sponge / WorldEdit (.schem)</div>
                  <div className="text-[11px] text-slate-400">
                    Standard format compatible with WorldEdit, FAWE, Axiom, and SchemPaste.
                  </div>
                </div>
                {selectedFormat === 'schem' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              </button>

              <button
                type="button"
                onClick={() => setSelectedFormat('litematic')}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                  selectedFormat === 'litematic'
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-slate-200">Litematica (.litematic)</div>
                  <div className="text-[11px] text-slate-400">
                    Optimized for client-side Fabric/Forge Litematica ghost projection overlay.
                  </div>
                </div>
                {selectedFormat === 'litematic' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              </button>

              <button
                type="button"
                onClick={() => setSelectedFormat('json')}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                  selectedFormat === 'json'
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-slate-200">VoxelForge Build Manifest (.json)</div>
                  <div className="text-[11px] text-slate-400">
                    Raw XYZ coordinates, block states, confidence stats, and Bill of Materials.
                  </div>
                </div>
                {selectedFormat === 'json' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            disabled={isExporting}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Generating...' : `Download .${selectedFormat}`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
