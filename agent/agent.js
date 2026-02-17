/**
 * GuardianClaw — OpenClaw AI Agent
 *
 * Risk analysis engine that:
 * 1. Receives transaction intents from the frontend/relayer
 * 2. Runs multiple detectors (honeypot, liquidity, ownership, approval)
 * 3. Produces a risk score and decision (ALLOW / BLOCK / REVIEW)
 * 4. Signs EIP-712 intents for on-chain submission
 * 5. Logs all decisions for audit transparency
 *
 * Endpoints:
 *   POST /analyze   — Analyze a transaction intent
 *   GET  /metrics   — Detection metrics
 *   GET  /logs      — Decision logs
 *   GET  /health    — Health check
 */

const express = require("express");
const cors = require("cors");
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: "../.env" });

// Import detectors
const { detectHoneypot } = require("./detectors/honeypot");
const { checkLiquidity } = require("./detectors/liquidity_check");
const { checkOwnership } = require("./detectors/ownership_check");
const { checkApprovalRisk } = require("./detectors/approval_risk");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.AGENT_PORT || 9001;
const RPC_URL = process.env.OPBNB_TESTNET_RPC || "https://opbnb-testnet-rpc.bnbchain.org";

// ─── State ───────────────────────────────────────────────────────

const decisionLog = [];
const metrics = {
    totalAnalyzed: 0,
    blocked: 0,
    allowed: 0,
    reviewed: 0,
    avgRiskScore: 0,
    detectorHits: {
        honeypot: 0,
        lowLiquidity: 0,
        suspiciousOwner: 0,
        approvalRisk: 0,
    },
};

let provider;
try {
    provider = new ethers.JsonRpcProvider(RPC_URL);
} catch (err) {
    console.log("⚠️  Provider init error:", err.message);
}

// ─── Agent Signing Key ───────────────────────────────────────────

const AGENT_KEY = process.env.AGENT_PRIVATE_KEY || ethers.Wallet.createRandom().privateKey;
const agentWallet = new ethers.Wallet(AGENT_KEY);
console.log(`🤖 Agent address: ${agentWallet.address}`);

// ─── Analysis Engine ─────────────────────────────────────────────

async function analyzeTransaction(txIntent) {
    const {
        wallet,
        to,
        value,
        data,
    } = txIntent;

    const results = {
        honeypot: { score: 0, flagged: false, reason: "" },
        liquidity: { score: 0, flagged: false, reason: "" },
        ownership: { score: 0, flagged: false, reason: "" },
        approval: { score: 0, flagged: false, reason: "" },
    };

    // Run all detectors in parallel
    try {
        const [honeypotResult, liquidityResult, ownershipResult, approvalResult] =
            await Promise.allSettled([
                detectHoneypot(to, data, provider),
                checkLiquidity(to, value, provider),
                checkOwnership(to, provider),
                checkApprovalRisk(to, data, provider),
            ]);

        if (honeypotResult.status === "fulfilled") results.honeypot = honeypotResult.value;
        if (liquidityResult.status === "fulfilled") results.liquidity = liquidityResult.value;
        if (ownershipResult.status === "fulfilled") results.ownership = ownershipResult.value;
        if (approvalResult.status === "fulfilled") results.approval = approvalResult.value;
    } catch (err) {
        console.error("Detector error:", err.message);
    }

    // Compute aggregate risk score (weighted)
    const weights = {
        honeypot: 0.40,
        liquidity: 0.20,
        ownership: 0.25,
        approval: 0.15,
    };

    let riskScore = Math.round(
        results.honeypot.score * weights.honeypot +
        results.liquidity.score * weights.liquidity +
        results.ownership.score * weights.ownership +
        results.approval.score * weights.approval
    );

    riskScore = Math.min(100, Math.max(0, riskScore));

    // Decision logic
    let decision;
    let reason = [];

    if (riskScore >= 70) {
        decision = "BLOCK";
        if (results.honeypot.flagged) {
            reason.push(`Honeypot detected: ${results.honeypot.reason}`);
            metrics.detectorHits.honeypot++;
        }
        if (results.liquidity.flagged) {
            reason.push(`Low liquidity: ${results.liquidity.reason}`);
            metrics.detectorHits.lowLiquidity++;
        }
        if (results.ownership.flagged) {
            reason.push(`Suspicious ownership: ${results.ownership.reason}`);
            metrics.detectorHits.suspiciousOwner++;
        }
        if (results.approval.flagged) {
            reason.push(`Approval risk: ${results.approval.reason}`);
            metrics.detectorHits.approvalRisk++;
        }
        metrics.blocked++;
    } else if (riskScore >= 40) {
        decision = "REVIEW";
        reason.push("Moderate risk — manual review recommended");
        metrics.reviewed++;
    } else {
        decision = "ALLOW";
        reason.push("Transaction appears safe");
        metrics.allowed++;
    }

    metrics.totalAnalyzed++;
    metrics.avgRiskScore = Math.round(
        (metrics.avgRiskScore * (metrics.totalAnalyzed - 1) + riskScore) / metrics.totalAnalyzed
    );

    // Sign intent (EIP-712 style)
    const intentHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
            ["address", "address", "uint256", "uint8", "uint256"],
            [wallet || ethers.ZeroAddress, to || ethers.ZeroAddress, value || 0, decision === "BLOCK" ? 0 : 1, riskScore]
        )
    );
    const signedIntent = await agentWallet.signMessage(ethers.getBytes(intentHash));

    const decisionEntry = {
        id: `decision_${Date.now()}_${metrics.totalAnalyzed}`,
        timestamp: new Date().toISOString(),
        wallet,
        to,
        value: value?.toString() || "0",
        riskScore,
        decision,
        reason: reason.join("; "),
        detectors: results,
        intentHash,
        signedIntent,
        agentAddress: agentWallet.address,
        model: "guardianclaw-risk-engine-v1",
        deterministic: true,
    };

    decisionLog.push(decisionEntry);

    // Save to log file
    try {
        const logDir = path.join(__dirname, "logs");
        if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
        fs.writeFileSync(
            path.join(logDir, `${decisionEntry.id}.json`),
            JSON.stringify(decisionEntry, null, 2)
        );
    } catch (err) {
        console.error("Log save error:", err.message);
    }

    return decisionEntry;
}

