import React, { useState } from 'react';
import {
  Building2,
  CheckCircle2,
  Columns,
  Layers,
  Palette,
  Maximize2,
  RefreshCw,
  X,
  Sparkles,
  GitBranch,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ReferenceBuilding, IterationStepReport } from '../../types/minecraft.ts';

interface ReconstructionAnalysisPanelProps {
  referenceBuilding?: ReferenceBuilding;
  iterationHistory?: IterationStepReport[];
  viewsDetected?: { view: string; confidence: number; imageId: string }[];
  isOpen: boolean;
  onClose: () => void;
}

export const ReconstructionAnalysisPanel: React.FC<ReconstructionAnalysisPanelProps> = ({
  referenceBuilding,
  iterationHistory,
  viewsDetected,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'materials' | 'iterations' | 'provenance'>('architecture');

  if (!isOpen || !referenceBuilding) return null;

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden text-slate-100 text-xs">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-800 bg-slate-950/60">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-slate-100 font-mono">Reconstruction Analysis</span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-slate-800 bg-slate-950/40 p-1">
        <button
          onClick={() => setActiveTab('architecture')}
          className={`flex-1 py-1 px-2 rounded font-medium transition-colors ${
            activeTab === 'architecture' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Architecture
        </button>
        <button
          onClick={() => setActiveTab('materials')}
          className={`flex-1 py-1 px-2 rounded font-medium transition-colors ${
            activeTab === 'materials' ? 'bg-slate-800 text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Materials
        </button>
        <button
          onClick={() => setActiveTab('iterations')}
          className={`flex-1 py-1 px-2 rounded font-medium transition-colors ${
            activeTab === 'iterations' ? 'bg-slate-800 text-purple-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Convergence
        </button>
        <button
          onClick={() => setActiveTab('provenance')}
          className={`flex-1 py-1 px-2 rounded font-medium transition-colors ${
            activeTab === 'provenance' ? 'bg-slate-800 text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Provenance
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3.5">
        {activeTab === 'architecture' && (
          <div className="space-y-3">
            {/* Dimensions */}
            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1.5 font-mono">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Estimated Dimensions</span>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">WIDTH</span>
                  <span className="text-emerald-400 font-bold text-sm">{referenceBuilding.overallWidth}m</span>
                </div>
                <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">HEIGHT</span>
                  <span className="text-emerald-400 font-bold text-sm">{referenceBuilding.overallHeight}m</span>
                </div>
                <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">DEPTH</span>
                  <span className="text-emerald-400 font-bold text-sm">{referenceBuilding.estimatedDepth}m</span>
                </div>
              </div>
            </div>

            {/* Symmetry & Repeated Elements */}
            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Detected Symmetry</span>
                <span className="text-emerald-400 font-mono font-bold">
                  {referenceBuilding.symmetry.hasBilateralSymmetry ? 'Bilateral (X-Axis)' : 'Asymmetric'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Symmetry Confidence</span>
                <span className="text-slate-200 font-mono">{Math.round(referenceBuilding.symmetry.confidence * 100)}%</span>
              </div>
            </div>

            {/* Facade Bays */}
            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1.5">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono block">
                Facade Bays & Openings ({referenceBuilding.facadeBays.length} Detected)
              </span>
              <div className="space-y-1">
                {referenceBuilding.facadeBays.map((bay, i) => (
                  <div key={i} className="flex items-center justify-between p-1.5 bg-slate-900/80 rounded border border-slate-800 text-[11px]">
                    <span className="text-slate-300 font-mono capitalize">
                      Bay {i + 1}: {bay.type.replace('_', ' ')}
                    </span>
                    <span className="text-emerald-400 font-mono capitalize">{bay.archStyle} Arch</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Roof Canopy */}
            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1 text-[11px] font-mono">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Roof Vault Canopy</span>
              <div className="flex justify-between text-slate-300">
                <span>Profile:</span>
                <span className="text-purple-400 capitalize">{referenceBuilding.roof.shape.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Rib Count:</span>
                <span className="text-emerald-400">{referenceBuilding.roof.ribCount} Structural Ribs</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'materials' && (
          <div className="space-y-2">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono block">
              Reference Feature → Minecraft Material Mapping
            </span>
            <div className="space-y-1.5">
              {referenceBuilding.materialMapping.map((mat, i) => (
                <div key={i} className="p-2 bg-slate-950/70 rounded-lg border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">{mat.referenceFeature}</span>
                    <span className="text-[10px] font-mono text-emerald-400">{mat.detectedColor}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>Mapped Block:</span>
                    <span className="text-cyan-300 font-bold">{mat.bestBlockId.replace('minecraft:', '')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'iterations' && (
          <div className="space-y-2">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono block">
              Render-vs-Reference Iterative Convergence
            </span>
            <div className="space-y-1.5">
              {(iterationHistory || []).map((step) => (
                <div key={step.iteration} className="p-2 bg-slate-950/70 rounded-lg border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between font-mono">
                    <span className="font-bold text-emerald-400">
                      Iteration {step.iteration}: {step.stepName}
                    </span>
                    {step.converged ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        Converged
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500">Refining...</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">{step.description}</p>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800/60">
                    <span>Silhouette Match: {Math.round(step.silhouetteOverlapScore * 100)}%</span>
                    <span>Proportions Error: {Math.round(step.proportionsError * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'provenance' && (
          <div className="space-y-3 font-mono">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
              Block Observation Provenance
            </span>

            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-emerald-400 font-bold">Observed from Reference</span>
                  <span className="text-emerald-400">{referenceBuilding.provenanceSummary.observedPercent}%</span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div className="bg-emerald-500 h-full" style={{ width: `${referenceBuilding.provenanceSummary.observedPercent}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-sky-400 font-bold">Inferred via Symmetry & Continuation</span>
                  <span className="text-sky-400">{referenceBuilding.provenanceSummary.inferredPercent}%</span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div className="bg-sky-500 h-full" style={{ width: `${referenceBuilding.provenanceSummary.inferredPercent}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-purple-400 font-bold">AI Generated Context</span>
                  <span className="text-purple-400">{referenceBuilding.provenanceSummary.generatedPercent}%</span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div className="bg-purple-500 h-full" style={{ width: `${referenceBuilding.provenanceSummary.generatedPercent}%` }} />
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[10px] text-slate-400 space-y-1">
              <span className="font-bold text-slate-300 block">Strict Reconstruction Guarantee:</span>
              <p>Visible front facade, arches, and columns have 100% observed authority. Hidden sides and back use symmetrical architectural continuation rather than random block placement.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
