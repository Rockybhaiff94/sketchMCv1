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
} from 'lucide-react';
import { MinecraftBuild, BlockPlacement } from './types/minecraft.ts';
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
    generatePresetBuild('medieval_tavern', 1.0, '1.21')
  );

  // History State for Undo/Redo
  const [history, setHistory] = useState<MinecraftBuild[]>([
    generatePresetBuild('medieval_tavern', 1.0, '1.21'),
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
    imageFile?: File;
    imageDataUrl?: string;
    presetId?: string;
    scale: number;
    minecraftVersion: '1.20' | '1.21';
  }) => {
    setIsProcessing(true);
    setProcessingProgress(15);
    setProcessingStep('Analyzing silhouette, materials & perspective with Gemini 3.8 Flash...');

    try {
      setTimeout(() => {
        setProcessingProgress(45);
        setProcessingStep('Segmenting architectural framing, arches, and glass facades...');
      }, 600);

      setTimeout(() => {
        setProcessingProgress(70);
        setProcessingStep('Solving discrete Minecraft voxel grid & blockstate orientations...');
      }, 1400);

      const response = await fetch('/api/reconstruct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: data.imageDataUrl,
          mimeType: data.imageFile?.type || 'image/jpeg',
          presetId: data.presetId,
          scale: data.scale,
          version: data.minecraftVersion,
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Failed reconstruction');
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
        setActiveTab('workbench');
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
    </div>
  );
}
