import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSystemInstruction,
  sanitizeUserInput,
  extractCodeBlocks,
  assertDataPermission,
} from './reasoning.ts';
import type { PrivacyConfig } from './reasoning.ts';

test('buildSystemInstruction contains core correctness, clarity, and usefulness priorities', () => {
  const prompt = buildSystemInstruction({
    prioritizeSpeed: true,
    formatMode: 'direct',
    userPermission: false,
  });

  assert.ok(prompt.includes('1. Correctness, 2. Clarity, 3. Usefulness'));
  assert.ok(prompt.includes('NEVER invent APIs'));
  assert.ok(prompt.includes('SPEED & CONCISENESS'));
  assert.ok(prompt.includes('Zero Cross-Contamination'));
});

test('sanitizeUserInput redacts sensitive API keys when maskSensitivePatterns is enabled', () => {
  const config: PrivacyConfig = {
    permissionGranted: true,
    allowSnippetAnalysis: true,
    allowSessionHistory: true,
    maskSensitivePatterns: true,
  };

  const raw = 'Here is my key: AIzaSyD9x7aKlmnoPqrstuvwxyz1234567890 please inspect';
  const result = sanitizeUserInput(raw, config);

  assert.equal(result.hasSensitiveRedactions, true);
  assert.ok(!result.safeText.includes('AIzaSyD9x7aKlmnoPqrstuvwxyz1234567890'));
  assert.ok(result.safeText.includes('[REDACTED_SENSITIVE_CREDENTIAL]'));
});

test('sanitizeUserInput flags ambiguous single-word requests', () => {
  const config: PrivacyConfig = {
    permissionGranted: true,
    allowSnippetAnalysis: true,
    allowSessionHistory: true,
    maskSensitivePatterns: true,
  };

  const result = sanitizeUserInput('fix', config);
  assert.equal(result.isAmbiguous, true);

  const clearResult = sanitizeUserInput('Write a quicksort function in TypeScript with comments', config);
  assert.equal(clearResult.isAmbiguous, false);
});

test('extractCodeBlocks parses markdown fenced code blocks accurately', () => {
  const markdown = `
Here is the solution:
\`\`\`typescript
function add(a: number, b: number): number {
  return a + b;
}
\`\`\`
And in Python:
\`\`\`python
def add(a, b):
    return a + b
\`\`\`
`;

  const blocks = extractCodeBlocks(markdown);
  assert.equal(blocks.length, 2);
  assert.equal(blocks[0].language, 'typescript');
  assert.ok(blocks[0].code.includes('function add'));
  assert.equal(blocks[1].language, 'python');
  assert.ok(blocks[1].code.includes('def add'));
});

test('assertDataPermission enforces permission boundaries correctly', () => {
  const deniedConfig: PrivacyConfig = {
    permissionGranted: false,
    allowSnippetAnalysis: false,
    allowSessionHistory: false,
    maskSensitivePatterns: true,
  };

  const check1 = assertDataPermission('analyze_code', deniedConfig);
  assert.equal(check1.allowed, false);

  const allowedConfig: PrivacyConfig = {
    permissionGranted: true,
    allowSnippetAnalysis: true,
    allowSessionHistory: true,
    maskSensitivePatterns: true,
  };

  const check2 = assertDataPermission('analyze_code', allowedConfig);
  assert.equal(check2.allowed, true);
});
