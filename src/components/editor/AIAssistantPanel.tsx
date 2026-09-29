import React, { useState } from 'react';
import { X, Sparkles, ArrowRight, CornerDownLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { MinecraftBuild } from '../../types/minecraft.ts';

interface AIAssistantPanelProps {
  build: MinecraftBuild;
  isOpen: boolean;
  onClose: () => void;
  onApplyPromptEdit: (prompt: string) => Promise<void>;
  isApplying: boolean;
}

export const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({
  build,
  isOpen,
  onClose,
  onApplyPromptEdit,
  isApplying,
}) => {
  const [prompt, setPrompt] = useState('');
  const [history, setHistory] = useState<string[]>([
    'Replaced wall material with stone bricks',
    'Increased roof gable overhang by 1 block',
  ]);

  if (!isOpen) return null;

  const quickPrompts = [
    'Replace all oak planks with spruce planks',
    'Change the roof to deepslate tile stairs',
    'Add stone brick walls along the foundation',
    'Add lanterns to the corner pillars',
    'Replace standard glass with black stained glass',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isApplying) return;
    const query = prompt.trim();
    setPrompt('');
    await onApplyPromptEdit(query);
    setHistory((prev) => [query, ...prev]);
  };

  return (
    <div className="flex flex-col h-full w-80 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl shadow-2xl p-4 text-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <h3 className="text-xs font-bold text-slate-100">AI BUILD ASSISTANT</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Natural Language Prompt Input */}
      <form onSubmit={handleSubmit} className="my-3 space-y-2">
        <label className="block text-[11px] font-medium text-slate-400">
          Describe architectural modification:
        </label>
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. 'Replace all oak with spruce' or 'Make the roof steeper'..."
            rows={3}
            className="w-full p-2.5 text-xs bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-purple-500/60 resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={!prompt.trim() || isApplying}
            className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-purple-500 text-white hover:bg-purple-400 disabled:opacity-30 disabled:hover:bg-purple-500 transition-all shadow-md"
            title="Apply Modification (Enter)"
          >
            {isApplying ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CornerDownLeft className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </form>

      {/* Quick Suggestions */}
      <div className="space-y-1.5 my-2">
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          Suggested Operations
        </span>
        <div className="flex flex-col gap-1">
          {quickPrompts.map((q, idx) => (
            <button
              key={idx}
              onClick={() => onApplyPromptEdit(q)}
              disabled={isApplying}
              className="flex items-center justify-between text-left px-2.5 py-1.5 rounded-lg bg-slate-950/40 hover:bg-purple-500/10 border border-slate-800/80 hover:border-purple-500/30 text-[11px] text-slate-300 hover:text-purple-300 transition-colors group"
            >
              <span className="truncate">{q}</span>
              <ArrowRight className="w-3 h-3 text-slate-600 group-hover:text-purple-400 shrink-0 ml-1.5" />
            </button>
          ))}
        </div>
      </div>

      {/* Modification History */}
      <div className="flex-1 overflow-y-auto mt-2 pt-2 border-t border-slate-800/80">
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
          Applied Operations
        </span>
        <div className="space-y-1.5">
          {history.map((h, i) => (
            <div
              key={i}
              className="flex items-start gap-2 p-2 rounded-lg bg-slate-950/40 border border-slate-800 text-[11px] text-slate-400"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span className="line-clamp-2">{h}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
