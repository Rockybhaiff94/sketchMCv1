/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Boxes,
  Upload,
  Layers,
  Sparkles,
  FileDown,
  Calculator,
  Sliders,
  ChevronRight,
  Maximize2,
  SlidersHorizontal,
  Palette,
  Box,
  Grid,
  FileCode2,
  Building2,
  Bot,
  Database,
} from 'lucide-react';
import {
  MinecraftBuild,
  BlockPlacement,
  ReferenceImageItem,
  ReconstructionSettings,
  ReferenceBuilding,
  IterationStepReport,
  AgentReport,
  CandidateSolution,
  Neutral3DModel,
  DepthModel,
  Observation,
  ReconstructionProject,
} from './types/minecraft.ts';
import { PRESET_BUILDINGS, generatePresetBuild } from './lib/presets.ts';
import { ThreeViewport, ToolMode, ShadingMode } from './components/viewport/ThreeViewport.tsx';
import { Toolbar } from './components/editor/Toolbar.tsx';
import { LayerSliceBar } from './components/editor/LayerSliceBar.tsx';
import { BlockPaletteSelector } from './components/editor/BlockPaletteSelector.tsx';
import { BlockStateInspector } from './components/editor/BlockStateInspector.tsx';
import { MaterialBOMModal } from './components/editor/MaterialBOMModal.tsx';
import { ExportModal } from './components/editor/ExportModal.tsx';
import { AIAssistantPanel } from './components/editor/AIAssistantPanel.tsx';
import { ConfidenceHUD } from './components/editor/ConfidenceHUD.tsx';
import { Schematic2DModal } from './components/editor/Schematic2DModal.tsx';
import { ImageUploadModal } from './components/upload/ImageUploadModal.tsx';
import { ReconstructionAnalysisPanel } from './components/editor/ReconstructionAnalysisPanel.tsx';
import { AICouncilPanel } from './components/editor/AICouncilPanel.tsx';
import { VisualDebugModal } from './components/editor/VisualDebugModal.tsx';
import { MinecraftVersionModal } from './components/editor/MinecraftVersionModal.tsx';
import { buildNeutral3DModel } from './lib/geometry/neutralModelBuilder.ts';
import { CandidateSolver } from './lib/reconstruction/candidateSolver.ts';
import { ConstructionPatternDatabase } from './lib/schematics/patternDatabase.ts';
import { UniversalReconstructor } from './lib/reconstruction/universalReconstructor.ts';
import {
  createReconstructionIdentity,
  setCurrentReconstructionId,
  isResultStale,
  buildCacheKey,
  getCachedResult,
  setCachedResult,
  addToHistory,
  getReconstructionHistory,
  computeImageHash,
  type ReconstructionIdentity,
  type ReconstructionHistoryEntry,
} from './lib/reconstruction/reconstructionContext.ts';

type AppTab = 'workbench' | 'gallery';
type RightPanelTab = 'palette' | 'inspector';

