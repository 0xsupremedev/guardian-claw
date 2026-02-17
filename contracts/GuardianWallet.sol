// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./interfaces/IPolicyGuard.sol";
import "./libraries/EIP712Verifier.sol";

/**
 * @title GuardianWallet
 * @author GuardianClaw Team
 * @notice Non-custodial smart wallet with AI agent policy enforcement
 * @dev Core wallet contract that:
 *      1. Holds user funds (receive BNB)
 *      2. Enforces PolicyGuard checks on every outgoing tx
 *      3. Supports session keys for the AI agent (time-limited delegation)
 *      4. Verifies EIP-712 signed intents for meta-transactions
 *      5. Implements EIP-1271 for smart-wallet signature validation
 *      6. Emergency controls (revoke session key, pause)
 */
contract GuardianWallet {
    using EIP712Verifier for *;

    // ─── Constants ───────────────────────────────────────────────────

    bytes4 internal constant EIP1271_MAGIC_VALUE = 0x1626ba7e;
    bytes32 public immutable DOMAIN_SEPARATOR;

    // ─── State ───────────────────────────────────────────────────────

    address public owner;
    IPolicyGuard public policyGuard;

    // Session keys: agent address → expiry timestamp
    struct SessionKey {
        uint256 expiry;
        bool active;
        uint256 nonce;
    }
    mapping(address => SessionKey) public sessionKeys;

    // Owner nonce for meta-transactions
    uint256 public ownerNonce;

    // Emergency pause
    bool public paused;

    // Execution log for audit
    uint256 public executionCount;

    // ─── Events ──────────────────────────────────────────────────────

    event Received(address indexed from, uint256 amount);
    event Executed(
        address indexed to,
        uint256 value,
        bytes data,
        bool success,
        uint256 executionId
    );
    event TransactionBlocked(
        address indexed to,
        uint256 value,
        string reason,
        uint256 executionId
    );
    event SessionKeySet(address indexed key, uint256 expiry);
    event SessionKeyRevoked(address indexed key);
    event PolicyGuardUpdated(address indexed oldGuard, address indexed newGuard);
    event EmergencyPause(bool paused);
    event OwnershipTransferred(address indexed oldOwner, address indexed newOwner);

    // ─── Modifiers ───────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "GW: not owner");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "GW: paused");
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────────

    constructor(address _policyGuard) {
        owner = msg.sender;
        policyGuard = IPolicyGuard(_policyGuard);

        DOMAIN_SEPARATOR = EIP712Verifier.buildDomainSeparator(
            "GuardianWallet",
            "1",
            address(this)
        );
    }

    // ─── Receive BNB ─────────────────────────────────────────────────

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    fallback() external payable {
        emit Received(msg.sender, msg.value);
    }

    // ─── Core Execution ──────────────────────────────────────────────

    /**
     * @notice Execute a transaction with PolicyGuard enforcement
     * @dev The main entry point for guarded transactions.
     *      1. Checks PolicyGuard.checkAndConsume()
     *      2. If passes, executes the call
     *      3. Emits Executed or TransactionBlocked
     * @param to Destination address
     * @param value BNB value to send
     * @param data Calldata for the destination
     * @return success Whether the inner call succeeded
     * @return returnData The return data from the inner call
     */
    function executeWithGuard(
        address to,
        uint256 value,
        bytes calldata data
    ) external onlyOwner whenNotPaused returns (bool success, bytes memory returnData) {
        executionCount++;

        // PolicyGuard check
        try policyGuard.checkAndConsume(owner, to, value) returns (bool allowed) {
            require(allowed, "GW: policy check failed");
        } catch Error(string memory reason) {
            emit TransactionBlocked(to, value, reason, executionCount);
            revert(string(abi.encodePacked("GW: blocked - ", reason)));
        }

        // Execute the transaction
        (success, returnData) = to.call{value: value}(data);

        emit Executed(to, value, data, success, executionCount);
    }

    /**
     * @notice Execute via meta-transaction with EIP-712 signature
     * @dev Allows the relayer to submit transactions signed by the owner
     * @param to Destination address
     * @param value BNB value
     * @param data Calldata
     * @param deadline Signature expiry timestamp
     * @param signature Owner's EIP-712 signature
     */
    function executeWithSignature(
        address to,
        uint256 value,
        bytes calldata data,
        uint256 deadline,
        bytes calldata signature
    ) external whenNotPaused returns (bool success, bytes memory returnData) {
        require(block.timestamp <= deadline, "GW: signature expired");

        executionCount++;

        // Verify owner signature
        bytes32 structHash = EIP712Verifier.hashIntent(
            to,
            value,
            keccak256(data),
            ownerNonce,
            deadline
        );

        address signer = EIP712Verifier.recoverSigner(
            DOMAIN_SEPARATOR,
            structHash,
            signature
        );
        require(signer == owner, "GW: invalid owner signature");

        ownerNonce++;

        // PolicyGuard check
        try policyGuard.checkAndConsume(owner, to, value) returns (bool allowed) {
            require(allowed, "GW: policy check failed");
        } catch Error(string memory reason) {
            emit TransactionBlocked(to, value, reason, executionCount);
            revert(string(abi.encodePacked("GW: blocked - ", reason)));
        }

        // Execute
        (success, returnData) = to.call{value: value}(data);
        emit Executed(to, value, data, success, executionCount);
    }

    /**
     * @notice Execute a policy action via agent session key
     * @dev Agent can block addresses, update whitelist, etc. within session key scope
     * @param actionType 0=block, 1=whitelist, 2=unblock, 3=unwhitelist
     * @param target Target address for the action
     * @param deadline Signature expiry
     * @param signature Agent's EIP-712 signature
     */
    function executeAgentAction(
        uint8 actionType,
        address target,
        uint256 deadline,
        bytes calldata signature
    ) external whenNotPaused {
        require(block.timestamp <= deadline, "GW: signature expired");

        // Verify agent session key signature
        bytes32 structHash = EIP712Verifier.hashPolicyAction(
            actionType,
            target,
            0, // value not used for simple actions
            0, // nonce handled by session key
            deadline
        );

        address signer = EIP712Verifier.recoverSigner(
            DOMAIN_SEPARATOR,
            structHash,
            signature
        );

        // Verify signer has an active session key
        SessionKey storage sk = sessionKeys[signer];
        require(sk.active, "GW: not a session key");
        require(block.timestamp <= sk.expiry, "GW: session expired");

        sk.nonce++;

        // Execute the policy action
        if (actionType == 0) {
            policyGuard.blockAddress(target, true);
        } else if (actionType == 1) {
            policyGuard.whitelistAddress(target, true);
        } else if (actionType == 2) {
            policyGuard.blockAddress(target, false);
        } else if (actionType == 3) {
            policyGuard.whitelistAddress(target, false);
        } else {
            revert("GW: invalid action type");
        }
    }

    // ─── Session Key Management ──────────────────────────────────────

    /**
     * @notice Grant a session key to the AI agent
     * @param key The agent's signing address
     * @param expiry Unix timestamp when the key expires
     */
    function setSessionKey(address key, uint256 expiry) external onlyOwner {
        require(key != address(0), "GW: zero address");
        require(expiry > block.timestamp, "GW: expiry in past");

        sessionKeys[key] = SessionKey({
            expiry: expiry,
            active: true,
            nonce: 0
        });

        emit SessionKeySet(key, expiry);
    }

    /**
     * @notice Revoke a session key (emergency control)
     * @param key The agent's signing address to revoke
     */
    function revokeSessionKey(address key) external onlyOwner {
        sessionKeys[key].active = false;
        emit SessionKeyRevoked(key);
    }

    /**
     * @notice Check if a session key is currently valid
     */
    function isSessionKeyActive(address key) external view returns (bool) {
        SessionKey memory sk = sessionKeys[key];
        return sk.active && block.timestamp <= sk.expiry;
    }

    // ─── EIP-1271 Signature Validation ───────────────────────────────

    /**
     * @notice Validate a signature for EIP-1271 compatibility
     * @param hash The message hash
     * @param signature The signature
     * @return magicValue 0x1626ba7e if valid
     */
    function isValidSignature(
        bytes32 hash,
        bytes memory signature
    ) external view returns (bytes4) {
        address signer = EIP712Verifier.recoverSigner(
            DOMAIN_SEPARATOR,
            hash,
            signature
        );

        if (signer == owner) {
            return EIP1271_MAGIC_VALUE;
        }

        SessionKey memory sk = sessionKeys[signer];
        if (sk.active && block.timestamp <= sk.expiry) {
            return EIP1271_MAGIC_VALUE;
        }

        return bytes4(0);
    }

    // ─── Admin Functions ─────────────────────────────────────────────

    function updatePolicyGuard(address newGuard) external onlyOwner {
        address old = address(policyGuard);
        policyGuard = IPolicyGuard(newGuard);
        emit PolicyGuardUpdated(old, newGuard);
    }

    function togglePause() external onlyOwner {
        paused = !paused;
        emit EmergencyPause(paused);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "GW: zero address");
        address old = owner;
        owner = newOwner;
        emit OwnershipTransferred(old, newOwner);
    }

    /**
     * @notice Emergency withdrawal — owner can always retrieve funds
     * @param to Destination for the withdrawal
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address payable to, uint256 amount) external onlyOwner {
        require(to != address(0), "GW: zero address");
        require(amount <= address(this).balance, "GW: insufficient balance");
        (bool sent,) = to.call{value: amount}("");
        require(sent, "GW: withdraw failed");
    }

    // ─── View Functions ──────────────────────────────────────────────

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getPolicyGuardAddress() external view returns (address) {
        return address(policyGuard);
    }
}
