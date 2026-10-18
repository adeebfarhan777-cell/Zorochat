import React from 'react';
import { User, Sparkles, ShieldCheck, AlertCircle, Clock, Zap } from 'lucide-react';
import { Message, VerificationResult } from '../types/assistant';
import { CodeBlock } from './CodeBlock';

interface MessageItemProps {
  message: Message;
  onRunVerify?: (code: string, language: string) => Promise<VerificationResult | null>;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, onRunVerify }) => {
  const isUser = message.role === 'user';

  // Parse text into alternating text and code blocks
  const renderFormattedContent = (content: string) => {
    const parts: React.ReactNode[] = [];
    const codeBlockRegex = /```([a-zA-Z0-9_\-+]*)\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let keyIdx = 0;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        const textSegment = content.slice(lastIndex, match.index);
        parts.push(renderMarkdownText(textSegment, `text-${keyIdx++}`));
      }

      const language = match[1]?.trim() || 'text';
      const code = match[2]?.trim() || '';
      parts.push(
        <CodeBlock
          key={`code-${keyIdx++}`}
          code={code}
          language={language}
          onRunVerify={onRunVerify}
        />
      );

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      const remainingText = content.slice(lastIndex);
      parts.push(renderMarkdownText(remainingText, `text-${keyIdx++}`));
    }

    return parts;
  };

  // Basic lightweight markdown renderer for headings, lists, bold, inline code, and tables
  const renderMarkdownText = (text: string, keyPrefix: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];

    lines.forEach((line, i) => {
      const lineKey = `${keyPrefix}-l-${i}`;
      const trimmed = line.trim();

      if (!trimmed) {
        elements.push(<div key={lineKey} className="h-2" />);
        return;
      }

      // Headers
      if (line.startsWith('#### ')) {
        elements.push(
          <h4 key={lineKey} className="text-sm font-semibold text-cyan-300 mt-3 mb-1">
            {formatInlineText(line.replace('#### ', ''))}
          </h4>
        );
      } else if (line.startsWith('### ')) {
        elements.push(
          <h3 key={lineKey} className="text-base font-semibold text-indigo-200 mt-3 mb-1">
            {formatInlineText(line.replace('### ', ''))}
          </h3>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <h2 key={lineKey} className="text-lg font-bold text-slate-100 mt-4 mb-2 border-b border-slate-800 pb-1">
            {formatInlineText(line.replace('## ', ''))}
          </h2>
        );
      } else if (line.startsWith('# ')) {
        elements.push(
          <h1 key={lineKey} className="text-xl font-bold text-white mt-4 mb-2">
            {formatInlineText(line.replace('# ', ''))}
          </h1>
        );
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        elements.push(
          <li key={lineKey} className="ml-4 list-disc text-slate-300 text-sm my-0.5 leading-relaxed">
            {formatInlineText(trimmed.slice(2))}
          </li>
        );
      } else if (/^\d+\.\s/.test(trimmed)) {
        const match = trimmed.match(/^(\d+)\.\s(.*)/);
        elements.push(
          <div key={lineKey} className="flex items-start gap-2 text-slate-300 text-sm my-1 leading-relaxed">
            <span className="font-semibold text-indigo-400 font-mono text-xs mt-0.5">{match ? match[1] : '•'}.</span>
            <span>{match ? formatInlineText(match[2]) : trimmed}</span>
          </div>
        );
      } else {
        elements.push(
          <p key={lineKey} className="text-sm text-slate-300 leading-relaxed my-1">
            {formatInlineText(line)}
          </p>
        );
      }
    });

    return <div key={keyPrefix}>{elements}</div>;
  };

  // Helper to parse `inline code`, **bold**, *italic*
  const formatInlineText = (str: string) => {
    const parts = str.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={index}
            className="px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono text-xs border border-slate-700/50"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-semibold text-slate-100">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={index} className="italic text-slate-200">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  return (
    <div
      className={`group flex gap-3.5 sm:gap-4 p-4 sm:p-5 rounded-2xl transition-all ${
        isUser
          ? 'bg-slate-900/60 border border-slate-800/80 ml-auto max-w-2xl'
          : 'bg-slate-900/30 border border-slate-800/40 w-full'
      }`}
    >
      {/* Avatar Icon */}
      <div className="flex-shrink-0">
        {isUser ? (
          <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-medium">
            <User className="w-4 h-4" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-indigo-500/10">
            <Sparkles className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Message Body */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Author & Meta Line */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-200">
              {isUser ? 'You' : 'Veritas AI'}
            </span>
            {!isUser && message.modelUsed && (
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                {message.modelUsed}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-slate-500 text-[11px]">
            {message.durationMs && (
              <span className="flex items-center gap-1 font-mono text-emerald-400/90">
                <Zap className="w-3 h-3" />
                <span>{message.durationMs}ms</span>
              </span>
            )}
            <span>
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Notices */}
        {message.premiseWarning && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
            <div>
              <span className="font-semibold">Premise Check:</span> {message.premiseWarning}
            </div>
          </div>
        )}

        {message.privacyNotice && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
            <div>
              <span className="font-semibold">Privacy Protection:</span> {message.privacyNotice}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="text-slate-200 space-y-1">
          {renderFormattedContent(message.text)}
          {message.isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-indigo-400 animate-pulse rounded-sm align-middle" />
          )}
        </div>
      </div>
    </div>
  );
};
