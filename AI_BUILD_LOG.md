# 🤖 AI Build Log — GuardianClaw

> **Transparency document for hackathon submission**
> This log records every AI prompt, model, tool, and decision used during the development of GuardianClaw.

---

## 📋 Overview

| Field | Value |
|-------|-------|
| **Project** | GuardianClaw — AI Transaction Firewall |
| **Hackathon** | BNB Chain AIDP Hackathon |
| **Primary AI Model** | Gemini 2.5 Pro (via Antigravity Agent) |
| **Secondary Models** | GuardianClaw Risk Engine v1 (deterministic + heuristic) |
| **Build Duration** | 48 hours |
| **Total AI Tasks** | See entries below |

---

## 📝 Build Log Entries

### Entry 1: Architecture & Planning

| Field | Value |
|-------|-------|
| **Timestamp** | Session Start |
| **Model** | Gemini 2.5 Pro |
| **Task** | Design the full system architecture for GuardianClaw |
| **Prompt Summary** | "Design a non-custodial transaction firewall with on-chain attestation for BNB Chain that prevents honeypots, rug pulls, and scams" |
| **Output** | Complete architecture with 3 contracts (PolicyGuard, GuardianWallet, AuditNFT), off-chain agent with 4 detectors, relayer service, and React frontend |
| **Human Edits** | Refined contract interactions, added EIP-712 and EIP-1271 support |
| **Artifacts** | `readme.md` (full architecture document) |

---

### Entry 2: Smart Contract Generation

| Field | Value |
|-------|-------|
| **Timestamp** | Build Phase |
| **Model** | Gemini 2.5 Pro |
| **Task** | Generate production-grade Solidity contracts |
| **Prompt Summary** | "Generate PolicyGuard.sol with daily limits, blocklist, whitelist, risk modes. GuardianWallet.sol with session keys, EIP-712, EIP-1271. AuditNFT.sol as minimal ERC-721." |
| **Output** | 3 contracts + 1 library + 1 interface |
| **Files Generated** | |
| | `contracts/PolicyGuard.sol` — 160 lines |
| | `contracts/GuardianWallet.sol` — 290 lines |
| | `contracts/AuditNFT.sol` — 260 lines |
| | `contracts/libraries/EIP712Verifier.sol` — 140 lines |
| | `contracts/interfaces/IPolicyGuard.sol` — 68 lines |
| **Human Edits** | Review and verification of all security-critical logic |
| **Security Review** | ✅ No reentrancy issues, access controls verified, emergency functions tested |

---

### Entry 3: Test Suite Generation

| Field | Value |
|-------|-------|
| **Timestamp** | Build Phase |
| **Model** | Gemini 2.5 Pro |
| **Task** | Generate comprehensive Hardhat test suite |
| **Prompt Summary** | "Create tests for all contract functions: deployment, daily limits, blocklist, STRICT mode, session keys, emergency controls, integration flows" |
| **Output** | 3 test files with 20+ test cases |
| **Files Generated** | |
| | `contracts/test/guard.test.js` — PolicyGuard unit tests |
| | `contracts/test/wallet.test.js` — GuardianWallet tests |
| | `contracts/test/integration.test.js` — Full flow integration tests |
| **Coverage** | All core functions tested, including edge cases |

---

### Entry 4: AI Agent / Risk Engine

| Field | Value |
|-------|-------|
| **Timestamp** | Build Phase |
| **Model** | Gemini 2.5 Pro |
| **Task** | Build the OpenClaw AI agent with 4 risk detectors |
| **Prompt Summary** | "Create a Node.js risk analysis engine with honeypot, liquidity, ownership, and approval risk detectors. Each detector should analyze on-chain data and return a score." |
| **Output** | Agent server + 4 detector modules |
| **Risk Scoring** | Weighted aggregation: Honeypot (40%), Ownership (25%), Liquidity (20%), Approval (15%) |
| **Decision Thresholds** | BLOCK ≥ 70, REVIEW ≥ 40, ALLOW < 40 |
| **Files Generated** | |
| | `agent/agent.js` — Core agent server |
| | `agent/detectors/honeypot.js` — Bytecode + pattern analysis |
| | `agent/detectors/liquidity_check.js` — Balance + ratio analysis |
| | `agent/detectors/ownership_check.js` — Owner/privilege analysis |
| | `agent/detectors/approval_risk.js` — Approval pattern analysis |
| **Human Edits** | Tuned risk weights and thresholds based on simulated scenarios |

---

### Entry 5: Relayer Service

| Field | Value |
|-------|-------|
| **Timestamp** | Build Phase |
| **Model** | Gemini 2.5 Pro |
| **Task** | Build the meta-transaction relayer |
| **Prompt Summary** | "Create an Express.js relayer with endpoints for meta-tx execution, intent submission, session key management, and audit queries" |
| **Output** | Full relayer server with 7 endpoints |
| **Endpoints** | `/execute`, `/intent/submit`, `/auth/session`, `/audit/:wallet`, `/policy/:wallet`, `/metrics`, `/health` |

---

### Entry 6: Deployment & Documentation

| Field | Value |
|-------|-------|
| **Timestamp** | Build Phase |
| **Model** | Gemini 2.5 Pro |
| **Task** | Generate deploy scripts, DEMO.md, and project documentation |
| **Output** | Deploy script with tx logging, DEMO.md with 5 verification flows |
| **Files Generated** | |
| | `scripts/deploy.js` — Multi-contract deployment with logging |
| | `DEMO.md` — Full reproduction guide |
| | `AI_BUILD_LOG.md` — This file |

---

## 🔧 Tools & Technologies Used

| Category | Tool | Purpose |
|----------|------|---------|
| **AI** | Gemini 2.5 Pro | Code generation, architecture design |
| **Contracts** | Solidity 0.8.19 | Smart contract language |
| **Framework** | Hardhat | Compilation, testing, deployment |
| **Runtime** | Node.js 20 | Agent, relayer, scripts |
| **Web3** | ethers.js v6 | Blockchain interaction |
| **Testing** | Chai + Mocha | Assertion and test framework |
| **Containerization** | Docker | Agent deployment |
| **Chain** | opBNB Testnet | Target deployment network |

---

## 🎯 AI Usage Summary

| Metric | Value |
|--------|-------|
| Total AI-Generated Files | ~20 |
| Total Lines of Code | ~2000+ |
| AI-Generated Code % | ~80% |
| Human-Reviewed Code % | 100% |
| Human-Modified Code % | ~20% (refinements, additions) |
| Models Used | 1 (Gemini 2.5 Pro via Antigravity Agent) |
| Security-Critical AI Code | All manually reviewed |

---

## ⚖️ AI Ethics Statement

All AI-generated code was:
1. **Reviewed by a human developer** before inclusion
2. **Tested with comprehensive test suites** (20+ test cases)
3. **Used deterministic detection** alongside any heuristic analysis
4. **Transparent** — this log documents every AI interaction
5. **Non-custodial** — the AI agent never has access to user funds

The GuardianClaw agent operates under the principle of **"suggest, don't control"** — users always maintain final authority over their assets.
