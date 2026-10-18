import React from 'react';
import { ShieldCheck, ShieldAlert, Sparkles, RefreshCw, Download, Zap, Settings, Bug, CheckSquare } from 'lucide-react';
import { PrivacySettings, FormatMode, ReasoningDepth } from '../types/assistant';

interface HeaderProps {
  privacySettings: PrivacySettings;
  onOpenPrivacy: () => void;
  onOpenErrorInspector: () => void;
  onClearChat: () => void;
  formatMode: FormatMode;
  onChangeFormatMode: (mode: FormatMode) => void;
  reasoningDepth: ReasoningDepth;
  onChangeReasoningDepth: (depth: ReasoningDepth) => void;
  messageCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  privacySettings,
  onOpenPrivacy,
  onOpenErrorInspector,
  onClearChat,
  formatMode,
  onChangeFormatMode,
  reasoningDepth,
  onChangeReasoningDepth,
  messageCount,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-4 sm:px-6 py-3.5">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Branding & Tagline */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-cyan-300" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-slate-100 text-base sm:text-lg tracking-tight">
                Veritas AI
              </h1>
              <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                Precision v2
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Correctness &bull; Clarity &bull; Usefulness &bull; Ultra-Fast Stream
            </p>
          </div>
        </div>

        {/* Right: Controls & Badges */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
          {/* Format Mode Selector */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => onChangeFormatMode('direct')}
              aria-label="Direct answer format"
              className={`px-2.5 py-1 rounded-md transition-colors ${
                formatMode === 'direct'
                  ? 'bg-indigo-600 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Direct
            </button>
            <button
              onClick={() => onChangeFormatMode('step_by_step')}
              aria-label="Step-by-step format"
              className={`px-2.5 py-1 rounded-md transition-colors ${
                formatMode === 'step_by_step'
                  ? 'bg-indigo-600 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Step-by-Step
            </button>
          </div>

          {/* Speed / Depth Toggle */}
          <button
            onClick={() => onChangeReasoningDepth(reasoningDepth === 'fast' ? 'deep' : 'fast')}
            aria-label="Toggle speed and reasoning depth"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 transition-colors"
          >
            <Zap className={`w-3.5 h-3.5 ${reasoningDepth === 'fast' ? 'text-amber-400' : 'text-indigo-400'}`} />
            <span className="font-medium">
              {reasoningDepth === 'fast' ? 'Fast Info' : 'Deep Logic'}
            </span>
          </button>

          {/* Error Reducer / Code Validator Tool Button */}
          <button
            onClick={onOpenErrorInspector}
            aria-label="Open Code Error Reducer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 transition-colors"
          >
            <Bug className="w-3.5 h-3.5 text-rose-400" />
            <span className="font-medium hidden sm:inline">Error Reducer</span>
          </button>

          {/* Privacy & Permission Status Badge */}
          <button
            onClick={onOpenPrivacy}
            aria-label="Open Privacy & Permission Center"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors ${
              privacySettings.permissionGranted
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
            }`}
          >
            {privacySettings.permissionGranted ? (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span className="font-medium">
              {privacySettings.permissionGranted ? 'Data: Consented' : 'Data: Restricted'}
            </span>
          </button>

          {/* Clear Chat */}
          {messageCount > 0 && (
            <button
              onClick={onClearChat}
              aria-label="Clear chat session"
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
