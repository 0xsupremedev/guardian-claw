// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title EIP712Verifier
 * @notice Library for verifying EIP-712 typed signatures
 * @dev Used by GuardianWallet to validate agent and owner signatures
 */
library EIP712Verifier {
    // EIP-712 domain separator typehash
    bytes32 internal constant DOMAIN_TYPEHASH =
        keccak256(
            "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
        );

    // Intent typehash for transaction execution
    bytes32 internal constant INTENT_TYPEHASH =
        keccak256(
            "Intent(address to,uint256 value,bytes32 dataHash,uint256 nonce,uint256 deadline)"
        );

    // Policy action typehash for agent-initiated policy changes
    bytes32 internal constant POLICY_ACTION_TYPEHASH =
        keccak256(
            "PolicyAction(uint8 actionType,address target,uint256 value,uint256 nonce,uint256 deadline)"
        );

    /**
     * @notice Build the EIP-712 domain separator
     * @param name Contract name
     * @param version Contract version
     * @param contractAddress The address of the verifying contract
     * @return domainSeparator The computed domain separator
     */
    function buildDomainSeparator(
        string memory name,
        string memory version,
        address contractAddress
    ) internal view returns (bytes32 domainSeparator) {
        domainSeparator = keccak256(
            abi.encode(
                DOMAIN_TYPEHASH,
                keccak256(bytes(name)),
                keccak256(bytes(version)),
                block.chainid,
                contractAddress
            )
        );
    }

    /**
     * @notice Hash an intent for EIP-712 signing
     * @param to Destination address
     * @param value ETH/BNB value
     * @param dataHash Keccak256 of the calldata
     * @param nonce Signer nonce
     * @param deadline Signature expiry timestamp
     * @return The EIP-712 struct hash
     */
    function hashIntent(
        address to,
        uint256 value,
        bytes32 dataHash,
        uint256 nonce,
        uint256 deadline
    ) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    INTENT_TYPEHASH,
                    to,
                    value,
                    dataHash,
                    nonce,
                    deadline
                )
            );
    }

    /**
     * @notice Hash a policy action for EIP-712 signing
     * @param actionType Type of policy action (0=block, 1=whitelist, 2=setLimit)
     * @param target Target address for the action
     * @param value Associated value (e.g., new limit)
     * @param nonce Signer nonce
     * @param deadline Signature expiry timestamp
     * @return The EIP-712 struct hash
     */
    function hashPolicyAction(
        uint8 actionType,
        address target,
        uint256 value,
        uint256 nonce,
        uint256 deadline
    ) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    POLICY_ACTION_TYPEHASH,
                    actionType,
                    target,
                    value,
                    nonce,
                    deadline
                )
            );
    }

    /**
     * @notice Recover the signer from an EIP-712 signature
     * @param domainSeparator The domain separator
     * @param structHash The struct hash
     * @param signature The signature (65 bytes: r, s, v)
     * @return signer The recovered signer address
     */
    function recoverSigner(
        bytes32 domainSeparator,
        bytes32 structHash,
        bytes memory signature
    ) internal pure returns (address signer) {
        require(signature.length == 65, "EIP712: invalid signature length");

        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", domainSeparator, structHash)
        );

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }

        if (v < 27) v += 27;
        require(v == 27 || v == 28, "EIP712: invalid v value");

        signer = ecrecover(digest, v, r, s);
        require(signer != address(0), "EIP712: invalid signature");
    }
}
