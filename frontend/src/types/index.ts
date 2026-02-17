export interface RiskResult {
  decision: 'ALLOW' | 'BLOCK' | 'REVIEW';
  riskScore: number;
  reason: string;
  detectors: Record<string, { flagged: boolean; score: number; reason?: string }>;
  signature?: string;
  intentHash?: string;
}

export interface AuditRecord {
  id?: string;
  wallet?: string;
  to?: string;
  value?: string;
  riskScore?: number;
  classification?: string;
  decision?: 'ALLOW' | 'BLOCK' | 'REVIEW';
  timestamp?: string;
}
