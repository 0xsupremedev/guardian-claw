/**
 * GuardianClaw — Meta-Transaction Relayer Server
 *
 * Endpoints:
 *   POST /execute       — Submit a signed meta-tx to GuardianWallet
 *   POST /intent/submit — Submit an agent intent for analysis + execution
 *   POST /auth/session  — Create/verify a session key
 *   GET  /audit/:wallet — Get audit history for a wallet
 *   GET  /health        — Health check
 */

const express = require("express");
const cors = require("cors");
const { ethers } = require("ethers");
require("dotenv").config({ path: "../.env" });

const app = express();
app.use(cors());
app.use(express.json());

// ─── Config ──────────────────────────────────────────────────────

const PORT = process.env.RELAYER_PORT || 3001;
const RPC_URL = process.env.OPBNB_TESTNET_RPC || "https://opbnb-testnet-rpc.bnbchain.org";
const PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY || process.env.PRIVATE_KEY;

// Contract ABIs (minimal)
const GUARDIAN_WALLET_ABI = [
    "function executeWithGuard(address to, uint256 value, bytes data) returns (bool, bytes)",
    "function executeWithSignature(address to, uint256 value, bytes data, uint256 deadline, bytes signature) returns (bool, bytes)",
    "function executeAgentAction(uint8 actionType, address target, uint256 deadline, bytes signature)",
    "function setSessionKey(address key, uint256 expiry)",
    "function revokeSessionKey(address key)",
    "function isSessionKeyActive(address key) view returns (bool)",
    "function owner() view returns (address)",
    "function getBalance() view returns (uint256)",
    "function executionCount() view returns (uint256)",
    "function paused() view returns (bool)",
    "event Executed(address indexed to, uint256 value, bytes data, bool success, uint256 executionId)",
    "event TransactionBlocked(address indexed to, uint256 value, string reason, uint256 executionId)",
];

const POLICY_GUARD_ABI = [
    "function checkAndConsume(address user, address to, uint256 value) returns (bool)",
    "function blockAddress(address addr, bool blocked)",
    "function whitelistAddress(address addr, bool allowed)",
    "function setDailyLimit(uint256 newLimit)",
    "function blocklist(address) view returns (bool)",
    "function whitelist(address) view returns (bool)",
    "function dailyLimit() view returns (uint256)",
    "function getRemainingDailyLimit(address user) view returns (uint256)",
    "function riskMode() view returns (uint8)",
];

const AUDIT_NFT_ABI = [
    "function mintAudit(address wallet, uint8 actionType, uint256 riskScore, string metadataURI, string txHashRef, address agent) returns (uint256)",
    "function mintSimple(address wallet, string metadataURI) returns (uint256)",
    "function getAuditRecord(uint256 tokenId) view returns (tuple(address wallet, uint8 actionType, uint256 riskScore, string metadataURI, string txHashRef, uint256 timestamp, address agent))",
    "function totalSupply() view returns (uint256)",
    "function tokenURI(uint256 tokenId) view returns (string)",
];

// Contract addresses (loaded from env or deployment log)
let GUARDIAN_WALLET_ADDR = process.env.VITE_GUARDIAN_WALLET_ADDRESS || "";
let POLICY_GUARD_ADDR = process.env.VITE_POLICY_GUARD_ADDRESS || "";
let AUDIT_NFT_ADDR = process.env.VITE_AUDIT_NFT_ADDRESS || "";

// In-memory store for demo
const executionLog = [];
const intentLog = [];

// ─── Provider & Wallet ───────────────────────────────────────────

let provider, relayerWallet;

function initProvider() {
    try {
        provider = new ethers.JsonRpcProvider(RPC_URL);
        if (PRIVATE_KEY) {
            relayerWallet = new ethers.Wallet(PRIVATE_KEY, provider);
            console.log(`  🔑 Relayer address: ${relayerWallet.address}`);
        } else {
            console.log("  ⚠️  No PRIVATE_KEY set — read mode only");
        }
    } catch (err) {
        console.log("  ⚠️  Provider init error:", err.message);
    }
}

function getContract(addr, abi) {
    if (!relayerWallet) throw new Error("Relayer wallet not initialized");
    return new ethers.Contract(addr, abi, relayerWallet);
}

// ─── Routes ──────────────────────────────────────────────────────

