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
  const handleStartReconstruction = async (data: {
    images: ReferenceImageItem[];
    presetId?: string;
    settings: ReconstructionSettings;
  }) => {
    setIsProcessing(true);
    setProcessingProgress(15);
    setProcessingStep('Analyzing silhouette, facade bays, and stepped arches...');

    try {
      setTimeout(() => {
        setProcessingProgress(45);
        setProcessingStep('Solving 3D architectural proxy and proportion alignment...');
      }, 500);

      setTimeout(() => {
        setProcessingProgress(75);
        setProcessingStep('Executing 6-step iterative render-vs-reference calibration...');
      }, 1200);

      const response = await fetch('/api/reconstruct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: data.images,
          presetId: data.presetId,
          settings: data.settings,
          scale: data.settings?.customScaleMultiplier || 1.0,
          version: data.settings?.minecraftVersion || selectedVersion,
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || resData.details || 'Failed reconstruction');
      }

      setProcessingProgress(100);
      setProcessingStep('Reconstruction complete!');

      setTimeout(() => {
        setIsProcessing(false);
        setIsUploadModalOpen(false);
        const newBuild = resData.build as MinecraftBuild;
        setCurrentBuild(newBuild);
        setHistory([newBuild]);
        setHistoryIndex(0);
        setCurrentLayerSlice(Math.max(1, newBuild.dimensions.height));
        setSelectedVersion(newBuild.version);
        setActiveTab('workbench');

        // Store Multi-Agent Council & Neutral 3D Model outputs
        if (resData.councilReports) setCouncilReports(resData.councilReports);
        if (resData.candidateSolutions) setCandidateSolutions(resData.candidateSolutions);
        if (resData.neutralModel) setNeutralModel(resData.neutralModel);
        if (resData.depthModel) setDepthModel(resData.depthModel);
        if (resData.project) setCurrentProject(resData.project);

        if (newBuild.metadata.referenceBuilding) {
          setIsAnalysisPanelOpen(true);
        }
      }, 400);
    } catch (err: any) {
      console.error(err);
      alert(`Reconstruction error: ${err.message}`);
      setIsProcessing(false);
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
      const data = await response.json();
      if (data.success && data.updatedBuild) {
        pushHistory(data.updatedBuild);
      }
    } catch (err) {
      console.error('Prompt edit failed:', err);
    } finally {
      setIsApplyingPrompt(false);
    }
  };

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      {/* =================================================================== */}
      {/* 1. TOP DOCKED HEADER: Project Controls, Version, Actions, Export */}
      {/* =================================================================== */}
      <header className="h-13 w-full bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 z-30 select-none flex-shrink-0">
        {/* Left: Brand & Build Name */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <Boxes className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="font-bold text-sm tracking-tight text-white font-mono">
              Voxel<span className="text-emerald-400">Forge</span>
            </span>
          </div>

          <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />

          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs font-medium text-slate-300 max-w-[200px] truncate">
              {currentBuild.name}
            </span>
            <select
              value={selectedVersion}
              onChange={(e) => setSelectedVersion(e.target.value as '1.20' | '1.21')}
              className="px-2 py-0.5 text-[11px] font-mono bg-slate-950 border border-slate-700 rounded text-slate-300 focus:outline-none focus:border-emerald-500"
              title="Target Minecraft Version"
            >
              <option value="1.21">Java 1.21</option>
              <option value="1.20">Java 1.20.4</option>
            </select>
          </div>
        </div>

        {/* Center: Primary Pipeline & Utilities */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors shadow-sm"
            title="Upload architectural reference image for 3D Minecraft reconstruction"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Reconstruct Image</span>
          </button>

          <button
            onClick={() => setIsAssistantOpen(!isAssistantOpen)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              isAssistantOpen
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                : 'text-purple-400 hover:text-purple-300 bg-slate-950/60 border-slate-800'
            }`}
            title="Natural Language Architectural Modification"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden md:inline">AI Edit</span>
          </button>

          <button
            onClick={() => setIsAnalysisPanelOpen(!isAnalysisPanelOpen)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              isAnalysisPanelOpen
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'text-emerald-400 hover:text-emerald-300 bg-slate-950/60 border-slate-800'
            }`}
            title="View Reference Architectural Decomposition & Convergence Trace"
          >
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">Analysis</span>
          </button>

          <button
            onClick={() => setIsAICouncilOpen(!isAICouncilOpen)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
              isAICouncilOpen
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                : 'text-emerald-400 hover:text-emerald-300 bg-slate-950/60 border-slate-800'
            }`}
            title="Open Hermes Multi-Agent Council (Hermes, GPT, Gemini, Grok)"
          >
            <Bot className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">AI Council</span>
          </button>

          <button
            onClick={() => setIsVisualDebugOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-sky-400 hover:text-sky-300 bg-slate-950/60 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
            title="Open Visual Debug & Neutral 3D Model Inspector"
          >
            <Box className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden md:inline">Visual Debug</span>
          </button>

          <button
            onClick={() => setIsVersionModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-slate-950/60 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
            title="Minecraft Version Registry & Immutability Manager"
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline font-mono">v{currentBuild.metadata.minecraftVersion || '1.21.1'}</span>
          </button>

          <button
            onClick={() => setIsBOMModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-950/60 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
            title="Calculate Material Requirements & Stacks"
          >
            <Calculator className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">BOM</span>
          </button>

          <button
            onClick={() => setIsSchematic2DOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-950/60 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
            title="View 2D Blueprint Layers"
          >
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden md:inline">Blueprint</span>
          </button>
        </div>

        {/* Right: Viewport Shading Modes & Export */}
        <div className="flex items-center gap-2">
          {/* Shading Mode Switcher */}
          <div className="hidden lg:flex items-center gap-0.5 p-0.5 bg-slate-950 border border-slate-800 rounded-lg">
            <button
              onClick={() => setShadingMode('material')}
              className={`p-1.5 rounded transition-colors ${
                shadingMode === 'material' ? 'bg-slate-800 text-emerald-400' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Material Mode: Block colors & transparency"
            >
              <Palette className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShadingMode('solid')}
              className={`p-1.5 rounded transition-colors ${
                shadingMode === 'solid' ? 'bg-slate-800 text-sky-400' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Solid Mode: Studio clay shading"
            >
              <Box className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShadingMode('wireframe')}
              className={`p-1.5 rounded transition-colors ${
                shadingMode === 'wireframe' ? 'bg-slate-800 text-cyan-400' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Wireframe Mode"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShadingMode('blueprint')}
              className={`p-1.5 rounded transition-colors ${
                shadingMode === 'blueprint' ? 'bg-slate-800 text-indigo-400' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Blueprint Mode"
            >
              <FileCode2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-100 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors shadow-sm"
            title="Export WorldEdit .schem, Litematica .litematic, or JSON"
          >
            <FileDown className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export</span>
          </button>
        </div>
      </header>

      {/* =================================================================== */}
      {/* 2. MAIN DOCKED WORKBENCH BODY */}
      {/* =================================================================== */}
      <div className="flex flex-row flex-1 w-full h-[calc(100vh-3.25rem)] overflow-hidden relative">
        {/* LEFT DOCKED CAD TOOLBAR */}
        <Toolbar
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          onUndo={handleUndo}
          onRedo={handleRedo}
        />

        {/* CENTER VIEWPORT & SLICER CONTAINER */}
        <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-slate-950">
          {/* Main 3D Three.js Viewport */}
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

            {/* AI Assistant Drawer (when opened) */}
            {isAssistantOpen && (
              <div className="absolute top-3 left-3 z-20 w-80 h-[calc(100%-1.5rem)] shadow-2xl">
                <AIAssistantPanel
                  build={currentBuild}
                  isOpen={isAssistantOpen}
                  onClose={() => setIsAssistantOpen(false)}
                  onApplyPromptEdit={handleApplyPromptEdit}
                  isApplying={isApplyingPrompt}
                />
              </div>
            )}

            {/* Reconstruction Architectural Analysis Panel (when opened) */}
            {isAnalysisPanelOpen && currentBuild.metadata.referenceBuilding && (
              <div className="absolute top-3 left-3 z-20 w-84 h-[calc(100%-1.5rem)] shadow-2xl">
                <ReconstructionAnalysisPanel
                  referenceBuilding={currentBuild.metadata.referenceBuilding}
                  iterationHistory={currentBuild.metadata.iterationHistory}
                  isOpen={isAnalysisPanelOpen}
                  onClose={() => setIsAnalysisPanelOpen(false)}
                />
              </div>
            )}

            {/* AI Council Workspace Drawer (when opened) */}
            {isAICouncilOpen && (
              <div className="absolute top-3 right-3 z-30 w-96 h-[calc(100%-1.5rem)] shadow-2xl rounded-lg overflow-hidden border border-slate-700/80">
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

          {/* DOCKED BOTTOM BAR: Slicer, Layer Controls & Live Status */}
          <div className="h-14 border-t border-slate-800 bg-slate-900/95 flex items-center justify-between px-4 z-20 flex-shrink-0 select-none">
            {/* Left: Layer Slicer Slider */}
            <div className="flex items-center gap-3">
              <LayerSliceBar
                maxHeight={maxHeight}
                currentSlice={currentLayerSlice}
                onChangeSlice={setCurrentLayerSlice}
              />
            </div>

            {/* Right: Live Build Stats & Navigation Info */}
            <div className="flex items-center gap-4 text-xs font-mono tabular-nums text-slate-300">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 text-[11px]">CURSOR:</span>
                {hoveredCoords ? (
                  <span className="text-emerald-400 font-semibold">
                    X:{hoveredCoords.x} Y:{hoveredCoords.y} Z:{hoveredCoords.z}
                  </span>
                ) : (
                  <span className="text-slate-500">—</span>
                )}
              </div>

              <div className="h-3.5 w-px bg-slate-800" />

              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 text-[11px]">BLOCKS:</span>
                <span className="text-slate-200 font-semibold">{currentBuild.blocks.length}</span>
              </div>

              <div className="h-3.5 w-px bg-slate-800 hidden sm:block" />

              <div className="hidden sm:flex items-center gap-1.5">
                <span className="text-slate-500 text-[11px]">BOUNDS:</span>
                <span className="text-slate-400">
                  {currentBuild.dimensions.width}×{currentBuild.dimensions.height}×{currentBuild.dimensions.depth}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT DOCKED SIDEBAR: Block Palette & Block State Inspector */}
        <div className="w-80 h-full border-l border-slate-800 bg-slate-900 flex flex-col z-20 flex-shrink-0 overflow-hidden">
          {/* Right Panel Tab Switcher */}
          <div className="flex items-center border-b border-slate-800 bg-slate-950/60 p-1 flex-shrink-0">
            <button
              onClick={() => setRightPanelTab('palette')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-colors ${
                rightPanelTab === 'palette'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>Palette</span>
            </button>
            <button
              onClick={() => setRightPanelTab('inspector')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-colors ${
                rightPanelTab === 'inspector'
                  ? 'bg-slate-800 text-cyan-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
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

          {/* Bottom Architectural Confidence / Quality HUD */}
          <div className="border-t border-slate-800 p-2 bg-slate-950/50 flex-shrink-0">
            <ConfidenceHUD
              confidence={currentBuild.metadata.confidence}
              onReconstructRegion={(r) => handleApplyPromptEdit(`Re-optimize ${r} architecture`)}
              onOpenAnalysis={() => setIsAnalysisPanelOpen(true)}
            />
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 3. MODALS & OVERLAYS */}
      {/* =================================================================== */}
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
