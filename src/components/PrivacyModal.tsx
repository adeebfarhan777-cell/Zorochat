import React from 'react';
import { ShieldCheck, ShieldAlert, Lock, CheckCircle2, AlertTriangle, Eye, EyeOff, X, KeyRound, Database } from 'lucide-react';
import { PrivacySettings } from '../types/assistant';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PrivacySettings;
  onUpdateSettings: (newSettings: PrivacySettings) => void;
  redactionCount: number;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  redactionCount,
}) => {
  if (!isOpen) return null;

  const toggle = (key: keyof PrivacySettings) => {
    onUpdateSettings({
      ...settings,
      [key]: !settings[key],
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-modal-title"
    >
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 id="privacy-modal-title" className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                Data Privacy & Permission Center
              </h2>
              <p className="text-xs text-slate-400">
                Zero third-party data access &bull; Strictly sandboxed local context
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close privacy settings"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Strict Data Isolation Guarantee */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-medium text-sm">
              <Lock className="w-4 h-4" />
              <span>Fundamental Guarantee: No Access To Others' Data</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              This application operates on a strict tenant-isolation boundary. It cannot, and will never, access, read, or cross-reference other users&apos; sessions, private databases, or confidential files.
            </p>
          </div>

          {/* Granular Permission Toggles */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Your Explicit Permissions
            </h3>

            {/* Toggle 1: Explicit Permission to Use User's Data */}
            <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-slate-200">
                    Grant Permission To Inspect Your Snippets
                  </span>
                  {settings.permissionGranted ? (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Granted
                    </span>
                  ) : (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Revoked
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  Allows the reasoning engine to read code and inputs you paste into the prompt to provide precise debug feedback.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.permissionGranted}
                onClick={() => toggle('permissionGranted')}
                aria-label="Toggle permission to inspect your code and snippets"
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                  settings.permissionGranted ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings.permissionGranted ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Toggle 2: Sensitive Token Masking */}
            <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-indigo-400" />
                  <span className="font-medium text-sm text-slate-200">
                    Auto-Mask Sensitive Keys & Secrets
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Automatically scrubs API keys, bearer tokens, and secrets from your queries locally before processing.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.maskSensitivePatterns}
                onClick={() => toggle('maskSensitivePatterns')}
                aria-label="Toggle auto-masking of sensitive keys"
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                  settings.maskSensitivePatterns ? 'bg-indigo-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings.maskSensitivePatterns ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Toggle 3: Multi-turn Conversation Memory */}
            <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-cyan-400" />
                  <span className="font-medium text-sm text-slate-200">
                    Ephemeral Session Memory
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Keeps the last few messages in memory for context continuity. If disabled, every prompt is processed statelessly.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.allowSessionHistory}
                onClick={() => toggle('allowSessionHistory')}
                aria-label="Toggle ephemeral session history"
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                  settings.allowSessionHistory ? 'bg-cyan-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings.allowSessionHistory ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Privacy Audit Info */}
          <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-950/60 px-4 py-3 rounded-lg border border-slate-800">
            <span>Client-side redacted secrets this session:</span>
            <span className="font-mono font-semibold text-emerald-400">{redactionCount}</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-900">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-colors shadow-sm"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
