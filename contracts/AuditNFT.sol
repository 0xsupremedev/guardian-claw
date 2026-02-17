// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title AuditNFT
 * @author GuardianClaw Team
 * @notice On-chain audit trail as ERC-721 NFTs
 * @dev Mints a proof-of-action token for every GuardianClaw intervention.
 *      Each NFT stores metadata pointing to:
 *      - The agent's decision (IPFS CID)
 *      - The related transaction hash
 *      - Action type (SAFE/BLOCKED/REVOKED)
 *      - Risk score at time of decision
 *
 *      Minimal ERC-721 implementation (no OpenZeppelin dependency for hackathon speed)
 */
contract AuditNFT {

    // ─── ERC-721 Core State ──────────────────────────────────────────

    string public name = "GuardianClaw Audit";
    string public symbol = "GCAUDIT";

    address public owner;
    address public guardianWallet; // authorized minter

    uint256 private _tokenIdCounter;

    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;

    // ─── Audit Metadata ──────────────────────────────────────────────

    enum ActionType { SAFE_TRANSFER, BLOCKED_HONEYPOT, BLOCKED_LIMIT, BLOCKED_BLACKLIST, EMERGENCY_REVOKE, POLICY_UPDATE }

    struct AuditRecord {
        address wallet;           // The GuardianWallet that was protected
        ActionType actionType;    // Type of action
        uint256 riskScore;        // Risk score (0-100) at decision time
        string metadataURI;       // IPFS CID or URL pointing to full decision JSON
        string txHashRef;         // Related tx hash (as string for cross-chain compat)
        uint256 timestamp;        // Block timestamp of mint
        address agent;            // Agent address that made the decision
    }

    mapping(uint256 => AuditRecord) public auditRecords;

    // ─── Events ──────────────────────────────────────────────────────

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
    event AuditMinted(
        uint256 indexed tokenId,
        address indexed wallet,
        ActionType actionType,
        uint256 riskScore,
        string metadataURI
    );

    // ─── Modifiers ───────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "AuditNFT: not owner");
        _;
    }

    modifier onlyAuthorized() {
        require(
            msg.sender == owner || msg.sender == guardianWallet,
            "AuditNFT: not authorized"
        );
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
    }

    // ─── Mint Audit NFT ──────────────────────────────────────────────

    /**
     * @notice Mint an audit proof NFT
     * @param wallet The GuardianWallet being protected
     * @param actionType The type of protective action
     * @param riskScore Risk score (0-100)
     * @param metadataURI IPFS CID or URL to the full decision JSON
     * @param txHashRef Related transaction hash
     * @param agent The agent address that made the decision
     * @return tokenId The minted token ID
     */
    function mintAudit(
        address wallet,
        ActionType actionType,
        uint256 riskScore,
        string calldata metadataURI,
        string calldata txHashRef,
        address agent
    ) external onlyAuthorized returns (uint256 tokenId) {
        _tokenIdCounter++;
        tokenId = _tokenIdCounter;

        _mint(wallet, tokenId);

        auditRecords[tokenId] = AuditRecord({
            wallet: wallet,
            actionType: actionType,
            riskScore: riskScore,
            metadataURI: metadataURI,
            txHashRef: txHashRef,
            timestamp: block.timestamp,
            agent: agent
        });

        emit AuditMinted(tokenId, wallet, actionType, riskScore, metadataURI);
    }

    /**
     * @notice Convenience function to mint with simpler params
     * @param wallet The wallet being protected
     * @param metadataURI IPFS CID or URL
     * @return tokenId The minted token ID
     */
    function mintSimple(
        address wallet,
        string calldata metadataURI
    ) external onlyAuthorized returns (uint256 tokenId) {
        _tokenIdCounter++;
        tokenId = _tokenIdCounter;

        _mint(wallet, tokenId);

        auditRecords[tokenId] = AuditRecord({
            wallet: wallet,
            actionType: ActionType.SAFE_TRANSFER,
            riskScore: 0,
            metadataURI: metadataURI,
            txHashRef: "",
            timestamp: block.timestamp,
            agent: msg.sender
        });

        emit AuditMinted(tokenId, wallet, ActionType.SAFE_TRANSFER, 0, metadataURI);
    }

    // ─── Admin ───────────────────────────────────────────────────────

    function setGuardianWallet(address wallet) external onlyOwner {
        guardianWallet = wallet;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "AuditNFT: zero address");
        owner = newOwner;
    }

    // ─── View Functions ──────────────────────────────────────────────

    function tokenURI(uint256 tokenId) public view returns (string memory) {
        require(_exists(tokenId), "AuditNFT: nonexistent token");
        return auditRecords[tokenId].metadataURI;
    }

    function getAuditRecord(uint256 tokenId) external view returns (AuditRecord memory) {
        require(_exists(tokenId), "AuditNFT: nonexistent token");
        return auditRecords[tokenId];
    }

    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }

    // ─── ERC-721 Standard Functions ──────────────────────────────────

    function balanceOf(address _owner) public view returns (uint256) {
        require(_owner != address(0), "ERC721: zero address");
        return _balances[_owner];
    }

    function ownerOf(uint256 tokenId) public view returns (address) {
        address tokenOwner = _owners[tokenId];
        require(tokenOwner != address(0), "ERC721: nonexistent token");
        return tokenOwner;
    }

    function approve(address to, uint256 tokenId) public {
        address tokenOwner = ownerOf(tokenId);
        require(to != tokenOwner, "ERC721: approve to owner");
        require(
            msg.sender == tokenOwner || isApprovedForAll(tokenOwner, msg.sender),
            "ERC721: not authorized"
        );
        _tokenApprovals[tokenId] = to;
        emit Approval(tokenOwner, to, tokenId);
    }

    function getApproved(uint256 tokenId) public view returns (address) {
        require(_exists(tokenId), "ERC721: nonexistent token");
        return _tokenApprovals[tokenId];
    }

    function setApprovalForAll(address operator, bool approved) public {
        require(operator != msg.sender, "ERC721: self approval");
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(address _owner, address operator) public view returns (bool) {
        return _operatorApprovals[_owner][operator];
    }

    function transferFrom(address from, address to, uint256 tokenId) public {
        require(_isApprovedOrOwner(msg.sender, tokenId), "ERC721: not authorized");
        _transfer(from, to, tokenId);
    }

    // ─── Internal ────────────────────────────────────────────────────

    function _exists(uint256 tokenId) internal view returns (bool) {
        return _owners[tokenId] != address(0);
    }

    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        address tokenOwner = ownerOf(tokenId);
        return (
            spender == tokenOwner ||
            getApproved(tokenId) == spender ||
            isApprovedForAll(tokenOwner, spender)
        );
    }

    function _mint(address to, uint256 tokenId) internal {
        require(to != address(0), "ERC721: mint to zero");
        require(!_exists(tokenId), "ERC721: already minted");
        _balances[to] += 1;
        _owners[tokenId] = to;
        emit Transfer(address(0), to, tokenId);
    }

    function _transfer(address from, address to, uint256 tokenId) internal {
        require(ownerOf(tokenId) == from, "ERC721: wrong owner");
        require(to != address(0), "ERC721: zero address");
        delete _tokenApprovals[tokenId];
        _balances[from] -= 1;
        _balances[to] += 1;
        _owners[tokenId] = to;
        emit Transfer(from, to, tokenId);
    }

    // ─── ERC-165 ─────────────────────────────────────────────────────

    function supportsInterface(bytes4 interfaceId) public pure returns (bool) {
        return
            interfaceId == 0x80ac58cd || // ERC-721
            interfaceId == 0x01ffc9a7;   // ERC-165
    }
}
