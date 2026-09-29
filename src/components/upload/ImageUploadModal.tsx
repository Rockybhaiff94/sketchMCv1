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
} from 'lucide-react';
import { PRESET_BUILDINGS } from '../../lib/presets.ts';

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartReconstruction: (data: {
    imageFile?: File;
    imageDataUrl?: string;
    presetId?: string;
    scale: number;
    minecraftVersion: '1.20' | '1.21';
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [scale, setScale] = useState<number>(1.0);
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

  const validateAndProcessFile = (file: File) => {
    setErrorMessage(null);
    setSelectedPresetId(null);

    // Format validation
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage('Unsupported format. Please upload JPG, PNG, or WEBP.');
      return;
    }

    // Size validation (15MB limit)
    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage('Image size exceeds 15MB limit.');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    setSelectedFile(null);
    setPreviewUrl(null);
    setErrorMessage(null);
  };

  const handleStart = () => {
    if (!selectedFile && !selectedPresetId) return;

    onStartReconstruction({
      imageFile: selectedFile || undefined,
      imageDataUrl: previewUrl || undefined,
      presetId: selectedPresetId || undefined,
      scale,
      minecraftVersion,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="flex flex-col w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-100">
              New 3D Minecraft Reconstruction
            </h3>
            <p className="text-xs text-slate-400">
              Upload a building photograph, concept art, or select a starter archetype
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
            <div className="flex flex-col items-center justify-center py-10 space-y-6 text-center">
              <div className="relative flex items-center justify-center w-20 h-20">
                <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 animate-ping" />
                <div className="w-16 h-16 rounded-full border-4 border-emerald-400 border-t-transparent animate-spin" />
                <Sparkles className="w-6 h-6 text-emerald-400 absolute" />
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
                  {processingStep}
                </h4>
                <p className="text-xs text-slate-400">
                  Solving Minecraft block candidate placements and orientations...
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full max-w-md bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className="bg-emerald-400 h-full transition-all duration-300"
                  style={{ width: `${processingProgress}%` }}
                />
              </div>

              <div className="grid grid-cols-4 gap-2 w-full max-w-md text-[10px] font-mono text-slate-500">
                <div className={processingProgress >= 25 ? 'text-emerald-400 font-bold' : ''}>1. Vision</div>
                <div className={processingProgress >= 50 ? 'text-emerald-400 font-bold' : ''}>2. Geometry</div>
                <div className={processingProgress >= 75 ? 'text-emerald-400 font-bold' : ''}>3. Voxels</div>
                <div className={processingProgress >= 95 ? 'text-emerald-400 font-bold' : ''}>4. Orientations</div>
              </div>
            </div>
          ) : (
            <>
              {/* Option A: Drag & Drop Custom Image */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Option A: Upload Reference Image
                </label>

                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                    dragActive
                      ? 'border-emerald-400 bg-emerald-500/10'
                      : previewUrl
                      ? 'border-slate-700 bg-slate-950/60'
                      : 'border-slate-800 hover:border-slate-600 bg-slate-950/40'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {previewUrl ? (
                    <div className="flex items-center gap-4 w-full">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-24 h-24 object-cover rounded-lg border border-slate-700 shadow-md"
                      />
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-xs font-semibold text-slate-200 truncate">
                          {selectedFile?.name || 'Uploaded Reference'}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500">
                          {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : ''}
                        </span>
                        <span className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Ready for AI Reconstruction
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                          setPreviewUrl(null);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className="p-3 rounded-full bg-slate-800/80 text-emerald-400">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div className="text-xs text-slate-300">
                        <span className="font-semibold text-emerald-400">Click to upload</span> or drag and drop image here
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        PNG, JPG, WEBP up to 15MB
                      </span>
                    </div>
                  )}
                </div>

                {errorMessage && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-rose-400">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </div>

              {/* Option B: Starter Gallery Presets */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Option B: Or Choose a Starter Architectural Archetype
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
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${preset.badgeColor}`}>
                            {preset.category}
                          </span>
                        </div>
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

              {/* Scale & Version Configurations */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                {/* Scale Slider */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                      <span>VOXEL RESOLUTION / SCALE</span>
                    </label>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {scale === 1.0 ? '1:1 (Real-world)' : `${scale}x`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.6"
                    max="1.5"
                    step="0.1"
                    value={scale}
                    onChange={(e) => setScale(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                    <span>Compact (0.6x)</span>
                    <span>1:1 Realistic (1.0x)</span>
                    <span>Detailed (1.5x)</span>
                  </div>
                </div>

                {/* Minecraft Target Version */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    MINECRAFT VERSION
                  </label>
                  <select
                    value={minecraftVersion}
                    onChange={(e) => setMinecraftVersion(e.target.value as '1.20' | '1.21')}
                    className="w-full p-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500/50 font-mono"
                  >
                    <option value="1.21">1.21 (Tricky Trials / Copper & Tuff)</option>
                    <option value="1.20">1.20 (Trails & Tales / Cherry & Bamboo)</option>
                  </select>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Only authentic blocks from this version will be placed.
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
              disabled={!selectedFile && !selectedPresetId}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-30 disabled:hover:bg-emerald-400 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
            >
              <span>Reconstruct 3D Minecraft Build</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
