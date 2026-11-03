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
    <div className="flex flex-col h-full w-80 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/60 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden text-zinc-200">
      {/* Header */}
      <div className="bg-zinc-950/80 border-b border-zinc-800 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <h3 className="text-xs font-bold text-zinc-100 tracking-wide">AI BUILD ASSISTANT</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-col flex-1 overflow-hidden p-4 gap-3">
        {/* Natural Language Prompt Input */}
        <form onSubmit={handleSubmit} className="space-y-2">
          <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
            Describe architectural modification:
          </label>
          <div className="relative bg-zinc-950 border border-zinc-800 rounded-xl focus-within:border-green-500/40 transition-colors">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. 'Replace all oak with spruce' or 'Make the roof steeper'..."
              rows={3}
              className="w-full p-2.5 pr-10 text-xs bg-transparent text-zinc-100 placeholder:text-zinc-600 focus:outline-none resize-none rounded-xl"
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
              className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-violet-500 text-white hover:bg-violet-400 disabled:opacity-30 disabled:hover:bg-violet-500 transition-all shadow-md"
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
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
            Suggested Operations
          </span>
          <div className="flex flex-col gap-1">
            {quickPrompts.map((q, idx) => (
              <button
                key={idx}
                onClick={() => onApplyPromptEdit(q)}
                disabled={isApplying}
                className="flex items-center justify-between text-left px-2.5 py-1.5 rounded-lg bg-zinc-950/60 hover:bg-violet-500/10 border border-zinc-800/80 hover:border-violet-500/30 text-[11px] text-zinc-300 hover:text-violet-300 transition-colors group disabled:opacity-50"
              >
                <span className="truncate">{q}</span>
                <ArrowRight className="w-3 h-3 text-zinc-600 group-hover:text-violet-400 shrink-0 ml-1.5" />
              </button>
            ))}
          </div>
        </div>

        {/* Modification History */}
        <div className="flex-1 overflow-y-auto pt-3 border-t border-zinc-800/80">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-2">
            Applied Operations
          </span>
          <div className="space-y-1.5">
            {history.map((h, i) => (
              <div
                key={i}
                className="flex items-start gap-2 p-2 rounded-xl bg-green-500/10 border border-green-500/20 text-[11px] text-zinc-400"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />
                <span className="line-clamp-2">{h}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
