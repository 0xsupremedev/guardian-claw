const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GuardianWallet", function () {
    let policyGuard, wallet, auditNFT;
    let owner, agent, relayer, recipient, attacker;

    const DAILY_LIMIT = ethers.parseEther("10");

    beforeEach(async function () {
        [owner, agent, relayer, recipient, attacker] = await ethers.getSigners();

        // Deploy PolicyGuard
        const PolicyGuard = await ethers.getContractFactory("PolicyGuard");
        policyGuard = await PolicyGuard.deploy(DAILY_LIMIT);
        await policyGuard.waitForDeployment();

        // Deploy GuardianWallet
        const GuardianWallet = await ethers.getContractFactory("GuardianWallet");
        wallet = await GuardianWallet.deploy(await policyGuard.getAddress());
        await wallet.waitForDeployment();

        // Link PolicyGuard to wallet
        await policyGuard.setGuardianWallet(await wallet.getAddress());

        // Deploy AuditNFT
        const AuditNFT = await ethers.getContractFactory("AuditNFT");
        auditNFT = await AuditNFT.deploy();
        await auditNFT.waitForDeployment();
        await auditNFT.setGuardianWallet(await wallet.getAddress());

        // Fund the wallet
        await owner.sendTransaction({
            to: await wallet.getAddress(),
            value: ethers.parseEther("20"),
        });
    });

    describe("Deployment", function () {
        it("should set the correct owner", async function () {
            expect(await wallet.owner()).to.equal(owner.address);
        });

        it("should set the correct PolicyGuard", async function () {
            expect(await wallet.getPolicyGuardAddress()).to.equal(
                await policyGuard.getAddress()
            );
        });

        it("should receive BNB", async function () {
            expect(await wallet.getBalance()).to.equal(ethers.parseEther("20"));
        });
    });

    describe("executeWithGuard", function () {
        it("should execute a safe transaction", async function () {
            const amount = ethers.parseEther("1");
            const balBefore = await ethers.provider.getBalance(recipient.address);

            await expect(
                wallet.executeWithGuard(recipient.address, amount, "0x")
            ).to.emit(wallet, "Executed");

            const balAfter = await ethers.provider.getBalance(recipient.address);
            expect(balAfter - balBefore).to.equal(amount);
        });

        it("should block transaction exceeding daily limit", async function () {
            const amount = ethers.parseEther("15");

            await expect(
                wallet.executeWithGuard(recipient.address, amount, "0x")
            ).to.be.revertedWith("GW: blocked - PolicyGuard: daily limit exceeded");
        });

        it("should block transaction to blocklisted address", async function () {
            await policyGuard.blockAddress(attacker.address, true);

            await expect(
                wallet.executeWithGuard(attacker.address, ethers.parseEther("1"), "0x")
            ).to.be.revertedWith("GW: blocked - PolicyGuard: destination blocked");
        });

        it("should reject non-owner execution", async function () {
            await expect(
                wallet.connect(attacker).executeWithGuard(recipient.address, ethers.parseEther("1"), "0x")
            ).to.be.revertedWith("GW: not owner");
        });

        it("should increment execution count", async function () {
            await wallet.executeWithGuard(recipient.address, ethers.parseEther("1"), "0x");
            expect(await wallet.executionCount()).to.equal(1);

            await wallet.executeWithGuard(recipient.address, ethers.parseEther("1"), "0x");
            expect(await wallet.executionCount()).to.equal(2);
        });
    });

    describe("Session Keys", function () {
        it("should set a session key", async function () {
            const expiry = Math.floor(Date.now() / 1000) + 86400; // +24h

            await expect(wallet.setSessionKey(agent.address, expiry))
                .to.emit(wallet, "SessionKeySet")
                .withArgs(agent.address, expiry);

            expect(await wallet.isSessionKeyActive(agent.address)).to.be.true;
        });

        it("should revoke a session key", async function () {
            const expiry = Math.floor(Date.now() / 1000) + 86400;
            await wallet.setSessionKey(agent.address, expiry);

            await expect(wallet.revokeSessionKey(agent.address))
                .to.emit(wallet, "SessionKeyRevoked")
                .withArgs(agent.address);

            expect(await wallet.isSessionKeyActive(agent.address)).to.be.false;
        });

        it("should reject session key from non-owner", async function () {
            const expiry = Math.floor(Date.now() / 1000) + 86400;
            await expect(
                wallet.connect(attacker).setSessionKey(agent.address, expiry)
            ).to.be.revertedWith("GW: not owner");
        });
    });

    describe("Emergency Controls", function () {
        it("should pause and unpause", async function () {
            await wallet.togglePause();
            expect(await wallet.paused()).to.be.true;

            await expect(
                wallet.executeWithGuard(recipient.address, ethers.parseEther("1"), "0x")
            ).to.be.revertedWith("GW: paused");

            await wallet.togglePause();
            expect(await wallet.paused()).to.be.false;
        });

        it("should allow emergency withdrawal", async function () {
            const amount = ethers.parseEther("5");
            const balBefore = await ethers.provider.getBalance(owner.address);

            const tx = await wallet.emergencyWithdraw(owner.address, amount);
            const receipt = await tx.wait();
            const gasUsed = receipt.gasUsed * receipt.gasPrice;

            const balAfter = await ethers.provider.getBalance(owner.address);
            expect(balAfter - balBefore + gasUsed).to.equal(amount);
        });

        it("should reject emergency withdrawal from non-owner", async function () {
            await expect(
                wallet.connect(attacker).emergencyWithdraw(attacker.address, ethers.parseEther("1"))
            ).to.be.revertedWith("GW: not owner");
        });
    });

    describe("Policy Guard Update", function () {
        it("should allow owner to update PolicyGuard", async function () {
            const PolicyGuard2 = await ethers.getContractFactory("PolicyGuard");
            const newGuard = await PolicyGuard2.deploy(ethers.parseEther("100"));
            await newGuard.waitForDeployment();

            await expect(wallet.updatePolicyGuard(await newGuard.getAddress()))
                .to.emit(wallet, "PolicyGuardUpdated");
        });
    });
});
