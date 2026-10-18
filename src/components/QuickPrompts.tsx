import React from 'react';
import { Terminal, Bug, Cpu, HelpCircle, CheckCheck, Lightbulb } from 'lucide-react';

interface QuickPromptsProps {
  onSelectPrompt: (promptText: string) => void;
}

export const QuickPrompts: React.FC<QuickPromptsProps> = ({ onSelectPrompt }) => {
  const prompts = [
    {
      icon: <Terminal className="w-4 h-4 text-cyan-400" />,
      label: 'Binary Search Algorithm',
      detail: 'Iterative implementation with midpoint overflow prevention & test cases',
      query: 'Write an optimal binary search in TypeScript. Explain the loop invariant and why left + (right - left) / 2 prevents overflow.',
    },
    {
      icon: <Bug className="w-4 h-4 text-rose-400" />,
      label: 'Debug & Reduce Errors',
      detail: 'Detect edge case failures, off-by-one hazards, and unhandled nil/null',
      query: 'Review this loop logic for potential off-by-one and boundary bugs: for (let i = 0; i <= arr.length; i++) { total += arr[i].value; }',
    },
    {
      icon: <HelpCircle className="w-4 h-4 text-amber-400" />,
      label: 'Check Premise & Assumptions',
      detail: 'Clarify misunderstandings and common myths in programming',
      query: 'Check premise: Does `const` in JavaScript make objects immutable? Explain what is frozen vs mutable.',
    },
    {
      icon: <Cpu className="w-4 h-4 text-indigo-400" />,
      label: 'Algorithmic Complexity Proof',
      detail: 'Derive time & space complexity clearly using plain language',
      query: 'Explain QuickSort time complexity in best, average, and worst cases with plain language and diagrams.',
    },
    {
      icon: <CheckCheck className="w-4 h-4 text-emerald-400" />,
      label: 'Generate Strict Unit Tests',
      detail: 'Edge cases, invalid inputs, null boundaries',
      query: 'Generate 5 rigorous boundary unit tests for a palindrome string function using node:test and node:assert.',
    },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto my-8 space-y-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
        <Lightbulb className="w-4 h-4 text-amber-400" />
        <span>Quick Starter Benchmarks & Verifications</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {prompts.map((item, idx) => (
          <button
            key={idx}
            onClick={() => onSelectPrompt(item.query)}
            className="flex items-start gap-3 p-3.5 text-left rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/30 transition-all text-xs group"
          >
            <div className="p-2 rounded-lg bg-slate-800 group-hover:bg-slate-750 transition-colors">
              {item.icon}
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors">
                {item.label}
              </div>
              <div className="text-[11px] text-slate-400 line-clamp-2">
                {item.detail}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
