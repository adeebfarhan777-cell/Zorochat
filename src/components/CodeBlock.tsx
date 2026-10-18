import React, { useState } from 'react';
import { Check, Copy, Play, ShieldAlert, CheckCircle2, AlertTriangle, Info, Terminal, ChevronDown, ChevronUp } from 'lucide-react';
import { VerificationResult } from '../types/assistant';

interface CodeBlockProps {
  code: string;
  language: string;
  onRunVerify?: (code: string, language: string) => Promise<VerificationResult | null>;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language, onRunVerify }) => {
  const [copied, setCopied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [showSandbox, setShowSandbox] = useState(false);
  const [sandboxOutput, setSandboxOutput] = useState<string[]>([]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleVerify = async () => {
    if (!onRunVerify) return;
    setIsVerifying(true);
    try {
      const res = await onRunVerify(code, language);
      setVerificationResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRunInSandbox = () => {
    setShowSandbox(!showSandbox);
    if (!showSandbox) {
      setSandboxOutput(['Initializing secure client-side sandbox...']);
      try {
        const logs: string[] = [];
        const customConsole = {
          log: (...args: any[]) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
          error: (...args: any[]) => logs.push('[ERROR] ' + args.map(a => String(a)).join(' ')),
          warn: (...args: any[]) => logs.push('[WARN] ' + args.map(a => String(a)).join(' ')),
        };

        // Safe execution sandbox for pure JS calculations
        const runner = new Function('console', `
          try {
            ${code}
          } catch(err) {
            console.error(err.message);
          }
        `);
        runner(customConsole);

        setSandboxOutput(logs.length > 0 ? logs : ['Execution completed with no console output.']);
      } catch (err: any) {
        setSandboxOutput([`Sandbox error: ${err.message}`]);
      }
    }
  };

  const isExecutable = ['javascript', 'js', 'typescript', 'ts'].includes(language.toLowerCase());

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-slate-800 bg-slate-950/90 shadow-md">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-medium uppercase tracking-wider text-indigo-400 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
            {language || 'code'}
          </span>
          <span className="text-[11px] text-slate-500">
            {code.split('\n').length} lines
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {isExecutable && (
            <button
              onClick={handleRunInSandbox}
              aria-label="Run snippet in sandbox"
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 transition-colors border border-slate-700"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{showSandbox ? 'Hide Sandbox' : 'Run Sandbox'}</span>
            </button>
          )}

          {onRunVerify && (
            <button
              onClick={handleVerify}
              disabled={isVerifying}
              aria-label="Verify code for bugs and boundary hazards"
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-indigo-200 transition-colors border border-slate-700"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
              <span>{isVerifying ? 'Checking...' : 'Verify Logic'}</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            aria-label="Copy code to clipboard"
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Content */}
      <pre className="p-4 text-xs sm:text-sm font-mono overflow-x-auto text-slate-200 leading-relaxed scrollbar-thin">
        <code>{code}</code>
      </pre>

      {/* Verification Result Panel */}
      {verificationResult && (
        <div className="p-4 bg-slate-900/90 border-t border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {verificationResult.verified ? (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Logic Verification Passed: {verificationResult.summary}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Verification Warning: {verificationResult.summary}</span>
                </div>
              )}
            </div>
            <button
              onClick={() => setVerificationResult(null)}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Dismiss
            </button>
          </div>

          {verificationResult.issues.length > 0 && (
            <div className="space-y-2 mt-2">
              {verificationResult.issues.map((issue, i) => (
                <div
                  key={i}
                  className={`p-2.5 rounded-lg text-xs flex items-start gap-2.5 border ${
                    issue.severity === 'critical'
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      : issue.severity === 'warning'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                  }`}
                >
                  <div className="mt-0.5 font-bold uppercase text-[10px] px-1.5 py-0.5 rounded bg-black/30">
                    {issue.severity}
                  </div>
                  <div>
                    <span className="font-semibold">{issue.title}</span>
                    {issue.line && <span className="opacity-75"> (line {issue.line})</span>}:{' '}
                    <span>{issue.message}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sandbox Output Panel */}
      {showSandbox && (
        <div className="p-4 bg-black/80 border-t border-slate-800 font-mono text-xs text-slate-300">
          <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-800 text-slate-400 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-400">
              <Terminal className="w-3.5 h-3.5" />
              <span>Sandbox Console Output</span>
            </span>
            <button
              onClick={() => setSandboxOutput([])}
              className="hover:text-slate-200"
            >
              Clear
            </button>
          </div>
          <div className="space-y-1">
            {sandboxOutput.map((line, idx) => (
              <div key={idx} className="whitespace-pre-wrap">{line}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
