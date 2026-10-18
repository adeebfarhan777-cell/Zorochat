/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, Square, ShieldCheck, Sparkles, AlertCircle, ArrowDown, Lock, Code2, Zap } from 'lucide-react';
import { Header } from './components/Header';
import { MessageItem } from './components/MessageItem';
import { QuickPrompts } from './components/QuickPrompts';
import { PrivacyModal } from './components/PrivacyModal';
import { ErrorInspectorModal } from './components/ErrorInspectorModal';
import { Message, PrivacySettings, FormatMode, ReasoningDepth, VerificationResult } from './types/assistant';

const INITIAL_GREETING: Message = {
  id: 'init-msg',
  role: 'model',
  text: `### Welcome to Veritas AI

I am an AI assistant specialized in **programming, logical reasoning, and clear explanation**.

My strict operating priorities:
1. **Correctness First**: Verified algorithms, boundary safety, and zero invented APIs.
2. **Clarity**: Direct solutions first with clean prose, diagrams, and scannable code blocks.
3. **Usefulness & Speed**: High-density answers streamed rapidly without boilerplate filler.

#### Privacy & Data Isolation:
- **Zero Cross-User Data Access**: Completely isolated local environment; never reads or cross-references others' data.
- **Permission Controlled**: Code snippets and session memory are processed strictly with your consent.
- **Error Reduction Suite**: Built-in logic auditor to detect off-by-one errors and edge case hazards.

*Ask a coding question, submit a logic problem, or pick a starter benchmark below.*`,
  timestamp: Date.now(),
  modelUsed: 'gemini-3.8-flash',
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_GREETING]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [formatMode, setFormatMode] = useState<FormatMode>('direct');
  const [reasoningDepth, setReasoningDepth] = useState<ReasoningDepth>('fast');
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [errorInspectorOpen, setErrorInspectorOpen] = useState(false);
  const [redactionCount, setRedactionCount] = useState(0);

  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    permissionGranted: true,
    allowSnippetAnalysis: true,
    allowSessionHistory: true,
    maskSensitivePatterns: true,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Adjust textarea height dynamically
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const handleRunVerify = async (code: string, language: string): Promise<VerificationResult | null> => {
    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
      });
      if (!res.ok) throw new Error('Verification failed');
      return await res.json();
    } catch (err) {
      console.error('Verify error:', err);
      return null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsGenerating(false);
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.isStreaming) {
          return [
            ...prev.slice(0, -1),
            { ...last, isStreaming: false, text: last.text + '\n\n*(Generation stopped by user)*' },
          ];
        }
        return prev;
      });
    }
  };

  const handleSend = async (overridePrompt?: string) => {
    const promptToSend = (overridePrompt || input).trim();
    if (!promptToSend || isGenerating) return;

    // Check permission
    if (!privacySettings.permissionGranted) {
      setPrivacyModalOpen(true);
      return;
    }

    const userMsgId = 'user-' + Date.now();
    const modelMsgId = 'model-' + Date.now();
    const startTime = Date.now();

    const userMessage: Message = {
      id: userMsgId,
      role: 'user',
      text: promptToSend,
      timestamp: startTime,
    };

    const streamingModelMessage: Message = {
      id: modelMsgId,
      role: 'model',
      text: '',
      timestamp: Date.now(),
      isStreaming: true,
      modelUsed: 'gemini-3.8-flash',
    };

    setMessages((prev) => [...prev, userMessage, streamingModelMessage]);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setIsGenerating(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          prompt: promptToSend,
          conversationHistory: messages.map((m) => ({ role: m.role, text: m.text })),
          privacyConfig: privacySettings,
          options: {
            prioritizeSpeed: reasoningDepth === 'fast',
            formatMode,
            thinkingDepth: reasoningDepth,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }

      if (!response.body) throw new Error('ReadableStream not supported.');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let accumulatedText = '';
      let detectedNotice = '';
      let detectedPremise = '';
      let modelUsed = 'gemini-3.8-flash';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let currentEvent = 'message';
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.replace('event: ', '').trim();
          } else if (line.startsWith('data: ')) {
            const rawData = line.replace('data: ', '').trim();
            try {
              const parsed = JSON.parse(rawData);
              if (currentEvent === 'chunk' && parsed.text) {
                accumulatedText += parsed.text;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === modelMsgId ? { ...m, text: accumulatedText } : m
                  )
                );
              } else if (currentEvent === 'privacy_notice' && parsed.message) {
                detectedNotice = parsed.message;
                setRedactionCount((c) => c + 1);
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === modelMsgId ? { ...m, privacyNotice: detectedNotice } : m
                  )
                );
              } else if (currentEvent === 'premise_notice' && parsed.message) {
                detectedPremise = parsed.message;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === modelMsgId ? { ...m, premiseWarning: detectedPremise } : m
                  )
                );
              } else if (currentEvent === 'done') {
                if (parsed.model) modelUsed = parsed.model;
              }
            } catch {
              // Ignore partial JSON chunks
            }
          }
        }
      }

      const durationMs = Date.now() - startTime;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === modelMsgId
            ? {
                ...m,
                isStreaming: false,
                text: accumulatedText || '(No response returned)',
                durationMs,
                modelUsed,
              }
            : m
        )
      );
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      const durationMs = Date.now() - startTime;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === modelMsgId
            ? {
                ...m,
                isStreaming: false,
                durationMs,
                text: `**System Error:** ${err.message || 'Failed to communicate with reasoning server.'}\n\nPlease check that your prompt is well-formed or review permissions.`,
              }
            : m
        )
      );
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    setMessages([INITIAL_GREETING]);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Header */}
      <Header
        privacySettings={privacySettings}
        onOpenPrivacy={() => setPrivacyModalOpen(true)}
        onOpenErrorInspector={() => setErrorInspectorOpen(true)}
        onClearChat={handleClearChat}
        formatMode={formatMode}
        onChangeFormatMode={setFormatMode}
        reasoningDepth={reasoningDepth}
        onChangeReasoningDepth={setReasoningDepth}
        messageCount={messages.length}
      />

      {/* Main Conversation Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 pt-6 pb-28 flex flex-col justify-between">
        <div className="space-y-6">
          {messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              onRunVerify={handleRunVerify}
            />
          ))}

          {/* Quick Prompts shown if only initial greeting exists */}
          {messages.length === 1 && (
            <QuickPrompts onSelectPrompt={(p) => handleSend(p)} />
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Dock Area */}
      <div className="sticky bottom-0 z-20 bg-slate-950/90 backdrop-blur-lg border-t border-slate-800/80 px-4 sm:px-6 py-4">
        <div className="max-w-4xl mx-auto space-y-2">
          {/* Permission Warning Notice if Denied */}
          {!privacySettings.permissionGranted && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>Data permission is currently revoked. Snippets cannot be analyzed.</span>
              </div>
              <button
                onClick={() => setPrivacyModalOpen(true)}
                className="underline hover:text-white font-medium"
              >
                Grant Permission
              </button>
            </div>
          )}

          {/* Prompt Form */}
          <div className="relative rounded-2xl bg-slate-900 border border-slate-700/80 focus-within:border-indigo-500/60 focus-within:ring-2 focus-within:ring-indigo-500/20 shadow-lg transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask a programming question, paste code to debug, or verify logic..."
              rows={1}
              aria-label="Ask a programming or reasoning question"
              className="w-full bg-transparent p-3.5 pr-24 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none resize-none min-h-[48px] max-h-[200px]"
            />

            {/* Action Buttons on Right */}
            <div className="absolute right-2.5 bottom-2.5 flex items-center gap-2">
              {isGenerating ? (
                <button
                  type="button"
                  onClick={handleStop}
                  aria-label="Stop generation"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-semibold shadow-md transition-colors"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={!input.trim()}
                  aria-label="Send prompt"
                  className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white shadow-md transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Micro Footer Status Line */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-emerald-400/90">
                <Lock className="w-3 h-3" />
                <span>Isolated Private Session</span>
              </span>
              <span>&bull;</span>
              <span>Enter to send, Shift+Enter for newline</span>
            </div>

            <button
              onClick={() => setErrorInspectorOpen(true)}
              className="hover:text-slate-300 transition-colors flex items-center gap-1"
            >
              <Code2 className="w-3 h-3 text-indigo-400" />
              <span>Logic Hazard Auditor</span>
            </button>
          </div>
        </div>
      </div>

      {/* Privacy & Permission Modal */}
      <PrivacyModal
        isOpen={privacyModalOpen}
        onClose={() => setPrivacyModalOpen(false)}
        settings={privacySettings}
        onUpdateSettings={setPrivacySettings}
        redactionCount={redactionCount}
      />

      {/* Error Reduction Inspector Modal */}
      <ErrorInspectorModal
        isOpen={errorInspectorOpen}
        onClose={() => setErrorInspectorOpen(false)}
        onRunVerify={handleRunVerify}
      />
    </div>
  );
}
