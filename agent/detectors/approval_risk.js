/**
 * Approval Risk Detector
 *
 * Checks for dangerous approval patterns:
 * 1. Unlimited token approvals (MaxUint256)
 * 2. Approval to suspicious/new contracts
 * 3. Multi-token approval risks
 */

const { ethers } = require("ethers");

// ERC-20 approve selector
const APPROVE_SELECTOR = "0x095ea7b3";
const MAX_UINT256 = "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

/**
 * Check for approval-related risks
 * @param {string} to - Target token contract
 * @param {string} data - Transaction calldata
 * @param {ethers.Provider} provider - RPC provider
 * @returns {{ score: number, flagged: boolean, reason: string }}
 */
async function checkApprovalRisk(to, data, provider) {
    let score = 0;
    let reasons = [];

    if (!data || !to) {
        return { score: 0, flagged: false, reason: "No calldata to analyze" };
    }

    try {
        // 1. Check if this is an approve call
        if (data.toLowerCase().startsWith(APPROVE_SELECTOR)) {
            const decoded = data.slice(10); // Remove selector

            // Extract spender and amount
            const spender = "0x" + decoded.slice(24, 64); // address padded to 32 bytes
            const amountHex = decoded.slice(64, 128);

            // 2. Check for unlimited approval
            if (amountHex.toLowerCase().includes(MAX_UINT256)) {
                score += 40;
                reasons.push("Unlimited token approval (MaxUint256)");

                // 3. Check if spender is a known contract or suspicious
                if (provider) {
                    try {
                        const spenderCode = await provider.getCode(spender);

                        if (spenderCode === "0x" || spenderCode === "0x0") {
                            score += 30;
                            reasons.push("Approving to an EOA (very suspicious)");
                        }

                        // Check if spender has very few transactions
                        const txCount = await provider.getTransactionCount(spender);
                        if (txCount < 5) {
                            score += 15;
                            reasons.push(`Spender has only ${txCount} transactions`);
                        }
                    } catch (e) {
                        score += 5;
                        reasons.push("Could not verify spender");
                    }
                }
            } else {
                // Finite approval — lower risk
                score += 5;
                reasons.push("Finite token approval");
            }
        }

        // 4. Check for increaseAllowance (0x39509351) — often used normally but can be risky
        if (data.toLowerCase().startsWith("0x39509351")) {
            score += 10;
            reasons.push("increaseAllowance call detected");
        }

        // 5. Check for setApprovalForAll (0xa22cb465) — ERC-721/1155
        if (data.toLowerCase().startsWith("0xa22cb465")) {
            score += 25;
            reasons.push("setApprovalForAll detected (NFT/multi-token approval)");

            // Check if approving
            const approvedByte = data.slice(-1);
            if (approvedByte === "1") {
                score += 10;
                reasons.push("Granting full NFT access");
            }
        }

    } catch (err) {
        score += 5;
        reasons.push(`Approval check error: ${err.message}`);
    }

    score = Math.min(100, Math.max(0, score));

    return {
        score,
        flagged: score >= 40,
        reason: reasons.length > 0 ? reasons.join("; ") : "No approval risks",
    };
}

module.exports = { checkApprovalRisk };