// ─── Routes ──────────────────────────────────────────────────────

// POST /analyze — Main analysis endpoint
app.post("/analyze", async (req, res) => {
    try {
        const { wallet, to, data, value } = req.body;

        if (!to) {
            return res.status(400).json({ error: "Missing 'to' address" });
        }

        console.log(`\n🔍 Analyzing tx: ${wallet} → ${to} (${value || 0} wei)`);

        const result = await analyzeTransaction(req.body);

        console.log(`   ${result.decision === "BLOCK" ? "🔴" : result.decision === "REVIEW" ? "🟡" : "🟢"} ${result.decision} | Risk: ${result.riskScore}/100 | ${result.reason}`);

        res.json({
            riskScore: result.riskScore,
            decision: result.decision,
            reason: result.reason,
            signedIntent: result.signedIntent,
            intentHash: result.intentHash,
            agentAddress: result.agentAddress,
            detectors: result.detectors,
            decisionId: result.id,
        });
    } catch (err) {
        console.error("Analysis error:", err);
        res.status(500).json({ error: err.message });
    }
});

// GET /metrics — Aggregated detection metrics
app.get("/metrics", (req, res) => {
    res.json(metrics);
});

// GET /logs — All decision logs
app.get("/logs", (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    res.json({
        total: decisionLog.length,
        offset,
        limit,
        logs: decisionLog.slice(offset, offset + limit),
    });
});

// GET /logs/:id — Single decision log
app.get("/logs/:id", (req, res) => {
    const entry = decisionLog.find((d) => d.id === req.params.id);
    if (!entry) return res.status(404).json({ error: "Decision not found" });
    res.json(entry);
});

// GET /health
app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        agentAddress: agentWallet.address,
        totalAnalyzed: metrics.totalAnalyzed,
        rpc: RPC_URL,
        version: "1.0.0",
    });
});

// ─── Start ───────────────────────────────────────────────────────

app.listen(PORT, () => {
    console.log("═══════════════════════════════════════════════════════════");
    console.log("  🧠 GuardianClaw AI Agent");
    console.log("═══════════════════════════════════════════════════════════");
    console.log(`  Port:     ${PORT}`);
    console.log(`  RPC:      ${RPC_URL}`);
    console.log(`  Agent:    ${agentWallet.address}`);
    console.log("═══════════════════════════════════════════════════════════\n");
});

module.exports = app;
