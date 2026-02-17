# GuardianClaw

## The Next-Generation AI-Driven Security Standard for the BNB Ecosystem

GuardianClaw is not just a wallet or a scanner—it is a comprehensive, **AI-Powered Non-Custodial Transaction Firewall** purpose-built to eliminate the threat of malicious actors on the BNB Smart Chain and opBNB. By sandwiching a user's intent between an autonomous off-chain intelligence layer and a rigid on-chain enforcement kernel, GuardianClaw ensures that retail users can navigate the DeFi "dark forest" with institutional-grade protection.

---

### Key Pillars of the GuardianClaw Infrastructure

#### 1. AI-Powered Forensic Intelligence
GuardianClaw leverages the **OpenClaw Agentic Framework** to provide real-time, proactive risk assessment. Every transaction intent is intercepted and analyzed by an autonomous AI agent that performs:
- **Modular Bytecode Scanning**: Decomposes contract runtime bytecode to identify "malicious primitives" such as hidden mint functions, proxy upgrade traps, or custom transfer logic designed to create honeypots.
- **Predictive EVM Simulation**: Executes a deterministic "dry-run" in a sandboxed environment to monitor state changes. If the simulation results in a "blocked sell" or a "stealth drain," the firewall instantly triggers a hard-revert long before the user's funds are exposed.
- **Liquidity Health Analysis**: Continuously queries DEX factory contracts (PancakeSwap, Uniswap) to verify swap-depth, slippage-to-value ratios, and LP token lock status.

#### 2. Non-Custodial Architecture & User Sovereignty
Security at the cost of freedom is a failed model. GuardianClaw operates on a **Non-Custodial, Multi-Layered Consent** basis:
- **EIP-712 Intent Flow**: Users authorize specific "Typed Intents" rather than blind hex data. You approve exactly what you see: the target contract, the value, and the expected outcome.
- **Ephemeral Session Keys**: For high-frequency interactions, GuardianClaw utilizes limited-scope session keys that are time-bound and permission-locked, ensuring the AI agent can only execute what you have explicitly allowed.
- **Zero-Trust Infrastructure**: The AI agent acts as a guard, but your private keys never leave your device. The system provides protection without ever requiring "Master Custody" over your assets.

#### 3. On-Chain Transaction Firewall & Policy Enforcement
While scanners only warn, GuardianClaw **enforces**. The **PolicyGuard Kernel** is a smart contract residing on-chain that serves as the final arbiter of every transaction:
- **Hard-Coded Constraints**: Users define their own "Security Constitution," including daily spending limits, counterparty whitelists, and risk score thresholds that the contract will strictly honor.
- **Synchronized Global Blocklist**: Once a malicious contract is identified by any AI agent in the network, that address is added to a global blocklist, providing "herd immunity" to the entire GuardianClaw ecosystem within seconds.
- **AuditNFT Protocol**: Every protective action, whether a blocked honeypot or a safe verification, is recorded as an immutable **AuditNFT** on opBNB. This provides a verifiable, cryptographic proof-of-action for every security intervention.

---

## Technical Stack

