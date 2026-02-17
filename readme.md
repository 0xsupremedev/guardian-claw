# GuardianClaw 🛡️🐾

### AI-Powered Non-Custodial Transaction Firewall for BNB Chain

GuardianClaw is a next-generation security protocol designed to protect DeFi users from honeypots, rug pulls, and malicious signature drains. By combining real-time AI agents with on-chain policy enforcement, GuardianClaw acts as an autonomous bodyguard for your wallet, blocking threats before funds ever leave your control.

---

## 🚀 Key Features

- **Autonomous Agentic Security**: Real-time scanning of smart contract bytecode and liquidity metrics using the OpenClaw framework.
- **On-Chain Policy Guard**: Smart contract-based enforcement of daily limits, blocklists, and risk modes.
- **Non-Custodial Design**: Users retain full control of their keys; agents act via ephemeral, limited-power session keys.
- **Immutable Audit Trail**: Every security intervention is minted as a verifiable **AuditNFT** on opBNB/BSC, ensuring transparency.
- **EIP-712 Intent Flow**: Secure, gas-optimized meta-transactions for seamless user experience.

---

## 🛠️ Tech Stack

- **Smart Contracts**: Solidity (0.8.19)
- **Development Environment**: Hardhat
- **Frontend**: React, TypeScript, Vite
- **Styling**: Tailwind CSS, Framer Motion
- **Web3 Connectivity**: Web3Modal, Ethers.js, Wagmi
- **AI Engine**: OpenClaw (Node.js AI SDK)
- **Backend/Relayer**: Express.js, TypeScript
- **Target Chains**: opBNB Testnet, BNB Smart Chain Testnet

---

## 📦 Project Structure

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

## 🚦 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/0xsupremedev/guardian-claw.git
   cd guardian-claw
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Add your Private Keys and RPC URLs
   ```

### Deployment
Deploy to opBNB Testnet:
```bash
npx hardhat run scripts/deploy.js --network opbnbTestnet
```

---

## 📄 Documentation

- [AI Build Log](./AI_BUILD_LOG.md) - Record of AI-assisted development.
- [Demo Instructions](./DEMO.md) - Step-by-step guide to reproduce security flows.
- [Pitch Script](./PITCH.md) - Technical value proposition.

---

## 🛡️ Security Disclaimer
This software is a Proof of Concept (PoC) built for the BNB Chain AIDP Hackathon. It is experimental and has not undergone a professional security audit. Use at your own risk.

## ⚖️ License
MIT License - Copyright (c) 2024 GuardianClaw Team