// Health check
app.get("/health", async (req, res) => {
    try {
        const blockNumber = provider ? await provider.getBlockNumber() : 0;
        res.json({
            status: "ok",
            relayerAddress: relayerWallet?.address || "not configured",
            network: RPC_URL,
            blockNumber,
            contracts: {
                guardianWallet: GUARDIAN_WALLET_ADDR || "not set",
                policyGuard: POLICY_GUARD_ADDR || "not set",
                auditNFT: AUDIT_NFT_ADDR || "not set",
            },
            executionCount: executionLog.length,
            intentCount: intentLog.length,
        });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
});

// POST /execute — Submit meta-tx to GuardianWallet
app.post("/execute", async (req, res) => {
    try {
        const { wallet, to, value, data, agentSignature, deadline, ownerSignature } = req.body;

        if (!wallet || !to) {
            return res.status(400).json({ error: "Missing required fields: wallet, to" });
        }

        const guardianWallet = getContract(
            wallet || GUARDIAN_WALLET_ADDR,
            GUARDIAN_WALLET_ABI
        );

        let tx;
        if (ownerSignature) {
            // Meta-tx with owner signature
            tx = await guardianWallet.executeWithSignature(
                to,
                value || 0,
                data || "0x",
                deadline || Math.floor(Date.now() / 1000) + 3600,
                ownerSignature
            );
        } else {
            // Direct execution (relayer must be owner — for demo)
            tx = await guardianWallet.executeWithGuard(
                to,
                value || 0,
                data || "0x"
            );
        }

        const receipt = await tx.wait();

        const logEntry = {
            txHash: tx.hash,
            blockNumber: receipt.blockNumber,
            to,
            value: value || "0",
            status: receipt.status === 1 ? "success" : "reverted",
            timestamp: new Date().toISOString(),
        };
        executionLog.push(logEntry);

        res.json({
            txHash: tx.hash,
            blockNumber: receipt.blockNumber,
            status: "confirmed",
            gasUsed: receipt.gasUsed.toString(),
        });
    } catch (err) {
        const logEntry = {
            error: err.message,
            to: req.body?.to,
            value: req.body?.value,
            status: "failed",
            timestamp: new Date().toISOString(),
        };
        executionLog.push(logEntry);

        res.status(400).json({
            error: err.message,
            status: "failed",
        });
    }
});

// POST /intent/submit — Submit an agent intent
app.post("/intent/submit", async (req, res) => {
    try {
        const { wallet, to, value, data, riskScore, classification, signature, intentHash } = req.body;

        const intent = {
            id: `intent_${Date.now()}`,
            wallet: wallet || GUARDIAN_WALLET_ADDR,
            to,
            value,
            data,
            riskScore: riskScore || 0,
            classification: classification || "UNKNOWN",
            signature,
            intentHash,
            decision: riskScore > 70 ? "BLOCK" : "ALLOW",
            timestamp: new Date().toISOString(),
        };

        intentLog.push(intent);

        // If BLOCK, try to add to blocklist
        if (intent.decision === "BLOCK" && POLICY_GUARD_ADDR && relayerWallet) {
            try {
                const policyGuard = getContract(POLICY_GUARD_ADDR, POLICY_GUARD_ABI);
                const tx = await policyGuard.blockAddress(to, true);
                await tx.wait();
                intent.blockTxHash = tx.hash;
            } catch (blockErr) {
                intent.blockError = blockErr.message;
            }
        }

        // If ALLOW and we have an audit NFT, mint one
        if (intent.decision === "ALLOW" && AUDIT_NFT_ADDR && relayerWallet) {
            try {
                const auditNFT = getContract(AUDIT_NFT_ADDR, AUDIT_NFT_ABI);
                const tx = await auditNFT.mintSimple(
                    wallet || GUARDIAN_WALLET_ADDR,
                    `ipfs://guardianclaw/${intent.id}`
                );
                await tx.wait();
                intent.auditNftTxHash = tx.hash;
            } catch (nftErr) {
                intent.nftError = nftErr.message;
            }
        }

        res.json({
            intentId: intent.id,
            decision: intent.decision,
            riskScore: intent.riskScore,
            classification: intent.classification,
            blockTxHash: intent.blockTxHash,
            auditNftTxHash: intent.auditNftTxHash,
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// POST /auth/session — Create session key
app.post("/auth/session", async (req, res) => {
    try {
        const { wallet, agentAddress, duration } = req.body;

        if (!wallet || !agentAddress) {
            return res.status(400).json({ error: "Missing wallet or agentAddress" });
        }

        const durationSecs = duration || 86400; // default 24h
        const expiry = Math.floor(Date.now() / 1000) + durationSecs;

        const guardianWallet = getContract(wallet, GUARDIAN_WALLET_ABI);
        const tx = await guardianWallet.setSessionKey(agentAddress, expiry);
        await tx.wait();

        res.json({
            txHash: tx.hash,
            agentAddress,
            expiry,
            expiryISO: new Date(expiry * 1000).toISOString(),
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// GET /audit/:wallet — Get audit history
app.get("/audit/:wallet", async (req, res) => {
    try {
        const { wallet } = req.params;

        // Return from in-memory logs
        const walletIntents = intentLog.filter(
            (i) => i.wallet?.toLowerCase() === wallet?.toLowerCase()
        );
        const walletExecutions = executionLog.filter(
            (e) => e.status !== "failed"
        );

        // If audit NFT is configured, also fetch on-chain
        let nftRecords = [];
        if (AUDIT_NFT_ADDR && provider) {
            try {
                const auditNFT = new ethers.Contract(AUDIT_NFT_ADDR, AUDIT_NFT_ABI, provider);
                const totalSupply = await auditNFT.totalSupply();
                const count = Number(totalSupply);

                for (let i = 1; i <= Math.min(count, 50); i++) {
                    try {
                        const record = await auditNFT.getAuditRecord(i);
                        nftRecords.push({
                            tokenId: i,
                            wallet: record.wallet,
                            actionType: Number(record.actionType),
                            riskScore: Number(record.riskScore),
                            metadataURI: record.metadataURI,
                            txHashRef: record.txHashRef,
                            timestamp: Number(record.timestamp),
                            agent: record.agent,
                        });
                    } catch (e) {
                        // skip invalid tokens
                    }
                }
            } catch (e) {
                // NFT contract not accessible
            }
        }

        res.json({
            wallet,
            intents: walletIntents,
            executions: walletExecutions,
            auditNFTs: nftRecords,
            totalIntents: walletIntents.length,
            totalExecutions: walletExecutions.length,
            totalNFTs: nftRecords.length,
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// GET /policy/:wallet — Get current policy status
app.get("/policy/:wallet", async (req, res) => {
    try {
        if (!POLICY_GUARD_ADDR || !provider) {
            return res.json({ error: "PolicyGuard not configured" });
        }

        const policyGuard = new ethers.Contract(POLICY_GUARD_ADDR, POLICY_GUARD_ABI, provider);

        const dailyLimit = await policyGuard.dailyLimit();
        const riskMode = await policyGuard.riskMode();
        const ownerAddr = req.params.wallet;
        const remaining = await policyGuard.getRemainingDailyLimit(ownerAddr);

        res.json({
            dailyLimit: ethers.formatEther(dailyLimit),
            remainingLimit: ethers.formatEther(remaining),
            riskMode: ["STRICT", "BALANCED", "RELAXED"][Number(riskMode)],
            policyGuardAddress: POLICY_GUARD_ADDR,
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// GET /metrics — Aggregated metrics
app.get("/metrics", (req, res) => {
    const blocked = intentLog.filter((i) => i.decision === "BLOCK");
    const allowed = intentLog.filter((i) => i.decision === "ALLOW");

    res.json({
        totalIntents: intentLog.length,
        blockedCount: blocked.length,
        allowedCount: allowed.length,
        blockRate: intentLog.length > 0 ? (blocked.length / intentLog.length * 100).toFixed(1) + "%" : "0%",
        avgRiskScore: intentLog.length > 0
            ? (intentLog.reduce((a, i) => a + (i.riskScore || 0), 0) / intentLog.length).toFixed(1)
            : 0,
        totalExecutions: executionLog.length,
    });
});

// ─── Start Server ────────────────────────────────────────────────

app.listen(PORT, () => {
    console.log("═══════════════════════════════════════════════════════════");
    console.log("  🛡️  GuardianClaw Relayer Server");
    console.log("═══════════════════════════════════════════════════════════");
    console.log(`  Port:    ${PORT}`);
    console.log(`  RPC:     ${RPC_URL}`);
    initProvider();
    console.log("═══════════════════════════════════════════════════════════\n");
});

module.exports = app;