export default function App() {
  // Navigation & View
  const [activeTab, setActiveTab] = useState<AppTab>('workbench');
  const [rightPanelTab, setRightPanelTab] = useState<RightPanelTab>('palette');
  const [selectedVersion, setSelectedVersion] = useState<'1.20' | '1.21'>('1.21');
  const [shadingMode, setShadingMode] = useState<ShadingMode>('material');

  // Core Build State (Initialized with Glass Garden Conservatory as premier reference)
  const [currentBuild, setCurrentBuild] = useState<MinecraftBuild>(() =>
    generatePresetBuild('glass_garden_conservatory', 1.0, '1.21')
  );

  // Multi-Agent Council & Neutral 3D Model State
  const [isAICouncilOpen, setIsAICouncilOpen] = useState(false);
  const [isVisualDebugOpen, setIsVisualDebugOpen] = useState(false);
  const [councilReports, setCouncilReports] = useState<AgentReport[]>([]);
  const [candidateSolutions, setCandidateSolutions] = useState<CandidateSolution[]>([]);
  const [neutralModel, setNeutralModel] = useState<Neutral3DModel | undefined>();
  const [depthModel, setDepthModel] = useState<DepthModel | undefined>();
  const [currentProject, setCurrentProject] = useState<ReconstructionProject | undefined>();

  // History State for Undo/Redo
  const [history, setHistory] = useState<MinecraftBuild[]>([
    generatePresetBuild('glass_garden_conservatory', 1.0, '1.21'),
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Editor Tools & Selection
  const [activeTool, setActiveTool] = useState<ToolMode>('select');
  const [selectedBlockId, setSelectedBlockId] = useState<string>('minecraft:smooth_quartz');
  const [selectedBlockPlacement, setSelectedBlockPlacement] = useState<BlockPlacement | null>(null);
  const [hoveredCoords, setHoveredCoords] = useState<{ x: number; y: number; z: number } | null>(null);

  // Slicer State
  const maxHeight = Math.max(1, currentBuild.dimensions.height);
  const [currentLayerSlice, setCurrentLayerSlice] = useState<number>(maxHeight);

  // Modals & Drawers
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isBOMModalOpen, setIsBOMModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSchematic2DOpen, setIsSchematic2DOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isAnalysisPanelOpen, setIsAnalysisPanelOpen] = useState(false);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);

  // Upload & Reconstruction Pipeline Job State
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isApplyingPrompt, setIsApplyingPrompt] = useState(false);

  // Push new state to history
  const pushHistory = useCallback(
    (newBuild: MinecraftBuild) => {
      setHistory((prev) => {
        const sliced = prev.slice(0, historyIndex + 1);
        return [...sliced, newBuild];
      });
      setHistoryIndex((prev) => prev + 1);
      setCurrentBuild(newBuild);
    },
    [historyIndex]
  );

  // Undo / Redo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCurrentBuild(history[newIndex]);
      setSelectedBlockPlacement(null);
    }
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCurrentBuild(history[newIndex]);
      setSelectedBlockPlacement(null);
    }
  }, [historyIndex, history]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'v' || e.key === 'V') {
        setActiveTool('select');
      } else if (e.key === 'b' || e.key === 'B') {
        setActiveTool('paint');
      } else if (e.key === 'a' || e.key === 'A') {
        setActiveTool('add');
      } else if (e.key === 'e' || e.key === 'E') {
        setActiveTool('delete');
      } else if (e.key === 'i' || e.key === 'I') {
        setActiveTool('eyedropper');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Initialize Neutral 3D Model, Candidates, and Multi-Agent Council for initial reference
  useEffect(() => {
    if (currentBuild.metadata.referenceBuilding) {
      const { neutralModel: nm, depthModel: dm } = buildNeutral3DModel(
        currentBuild.metadata.referenceBuilding,
        1.0
      );
      setNeutralModel(nm);
      setDepthModel(dm);

      const db = ConstructionPatternDatabase.getInstance();
      const patterns = db.searchPatterns({ category: 'all' });
      const obs = nm.components.map((c) => ({
        regionId: c.id,
        semanticType: c.type,
        estimatedDepth: c.bounds.min.z,
        thickness: c.thickness,
        material: c.materialRegionId,
        color: '#343438',
        textureType: 'brick',
        transparency: 0,
        geometry: c.type,
        observedOrInferred: 'observed' as const,
        confidence: 0.95,
      }));

      const cands = CandidateSolver.generateAndSolveCandidates({
        observations: obs,
        hypotheses: [],
        schematicPatterns: patterns,
        targetVersion: selectedVersion,
      });
      setCandidateSolutions(cands);

      setCouncilReports([
        {
          agent: 'hermes',
          agentName: 'Hermes Lead Coordinator',
          role: 'Lead AI Systems Architect & Co-Worker',
          taskId: 'task_init',
          analysisType: 'orchestrate',
          status: 'complete',
          observations: obs,
          hypotheses: [
            {
              id: 'hypo_h_init',
              description: 'Classical framed conservatory with 3 facade bays, rose stained vault canopy, and fluted piers.',
              candidateBlockIds: ['minecraft:deepslate_tiles', 'minecraft:pink_stained_glass'],
              probability: 0.98,
              rationale: 'Council consensus reached.',
            },
          ],
          candidateSolutions: cands,
          confidence: 0.96,
          uncertainties: [],
          evidence: [],
          recommendedNextAction: 'Ready for block editing or multi-agent calibration.',
        },
        {
          agent: 'gpt',
          agentName: 'GPT Architecture Specialist',
          role: 'Architecture & Spatial Reasoning',
          taskId: 'task_init_gpt',
          analysisType: 'architectural_reasoning',
          status: 'complete',
          observations: obs,
          hypotheses: [
            {
              id: 'hypo_gpt_init',
              description: 'Tripartite modular symmetry verified. Pilasters project 0.5m forward from glazing.',
              candidateBlockIds: ['minecraft:deepslate_tiles'],
              probability: 0.95,
              rationale: 'Bilateral rhythm verified.',
            },
          ],
          candidateSolutions: cands,
          confidence: 0.95,
          uncertainties: [],
          evidence: [],
        },
        {
          agent: 'gemini',
          agentName: 'Gemini Vision Specialist',
          role: 'Vision, Depth & Occlusion',
          taskId: 'task_init_gemini',
          analysisType: 'vision_depth',
          status: 'complete',
          observations: obs,
          hypotheses: [
            {
              id: 'hypo_gem_init',
              description: '4 depth planes detected: foreground foliage, facade piers, inset glazing, and canopy vault.',
              candidateBlockIds: ['minecraft:pink_stained_glass', 'minecraft:light_blue_stained_glass_pane'],
              probability: 0.94,
              rationale: 'Depth gradient confirmed.',
            },
          ],
          candidateSolutions: [],
          confidence: 0.94,
          uncertainties: [],
          evidence: [],
        },
        {
          agent: 'grok',
          agentName: 'Grok Adversarial Critic',
          role: 'Independent Adversarial Critic',
          taskId: 'task_init_grok',
          analysisType: 'adversarial_critique',
          status: 'complete',
          observations: obs,
          hypotheses: [
            {
              id: 'hypo_grok_init',
              description: 'Deepslate tiles provide superior mortar line frequency over standard deepslate bricks.',
              candidateBlockIds: ['minecraft:deepslate_tiles', 'minecraft:polished_blackstone_bricks'],
              probability: 0.92,
              rationale: 'Challenged basic brick assumption.',
            },
          ],
          candidateSolutions: [],
          confidence: 0.92,
          uncertainties: [],
          evidence: [],
        },
      ]);
    }
  }, []);

  const handleRunCouncilOrchestration = async () => {
    setIsProcessing(true);
    setProcessingStep('Hermes orchestrating specialists (Gemini, GPT, Grok)...');
    setProcessingProgress(40);
    try {
      const response = await fetch('/api/ai/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: [],
          scale: 1.0,
          version: selectedVersion,
          customPrompt: 'Calibrate facade and verify depth layers',
        }),
      });
      if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
        const data = await response.json();
        if (data.success && data.project) {
          setCurrentProject(data.project);
          if (data.councilReports) setCouncilReports(data.councilReports);
          if (data.project.candidateSolutions) setCandidateSolutions(data.project.candidateSolutions);
          if (data.project.neutralModel) setNeutralModel(data.project.neutralModel);
          if (data.project.depthModel) setDepthModel(data.project.depthModel);
          if (data.project.currentBuild) {
            pushHistory(data.project.currentBuild);
          }
        }
      }
    } catch (err: any) {
      console.warn('Orchestration error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Block Selection - Automatically switches right panel tab to inspector
  const handleSelectBlock = (block: BlockPlacement | null) => {
    setSelectedBlockPlacement(block);
    if (block) {
      setRightPanelTab('inspector');
    }
  };

  // Tool Actions in 3D
  const handleAddBlock = (position: { x: number; y: number; z: number }, blockId: string) => {
    const newBlock: BlockPlacement = {
      id: `blk_manual_${Date.now()}_${position.x}_${position.y}_${position.z}`,
      blockId,
      position,
    };
    const updatedBuild: MinecraftBuild = {
      ...currentBuild,
      blocks: [...currentBuild.blocks, newBlock],
    };
    pushHistory(updatedBuild);
  };

  const handleDeleteBlock = (blockId: string, position: { x: number; y: number; z: number }) => {
    const filtered = currentBuild.blocks.filter(
      (b) => !(b.position.x === position.x && b.position.y === position.y && b.position.z === position.z)
    );
    const updatedBuild: MinecraftBuild = {
      ...currentBuild,
      blocks: filtered,
    };
    pushHistory(updatedBuild);
    setSelectedBlockPlacement(null);
  };

  const handlePaintBlock = (position: { x: number; y: number; z: number }, newBlockId: string) => {
    const updatedBlocks = currentBuild.blocks.map((b) => {
      if (b.position.x === position.x && b.position.y === position.y && b.position.z === position.z) {
        return { ...b, blockId: newBlockId };
      }
      return b;
    });
    const updatedBuild: MinecraftBuild = {
      ...currentBuild,
      blocks: updatedBlocks,
    };
    pushHistory(updatedBuild);
  };

  const handleUpdateBlockState = (
    position: { x: number; y: number; z: number },
    newState: Record<string, string>
  ) => {
    const updatedBlocks = currentBuild.blocks.map((b) => {
      if (b.position.x === position.x && b.position.y === position.y && b.position.z === position.z) {
        const updated = { ...b, state: newState };
        setSelectedBlockPlacement(updated);
        return updated;
      }
      return b;
    });
    const updatedBuild: MinecraftBuild = {
      ...currentBuild,
      blocks: updatedBlocks,
    };
    pushHistory(updatedBuild);
  };

  const handleEyedropperPick = (blockId: string) => {
    setSelectedBlockId(blockId);
    setActiveTool('paint');
  };

  // Start Multi-Stage AI Reconstruction Job
  // Uses reconstruction identity to prevent race conditions and preserve history.
  const handleStartReconstruction = async (data: {
    images: ReferenceImageItem[];
    presetId?: string;
    settings: ReconstructionSettings;
  }) => {
    setIsProcessing(true);
    setProcessingProgress(10);
    setProcessingStep('Creating reconstruction identity...');

    try {
      // 1. Create unique reconstruction identity from image content hash
      const primaryImage = data.images[0];
      const imageData = primaryImage?.dataUrl || `preset:${data.presetId || 'none'}`;
      const version = data.settings?.minecraftVersion || selectedVersion;
      const identity = await createReconstructionIdentity(imageData, version);
      setCurrentReconstructionId(identity.reconstructionId);

      // 2. Check cache for identical reconstruction
      const cacheKey = buildCacheKey({
        imageHash: identity.imageHash,
        minecraftVersion: version,
        scale: data.settings?.customScaleMultiplier || 1.0,
        mode: data.settings?.referenceMode || 'architecture_environment',
        quality: data.settings?.accuracy || 'high_detail',
        pipelineVersion: identity.pipelineVersion,
      });

      const cached = getCachedResult(cacheKey);
      if (cached) {
        console.info('Cache hit for identical reconstruction parameters');
        if (!isResultStale(identity.reconstructionId)) {
          applyReconstructionResult(cached, identity);
        }
        return;
      }

      setProcessingProgress(15);
      setProcessingStep('Analyzing reference image...');

      let resData: any = null;

      try {
        const response = await fetch('/api/reconstruct', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            images: data.images,
            presetId: data.presetId,
            settings: data.settings,
            scale: data.settings?.customScaleMultiplier || 1.0,
            version,
            reconstructionId: identity.reconstructionId,
          }),
        });

        const contentType = response.headers.get('content-type') || '';
        if (response.ok && contentType.includes('application/json')) {
          resData = await response.json();
        } else {
          console.warn(`Backend returned non-OK or non-JSON status ${response.status} (${contentType})`);
        }
      } catch (fetchErr) {
        console.warn('Backend /api/reconstruct unreachable, running local client-side reconstruction engine:', fetchErr);
      }

      // Stale check: if user uploaded another image while we were waiting, abort
      if (isResultStale(identity.reconstructionId)) {
        console.info(`Reconstruction ${identity.reconstructionId} is stale, discarding result`);
        setIsProcessing(false);
        return;
      }

      // If backend did not respond with success, run client-side fallback
      if (!resData || !resData.success) {
        setProcessingProgress(45);
        setProcessingStep('Running client-side reconstruction engine...');
        console.info('Executing client-side UniversalReconstructor engine fallback...');
        const clientRes = await UniversalReconstructor.reconstruct(
          data.images || [],
          data.settings || {
            minecraftVersion: version,
            customScaleMultiplier: 1.0,
          }
        );
        resData = {
          success: true,
          build: clientRes.build,
          semanticSubject: clientRes.semanticSubject,
          fidelityReport: clientRes.fidelityReport,
          councilReports: clientRes.councilReports,
          validation: clientRes.validation,
        };
      }

      // Second stale check after async work
      if (isResultStale(identity.reconstructionId)) {
        console.info(`Reconstruction ${identity.reconstructionId} is stale after processing, discarding`);
        setIsProcessing(false);
        return;
      }

      // Cache the result for identical future requests
      setCachedResult(cacheKey, resData);

      setProcessingProgress(100);
      setProcessingStep('Reconstruction complete!');

      setTimeout(() => {
        // Final stale check before applying to UI
        if (isResultStale(identity.reconstructionId)) {
          setIsProcessing(false);
          return;
        }
        applyReconstructionResult(resData, identity);
      }, 400);
    } catch (err: any) {
      console.error(err);
      alert(`Reconstruction error: ${err.message}`);
      setIsProcessing(false);
    }
  };

  // Apply a reconstruction result to the UI state.
  // Preserves history instead of wiping it.
  const applyReconstructionResult = (resData: any, identity: ReconstructionIdentity) => {
    setIsProcessing(false);
    setIsUploadModalOpen(false);
    const newBuild = resData.build as MinecraftBuild;

    // Stamp the build with its reconstruction identity
    newBuild.id = identity.buildId;
    (newBuild.metadata as any).reconstructionId = identity.reconstructionId;
    (newBuild.metadata as any).imageHash = identity.imageHash;
    (newBuild.metadata as any).pipelineVersion = identity.pipelineVersion;

    // PRESERVE history: push new build onto existing history instead of wiping
    pushHistory(newBuild);
    setCurrentLayerSlice(Math.max(1, newBuild.dimensions.height));
    setSelectedVersion(newBuild.version);
    setActiveTab('workbench');

    // Store Multi-Agent Council & Neutral 3D Model outputs
    if (resData.councilReports) setCouncilReports(resData.councilReports);
    if (resData.candidateSolutions) setCandidateSolutions(resData.candidateSolutions);
    if (resData.neutralModel) setNeutralModel(resData.neutralModel);
    if (resData.depthModel) setDepthModel(resData.depthModel);
    if (resData.project) setCurrentProject(resData.project);

    // Add to reconstruction history (immutable)
    const fidelity = resData.fidelityReport;
    addToHistory({
      identity,
      sourceImageName: newBuild.name,
      buildName: newBuild.name,
      blockCount: newBuild.blocks.length,
      status: fidelity?.status === 'SUCCESS' ? 'COMPLETED'
        : fidelity?.status === 'NEEDS_ITERATION' ? 'NEEDS_ITERATION'
        : fidelity?.status === 'FIDELITY_MISMATCH' ? 'APPROXIMATE'
        : 'COMPLETED',
      createdAt: new Date().toISOString(),
    });

    if (newBuild.metadata.referenceBuilding) {
      setIsAnalysisPanelOpen(true);
    }
  };

  // Handle Natural Language Prompt Edit
  const handleApplyPromptEdit = async (promptQuery: string) => {
    setIsApplyingPrompt(true);
    try {
      const response = await fetch('/api/prompt-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentBuild,
          prompt: promptQuery,
        }),
      });
      if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
        const data = await response.json();
        if (data.success && data.updatedBuild) {
          pushHistory(data.updatedBuild);
        }
      }
    } catch (err) {
      console.error('Prompt edit failed:', err);
    } finally {
      setIsApplyingPrompt(false);
    }
  };

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-zinc-950 font-sans text-zinc-100">
      {/* HEADER */}
      <header className="h-14 w-full bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-800 flex items-center justify-between px-4 z-30 select-none flex-shrink-0 shadow-sm">
        {/* Left: Sketch MC Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            {/* Diamond/Block SVG icon */}
            <div className="w-8 h-8 rounded-xl bg-green-500/15 border border-green-500/30 flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-green-400">
                <path d="M8 1L14 5V11L8 15L2 11V5L8 1Z" stroke="currentColor" strokeWidth="1.5" fill="rgba(74,222,128,0.15)"/>
                <path d="M8 1L14 5L8 9L2 5L8 1Z" stroke="currentColor" strokeWidth="1" fill="rgba(74,222,128,0.1)"/>
              </svg>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-sm tracking-tight text-white">
                Sketch<span className="text-green-400">MC</span>
              </span>
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">AI 3D Builder</span>
            </div>
          </div>

          <div className="h-5 w-px bg-zinc-800 mx-1 hidden sm:block" />

          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-400 max-w-[180px] truncate">
              {currentBuild.name}
            </span>
            <select
              value={selectedVersion}
              onChange={(e) => setSelectedVersion(e.target.value as '1.20' | '1.21')}
              className="px-2 py-1 text-[11px] font-mono bg-zinc-950 border border-zinc-700 rounded-lg text-zinc-300 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/20 cursor-pointer"
              title="Target Minecraft Version"
            >
              <option value="1.21">Java 1.21</option>
              <option value="1.20">Java 1.20.4</option>
            </select>
          </div>
        </div>

        {/* Center: Primary Actions */}
        <div className="flex items-center gap-1.5">
          {/* Reconstruct - primary CTA */}
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-zinc-950 bg-green-400 hover:bg-green-300 active:bg-green-500 rounded-xl transition-all shadow-sm shadow-green-500/20 hover:shadow-green-500/30"
            title="Upload reference image for 3D reconstruction"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Reconstruct</span>
          </button>

          <div className="h-5 w-px bg-zinc-800 mx-0.5 hidden md:block" />

          {/* Secondary tools group */}
          <button
            onClick={() => setIsAssistantOpen(!isAssistantOpen)}
            className={`flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium rounded-xl border transition-all ${
              isAssistantOpen
                ? 'bg-violet-500/15 text-violet-300 border-violet-500/40 shadow-sm shadow-violet-500/10'
                : 'text-zinc-400 hover:text-zinc-200 bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
            }`}
            title="AI Natural Language Editor"
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span className="hidden md:inline">AI Edit</span>
          </button>

          <button
            onClick={() => setIsAnalysisPanelOpen(!isAnalysisPanelOpen)}
            className={`flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium rounded-xl border transition-all ${
              isAnalysisPanelOpen
                ? 'bg-green-500/12 text-green-300 border-green-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
            }`}
            title="Architectural Analysis"
          >
            <Building2 className="w-3.5 h-3.5 text-green-400" />
            <span className="hidden md:inline">Analysis</span>
          </button>

          <button
            onClick={() => setIsAICouncilOpen(!isAICouncilOpen)}
            className={`flex items-center gap-1.5 px-2.5 py-2 text-xs font-semibold rounded-xl border transition-all ${
              isAICouncilOpen
                ? 'bg-green-500/12 text-green-300 border-green-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
            }`}
            title="Multi-Agent AI Council"
          >
            <Bot className="w-3.5 h-3.5 text-green-400" />
            <span className="hidden md:inline">AI Council</span>
          </button>

          <button
            onClick={() => setIsVisualDebugOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-950/60 hover:bg-zinc-800/60 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-all"
            title="Visual Debug Inspector"
          >
            <Box className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden md:inline">Debug</span>
          </button>

          <button
            onClick={() => setIsVersionModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 bg-zinc-950/60 hover:bg-zinc-800/60 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-all"
            title="Minecraft Version Registry"
          >
            <Database className="w-3.5 h-3.5 text-green-400" />
            <span className="hidden md:inline font-mono">v{currentBuild.metadata.minecraftVersion || '1.21.1'}</span>
          </button>

          <div className="h-5 w-px bg-zinc-800 mx-0.5 hidden lg:block" />

          <button
            onClick={() => setIsBOMModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-950/60 hover:bg-zinc-800/60 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-all"
            title="Bill of Materials"
          >
            <Calculator className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">BOM</span>
          </button>

          <button
            onClick={() => setIsSchematic2DOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-950/60 hover:bg-zinc-800/60 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-all"
            title="2D Blueprint Layers"
          >
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden md:inline">Blueprint</span>
          </button>
        </div>

        {/* Right: Viewport controls + Export */}
        <div className="flex items-center gap-2">
          {/* Shading mode group */}
          <div className="hidden lg:flex items-center gap-0.5 p-1 bg-zinc-950 border border-zinc-800 rounded-xl">
            {[
              { mode: 'material', icon: <Palette className="w-3.5 h-3.5" />, title: 'Material', color: 'text-green-400' },
              { mode: 'solid', icon: <Box className="w-3.5 h-3.5" />, title: 'Solid', color: 'text-sky-400' },
              { mode: 'wireframe', icon: <Grid className="w-3.5 h-3.5" />, title: 'Wireframe', color: 'text-cyan-400' },
              { mode: 'blueprint', icon: <FileCode2 className="w-3.5 h-3.5" />, title: 'Blueprint', color: 'text-indigo-400' },
            ].map(({ mode, icon, title, color }) => (
              <button
                key={mode}
                onClick={() => setShadingMode(mode as ShadingMode)}
                className={`p-1.5 rounded-lg transition-all ${
                  shadingMode === mode
                    ? `bg-zinc-800 ${color} shadow-sm`
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title={title}
              >
                {icon}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-zinc-100 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 rounded-xl transition-all shadow-sm"
            title="Export .schem, .litematic, or JSON"
          >
            <FileDown className="w-3.5 h-3.5 text-green-400" />
            <span>Export</span>
          </button>
        </div>
      </header>

      {/* MAIN BODY */}
      <div className="flex flex-row flex-1 w-full h-[calc(100vh-3.5rem)] overflow-hidden relative">
        {/* LEFT TOOLBAR */}
        <Toolbar
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          onUndo={handleUndo}
          onRedo={handleRedo}
        />

        {/* CENTER: VIEWPORT + BOTTOM BAR */}
        <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-zinc-950">
          {/* 3D Viewport */}
          <div className="flex-1 relative w-full h-full overflow-hidden">
            <ThreeViewport
              build={currentBuild}
              activeTool={activeTool}
              selectedBlockId={selectedBlockId}
              selectedBlockPlacement={selectedBlockPlacement}
              maxLayerSlice={currentLayerSlice}
              shadingMode={shadingMode}
              onSelectBlock={handleSelectBlock}
              onAddBlock={handleAddBlock}
              onDeleteBlock={handleDeleteBlock}
              onPaintBlock={handlePaintBlock}
              onEyedropperPick={handleEyedropperPick}
              hoveredCoords={hoveredCoords}
              setHoveredCoords={setHoveredCoords}
            />

            {/* AI Assistant Panel */}
            {isAssistantOpen && (
              <div className="absolute top-3 left-3 z-20 w-80 h-[calc(100%-1.5rem)] shadow-2xl shadow-black/50 animate-fade-in">
                <AIAssistantPanel
                  build={currentBuild}
                  isOpen={isAssistantOpen}
                  onClose={() => setIsAssistantOpen(false)}
                  onApplyPromptEdit={handleApplyPromptEdit}
                  isApplying={isApplyingPrompt}
                />
              </div>
            )}

            {/* Reconstruction Analysis Panel */}
            {isAnalysisPanelOpen && currentBuild.metadata.referenceBuilding && (
              <div className="absolute top-3 left-3 z-20 w-84 h-[calc(100%-1.5rem)] shadow-2xl shadow-black/50 animate-fade-in">
                <ReconstructionAnalysisPanel
                  referenceBuilding={currentBuild.metadata.referenceBuilding}
                  iterationHistory={currentBuild.metadata.iterationHistory}
                  isOpen={isAnalysisPanelOpen}
                  onClose={() => setIsAnalysisPanelOpen(false)}
                />
              </div>
            )}

            {/* AI Council Panel */}
            {isAICouncilOpen && (
              <div className="absolute top-3 right-3 z-30 w-96 h-[calc(100%-1.5rem)] shadow-2xl shadow-black/50 rounded-2xl overflow-hidden border border-zinc-700/60 animate-fade-in">
                <AICouncilPanel
                  councilReports={councilReports}
                  candidateSolutions={candidateSolutions}
                  project={currentProject}
                  onRunCouncil={handleRunCouncilOrchestration}
                  isLoading={isProcessing}
                />
              </div>
            )}
          </div>

          {/* BOTTOM STATUS BAR */}
          <div className="h-12 border-t border-zinc-800/80 bg-zinc-900/90 backdrop-blur-sm flex items-center justify-between px-4 z-20 flex-shrink-0 select-none">
            {/* Layer Slicer */}
            <div className="flex items-center">
              <LayerSliceBar
                maxHeight={maxHeight}
                currentSlice={currentLayerSlice}
                onChangeSlice={setCurrentLayerSlice}
              />
            </div>

            {/* Live Stats */}
            <div className="flex items-center gap-4 text-xs font-mono tabular-nums text-zinc-400">
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-600 text-[10px] uppercase tracking-wider">Cursor</span>
                {hoveredCoords ? (
                  <span className="text-green-400 font-semibold">
                    {hoveredCoords.x},{hoveredCoords.y},{hoveredCoords.z}
                  </span>
                ) : (
                  <span className="text-zinc-600">—</span>
                )}
              </div>

              <div className="h-3 w-px bg-zinc-800" />

              <div className="flex items-center gap-1.5">
                <span className="text-zinc-600 text-[10px] uppercase tracking-wider">Blocks</span>
                <span className="text-zinc-200 font-semibold">{currentBuild.blocks.length.toLocaleString()}</span>
              </div>

              <div className="h-3 w-px bg-zinc-800 hidden sm:block" />

              <div className="hidden sm:flex items-center gap-1.5">
                <span className="text-zinc-600 text-[10px] uppercase tracking-wider">Bounds</span>
                <span className="text-zinc-400">
                  {currentBuild.dimensions.width}×{currentBuild.dimensions.height}×{currentBuild.dimensions.depth}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="w-80 h-full border-l border-zinc-800 bg-zinc-900 flex flex-col z-20 flex-shrink-0 overflow-hidden">
          {/* Tab Switcher */}
          <div className="flex items-center p-2 border-b border-zinc-800 bg-zinc-950/50 flex-shrink-0 gap-1">
            <button
              onClick={() => setRightPanelTab('palette')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                rightPanelTab === 'palette'
                  ? 'bg-zinc-800 text-green-400 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>Palette</span>
            </button>
            <button
              onClick={() => setRightPanelTab('inspector')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                rightPanelTab === 'inspector'
                  ? 'bg-zinc-800 text-cyan-400 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Inspector</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {rightPanelTab === 'palette' ? (
              <BlockPaletteSelector
                selectedBlockId={selectedBlockId}
                onSelectBlockId={setSelectedBlockId}
                selectedVersion={selectedVersion}
              />
            ) : (
              <BlockStateInspector
                selectedBlock={selectedBlockPlacement}
                onUpdateBlockState={handleUpdateBlockState}
                onDeleteBlock={handleDeleteBlock}
              />
            )}
          </div>

          {/* Confidence HUD */}
          <div className="border-t border-zinc-800 p-2 bg-zinc-950/40 flex-shrink-0">
            <ConfidenceHUD
              confidence={currentBuild.metadata.confidence}
              onReconstructRegion={(r) => handleApplyPromptEdit(`Re-optimize ${r} architecture`)}
              onOpenAnalysis={() => setIsAnalysisPanelOpen(true)}
            />
          </div>
        </div>
      </div>

      {/* MODALS */}
      <ImageUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onStartReconstruction={handleStartReconstruction}
        isProcessing={isProcessing}
        processingStep={processingStep}
        processingProgress={processingProgress}
      />
      <MaterialBOMModal
        isOpen={isBOMModalOpen}
        onClose={() => setIsBOMModalOpen(false)}
        build={currentBuild}
      />
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        build={currentBuild}
      />
      <Schematic2DModal
        isOpen={isSchematic2DOpen}
        onClose={() => setIsSchematic2DOpen(false)}
        build={currentBuild}
        initialY={currentLayerSlice}
      />
      <VisualDebugModal
        isOpen={isVisualDebugOpen}
        onClose={() => setIsVisualDebugOpen(false)}
        referenceImageUrl={currentBuild.metadata.sourceImage || '/glass_garden_test.jpg'}
        referenceBuilding={currentBuild.metadata.referenceBuilding}
        neutralModel={neutralModel}
        depthModel={depthModel}
        candidateSolutions={candidateSolutions}
        observations={councilReports[0]?.observations || []}
      />
      <MinecraftVersionModal
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
        currentBuild={currentBuild}
        onBuildMigrated={(migrated) => pushHistory(migrated)}
      />
    </div>
  );
}
