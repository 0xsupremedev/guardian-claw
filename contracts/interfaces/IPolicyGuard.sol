// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IPolicyGuard
 * @notice Interface for the PolicyGuard contract used by GuardianWallet
 * @dev The wallet calls checkAndConsume() before every outgoing transaction
 */
interface IPolicyGuard {
    /// @notice Check if a transaction is allowed and consume daily limit
    /// @param user The user (wallet owner) initiating the tx
    /// @param to The destination address
    /// @param value The ETH/BNB value being sent
    /// @return allowed Whether the transaction passes all policy checks
    function checkAndConsume(
        address user,
        address to,
        uint256 value
    ) external returns (bool allowed);

    /// @notice Add or remove an address from the blocklist
    /// @param addr The address to block/unblock
    /// @param blocked True to block, false to unblock
    function blockAddress(address addr, bool blocked) external;

    /// @notice Add or remove an address from the whitelist
    /// @param addr The address to whitelist/unwhitelist
    /// @param allowed True to whitelist, false to remove
    function whitelistAddress(address addr, bool allowed) external;

    /// @notice Update the daily spending limit
    /// @param newLimit New limit in wei
    function setDailyLimit(uint256 newLimit) external;

    /// @notice Update per-token spending limits
    /// @param token Token address
    /// @param maxAmount Max daily amount for this token
    function setTokenLimit(address token, uint256 maxAmount) external;

    /// @notice Set slippage tolerance in basis points
    /// @param bps Basis points (e.g. 200 = 2%)
    function setSlippageLimit(uint256 bps) external;

    /// @notice Check if an address is blocklisted
    function blocklist(address addr) external view returns (bool);

    /// @notice Check if an address is whitelisted
    function whitelist(address addr) external view returns (bool);

    /// @notice Get the daily limit
    function dailyLimit() external view returns (uint256);

    /// @notice Get daily spent amount for a user
    function dailySpent(address user) external view returns (uint256);

    // Events
    event AddressBlocked(address indexed addr, bool blocked);
    event AddressWhitelisted(address indexed addr, bool allowed);
    event DailyLimitUpdated(uint256 oldLimit, uint256 newLimit);
    event TokenLimitUpdated(address indexed token, uint256 maxAmount);
    event SlippageLimitUpdated(uint256 bps);
    event TransactionChecked(
        address indexed user,
        address indexed to,
        uint256 value,
        bool allowed
    );
}
