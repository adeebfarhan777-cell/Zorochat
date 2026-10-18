import React, { useState } from 'react';
import { X, Bug, CheckCircle2, AlertTriangle, ShieldCheck, Play, ArrowRight, Copy, Check } from 'lucide-react';
import { VerificationResult } from '../types/assistant';

interface ErrorInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunVerify: (code: string, language: string) => Promise<VerificationResult | null>;
}

export const ErrorInspectorModal: React.FC<ErrorInspectorModalProps> = ({
  isOpen,
  onClose,
  onRunVerify,
}) => {
  const [code, setCode] = useState(`// Paste or inspect code snippet here
function calculateAverage(numbers: number[]) {
  let sum = 0;
  for (let i = 0; i <= numbers.length; i++) {
    sum += numbers[i];
  }
  return sum / numbers.length;
}`);
  const [language, setLanguage] = useState('typescript');
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const res = await onRunVerify(code, language);
      setResult(res);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLoadSample = (type: 'off_by_one' | 'loose_equality' | 'clean') => {
    if (type === 'off_by_one') {
      setCode(`function sumItems(items: number[]): number {
  let total = 0;
  // Bug hazard: <= causes undefined addition on items[items.length]
  for (let i = 0; i <= items.length; i++) {
    total += items[i];
  }
  return total;
}`);
    } else if (type === 'loose_equality') {
      setCode(`function checkStatus(code: string | number) {
  // Loose equality causes type coercion vulnerabilities
  if (code == 0) {
    return 'inactive';
  }
  return 'active';
}`);
    } else {
      setCode(`function sumItems(items: number[]): number {
  if (!items || items.length === 0) return 0;
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i];
  }
  return total;
}`);
    }
    setResult(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="error-inspector-title"
    >
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Bug className="w-5 h-5" />
            </div>
            <div>
              <h2 id="error-inspector-title" className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                Logic Hazard & Error Reducer
              </h2>
              <p className="text-xs text-slate-400">
                Detect boundary traps, off-by-one indices, and unhandled nil exceptions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close error reducer"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Quick Presets */}
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className="text-slate-400">Load Hazard Preset:</span>
            <button
              onClick={() => handleLoadSample('off_by_one')}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700"
            >
              Off-by-One Loop
            </button>
            <button
              onClick={() => handleLoadSample('loose_equality')}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700"
            >
              Loose Equality Hazard
            </button>
            <button
              onClick={() => handleLoadSample('clean')}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 text-emerald-400 border border-slate-700"
            >
              Clean Guarded Code
            </button>
          </div>

          {/* Editor Area */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Code to Inspect</label>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={8}
              aria-label="Code snippet to inspect for errors"
              className="w-full font-mono text-xs sm:text-sm p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-y"
            />
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              aria-label="Code language"
              className="text-xs bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
            >
              <option value="typescript">TypeScript</option>
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
            </select>

            <button
              onClick={handleVerify}
              disabled={isVerifying}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors shadow-sm"
            >
              {isVerifying ? (
                <span>Inspecting logic...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Run Error Reduction Audit</span>
                </>
              )}
            </button>
          </div>

          {/* Verification Results */}
          {result && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 font-semibold text-sm">
                {result.verified ? (
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Audit Status: Clean (0 Critical Defects)</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-rose-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Audit Status: Critical Hazard Detected</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-300">{result.summary}</p>

              {result.issues.length > 0 && (
                <div className="space-y-2 pt-2">
                  {result.issues.map((issue, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg text-xs border ${
                        issue.severity === 'critical'
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                          : issue.severity === 'warning'
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                          : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-[11px] mb-1">
                        <span>{issue.title}</span>
                        {issue.line && <span>Line {issue.line}</span>}
                      </div>
                      <p className="leading-relaxed opacity-90">{issue.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-800 bg-slate-900">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