![Solidity](https://img.shields.io/badge/Solidity-%23363636.svg?style=for-the-badge&logo=solidity&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232b.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Node.js](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Hardhat](https://img.shields.io/badge/Hardhat-FFF000?style=for-the-badge&logo=hardhat&logoColor=black)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)

---

## Detailed Project Description

### The Problem: The DeFi Wild West
In the current BNB Chain ecosystem, speed and low fees have led to a massive influx of retail users. However, this has also made it a prime target for malicious actors. Users frequently fall victim to:
1. **Honeypot Tokens**: Contracts that allow you to buy but prevent you from selling.
2. **Rug Pulls**: Developers draining liquidity from a pool suddenly.
3. **Approval Scams**: Malicious dApps requesting unlimited approvals to drain wallets.
4. **Phishing Signatures**: Social engineering users into signing EIP-712 messages that compromise their assets.

In most cases, security tools are passive—they warn you after a scan or after a transaction has already been processed.

### The Solution: GuardianClaw's Autonomous Firewall
GuardianClaw shifts the paradigm from "Passive Detection" to "Active Enforcement." Our system consists of three core layers that work in perfect synchrony:

#### 1. The OpenClaw AI Risk Engine (Off-Chain)
Our AI agent constantly monitors proposed transaction intents. When a user prepares to interact with a contract, the agent performs:
- **Bytecode Analysis**: Scans for known malicious patterns (e.g., hidden mint functions or blocked transfers).
- **Liquidity Verification**: Checks the depth and lock status of the token's liquidity pool.
- **Ownership Risk Assessment**: Analyzes the creator wallet and contract owner for suspicious history.
- **Simulation**: Runs a "dry-run" of the transaction in a sandboxed environment to see if it results in a "blocked sell" or other trap.

#### 2. The PolicyGuard Smart Contract (On-Chain)
This acts as the "Mandate" for your wallet. It enforces user-defined rules that cannot be bypassed, even if the user accidentally signs a malicious transaction:
- **Daily Spending Limits**: Prevents the total drainage of a wallet in a single day.
- **Real-Time Blocklist**: Automatically syncs with the AI agent's findings to block known malicious addresses globally.
- **Emergency Pause**: A kill-switch that can be activated by the user or the agent if suspicious activity spikes.

#### 3. The AuditNFT Protocol (Proof of Protection)
Transparency is key to trust. Every time our AI agent intervenes—whether it blocks a honeymoon or confirms a safe swap—it mints a non-fungible token (AuditNFT) on opBNB. This NFT contains a cryptographic link to the agent's decision logs and the associated transaction hash, providing users with an immutable record of their protection history.

---

## Architecture Diagram

```mermaid
graph TD
    User[User] -->|Initiates Tx| Frontend[React Dashboard]
    Frontend -->|Send Intent| Agent[OpenClaw AI Agent]
    Agent -->|Fetch Metadata| BSC[BNB Chain / opBNB]
    BSC -->|Bytecode / Liquidity| Agent
    Agent -->|Risk Score + EIP-712 Sig| Frontend
    Frontend -->|Signed Intent| Relayer[Meta-Tx Relayer]
    Relayer -->|Execute| Wallet[GuardianWallet Contract]
    Wallet -->|Check Policy| Guard[PolicyGuard Contract]
    Guard -->|Allow/Block| Wallet
    Wallet -->|Mint Proof| NFT[AuditNFT Contract]
    Wallet -->|Call| DApp[Target dApp/Exchange]
```

---

## Key Features

- **Autonomous Agentic Security**: Real-time scanning using the OpenClaw framework.
- **On-Chain Policy Guard**: Smart contract-based enforcement that lives on the blockchain.
- **Non-Custodial Design**: Users retain full control of their keys; agents act via ephemeral session keys.
- **Immutable Audit Trail**: On-chain verification of every security action.
- **EIP-712 Intent Flow**: Secure, gas-optimized meta-transactions.

---

## Project Structure

```text
/guardian-claw
├── /contracts        # Solidity Smart Contracts (Wallet, PolicyGuard, AuditNFT)
├── /agent            # AI Agent Risk Engine (Modular Detectors)
├── /relayer          # Meta-transaction submission service
├── /frontend         # React + Vite Dashboard & Transaction UI
├── /scripts          # Deployment and Demo automation scripts
└── /test             # Comprehensive Hardhat & Integration tests
```

---

## Getting Started

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/0xsupremedev/guardian-claw.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Deployment
Deploy to opBNB Testnet:
```bash
npx hardhat run scripts/deploy.js --network opbnbTestnet
```

---

## Security Disclaimer
This software is a Proof of Concept (PoC) built for the BNB Chain AIDP Hackathon. It is experimental and has not undergone a professional security audit. Use at your own risk.

## License
MIT License - Copyright (c) 2024 GuardianClaw Team
