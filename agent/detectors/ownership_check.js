/**
 * Ownership Check Detector
 *
 * Identifies suspicious ownership patterns:
 * 1. Non-renounced ownership in tokens
 * 2. Privileged function access
 * 3. Centralization risks
 */

const { ethers } = require("ethers");

// Common ownership function selectors
const OWNER_SELECTORS = {
    owner: "0x8da5cb5b",          // owner()
    renounceOwnership: "0x715018a6", // renounceOwnership()
    transferOwnership: "0xf2fde38b", // transferOwnership(address)
};

/**
 * Check ownership/centralization risk
 * @param {string} to - Target address
 * @param {ethers.Provider} provider - RPC provider
 * @returns {{ score: number, flagged: boolean, reason: string }}
 */
async function checkOwnership(to, provider) {
    let score = 0;
    let reasons = [];

    if (!to || !provider) {
        return { score: 0, flagged: false, reason: "No address or provider" };
    }

    try {
        // 1. Check if target is a contract
        const code = await provider.getCode(to);
        if (code === "0x" || code === "0x0") {
            return { score: 0, flagged: false, reason: "EOA — no ownership concern" };
        }

        // 2. Try to call owner()
        try {
            const ownerCall = await provider.call({
                to,
                data: OWNER_SELECTORS.owner,
            });

            if (ownerCall && ownerCall !== "0x") {
                const ownerAddr = ethers.AbiCoder.defaultAbiCoder().decode(
                    ["address"],
                    ownerCall
                )[0];

                if (ownerAddr !== ethers.ZeroAddress) {
                    score += 15;
                    reasons.push(`Owned by: ${ownerAddr.slice(0, 10)}...`);

                    // Check if owner is a contract (multi-sig is better)
                    const ownerCode = await provider.getCode(ownerAddr);
                    if (ownerCode === "0x" || ownerCode === "0x0") {
                        score += 20;
                        reasons.push("Owner is an EOA (not a multi-sig)");
                    }
                } else {
                    reasons.push("Ownership renounced (zero address)");
                }
            }
        } catch (e) {
            // Contract doesn't have owner() — might be okay
        }

        // 3. Check bytecode for privileged functions
        const hasTransferOwnership = code.includes(
            OWNER_SELECTORS.transferOwnership.slice(2)
        );
        const hasRenounceOwnership = code.includes(
            OWNER_SELECTORS.renounceOwnership.slice(2)
        );

        if (hasTransferOwnership && !hasRenounceOwnership) {
            score += 10;
            reasons.push("Has transferOwnership but no renounceOwnership");
        }

        // 4. Check for mint/burn functions (elevated risk)
        const hasMint = code.includes("40c10f19"); // mint(address,uint256)
        const hasBurn = code.includes("42966c68"); // burn(uint256)

        if (hasMint) {
            score += 15;
            reasons.push("Has mint function (can inflate supply)");
        }
        if (hasBurn && !hasMint) {
            score += 5;
            reasons.push("Has burn function");
        }

    } catch (err) {
        score += 5;
        reasons.push(`Ownership check error: ${err.message}`);
    }

    score = Math.min(100, Math.max(0, score));

    return {
        score,
        flagged: score >= 40,
        reason: reasons.length > 0 ? reasons.join("; ") : "Standard ownership pattern",
    };
}

module.exports = { checkOwnership };
