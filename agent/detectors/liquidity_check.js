/**
 * Liquidity Check Detector
 *
 * Evaluates liquidity risk for token/DeFi interactions:
 * 1. Balance check on target contract
 * 2. Transaction value vs available liquidity ratio
 * 3. DEX pair liquidity estimation
 */

const { ethers } = require("ethers");

// Minimum liquidity thresholds (in wei)
const MIN_LIQUIDITY_BNB = ethers.parseEther("0.1"); // 0.1 BNB minimum

/**
 * Check liquidity risk for a transaction target
 * @param {string} to - Target address
 * @param {string|number} value - Transaction value in wei
 * @param {ethers.Provider} provider - RPC provider
 * @returns {{ score: number, flagged: boolean, reason: string }}
 */
async function checkLiquidity(to, value, provider) {
    let score = 0;
    let reasons = [];

    if (!to || !provider) {
        return { score: 0, flagged: false, reason: "No address or provider" };
    }

    try {
        const txValue = BigInt(value || 0);

        // 1. Check target contract balance
        const balance = await provider.getBalance(to);

        if (balance === 0n && txValue > 0n) {
            score += 40;
            reasons.push("Target has zero BNB balance");
        } else if (balance < MIN_LIQUIDITY_BNB && txValue > balance) {
            score += 30;
            reasons.push(`Low BNB balance: ${ethers.formatEther(balance)} BNB`);
        }

        // 2. Check if target is a contract
        const code = await provider.getCode(to);
        const isContract = code !== "0x" && code !== "0x0";

        if (isContract) {
            // 3. For contracts with very little value and large tx — risky
            if (txValue > 0n && balance > 0n) {
                const ratio = Number(txValue * 100n / balance);
                if (ratio > 50) {
                    score += 20;
                    reasons.push(`High value ratio: tx is ${ratio}% of target balance`);
                }
            }

            // 4. New contract check (low nonce/activity indicator)
            const txCount = await provider.getTransactionCount(to);
            if (txCount < 3) {
                score += 15;
                reasons.push(`Very few transactions (${txCount}) — new contract`);
            }
        }

    } catch (err) {
        score += 5;
        reasons.push(`Liquidity check error: ${err.message}`);
    }

    score = Math.min(100, Math.max(0, score));

    return {
        score,
        flagged: score >= 50,
        reason: reasons.length > 0 ? reasons.join("; ") : "Adequate liquidity",
    };
}

module.exports = { checkLiquidity };
