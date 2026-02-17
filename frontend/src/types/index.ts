export interface RiskResult {
    decision: 'ALLOW' | 'BLOCK' | 'REVIEW';
    riskScore: number;
    reason: string;
    detectors: {
        [key: string]: {
            flagged: boolean;
            score: number;
        };
    };
    signature?: string;
}

export interface AuditRecord {
    id: string;
    actionType: number;
    riskScore: number;
    metadataURI: string;
    txHash: string;
    timestamp: number;
}

export interface PolicyStatus {
    dailyLimit: string;
    remainingLimit: string;
    isPaused: boolean;
    blockedCount: number;
}
