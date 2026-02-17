import type { AuditRecord, RiskResult } from '../types';

const RELAYER_URL = import.meta.env.VITE_RELAYER_URL || 'http://localhost:3001';
const AGENT_URL = import.meta.env.VITE_AGENT_URL || 'http://localhost:9001';

interface AgentMetrics {
  totalAnalyzed: number;
  blocked: number;
  allowed: number;
  reviewed: number;
  avgRiskScore: number;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  analyze: async (wallet: string, to: string, value: string, data = '0x') =>
    request<RiskResult>(`${AGENT_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet, to, value, data })
    }),

  submitIntent: async (payload: {
    wallet: string;
    to: string;
    value: string;
    data: string;
    riskScore: number;
    classification: string;
    signature?: string;
    intentHash?: string;
  }) =>
    request<{ intentId: string; decision: string }>(`${RELAYER_URL}/intent/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }),

  getAudit: async (walletAddress: string) => {
    const data = await request<{ intents?: AuditRecord[] }>(`${RELAYER_URL}/audit/${walletAddress}`);
    return data.intents || [];
  },

  getAgentMetrics: async () => request<AgentMetrics>(`${AGENT_URL}/metrics`),

  getDecisionLogs: async () => request<{ logs: RiskResult[] }>(`${AGENT_URL}/logs`)
};
