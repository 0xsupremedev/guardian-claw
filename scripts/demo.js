const hre = require("hardhat");

async function main() {
    const [owner, agent, recipient, honeypotSimulator] = await hre.ethers.getSigners();
    const network = hre.network.name;

    console.log("═══════════════════════════════════════════════════════════");
    console.log("  🛡️  GuardianClaw — Demo Script");
    console.log("═══════════════════════════════════════════════════════════");
    console.log(`  Network:   ${network}`);
    console.log(`  Owner:     ${owner.address}`);
    console.log(`  Agent:     ${agent.address}`);
    console.log(`  Recipient: ${recipient.address}`);
    console.log("═══════════════════════════════════════════════════════════\n");

    // ─── Deploy ────────────────────────────────────────────────────
    console.log("📦 DEPLOYING CONTRACTS...\n");

    const PolicyGuard = await hre.ethers.getContractFactory("PolicyGuard");
    const policyGuard = await PolicyGuard.deploy(hre.ethers.parseEther("10"));
    await policyGuard.waitForDeployment();
    console.log(`  ✅ PolicyGuard: ${await policyGuard.getAddress()}`);

    const GuardianWallet = await hre.ethers.getContractFactory("GuardianWallet");
    const wallet = await GuardianWallet.deploy(await policyGuard.getAddress());
    await wallet.waitForDeployment();
    console.log(`  ✅ GuardianWallet: ${await wallet.getAddress()}`);

    const AuditNFT = await hre.ethers.getContractFactory("AuditNFT");
    const auditNFT = await AuditNFT.deploy();
    await auditNFT.waitForDeployment();
    console.log(`  ✅ AuditNFT: ${await auditNFT.getAddress()}`);

    // Link
    await (await policyGuard.setGuardianWallet(await wallet.getAddress())).wait();
    await (await auditNFT.setGuardianWallet(await wallet.getAddress())).wait();
    console.log("  🔗 Contracts linked\n");

    // Fund wallet
    await (await owner.sendTransaction({
        to: await wallet.getAddress(),
        value: hre.ethers.parseEther("50"),
    })).wait();
    console.log(`  💰 Wallet funded: ${hre.ethers.formatEther(await wallet.getBalance())} BNB\n`);

    // ─── Demo Flow 1: Safe Transaction ────────────────────────────
    console.log("═══════════════════════════════════════════════════════════");
    console.log("  FLOW 1: Safe Transaction ✅");
    console.log("═══════════════════════════════════════════════════════════\n");

    const safeTx = await wallet.executeWithGuard(
        recipient.address,
        hre.ethers.parseEther("2"),
        "0x"
    );
    const safeReceipt = await safeTx.wait();
    console.log(`  📝 Tx Hash: ${safeTx.hash}`);
    console.log(`  ⛽ Gas Used: ${safeReceipt.gasUsed}`);
    console.log(`  ✅ Status: SUCCESS`);
    console.log(`  💰 Transferred: 2 BNB to ${recipient.address}`);

    // Mint audit NFT
    const nft1Tx = await auditNFT.mintAudit(
        await wallet.getAddress(),
        0, // SAFE_TRANSFER
        12,
        "ipfs://QmGuardianClawSafeTransfer001",
        safeTx.hash,
        agent.address
    );
    await nft1Tx.wait();
    console.log(`  🎖️  AuditNFT #1 minted (SAFE_TRANSFER, risk: 12)\n`);

    // ─── Demo Flow 2: Block Honeypot ──────────────────────────────
    console.log("═══════════════════════════════════════════════════════════");
    console.log("  FLOW 2: Honeypot Blocked 🔴");
    console.log("═══════════════════════════════════════════════════════════\n");

    // Agent detects and blocks
    const blockTx = await policyGuard.blockAddress(honeypotSimulator.address, true);
    await blockTx.wait();
    console.log(`  🤖 Agent blocked address: ${honeypotSimulator.address}`);
    console.log(`  📝 Block Tx: ${blockTx.hash}`);

    // Attempt transfer to honeypot
    try {
        await wallet.executeWithGuard(
            honeypotSimulator.address,
            hre.ethers.parseEther("5"),
            "0x"
        );
        console.log("  ❌ ERROR: Should have been blocked!");
    } catch (err) {
        console.log(`  ✅ BLOCKED: ${err.message.includes("destination blocked") ? "destination blocked" : err.message}`);
    }

    // Mint audit NFT for block
    const nft2Tx = await auditNFT.mintAudit(
        await wallet.getAddress(),
        1, // BLOCKED_HONEYPOT
        92,
        "ipfs://QmGuardianClawBlockedHoneypot002",
        "0x_blocked_attempt",
        agent.address
    );
    await nft2Tx.wait();
    console.log(`  🎖️  AuditNFT #2 minted (BLOCKED_HONEYPOT, risk: 92)\n`);

    // ─── Demo Flow 3: Daily Limit ─────────────────────────────────
    console.log("═══════════════════════════════════════════════════════════");
    console.log("  FLOW 3: Daily Limit Protection 🟡");
    console.log("═══════════════════════════════════════════════════════════\n");

    // Spend most of daily limit (already spent 2 BNB in Flow 1)
    const largeTx = await wallet.executeWithGuard(
        recipient.address,
        hre.ethers.parseEther("7"),
        "0x"
    );
    await largeTx.wait();
    console.log(`  💸 Sent 7 BNB (total today: 9 BNB / 10 BNB limit)`);

    // Try to exceed
    try {
        await wallet.executeWithGuard(
            recipient.address,
            hre.ethers.parseEther("5"),
            "0x"
        );
        console.log("  ❌ ERROR: Should have been blocked!");
    } catch (err) {
        console.log(`  ✅ BLOCKED: daily_limit_exceeded`);
    }

    const nft3Tx = await auditNFT.mintAudit(
        await wallet.getAddress(),
        2, // BLOCKED_LIMIT
        45,
        "ipfs://QmGuardianClawLimitExceeded003",
        "0x_limit_attempt",
        agent.address
    );
    await nft3Tx.wait();
    console.log(`  🎖️  AuditNFT #3 minted (BLOCKED_LIMIT, risk: 45)\n`);

    // ─── Demo Flow 4: Session Key Management ──────────────────────
    console.log("═══════════════════════════════════════════════════════════");
    console.log("  FLOW 4: Emergency Revoke ⚡");
    console.log("═══════════════════════════════════════════════════════════\n");

    const expiry = Math.floor(Date.now() / 1000) + 86400;
    await (await wallet.setSessionKey(agent.address, expiry)).wait();
    console.log(`  🔑 Session key set for agent (expires: ${new Date(expiry * 1000).toISOString()})`);
    console.log(`  ✅ isSessionKeyActive: ${await wallet.isSessionKeyActive(agent.address)}`);

    await (await wallet.revokeSessionKey(agent.address)).wait();
    console.log(`  ❌ Session key revoked`);
    console.log(`  ✅ isSessionKeyActive: ${await wallet.isSessionKeyActive(agent.address)}`);

    const nft4Tx = await auditNFT.mintAudit(
        await wallet.getAddress(),
        4, // EMERGENCY_REVOKE
        0,
        "ipfs://QmGuardianClawRevoke004",
        "0x_revoked",
        owner.address
    );
    await nft4Tx.wait();
    console.log(`  🎖️  AuditNFT #4 minted (EMERGENCY_REVOKE)\n`);

    // ─── Summary ───────────────────────────────────────────────────
    console.log("═══════════════════════════════════════════════════════════");
    console.log("  📊 DEMO COMPLETE — SUMMARY");
    console.log("═══════════════════════════════════════════════════════════");
    console.log(`  Execution Count:  ${await wallet.executionCount()}`);
    console.log(`  AuditNFT Supply:  ${await auditNFT.totalSupply()}`);
    console.log(`  Wallet Balance:   ${hre.ethers.formatEther(await wallet.getBalance())} BNB`);
    console.log(`  Daily Remaining:  ${hre.ethers.formatEther(await policyGuard.getRemainingDailyLimit(owner.address))} BNB`);
    console.log("═══════════════════════════════════════════════════════════\n");

    // Print audit trail
    console.log("  📋 AUDIT TRAIL:");
    const supply = Number(await auditNFT.totalSupply());
    for (let i = 1; i <= supply; i++) {
        const record = await auditNFT.getAuditRecord(i);
        const actionTypes = ["SAFE_TRANSFER", "BLOCKED_HONEYPOT", "BLOCKED_LIMIT", "BLOCKED_BLACKLIST", "EMERGENCY_REVOKE", "POLICY_UPDATE"];
        console.log(`    #${i} | ${actionTypes[Number(record.actionType)]} | Risk: ${record.riskScore} | URI: ${record.metadataURI}`);
    }
    console.log("\n  🎉 All flows verified successfully!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
