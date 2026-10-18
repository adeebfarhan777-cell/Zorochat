/**
 * Core utility for reasoning, privacy validation, and prompt construction.
 * Pure logic decoupled for deterministic unit testing.
 */

export interface PrivacyConfig {
  permissionGranted: boolean;
  allowSnippetAnalysis: boolean;
  allowSessionHistory: boolean;
  maskSensitivePatterns: boolean;
}

export interface SanitizedQuery {
  safeText: string;
  hasSensitiveRedactions: boolean;
  detectedPremiseWarning?: string;
  isAmbiguous: boolean;
}

export interface SystemPromptOptions {
  prioritizeSpeed: boolean;
  formatMode: 'direct' | 'structured' | 'step_by_step';
  userPermission: boolean;
}

/**
 * Builds the strict system prompt incorporating user instructions
 * and accuracy/clarity/usefulness rules.
 */
export function buildSystemInstruction(options: SystemPromptOptions): string {
  const parts: string[] = [
    `You are Veritas AI, an exceptionally accurate, helpful AI assistant built for programming, logical reasoning, and clear explanation.`,
    `Your strict priorities, in order: 1. Correctness, 2. Clarity, 3. Usefulness.`,
    ``,
    `CORE GUIDELINES:`,
    `- Answer the question directly first. Add explanation only as needed. Match length to complexity: short and sharp for simple questions, thorough for complex ones.`,
    `- Understand the request first: If it is ambiguous in a way that would alter the answer fundamentally, ask ONE short clarifying question or state your working assumption briefly in 1 line and proceed directly.`,
    `- Plain language: Define jargon simply when concepts are introduced.`,
    `- Formatting: Default to clean prose for discussion, but use clean markdown code blocks (with language identifiers), lists, and tables when it makes answers faster and easier to scan.`,
    `- Accuracy & Honesty: NEVER invent APIs, functions, syntax, library features, links, or citations. If uncertain, state what you know and what cannot be confirmed. Separate established facts from inferences or guesses.`,
    `- Premise Verification: If the user's premise or assumption appears incorrect, politely point it out immediately instead of continuing with a flawed premise.`,
    `- Advisory Fields: For medical, legal, or financial topics, provide useful general objective information and clearly advise consulting a certified professional.`,
    `- Data Privacy & Zero Cross-Contamination: You NEVER access or share data from other users. You only inspect or use data the current user has explicitly provided and granted permission to analyze.`,
  ];

  if (options.prioritizeSpeed) {
    parts.push(
      `- SPEED & CONCISENESS: Deliver high-density information rapidly without filler, fluff, or repetitive intros/outros.`
    );
  }

  if (options.formatMode === 'step_by_step') {
    parts.push(
      `- FORMAT REQUIREMENT: Provide the solution structured into logical, numbered verification steps with clear rationale.`
    );
  } else if (options.formatMode === 'direct') {
    parts.push(
      `- FORMAT REQUIREMENT: Lead directly with the immediate solution/code without conversational preamble.`
    );
  }

  if (!options.userPermission) {
    parts.push(
      `- PRIVACY NOTE: The user has not granted permission to persist or analyze external private documents. Rely strictly on general public knowledge and the immediate snippet provided.`
    );
  }

  return parts.join('\n');
}

/**
 * Redacts potential accidental API keys, tokens, or personal identifiers
 * if privacy masking is requested.
 */
export function sanitizeUserInput(input: string, config: PrivacyConfig): SanitizedQuery {
  if (!input) {
    return { safeText: '', hasSensitiveRedactions: false, isAmbiguous: false };
  }

  let text = input;
  let hasSensitiveRedactions = false;

  if (config.maskSensitivePatterns) {
    // Regex for common API keys/tokens (sk-, AIzaSy, bearer tokens, etc.)
    const keyPatterns = [
      /(?:(?:api[_-]?)?key|secret|token|password|bearer)\s*[:=]\s*["']?([a-zA-Z0-9_\-]{12,})["']?/gi,
      /(AIzaSy[0-9A-Za-z_\-]{25,40})/g,
      /(sk-[a-zA-Z0-9_\-]{15,})/g,
    ];

    for (const pattern of keyPatterns) {
      const replaced = text.replace(pattern, '[REDACTED_SENSITIVE_CREDENTIAL]');
      if (replaced !== text) {
        hasSensitiveRedactions = true;
        text = replaced;
      }
    }
  }

  // Detect flawed premises in common programming / logical questions
  let detectedPremiseWarning: string | undefined;
  if (/can html be called a programming language/i.test(text) || /html is a programming language/i.test(text)) {
    detectedPremiseWarning = 'Note: HTML is a markup language rather than a general-purpose programming language.';
  } else if (/const in javascript makes objects immutable/i.test(text)) {
    detectedPremiseWarning = 'Note: `const` prevents variable reassignment, but does not freeze object mutation.';
  }

  // Check ambiguity heuristic (e.g., extremely brief queries like "sort it" or "fix this" without code)
  const isAmbiguous = text.trim().split(/\s+/).length <= 2 && /^(sort|fix|optimize|run|help|check)$/i.test(text.trim());

  return {
    safeText: text,
    hasSensitiveRedactions,
    detectedPremiseWarning,
    isAmbiguous,
  };
}

/**
 * Extracts and classifies code blocks from markdown responses.
 */
export function extractCodeBlocks(markdown: string): Array<{ language: string; code: string }> {
  const codeBlockRegex = /```([a-zA-Z0-9_\-+]*)\n([\s\S]*?)```/g;
  const blocks: Array<{ language: string; code: string }> = [];

  let match: RegExpExecArray | null;
  while ((match = codeBlockRegex.exec(markdown)) !== null) {
    blocks.push({
      language: match[1]?.trim().toLowerCase() || 'text',
      code: match[2]?.trim() || '',
    });
  }

  return blocks;
}

/**
 * Validates privacy permissions before sending external requests.
 */
export function assertDataPermission(
  action: 'analyze_code' | 'export_data' | 'cache_session',
  config: PrivacyConfig
): { allowed: boolean; reason?: string } {
  if (action === 'analyze_code' && !config.allowSnippetAnalysis) {
    return {
      allowed: false,
      reason: 'Snippet analysis permission has not been granted by the user.',
    };
  }
  if (action === 'cache_session' && !config.allowSessionHistory) {
    return {
      allowed: false,
      reason: 'Session history storage permission is disabled.',
    };
  }
  return { allowed: true };
}
