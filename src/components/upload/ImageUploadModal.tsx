import React, { useState, useRef } from 'react';
import {
  Upload,
  X,
  FileImage,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Sliders,
  Layers,
  ArrowRight,
  Plus,
  Trash2,
  RefreshCw,
  Camera,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import {
  ReferenceImageItem,
  ReferenceViewType,
  ReconstructionSettings,
  BuildScaleOption,
  ReferenceModeOption,
  AccuracyOption,
  InferenceOption,
} from '../../types/minecraft.ts';
import { PRESET_BUILDINGS } from '../../lib/presets.ts';
import { classifyImageView, classifyReferenceSet } from '../../lib/vision/viewClassifier.ts';

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartReconstruction: (data: {
    images: ReferenceImageItem[];
    presetId?: string;
    settings: ReconstructionSettings;
  }) => void;
  isProcessing: boolean;
  processingStep: string;
  processingProgress: number;
}

export const ImageUploadModal: React.FC<ImageUploadModalProps> = ({
  isOpen,
  onClose,
  onStartReconstruction,
  isProcessing,
  processingStep,
  processingProgress,
}) => {
  const [images, setImages] = useState<ReferenceImageItem[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  // Reconstruction Settings
  const [buildScale, setBuildScale] = useState<BuildScaleOption>('medium');
  const [customScaleMultiplier, setCustomScaleMultiplier] = useState<number>(1.0);
  const [referenceMode, setReferenceMode] = useState<ReferenceModeOption>('architecture_environment');
  const [accuracy, setAccuracy] = useState<AccuracyOption>('high_detail');
  const [inference, setInference] = useState<InferenceOption>('conservative');
  const [minecraftVersion, setMinecraftVersion] = useState<'1.20' | '1.21'>('1.21');

  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFileList = (fileList: FileList | File[]) => {
    setErrorMessage(null);
    setSelectedPresetId(null);

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    const newItems: ReferenceImageItem[] = [];

    Array.from(fileList).forEach((file) => {
      if (!validTypes.includes(file.type)) {
        setErrorMessage('One or more files have unsupported format (use JPG, PNG, WEBP).');
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        setErrorMessage('File size exceeds 20MB limit.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const { probableView, confidence } = classifyImageView(file.name);

        const item: ReferenceImageItem = {
          id: `ref_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          dataUrl,
          mimeType: file.type,
          probableView,
          confidence,
          fileSize: file.size,
        };

        setImages((prev) => {
          const updated = [...prev, item];
          // Re-classify set for optimal multi-view distribution
          const classified = classifyReferenceSet(updated);
          return updated.map((img) => {
            const cls = classified.get(img.id);
            if (cls) {
              return { ...img, probableView: cls.view, confidence: cls.confidence };
            }
            return img;
          });
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFileList(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFileList(e.target.files);
    }
  };

  const handleRemoveImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleReclassifyView = (id: string, newView: ReferenceViewType) => {
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, userAssignedView: newView } : img))
    );
  };

  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    setImages([]);
    setErrorMessage(null);
  };

  const handleStart = () => {
    if (images.length === 0 && !selectedPresetId) return;

    onStartReconstruction({
      images,
      presetId: selectedPresetId || undefined,
      settings: {
        buildScale,
        customScaleMultiplier,
        referenceMode,
        accuracy,
        inference,
        minecraftVersion,
      },
    });
  };

  const viewOptions: ReferenceViewType[] = [
    'front',
    'back',
    'left',
    'right',
    'top',
    'bottom',
    'interior',
    'detail',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="flex flex-col w-full max-w-3xl max-h-[92vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-400" />
              <span>Reference-First Minecraft 3D Reconstruction</span>
            </h3>
            <p className="text-xs text-slate-400">
              Upload single or multi-angle references. Architecture, arches, and proportions are strictly reconstructed from your photos.
            </p>
          </div>
          {!isProcessing && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isProcessing ? (
            /* Multi-stage Progress Pipeline */
            <div className="flex flex-col items-center justify-center py-12 space-y-6 text-center">
              <div className="relative flex items-center justify-center w-20 h-20">
                <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 animate-ping" />
                <div className="w-16 h-16 rounded-full border-4 border-emerald-400 border-t-transparent animate-spin" />
                <Sparkles className="w-6 h-6 text-emerald-400 absolute" />
              </div>

              <div className="space-y-1.5 max-w-md">
                <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
                  {processingStep}
                </h4>
                <p className="text-xs text-slate-400">
                  Executing iterative render-vs-reference calibration across silhouette, bays, and stepped arches...
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full max-w-md bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800 shadow-inner">
                <div
                  className="bg-emerald-400 h-full transition-all duration-300"
                  style={{ width: `${processingProgress}%` }}
                />
              </div>

              <div className="grid grid-cols-4 gap-2 w-full max-w-md text-[10px] font-mono text-slate-500 text-center">
                <div className={processingProgress >= 20 ? 'text-emerald-400 font-bold' : ''}>1. Vision / Bays</div>
                <div className={processingProgress >= 45 ? 'text-emerald-400 font-bold' : ''}>2. 3D Proxy</div>
                <div className={processingProgress >= 70 ? 'text-emerald-400 font-bold' : ''}>3. Voxel Grid</div>
                <div className={processingProgress >= 90 ? 'text-emerald-400 font-bold' : ''}>4. Calibration</div>
              </div>
            </div>
          ) : (
            <>
              {/* Reference Manager: Multi-Image Ingestion */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span>1. REFERENCE MANAGER (SINGLE OR MULTI-IMAGE)</span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                      {images.length} {images.length === 1 ? 'Image' : 'Images'}
                    </span>
                  </label>

                  {images.length > 0 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add More Views</span>
                    </button>
                  )}
                </div>

                {/* Upload Dropzone */}
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative flex flex-col items-center justify-center p-5 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                    dragActive
                      ? 'border-emerald-400 bg-emerald-500/10'
                      : images.length > 0
                      ? 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                      : 'border-slate-800 hover:border-slate-600 bg-slate-950/50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {images.length === 0 ? (
                    <div className="flex flex-col items-center text-center space-y-2 py-3">
                      <div className="p-3 rounded-full bg-slate-800/80 text-emerald-400 shadow-md">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div className="text-xs text-slate-300">
                        <span className="font-semibold text-emerald-400">Click to upload</span> or drag and drop reference images
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Front, Back, Left, Right, Interior, Roof, or Details (JPG, PNG, WEBP)
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-xs text-slate-400 py-1">
                      <Plus className="w-4 h-4 text-emerald-400" />
                      <span>Drag more photos here or click to add additional perspectives</span>
                    </div>
                  )}
                </div>

                {errorMessage && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-rose-400">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Uploaded Reference Cards Gallery */}
                {images.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    {images.map((img, idx) => {
                      const currentView = img.userAssignedView || img.probableView;
                      return (
                        <div
                          key={img.id}
                          className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 shadow-sm"
                        >
                          <img
                            src={img.dataUrl}
                            alt={img.name}
                            className="w-16 h-16 object-cover rounded-lg border border-slate-700/80 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold text-slate-200 truncate">
                                Ref {idx + 1}: {img.name}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveImage(img.id);
                                }}
                                className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                                title="Remove photo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* View Classification & Reclassification Selector */}
                            <div className="flex items-center gap-2">
                              <select
                                value={currentView}
                                onChange={(e) =>
                                  handleReclassifyView(img.id, e.target.value as ReferenceViewType)
                                }
                                className="px-2 py-0.5 text-[11px] font-mono bg-slate-900 border border-slate-700 rounded text-emerald-300 focus:outline-none focus:border-emerald-500 capitalize"
                              >
                                {viewOptions.map((v) => (
                                  <option key={v} value={v}>
                                    {v} View
                                  </option>
                                ))}
                              </select>

                              <span className="text-[10px] font-mono text-slate-400">
                                {Math.round(img.confidence * 100)}% match
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Starter Archetypes (Option B) */}
              {images.length === 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Option B: Or Select a Starter Archetype
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {PRESET_BUILDINGS.map((preset) => {
                      const isSelected = selectedPresetId === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSelectPreset(preset.id)}
                          className={`flex flex-col text-left p-3 rounded-xl border transition-all ${
                            isSelected
                              ? 'bg-emerald-500/10 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
                              : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950/70'
                          }`}
                        >
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border mb-1 w-fit ${preset.badgeColor}`}>
                            {preset.category}
                          </span>
                          <span className="text-xs font-bold text-slate-200 line-clamp-1">
                            {preset.name}
                          </span>
                          <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                            {preset.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Reconstruction Settings Panel (Requirement 27) */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase font-mono tracking-wider">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
                    <span>2. RECONSTRUCTION PARAMETERS</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Build Scale */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      BUILD SCALE
                    </label>
                    <select
                      value={buildScale}
                      onChange={(e) => setBuildScale(e.target.value as BuildScaleOption)}
                      className="w-full p-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-mono"
                    >
                      <option value="small">Small (0.75x)</option>
                      <option value="medium">Medium (1:1 Realistic)</option>
                      <option value="large">Large (1.35x)</option>
                      <option value="custom">Custom Scale</option>
                    </select>
                  </div>

                  {/* Reference Mode */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      REFERENCE MODE
                    </label>
                    <select
                      value={referenceMode}
                      onChange={(e) => setReferenceMode(e.target.value as ReferenceModeOption)}
                      className="w-full p-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-mono"
                    >
                      <option value="architecture_environment">Architecture + Environment</option>
                      <option value="architecture_only">Architecture Only</option>
                      <option value="architecture_interior">Architecture + Interior</option>
                    </select>
                  </div>

                  {/* Accuracy */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      ACCURACY
                    </label>
                    <select
                      value={accuracy}
                      onChange={(e) => setAccuracy(e.target.value as AccuracyOption)}
                      className="w-full p-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-mono"
                    >
                      <option value="high_detail">High Detail</option>
                      <option value="balanced">Balanced</option>
                      <option value="fast">Fast</option>
                    </select>
                  </div>

                  {/* Hidden Inference */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      HIDDEN SIDES INFERENCE
                    </label>
                    <select
                      value={inference}
                      onChange={(e) => setInference(e.target.value as InferenceOption)}
                      className="w-full p-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-mono"
                    >
                      <option value="conservative">Conservative (Symmetry-first)</option>
                      <option value="balanced">Balanced</option>
                      <option value="creative">Creative Continuation</option>
                    </select>
                  </div>
                </div>

                {/* Minecraft Target Version */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-300 font-mono">TARGET VERSION:</span>
                    <select
                      value={minecraftVersion}
                      onChange={(e) => setMinecraftVersion(e.target.value as '1.20' | '1.21')}
                      className="px-2.5 py-1 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-mono"
                    >
                      <option value="1.21">Java 1.21 (Copper Doors, Tuff Bricks, Grates)</option>
                      <option value="1.20">Java 1.20 (Trails & Tales, Cherry, Bamboo)</option>
                    </select>
                  </div>

                  <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                    Version strictly enforces asset registry & valid blocks
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!isProcessing && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleStart}
              disabled={images.length === 0 && !selectedPresetId}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-30 disabled:hover:bg-emerald-400 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
            >
              <span>Reconstruct Building Architecture</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
