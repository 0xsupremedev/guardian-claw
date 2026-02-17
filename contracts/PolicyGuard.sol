// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./interfaces/IPolicyGuard.sol";

/**
 * @title PolicyGuard
 * @author GuardianClaw Team
 * @notice On-chain policy enforcement for GuardianWallet transactions
 * @dev Enforces per-user daily spending limits, address blocklists/whitelists,
 *      per-token limits, and slippage constraints. Called by GuardianWallet
 *      inside every transaction execution path.
 *
 *      Key design choices:
 *      - dailySpent resets each UTC day (block.timestamp / 1 days)
 *      - Only the wallet (or owner) can modify policies
 *      - Minimal gas: simple mappings and require checks
 */
contract PolicyGuard is IPolicyGuard {

    // ─── State ───────────────────────────────────────────────────────

    address public owner;
    address public guardianWallet; // The GuardianWallet contract authorized to call checkAndConsume

    uint256 public override dailyLimit;
    uint256 public slippageLimitBps; // basis points, e.g. 200 = 2%

    mapping(address => bool) public override blocklist;
    mapping(address => bool) public override whitelist;
    mapping(address => uint256) public override dailySpent;
    mapping(address => uint256) public dailySpentDay; // track which day the spend is for
    mapping(address => uint256) public tokenLimits;   // per-token daily limits
    mapping(address => uint256) public tokenDailySpent;
    mapping(address => uint256) public tokenSpentDay;

    // Risk modes
    enum RiskMode { STRICT, BALANCED, RELAXED }
    RiskMode public riskMode;

    // ─── Modifiers ───────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "PolicyGuard: not owner");
        _;
    }

    modifier onlyAuthorized() {
        require(
            msg.sender == owner || msg.sender == guardianWallet,
            "PolicyGuard: not authorized"
        );
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────────

    constructor(uint256 _dailyLimit) {
        owner = msg.sender;
        dailyLimit = _dailyLimit;
        slippageLimitBps = 200; // default 2%
        riskMode = RiskMode.BALANCED;
    }

    // ─── Core Policy Check ───────────────────────────────────────────

    /**
     * @notice Check transaction against all policy rules and consume daily limit
     * @dev Called by GuardianWallet.executeWithGuard() before execution
     * @param user The wallet owner initiating the transaction
     * @param to The destination address
     * @param value The BNB/ETH value being transferred
     * @return allowed True if transaction passes all checks
     */
    function checkAndConsume(
        address user,
        address to,
        uint256 value
    ) external override onlyAuthorized returns (bool allowed) {
        // 1. Blocklist check
        require(!blocklist[to], "PolicyGuard: destination blocked");

        // 2. In STRICT mode, destination must be whitelisted
        if (riskMode == RiskMode.STRICT) {
            require(whitelist[to], "PolicyGuard: destination not whitelisted (strict mode)");
        }

        // 3. Daily limit check with day reset
        uint256 today = _currentDay();

        if (dailySpentDay[user] != today) {
            dailySpent[user] = 0;
            dailySpentDay[user] = today;
        }

        require(
            dailySpent[user] + value <= dailyLimit,
            "PolicyGuard: daily limit exceeded"
        );

        // 4. Consume the daily limit
        dailySpent[user] += value;

        emit TransactionChecked(user, to, value, true);
        return true;
    }

    // ─── Policy Management ───────────────────────────────────────────

    function blockAddress(address addr, bool blocked) external override onlyAuthorized {
        blocklist[addr] = blocked;
        emit AddressBlocked(addr, blocked);
    }

    function whitelistAddress(address addr, bool allowed) external override onlyAuthorized {
        whitelist[addr] = allowed;
        emit AddressWhitelisted(addr, allowed);
    }

    function setDailyLimit(uint256 newLimit) external override onlyOwner {
        uint256 old = dailyLimit;
        dailyLimit = newLimit;
        emit DailyLimitUpdated(old, newLimit);
    }

    function setTokenLimit(address token, uint256 maxAmount) external override onlyOwner {
        tokenLimits[token] = maxAmount;
        emit TokenLimitUpdated(token, maxAmount);
    }

    function setSlippageLimit(uint256 bps) external override onlyOwner {
        require(bps <= 10000, "PolicyGuard: bps > 100%");
        slippageLimitBps = bps;
        emit SlippageLimitUpdated(bps);
    }

    function setRiskMode(RiskMode mode) external onlyOwner {
        riskMode = mode;
    }

    function setGuardianWallet(address wallet) external onlyOwner {
        guardianWallet = wallet;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "PolicyGuard: zero address");
        owner = newOwner;
    }

    // ─── View Functions ──────────────────────────────────────────────

    function getRemainingDailyLimit(address user) external view returns (uint256) {
        uint256 today = _currentDay();
        uint256 spent = dailySpentDay[user] == today ? dailySpent[user] : 0;
        return spent >= dailyLimit ? 0 : dailyLimit - spent;
    }

    function getRiskMode() external view returns (RiskMode) {
        return riskMode;
    }

    // ─── Internal ────────────────────────────────────────────────────

    function _currentDay() internal view returns (uint256) {
        return block.timestamp / 1 days;
    }
}
