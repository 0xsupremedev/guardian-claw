const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    const network = hre.network.name;

    console.log("═══════════════════════════════════════════════════════════");
    console.log("  🛡️  GuardianClaw — Deployment Script");
    console.log("═══════════════════════════════════════════════════════════");
    console.log(`  Network:  ${network}`);
    console.log(`  Deployer: ${deployer.address}`);
    console.log(`  Balance:  ${hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address))} BNB`);
    console.log("═══════════════════════════════════════════════════════════\n");

    const deployLog = {
        network,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        contracts: {},
        txHashes: [],
    };

    // ─── 1. Deploy PolicyGuard ─────────────────────────────────────
    console.log("📜 Deploying PolicyGuard...");
    const dailyLimit = hre.ethers.parseEther("10"); // 10 BNB daily limit
    const PolicyGuard = await hre.ethers.getContractFactory("PolicyGuard");
    const policyGuard = await PolicyGuard.deploy(dailyLimit);
    await policyGuard.waitForDeployment();
    const pgAddr = await policyGuard.getAddress();
    const pgTx = policyGuard.deploymentTransaction();

    console.log(`   ✅ PolicyGuard deployed at: ${pgAddr}`);
    console.log(`   📝 Tx Hash: ${pgTx.hash}`);

    deployLog.contracts.PolicyGuard = {
        address: pgAddr,
        txHash: pgTx.hash,
        dailyLimit: "10 BNB",
    };
    deployLog.txHashes.push({ step: "Deploy PolicyGuard", txHash: pgTx.hash });

    // ─── 2. Deploy GuardianWallet ──────────────────────────────────
    console.log("\n📜 Deploying GuardianWallet...");
    const GuardianWallet = await hre.ethers.getContractFactory("GuardianWallet");
    const wallet = await GuardianWallet.deploy(pgAddr);
    await wallet.waitForDeployment();
    const walletAddr = await wallet.getAddress();
    const walletTx = wallet.deploymentTransaction();

    console.log(`   ✅ GuardianWallet deployed at: ${walletAddr}`);
    console.log(`   📝 Tx Hash: ${walletTx.hash}`);

    deployLog.contracts.GuardianWallet = {
        address: walletAddr,
        txHash: walletTx.hash,
    };
    deployLog.txHashes.push({ step: "Deploy GuardianWallet", txHash: walletTx.hash });

    // ─── 3. Deploy AuditNFT ────────────────────────────────────────
    console.log("\n📜 Deploying AuditNFT...");
    const AuditNFT = await hre.ethers.getContractFactory("AuditNFT");
    const auditNFT = await AuditNFT.deploy();
    await auditNFT.waitForDeployment();
    const nftAddr = await auditNFT.getAddress();
    const nftTx = auditNFT.deploymentTransaction();

    console.log(`   ✅ AuditNFT deployed at: ${nftAddr}`);
    console.log(`   📝 Tx Hash: ${nftTx.hash}`);

    deployLog.contracts.AuditNFT = {
        address: nftAddr,
        txHash: nftTx.hash,
    };
    deployLog.txHashes.push({ step: "Deploy AuditNFT", txHash: nftTx.hash });

    // ─── 4. Link contracts ─────────────────────────────────────────
    console.log("\n🔗 Linking contracts...");

    const tx1 = await policyGuard.setGuardianWallet(walletAddr);
    await tx1.wait();
    console.log(`   ✅ PolicyGuard → GuardianWallet linked (${tx1.hash})`);
    deployLog.txHashes.push({ step: "Link PolicyGuard to Wallet", txHash: tx1.hash });

    const tx2 = await auditNFT.setGuardianWallet(walletAddr);
    await tx2.wait();
    console.log(`   ✅ AuditNFT → GuardianWallet linked (${tx2.hash})`);
    deployLog.txHashes.push({ step: "Link AuditNFT to Wallet", txHash: tx2.hash });

    // ─── 5. Set initial policies ───────────────────────────────────
    console.log("\n⚙️  Setting initial policies...");

    const tx3 = await policyGuard.setSlippageLimit(200); // 2%
    await tx3.wait();
    console.log(`   ✅ Slippage limit set to 2% (${tx3.hash})`);
    deployLog.txHashes.push({ step: "Set slippage limit", txHash: tx3.hash });

    // ─── Summary ───────────────────────────────────────────────────
    console.log("\n═══════════════════════════════════════════════════════════");
    console.log("  🎉 DEPLOYMENT COMPLETE");
    console.log("═══════════════════════════════════════════════════════════");
    console.log(`  PolicyGuard:     ${pgAddr}`);
    console.log(`  GuardianWallet:  ${walletAddr}`);
    console.log(`  AuditNFT:        ${nftAddr}`);
    console.log(`  Total Txs:       ${deployLog.txHashes.length}`);
    console.log("═══════════════════════════════════════════════════════════\n");

    // Save deployment log
    const logPath = path.join(__dirname, "..", `deployment-${network}.json`);
    fs.writeFileSync(logPath, JSON.stringify(deployLog, null, 2));
    console.log(`📄 Deployment log saved to: ${logPath}`);

    // Print for README
    console.log("\n📋 Copy for README.md:");
    console.log("```");
    console.log(`| Contract | Address | Tx Hash |`);
    console.log(`|----------|---------|---------|`);
    for (const [name, info] of Object.entries(deployLog.contracts)) {
        console.log(`| ${name} | \`${info.address}\` | \`${info.txHash}\` |`);
    }
    console.log("```");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
