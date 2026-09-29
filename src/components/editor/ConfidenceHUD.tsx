import React, { useState } from 'react';
import { ShieldCheck, RefreshCw, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { ConfidenceReport } from '../../types/minecraft.ts';

interface ConfidenceHUDProps {
  confidence: ConfidenceReport;
  onReconstructRegion?: (region: string) => void;
}

export const ConfidenceHUD: React.FC<ConfidenceHUDProps> = ({
  confidence,
  onReconstructRegion,
}) => {
  const [expanded, setExpanded] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 0.85) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (score >= 0.65) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  };

  const getBarColor = (score: number) => {
    if (score >= 0.85) return 'bg-emerald-500';
    if (score >= 0.65) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const overallPercent = Math.round((confidence?.overall ?? 0.88) * 100);

  return (
    <div className="flex flex-col bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl shadow-xl text-slate-200 overflow-hidden w-64">
      {/* Header Banner */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between p-3 hover:bg-slate-800/40 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
              Reconstruction
            </span>
            <span className="text-xs font-bold text-slate-100">
              Confidence {overallPercent}%
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className={`px-2 py-0.5 text-[11px] font-mono font-bold rounded border ${getScoreColor(
              confidence?.overall ?? 0.88
            )}`}
          >
            {overallPercent}%
          </span>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </div>
      </button>

      {/* Expanded Breakdown */}
      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-slate-800/80 space-y-2.5">
          <div className="space-y-1.5 text-xs">
            {/* Front */}
            <div>
              <div className="flex justify-between text-[11px] mb-0.5">
                <span className="text-slate-400">Front Facade</span>
                <span className="font-mono text-slate-200">
                  {Math.round((confidence?.front ?? 0.95) * 100)}%
                </span>
              </div>
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getBarColor(confidence?.front ?? 0.95)}`}
                  style={{ width: `${Math.round((confidence?.front ?? 0.95) * 100)}%` }}
                />
              </div>
            </div>

            {/* Roof */}
            <div>
              <div className="flex justify-between text-[11px] mb-0.5">
                <span className="text-slate-400">Roof Geometry</span>
                <span className="font-mono text-slate-200">
                  {Math.round((confidence?.roof ?? 0.91) * 100)}%
                </span>
              </div>
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getBarColor(confidence?.roof ?? 0.91)}`}
                  style={{ width: `${Math.round((confidence?.roof ?? 0.91) * 100)}%` }}
                />
              </div>
            </div>

            {/* Sides */}
            <div>
              <div className="flex justify-between text-[11px] mb-0.5">
                <span className="text-slate-400">Side Elevation</span>
                <span className="font-mono text-slate-200">
                  {Math.round((confidence?.sides ?? 0.82) * 100)}%
                </span>
              </div>
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getBarColor(confidence?.sides ?? 0.82)}`}
                  style={{ width: `${Math.round((confidence?.sides ?? 0.82) * 100)}%` }}
                />
              </div>
            </div>

            {/* Rear / Hidden */}
            <div>
              <div className="flex justify-between text-[11px] mb-0.5">
                <span className="text-slate-400">Rear (Inferred)</span>
                <span className="font-mono text-amber-400">
                  {Math.round((confidence?.rear ?? 0.45) * 100)}%
                </span>
              </div>
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getBarColor(confidence?.rear ?? 0.45)}`}
                  style={{ width: `${Math.round((confidence?.rear ?? 0.45) * 100)}%` }}
                />
              </div>
            </div>

            {/* Materials */}
            <div>
              <div className="flex justify-between text-[11px] mb-0.5">
                <span className="text-slate-400">Material Classification</span>
                <span className="font-mono text-slate-200">
                  {Math.round((confidence?.materials ?? 0.94) * 100)}%
                </span>
              </div>
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getBarColor(confidence?.materials ?? 0.94)}`}
                  style={{ width: `${Math.round((confidence?.materials ?? 0.94) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[10px] text-slate-400">
            <AlertCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>Rear geometry inferred using architectural symmetry rules.</span>
          </div>

          <button
            onClick={() => onReconstructRegion?.('rear')}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Re-optimize Structure</span>
          </button>
        </div>
      )}
    </div>
  );
};
