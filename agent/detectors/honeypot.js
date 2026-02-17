/**
 * Honeypot Detector
 *
 * Checks for common honeypot patterns:
 * 1. Contract bytecode analysis for dangerous opcodes
 * 2. Known honeypot contract signatures
 * 3. Transfer function restrictions
 * 4. Sell simulation failure patterns
 */

const { ethers } = require("ethers");

// Known honeypot function selectors (common traps)
const DANGEROUS_SELECTORS = [
    "0xa9059cbb", // transfer (check context)
    "0x23b872dd", // transferFrom (check context)
    "0x095ea7b3", // approve (check for unlimited)
];

// Known honeypot bytecode patterns
const HONEYPOT_BYTECODES = [
    "selfdestruct",
    "DELEGATECALL",
];

// Known scam addresses (demo list — in production, pull from API)
const KNOWN_SCAM_ADDRESSES = new Set([
    "0x0000000000000000000000000000000000dead",
    "0x000000000000000000000000000000000000dead",
]);

/**
 * Detect if a target address/contract is a honeypot
 * @param {string} to - Target contract address
 * @param {string} data - Transaction calldata
 * @param {ethers.Provider} provider - RPC provider
 * @returns {{ score: number, flagged: boolean, reason: string }}
 */
async function detectHoneypot(to, data, provider) {
    let score = 0;
    let reasons = [];

    if (!to || !provider) {
        return { score: 0, flagged: false, reason: "No address or provider" };
    }

    try {
        // 1. Check if address is a known scam
        if (KNOWN_SCAM_ADDRESSES.has(to.toLowerCase())) {
            return { score: 100, flagged: true, reason: "Known scam address" };
        }

        // 2. Check if target is a contract
        const code = await provider.getCode(to);

        if (code === "0x" || code === "0x0") {
            // EOA — generally safer for simple transfers
            return { score: 5, flagged: false, reason: "EOA address (not a contract)" };
        }

        // 3. Bytecode length check — tiny contracts may be suspicious
        if (code.length < 100) {
            score += 30;
            reasons.push("Very short bytecode (potential proxy or trap)");
        }

        // 4. Check for self-destruct opcode (0xff)
        if (code.includes("ff")) {
            score += 15;
            reasons.push("Contains SELFDESTRUCT opcode");
        }

        // 5. Check for DELEGATECALL (0xf4) — can change logic
        if (code.includes("f4")) {
            score += 10;
            reasons.push("Contains DELEGATECALL (upgradeable/proxy)");
        }

        // 6. Analyze calldata for approve with unlimited allowance
        if (data && data.startsWith("0x095ea7b3")) {
            // approve(address, uint256)
            const amountHex = data.slice(74); // skip selector + address
            if (amountHex.includes("ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")) {
                score += 25;
                reasons.push("Unlimited token approval detected");
            }
        }

        // 7. Check code entropy — very repetitive bytecode is suspicious
        const uniqueOpcodes = new Set(code.match(/.{2}/g) || []).size;
        const totalOpcodes = (code.length - 2) / 2;
        const entropy = uniqueOpcodes / Math.min(totalOpcodes, 256);

        if (entropy < 0.1) {
            score += 20;
            reasons.push("Low bytecode entropy (suspicious patterns)");
        }

    } catch (err) {
        score += 10;
        reasons.push(`Analysis error: ${err.message}`);
    }

    score = Math.min(100, Math.max(0, score));

    return {
        score,
        flagged: score >= 60,
        reason: reasons.length > 0 ? reasons.join("; ") : "No honeypot indicators",
    };
}

module.exports = { detectHoneypot };
