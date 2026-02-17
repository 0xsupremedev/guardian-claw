const RELAYER_URL = import.meta.env.VITE_RELAYER_URL || 'http://localhost:3001';
const AGENT_URL = import.meta.env.VITE_AGENT_URL || 'http://localhost:9001';

export const api = {
    // Analyze a transaction destination
    analyze: async (target: string, value: string, data: string = '0x') => {
        try {
            const response = await fetch(`${AGENT_URL}/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ target, value, data })
            });
            return await response.json();
        } catch (err) {
            console.error('Agent analysis failed:', err);
            throw err;
        }
    },

    // Submit an intent for execution
    submitIntent: async (payload: any) => {
        try {
            const response = await fetch(`${RELAYER_URL}/intent/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            return await response.json();
        } catch (err) {
            console.error('Intent submission failed:', err);
            throw err;
        }
    },

    // Get audit history for a wallet
    getAudit: async (walletAddress: string) => {
        try {
            const response = await fetch(`${RELAYER_URL}/audit/${walletAddress}`);
            return await response.json();
        } catch (err) {
            console.error('Audit fetch failed:', err);
            return [];
        }
    },

    // Get current policy status
    getPolicy: async (walletAddress: string) => {
        try {
            const response = await fetch(`${RELAYER_URL}/policy/${walletAddress}`);
            return await response.json();
        } catch (err) {
            console.error('Policy fetch failed:', err);
            return null;
        }
    }
};
