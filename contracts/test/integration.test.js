const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Integration: GuardianClaw Full Flow", function () {
    let policyGuard, wallet, auditNFT;
    let owner, agent, recipient, honeypotAddr;

    const DAILY_LIMIT = ethers.parseEther("10");

    beforeEach(async function () {
        [owner, agent, recipient, honeypotAddr] = await ethers.getSigners();

        // Deploy full system
        const PolicyGuard = await ethers.getContractFactory("PolicyGuard");
        policyGuard = await PolicyGuard.deploy(DAILY_LIMIT);
        await policyGuard.waitForDeployment();

        const GuardianWallet = await ethers.getContractFactory("GuardianWallet");
        wallet = await GuardianWallet.deploy(await policyGuard.getAddress());
        await wallet.waitForDeployment();

        await policyGuard.setGuardianWallet(await wallet.getAddress());

        const AuditNFT = await ethers.getContractFactory("AuditNFT");
        auditNFT = await AuditNFT.deploy();
        await auditNFT.waitForDeployment();
        await auditNFT.setGuardianWallet(await wallet.getAddress());

        // Fund wallet
        await owner.sendTransaction({
            to: await wallet.getAddress(),
            value: ethers.parseEther("50"),
        });

        // Set agent session key
        const expiry = Math.floor(Date.now() / 1000) + 86400;
        await wallet.setSessionKey(agent.address, expiry);
    });

    describe("Demo Flow 1: Safe Transaction", function () {
        it("should execute safe transfer and mint audit NFT", async function () {
            // 1. Execute safe transfer
            const amount = ethers.parseEther("2");
            await expect(
                wallet.executeWithGuard(recipient.address, amount, "0x")
            ).to.emit(wallet, "Executed");

            // 2. Mint audit NFT for safe transfer
            await expect(
                auditNFT.mintAudit(
                    await wallet.getAddress(),
                    0, // SAFE_TRANSFER
                    12, // low risk
                    "ipfs://QmSafeTransferDecision123",
                    "0xdeadbeef",
                    agent.address
                )
            ).to.emit(auditNFT, "AuditMinted");

            // Verify NFT
            expect(await auditNFT.totalSupply()).to.equal(1);
            const record = await auditNFT.getAuditRecord(1);
            expect(record.actionType).to.equal(0); // SAFE_TRANSFER
            expect(record.riskScore).to.equal(12);
        });
    });

    describe("Demo Flow 2: Blocked Honeypot", function () {
        it("should block honeypot transaction and mint audit NFT", async function () {
            // 1. Agent detects honeypot and blocks address
            await policyGuard.blockAddress(honeypotAddr.address, true);

            // 2. Attempt to send to honeypot — should revert
            await expect(
                wallet.executeWithGuard(honeypotAddr.address, ethers.parseEther("5"), "0x")
            ).to.be.revertedWith("GW: blocked - PolicyGuard: destination blocked");

            // 3. Mint audit NFT for blocked attempt
            await auditNFT.mintAudit(
                await wallet.getAddress(),
                1, // BLOCKED_HONEYPOT
                92, // high risk
                "ipfs://QmBlockedHoneypotDecision456",
                "0xcafebabe",
                agent.address
            );

            // 4. Verify
            const record = await auditNFT.getAuditRecord(1);
            expect(record.actionType).to.equal(1); // BLOCKED_HONEYPOT
            expect(record.riskScore).to.equal(92);
            expect(record.metadataURI).to.equal("ipfs://QmBlockedHoneypotDecision456");
        });
    });

    describe("Demo Flow 3: Daily Limit Protection", function () {
        it("should block transaction exceeding daily limit and mint audit NFT", async function () {
            // 1. Spend most of daily limit
            await wallet.executeWithGuard(recipient.address, ethers.parseEther("9"), "0x");

            // 2. Try to exceed — should block
            await expect(
                wallet.executeWithGuard(recipient.address, ethers.parseEther("5"), "0x")
            ).to.be.revertedWith("GW: blocked - PolicyGuard: daily limit exceeded");

            // 3. Mint audit NFT
            await auditNFT.mintAudit(
                await wallet.getAddress(),
                2, // BLOCKED_LIMIT
                45,
                "ipfs://QmLimitExceeded789",
                "0x12345678",
                agent.address
            );

            const record = await auditNFT.getAuditRecord(1);
            expect(record.actionType).to.equal(2);
        });
    });

    describe("Demo Flow 4: Emergency Revoke", function () {
        it("should revoke agent session key and verify agent cannot act", async function () {
            // 1. Verify agent is active
            expect(await wallet.isSessionKeyActive(agent.address)).to.be.true;

            // 2. Owner revokes agent
            await wallet.revokeSessionKey(agent.address);

            // 3. Agent is now inactive
            expect(await wallet.isSessionKeyActive(agent.address)).to.be.false;

            // 4. Mint audit NFT for revoke action
            await auditNFT.mintAudit(
                await wallet.getAddress(),
                4, // EMERGENCY_REVOKE
                0,
                "ipfs://QmEmergencyRevoke",
                "0xrevoked",
                owner.address
            );

            const record = await auditNFT.getAuditRecord(1);
            expect(record.actionType).to.equal(4);
        });
    });

    describe("Demo Flow 5: Multiple Audit NFTs", function () {
        it("should mint multiple audit NFTs and verify chain", async function () {
            // Safe tx
            await wallet.executeWithGuard(recipient.address, ethers.parseEther("1"), "0x");
            await auditNFT.mintAudit(
                await wallet.getAddress(), 0, 5, "ipfs://QmSafe1", "0x01", agent.address
            );

            // Block honeypot
            await policyGuard.blockAddress(honeypotAddr.address, true);
            await auditNFT.mintAudit(
                await wallet.getAddress(), 1, 95, "ipfs://QmBlock1", "0x02", agent.address
            );

            // Another safe tx
            await wallet.executeWithGuard(recipient.address, ethers.parseEther("1"), "0x");
            await auditNFT.mintAudit(
                await wallet.getAddress(), 0, 8, "ipfs://QmSafe2", "0x03", agent.address
            );

            // Verify total
            expect(await auditNFT.totalSupply()).to.equal(3);

            // Verify each record
            const r1 = await auditNFT.getAuditRecord(1);
            expect(r1.riskScore).to.equal(5);

            const r2 = await auditNFT.getAuditRecord(2);
            expect(r2.riskScore).to.equal(95);
            expect(r2.actionType).to.equal(1);

            const r3 = await auditNFT.getAuditRecord(3);
            expect(r3.riskScore).to.equal(8);
        });
    });
});
