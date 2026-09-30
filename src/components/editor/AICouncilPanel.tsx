import React, { useState } from 'react';
import {
  AgentReport,
  CandidateSolution,
  AgentType,
  ReconstructionProject,
} from '../../types/minecraft';
import {
  Bot,
  Brain,
  Eye,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Layers,
  Sparkles,
  RefreshCw,
  Cpu,
} from 'lucide-react';

interface AICouncilPanelProps {
  councilReports: AgentReport[];
  candidateSolutions: CandidateSolution[];
  project?: ReconstructionProject;
  onRunCouncil?: () => void;
  isLoading?: boolean;
}

export const AICouncilPanel: React.FC<AICouncilPanelProps> = ({
  councilReports,
  candidateSolutions,
  project,
  onRunCouncil,
  isLoading = false,
}) => {
  const [selectedAgent, setSelectedAgent] = useState<AgentType>('hermes');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    status: true,
    observations: true,
    hypotheses: true,
    candidates: true,
  });
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getAgentIcon = (type: AgentType) => {
    switch (type) {
      case 'hermes':
        return <Bot className="w-4 h-4 text-emerald-400" />;
      case 'gpt':
        return <Brain className="w-4 h-4 text-sky-400" />;
      case 'gemini':
        return <Eye className="w-4 h-4 text-purple-400" />;
      case 'grok':
        return <ShieldAlert className="w-4 h-4 text-amber-400" />;
      default:
        return <Cpu className="w-4 h-4 text-slate-400" />;
    }
  };

  const getAgentReport = (type: AgentType): AgentReport | undefined => {
    return councilReports.find((r) => r.agent === type);
  };

  const activeReport = getAgentReport(selectedAgent) || councilReports[0];

  const agentList: { type: AgentType; name: string; role: string }[] = [
    { type: 'hermes', name: 'Hermes', role: 'Coordinator' },
    { type: 'gpt', name: 'GPT', role: 'Architecture' },
    { type: 'gemini', name: 'Gemini', role: 'Vision & Depth' },
    { type: 'grok', name: 'Grok', role: 'Adversarial Critic' },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 text-slate-100 text-xs select-none overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-200">AI Council Workspace</h2>
            <p className="text-[10px] text-slate-400">Hermes Coordinator & Specialists</p>
          </div>
        </div>
        {onRunCouncil && (
          <button
            onClick={onRunCouncil}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded text-[11px] font-medium transition shadow-sm"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Reasoning...' : 'Run Council'}
          </button>
        )}
      </div>

      {/* Specialist Selector Tabs */}
      <div className="grid grid-cols-4 p-1.5 gap-1 bg-slate-950/80 border-b border-slate-800/80">
        {agentList.map(({ type, name, role }) => {
          const report = getAgentReport(type);
          const isSelected = selectedAgent === type;
          const status = report?.status || 'idle';

          return (
            <button
              key={type}
              onClick={() => setSelectedAgent(type)}
              className={`flex flex-col items-center p-1.5 rounded transition ${
                isSelected
                  ? 'bg-slate-800 text-white border border-slate-700 shadow'
                  : 'hover:bg-slate-800/50 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-1">
                {getAgentIcon(type)}
                <span className="font-semibold text-[11px]">{name}</span>
              </div>
              <span className="text-[9px] text-slate-400 truncate w-full text-center mt-0.5">{role}</span>
              <span
                className={`mt-1 px-1 py-0.2 rounded-full text-[8px] font-medium uppercase ${
                  status === 'complete'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : status === 'working'
                    ? 'bg-amber-500/20 text-amber-300 animate-pulse'
                    : status === 'not_configured'
                    ? 'bg-slate-700 text-slate-300'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                {status === 'not_configured' ? 'Local' : status}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Agent View Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {activeReport ? (
          <>
            {/* Agent Summary Banner */}
            <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/60 flex items-start gap-2.5">
              <div className="p-1.5 rounded-md bg-slate-800 border border-slate-700 mt-0.5">
                {getAgentIcon(activeReport.agent)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-200 text-[11px]">{activeReport.agentName}</h3>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    Conf: {(activeReport.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">{activeReport.role}</p>
                {activeReport.recommendedNextAction && (
                  <div className="mt-2 text-[10px] bg-slate-900/80 p-2 rounded border border-slate-800 text-slate-300">
                    <span className="text-emerald-400 font-medium">Directive:</span> {activeReport.recommendedNextAction}
                  </div>
                )}
              </div>
            </div>

            {/* Observations Section */}
            {activeReport.observations && activeReport.observations.length > 0 && (
              <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/40">
                <button
                  onClick={() => toggleSection('observations')}
                  className="w-full p-2 flex items-center justify-between bg-slate-900/60 hover:bg-slate-900 transition"
                >
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-sky-400" />
                    Observed Visual Regions ({activeReport.observations.length})
                  </span>
                  {expandedSections.observations ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
                {expandedSections.observations && (
                  <div className="p-2 space-y-1.5">
                    {activeReport.observations.map((obs) => (
                      <div
                        key={obs.regionId}
                        onClick={() => setSelectedRegionId(obs.regionId === selectedRegionId ? null : obs.regionId)}
                        className={`p-2 rounded border transition cursor-pointer ${
                          selectedRegionId === obs.regionId
                            ? 'bg-slate-800 border-sky-500'
                            : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-200">{obs.regionId}</span>
                          <span className="text-[9px] px-1.5 py-0.5 bg-slate-800 rounded text-slate-400 uppercase">
                            {obs.semanticType}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1 mt-1 text-[9px] text-slate-400">
                          <div>Depth: {obs.estimatedDepth}m</div>
                          <div>Thick: {obs.thickness}m</div>
                          <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full border border-slate-600 inline-block" style={{ backgroundColor: obs.color }} />
                            <span>{obs.color}</span>
                          </div>
                        </div>
                        <div className="text-[9px] text-slate-300 mt-1 italic">
                          Texture: {obs.textureType} • Geometry: {obs.geometry}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Hypotheses & Adversarial Critiques */}
            {activeReport.hypotheses && activeReport.hypotheses.length > 0 && (
              <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/40">
                <button
                  onClick={() => toggleSection('hypotheses')}
                  className="w-full p-2 flex items-center justify-between bg-slate-900/60 hover:bg-slate-900 transition"
                >
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Brain className="w-3.5 h-3.5 text-purple-400" />
                    Specialist Hypotheses & Challenges ({activeReport.hypotheses.length})
                  </span>
                  {expandedSections.hypotheses ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
                {expandedSections.hypotheses && (
                  <div className="p-2 space-y-2">
                    {activeReport.hypotheses.map((hyp) => (
                      <div key={hyp.id} className="p-2 bg-slate-900/60 border border-slate-800/80 rounded space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-slate-200">{hyp.id}</span>
                          <span className="text-[9px] text-purple-400 font-mono font-medium">
                            {(hyp.probability * 100).toFixed(0)}% Prob
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-300">{hyp.description}</p>
                        <div className="text-[9px] text-slate-400 bg-slate-950/60 p-1.5 rounded border border-slate-800/60">
                          <span className="text-slate-500 font-medium">Rationale:</span> {hyp.rationale}
                        </div>
                        {hyp.candidateBlockIds && hyp.candidateBlockIds.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {hyp.candidateBlockIds.map((b) => (
                              <span key={b} className="text-[8px] px-1 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 font-mono">
                                {b.replace('minecraft:', '')}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Candidate Solutions Section */}
            {candidateSolutions && candidateSolutions.length > 0 && (
              <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/40">
                <button
                  onClick={() => toggleSection('candidates')}
                  className="w-full p-2 flex items-center justify-between bg-slate-900/60 hover:bg-slate-900 transition"
                >
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Solved Minecraft Candidates ({candidateSolutions.length})
                  </span>
                  {expandedSections.candidates ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
                {expandedSections.candidates && (
                  <div className="p-2 space-y-2">
                    {candidateSolutions.map((cand) => (
                      <div key={cand.id} className="p-2 bg-slate-900/70 border border-slate-800 rounded space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-200">{cand.id}</span>
                          <span className="text-[10px] text-emerald-400 font-mono font-bold">
                            Score: {(cand.scores.overallScore * 100).toFixed(0)}%
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-300">{cand.why}</p>

                        {/* Measurable Dimensions Breakdown */}
                        <div className="grid grid-cols-4 gap-1 p-1.5 bg-slate-950 rounded border border-slate-800 text-[8px] font-mono text-slate-400">
                          <div>Vis: {(cand.scores.visualSimilarity * 100).toFixed(0)}%</div>
                          <div>Tex: {(cand.scores.textureSimilarity * 100).toFixed(0)}%</div>
                          <div>Geo: {(cand.scores.geometrySimilarity * 100).toFixed(0)}%</div>
                          <div>Dep: {(cand.scores.depthSimilarity * 100).toFixed(0)}%</div>
                        </div>

                        {/* Multi-Block Combination */}
                        <div className="space-y-1 mt-1">
                          <span className="text-[9px] text-slate-400 uppercase font-semibold">
                            {cand.isMultiBlock ? 'Multi-Block Ensemble' : 'Single Block'}
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {cand.blocks.map((blk, idx) => (
                              <div key={idx} className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 bg-slate-800/80 border border-slate-700/80 rounded font-mono text-emerald-300">
                                <span>{blk.blockId.replace('minecraft:', '')}</span>
                                {blk.state && (
                                  <span className="text-slate-400 text-[8px]">
                                    ({Object.entries(blk.state).map(([k, v]) => `${k}=${v}`).join(',')})
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="p-4 text-center text-slate-500">
            <AlertCircle className="w-5 h-5 mx-auto mb-1 text-slate-600" />
            No active agent reports found. Run Council to trigger multi-agent analysis.
          </div>
        )}
      </div>

      {/* Footer / Deterministic Validator Seal */}
      <div className="p-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          Deterministic Engine Authoritative
        </span>
        <span className="text-slate-500">Java 1.20/1.21</span>
      </div>
    </div>
  );
};
