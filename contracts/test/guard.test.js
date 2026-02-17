const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PolicyGuard", function () {
    let policyGuard;
    let owner, user1, user2, blockedAddr;

    const DAILY_LIMIT = ethers.parseEther("10"); // 10 BNB

    beforeEach(async function () {
        [owner, user1, user2, blockedAddr] = await ethers.getSigners();

        const PolicyGuard = await ethers.getContractFactory("PolicyGuard");
        policyGuard = await PolicyGuard.deploy(DAILY_LIMIT);
        await policyGuard.waitForDeployment();
    });

    describe("Deployment", function () {
        it("should set the correct owner", async function () {
            expect(await policyGuard.owner()).to.equal(owner.address);
        });

        it("should set the correct daily limit", async function () {
            expect(await policyGuard.dailyLimit()).to.equal(DAILY_LIMIT);
        });

        it("should default to BALANCED risk mode", async function () {
            expect(await policyGuard.riskMode()).to.equal(1); // BALANCED
        });

        it("should default to 200 bps slippage limit", async function () {
            expect(await policyGuard.slippageLimitBps()).to.equal(200);
        });
    });

    describe("checkAndConsume", function () {
        beforeEach(async function () {
            // Set guardianWallet to owner for testing
            await policyGuard.setGuardianWallet(owner.address);
        });

        it("should allow a transaction within daily limit", async function () {
            const amount = ethers.parseEther("5");
            await expect(
                policyGuard.checkAndConsume(user1.address, user2.address, amount)
            ).to.emit(policyGuard, "TransactionChecked")
                .withArgs(user1.address, user2.address, amount, true);
        });

        it("should block a transaction exceeding daily limit", async function () {
            const amount = ethers.parseEther("15");
            await expect(
                policyGuard.checkAndConsume(user1.address, user2.address, amount)
            ).to.be.revertedWith("PolicyGuard: daily limit exceeded");
        });

        it("should accumulate daily spending", async function () {
            const amount = ethers.parseEther("4");

            // First tx: 4 BNB
            await policyGuard.checkAndConsume(user1.address, user2.address, amount);
            // Second tx: 4 BNB (total 8)
            await policyGuard.checkAndConsume(user1.address, user2.address, amount);
            // Third tx: 4 BNB (total 12 > 10 limit)
            await expect(
                policyGuard.checkAndConsume(user1.address, user2.address, amount)
            ).to.be.revertedWith("PolicyGuard: daily limit exceeded");
        });

        it("should block transactions to blocklisted addresses", async function () {
            await policyGuard.blockAddress(blockedAddr.address, true);

            await expect(
                policyGuard.checkAndConsume(user1.address, blockedAddr.address, ethers.parseEther("1"))
            ).to.be.revertedWith("PolicyGuard: destination blocked");
        });

        it("should allow transactions after unblocking", async function () {
            await policyGuard.blockAddress(blockedAddr.address, true);
            await policyGuard.blockAddress(blockedAddr.address, false);

            await expect(
                policyGuard.checkAndConsume(user1.address, blockedAddr.address, ethers.parseEther("1"))
            ).to.emit(policyGuard, "TransactionChecked");
        });
    });

    describe("STRICT mode", function () {
        beforeEach(async function () {
            await policyGuard.setGuardianWallet(owner.address);
            await policyGuard.setRiskMode(0); // STRICT
        });

        it("should block transactions to non-whitelisted addresses", async function () {
            await expect(
                policyGuard.checkAndConsume(user1.address, user2.address, ethers.parseEther("1"))
            ).to.be.revertedWith("PolicyGuard: destination not whitelisted (strict mode)");
        });

        it("should allow transactions to whitelisted addresses", async function () {
            await policyGuard.whitelistAddress(user2.address, true);
            await expect(
                policyGuard.checkAndConsume(user1.address, user2.address, ethers.parseEther("1"))
            ).to.emit(policyGuard, "TransactionChecked");
        });
    });

    describe("Policy Management", function () {
        it("should allow owner to update daily limit", async function () {
            const newLimit = ethers.parseEther("20");
            await expect(policyGuard.setDailyLimit(newLimit))
                .to.emit(policyGuard, "DailyLimitUpdated")
                .withArgs(DAILY_LIMIT, newLimit);
        });

        it("should reject non-owner policy changes", async function () {
            await expect(
                policyGuard.connect(user1).setDailyLimit(ethers.parseEther("100"))
            ).to.be.revertedWith("PolicyGuard: not owner");
        });

        it("should emit AddressBlocked event", async function () {
            await expect(policyGuard.blockAddress(blockedAddr.address, true))
                .to.emit(policyGuard, "AddressBlocked")
                .withArgs(blockedAddr.address, true);
        });

        it("should provide remaining daily limit", async function () {
            await policyGuard.setGuardianWallet(owner.address);

            const remaining = await policyGuard.getRemainingDailyLimit(user1.address);
            expect(remaining).to.equal(DAILY_LIMIT);

            const spent = ethers.parseEther("3");
            await policyGuard.checkAndConsume(user1.address, user2.address, spent);

            const newRemaining = await policyGuard.getRemainingDailyLimit(user1.address);
            expect(newRemaining).to.equal(DAILY_LIMIT - spent);
        });
    });

    describe("Access Control", function () {
        it("should reject checkAndConsume from unauthorized callers", async function () {
            await expect(
                policyGuard.connect(user1).checkAndConsume(user1.address, user2.address, ethers.parseEther("1"))
            ).to.be.revertedWith("PolicyGuard: not authorized");
        });

        it("should allow guardianWallet to call checkAndConsume", async function () {
            await policyGuard.setGuardianWallet(user1.address);
            await expect(
                policyGuard.connect(user1).checkAndConsume(user1.address, user2.address, ethers.parseEther("1"))
            ).to.emit(policyGuard, "TransactionChecked");
        });
    });
});
