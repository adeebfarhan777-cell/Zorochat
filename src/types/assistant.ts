export interface PrivacySettings {
  permissionGranted: boolean;
  allowSnippetAnalysis: boolean;
  allowSessionHistory: boolean;
  maskSensitivePatterns: boolean;
}

export interface VerificationIssue {
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  line?: number;
}

export interface VerificationResult {
  verified: boolean;
  language: string;
  issuesCount: number;
  issues: VerificationIssue[];
  summary: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isStreaming?: boolean;
  durationMs?: number;
  premiseWarning?: string;
  privacyNotice?: string;
  modelUsed?: string;
}

export type FormatMode = 'direct' | 'structured' | 'step_by_step';
export type ReasoningDepth = 'fast' | 'deep';
