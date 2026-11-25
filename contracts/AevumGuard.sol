// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title AevumGuard — guarded stablecoin payments on Aevum testnet (chain 44005)
/// @notice TESTNET ONLY. No real value. The guard contract holds tUSD8 and only
///         releases it when a rule the owner wrote allows the payment:
///         per-recipient spending limits, scoped + expiring session keys, and a
///         hash-chained on-chain audit trail.
/// @dev Implemented per docs/ARCHITECTURE_AND_CONTRACT_SPEC.md §3 (12 Nov 2026 prep,
///      code written inside the build window, 17 Nov 2026).
///      Ownable / ReentrancyGuard / SafeERC20 semantics are implemented inline
///      (same behaviour and revert names as OpenZeppelin) so the file compiles
///      standalone with solc ^0.8.24 and has no external import to drift.

interface IERC20Like {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract AevumGuard {
    // Errors at contract scope (spec §3.2 names). NOTE: the spec also names an
    // event `SessionRevoked`; Solidity forbids an error and an event sharing
    // one identifier, so the event is `SessionKeyRevoked` (documented deviation,
    // see BUILD_LOG.md) while the revert error keeps the exact spec name.
    error OwnableUnauthorizedAccount(address account);
    error OverPerTxCap();
    error OverDailyCap();
    error OverWeeklyCap();
    error SessionExpired();
    error SessionRevoked();
    error SessionNotFound();
    error ScopeMismatch();
    error NoActiveLimit();
    error InsufficientGuardBalance();
    error NotOwnerOrSession();
    error InvalidLimitOrdering();
    error InvalidExpiry();
    error InvalidMaxPerTx();
    error ZeroAmount();
    error ZeroAddress();
    error ReentrantCall();
    error SafeTransferFailed();

    // ── Types ────────────────────────────────────────────────────────────────
    struct Limit {
        uint256 capPerTx;
        uint256 capPerDay;
        uint256 capPerWeek;
        bytes32 category;
        bool active;
    }

    struct SpendWindow {
        uint256 amount;
        uint256 windowStart;
    }

    struct SessionKey {
        bytes32 scope;      // allowed category
        uint256 maxPerTx;
        uint256 expiresAt;  // unix timestamp
        bool revoked;
        uint256 spent;
        bool exists;
    }

    struct Receipt {
        bytes32 action;     // e.g. keccak256("PAYMENT")
        address actor;
        address recipient;
        uint256 amount;
        bytes32 category;
        uint256 timestamp;
        bytes32 prevHash;
    }

    // ── State (spec §3.1) ────────────────────────────────────────────────────
    IERC20Like public immutable token;
    address public owner;

    mapping(address => Limit) private _limits;
    mapping(address => SpendWindow) private _spentDay;
    mapping(address => SpendWindow) private _spentWeek;
    mapping(address => SessionKey) private _sessions;
    mapping(uint256 => Receipt) private _receipts;
    mapping(uint256 => bytes32) private _receiptHashes;

    uint256 public auditNonce;
    bytes32 public lastReceiptHash;

    uint256 private _reentrancyStatus = 1;

    // ── Events (spec §3.3 — every event carries the audit fields) ────────────
    event Funded(uint256 indexed auditNonce, bytes32 prevReceiptHash, bytes32 receiptHash, address indexed actor, uint256 amount);
    event LimitSet(uint256 indexed auditNonce, bytes32 prevReceiptHash, bytes32 receiptHash, address indexed recipient, uint256 capPerTx, uint256 capPerDay, uint256 capPerWeek, bytes32 category);
    event LimitRemoved(uint256 indexed auditNonce, bytes32 prevReceiptHash, bytes32 receiptHash, address indexed recipient);
    event SessionGranted(uint256 indexed auditNonce, bytes32 prevReceiptHash, bytes32 receiptHash, address indexed key, bytes32 scope, uint256 maxPerTx, uint256 expiresAt);
    event SessionKeyRevoked(uint256 indexed auditNonce, bytes32 prevReceiptHash, bytes32 receiptHash, address indexed key);
    event Payment(uint256 indexed auditNonce, bytes32 prevReceiptHash, bytes32 receiptHash, address indexed actor, address indexed recipient, uint256 amount, bytes32 category);
    event Withdrawn(uint256 indexed auditNonce, bytes32 prevReceiptHash, bytes32 receiptHash, address indexed to, uint256 amount);

    // ── Modifiers ────────────────────────────────────────────────────────────
    modifier onlyOwner() {
        if (msg.sender != owner) revert OwnableUnauthorizedAccount(msg.sender);
        _;
    }

    modifier nonReentrant() {
        if (_reentrancyStatus != 1) revert ReentrantCall();
        _reentrancyStatus = 2;
        _;
        _reentrancyStatus = 1;
    }

    // ── Constructor ──────────────────────────────────────────────────────────
    constructor(address _token) {
        if (_token == address(0)) revert ZeroAddress();
        token = IERC20Like(_token);
        owner = msg.sender;
    }

    // ── Owner: funding ───────────────────────────────────────────────────────
    /// @notice Move tUSD8 into the guard. Owner must `approve` the guard first.
    function fund(uint256 amount) external onlyOwner nonReentrant {
        if (amount == 0) revert ZeroAmount();
        _safeTransferFrom(msg.sender, address(this), amount);
        (uint256 nonce, bytes32 prevHash, bytes32 hash) =
            _appendReceipt(keccak256("FUNDED"), msg.sender, address(this), amount, bytes32(0));
        emit Funded(nonce, prevHash, hash, msg.sender, amount);
    }

    // ── Owner: limits ────────────────────────────────────────────────────────
    /// @notice Create/update a recipient's caps. perTx <= perDay <= perWeek.
    ///         Setting all three to 0 pauses the recipient (payments revert).
    function setLimit(address recipient, uint256 perTx, uint256 perDay, uint256 perWeek, bytes32 category)
        external onlyOwner
    {
        if (recipient == address(0)) revert ZeroAddress();
        if (!(perTx <= perDay && perDay <= perWeek)) revert InvalidLimitOrdering();
        bool allZero = (perTx == 0 && perDay == 0 && perWeek == 0);
        _limits[recipient] = Limit(perTx, perDay, perWeek, category, !allZero);
        (uint256 nonce, bytes32 prevHash, bytes32 hash) =
            _appendReceipt(keccak256("LIMIT_SET"), msg.sender, recipient, perTx, category);
        emit LimitSet(nonce, prevHash, hash, recipient, perTx, perDay, perWeek, category);
    }

    /// @notice Deactivate a recipient's limit (default-deny: payments revert).
    function removeLimit(address recipient) external onlyOwner {
        if (recipient == address(0)) revert ZeroAddress();
        _limits[recipient].active = false;
        (uint256 nonce, bytes32 prevHash, bytes32 hash) =
            _appendReceipt(keccak256("LIMIT_REMOVED"), msg.sender, recipient, 0, bytes32(0));
        emit LimitRemoved(nonce, prevHash, hash, recipient);
    }

    // ── Owner: session keys ──────────────────────────────────────────────────
    /// @notice Register a scoped, expiring session key. Max expiry 7 days.
    function grantSession(address key, bytes32 scope, uint256 maxPerTx, uint256 expiresInSeconds)
        external onlyOwner
    {
        if (key == address(0)) revert ZeroAddress();
        if (maxPerTx == 0) revert InvalidMaxPerTx();
        if (expiresInSeconds == 0 || expiresInSeconds > 7 days) revert InvalidExpiry();
        uint256 expiresAt = block.timestamp + expiresInSeconds;
        _sessions[key] = SessionKey(scope, maxPerTx, expiresAt, false, 0, true);
        (uint256 nonce, bytes32 prevHash, bytes32 hash) =
            _appendReceipt(keccak256("SESSION_GRANTED"), msg.sender, key, maxPerTx, scope);
        emit SessionGranted(nonce, prevHash, hash, key, scope, maxPerTx, expiresAt);
    }

    /// @notice Instant revoke — effective in the same block for later calls.
    function revokeSession(address key) external onlyOwner {
        if (!_sessions[key].exists) revert SessionNotFound();
        _sessions[key].revoked = true;
        (uint256 nonce, bytes32 prevHash, bytes32 hash) =
            _appendReceipt(keccak256("SESSION_REVOKED"), msg.sender, key, 0, _sessions[key].scope);
        emit SessionKeyRevoked(nonce, prevHash, hash, key);
    }

    // ── The guarded payment ──────────────────────────────────────────────────
    /// @notice Pay `amount` of tUSD8 to `recipient` if every rule allows it.
    ///         Checks, in order (spec §3.2): caller authorisation / session
    ///         validity, active limit, per-tx cap, daily cap, weekly cap,
    ///         guard balance. Each failure reverts naming the exact rule.
    function pay(address recipient, uint256 amount, bytes32 category) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        if (recipient == address(0)) revert ZeroAddress();

        bool isOwner = (msg.sender == owner);
        if (!isOwner) {
            SessionKey storage s = _sessions[msg.sender];
            if (!s.exists) revert NotOwnerOrSession();
            if (s.revoked) revert SessionRevoked();
            if (block.timestamp > s.expiresAt) revert SessionExpired();
            if (s.scope != category) revert ScopeMismatch();
            if (amount > s.maxPerTx) revert OverPerTxCap();
        }

        Limit storage lim = _limits[recipient];
        if (!lim.active) revert NoActiveLimit();
        if (amount > lim.capPerTx) revert OverPerTxCap();

        uint256 spentDay = _effectiveSpent(_spentDay[recipient], 1 days);
        if (spentDay >= lim.capPerDay || amount > lim.capPerDay - spentDay) revert OverDailyCap();
        uint256 spentWeek = _effectiveSpent(_spentWeek[recipient], 7 days);
        if (spentWeek >= lim.capPerWeek || amount > lim.capPerWeek - spentWeek) revert OverWeeklyCap();

        if (token.balanceOf(address(this)) < amount) revert InsufficientGuardBalance();

        // Effects
        _rollWindow(_spentDay[recipient], 1 days, amount);
        _rollWindow(_spentWeek[recipient], 7 days, amount);
        if (!isOwner) _sessions[msg.sender].spent += amount;
        (uint256 nonce, bytes32 prevHash, bytes32 hash) =
            _appendReceipt(keccak256("PAYMENT"), msg.sender, recipient, amount, category);

        // Interaction (SafeERC20 semantics, reentrancy-guarded)
        _safeTransfer(recipient, amount);
        emit Payment(nonce, prevHash, hash, msg.sender, recipient, amount, category);
    }

    // ── Owner: emergency withdrawal ──────────────────────────────────────────
    function withdraw(uint256 amount, address to) external onlyOwner nonReentrant {
        if (amount == 0) revert ZeroAmount();
        if (to == address(0)) revert ZeroAddress();
        if (token.balanceOf(address(this)) < amount) revert InsufficientGuardBalance();
        (uint256 nonce, bytes32 prevHash, bytes32 hash) =
            _appendReceipt(keccak256("WITHDRAWN"), msg.sender, to, amount, bytes32(0));
        _safeTransfer(to, amount);
        emit Withdrawn(nonce, prevHash, hash, to, amount);
    }

    // ── Views ────────────────────────────────────────────────────────────────
    /// @notice Recompute the hash chain from stored receipts and compare each
    ///         recomputed hash to the supplied one. Returns (true, 0) when the
    ///         whole supplied chain matches, else (false, first bad index).
    function verifyChain(bytes32[] calldata receiptHashes) external view returns (bool ok, uint256 failedIndex) {
        bytes32 prev = bytes32(0);
        for (uint256 i = 0; i < receiptHashes.length; i++) {
            uint256 nonce = i + 1;
            if (nonce > auditNonce) return (false, i);
            Receipt storage r = _receipts[nonce];
            bytes32 recomputed = keccak256(
                abi.encodePacked(prev, nonce, r.action, r.actor, r.recipient, r.amount, r.category, r.timestamp)
            );
            if (recomputed != receiptHashes[i] || recomputed != _receiptHashes[nonce]) {
                return (false, i);
            }
            prev = recomputed;
        }
        return (true, 0);
    }

    function getLimit(address recipient)
        external view returns (uint256 capPerTx, uint256 capPerDay, uint256 capPerWeek, bytes32 category, bool active)
    {
        Limit storage l = _limits[recipient];
        return (l.capPerTx, l.capPerDay, l.capPerWeek, l.category, l.active);
    }

    function getSession(address key)
        external view returns (bytes32 scope, uint256 maxPerTx, uint256 expiresAt, bool revoked, uint256 spent)
    {
        SessionKey storage s = _sessions[key];
        return (s.scope, s.maxPerTx, s.expiresAt, s.revoked, s.spent);
    }

    /// @notice Effective spend in the current rolling windows (expired windows read as 0).
    function getSpent(address recipient) external view returns (uint256 spentToday, uint256 spentThisWeek) {
        return (
            _effectiveSpent(_spentDay[recipient], 1 days),
            _effectiveSpent(_spentWeek[recipient], 7 days)
        );
    }

    function receiptHash(uint256 nonce) external view returns (bytes32) {
        return _receiptHashes[nonce];
    }

    // ── Internals ────────────────────────────────────────────────────────────
    function _appendReceipt(bytes32 action, address actor, address recipient, uint256 amount, bytes32 category)
        internal returns (uint256 nonce, bytes32 prevHash, bytes32 hash)
    {
        auditNonce += 1;
        nonce = auditNonce;
        prevHash = lastReceiptHash;
        hash = keccak256(
            abi.encodePacked(prevHash, nonce, action, actor, recipient, amount, category, block.timestamp)
        );
        _receipts[nonce] = Receipt(action, actor, recipient, amount, category, block.timestamp, prevHash);
        _receiptHashes[nonce] = hash;
        lastReceiptHash = hash;
    }

    function _effectiveSpent(SpendWindow storage w, uint256 span) internal view returns (uint256) {
        if (w.windowStart == 0 || block.timestamp >= w.windowStart + span) return 0;
        return w.amount;
    }

    function _rollWindow(SpendWindow storage w, uint256 span, uint256 amount) internal {
        if (w.windowStart == 0 || block.timestamp >= w.windowStart + span) {
            w.windowStart = block.timestamp;
            w.amount = amount;
        } else {
            w.amount += amount;
        }
    }

    /// SafeERC20-style transfer: tolerates tokens with no return value,
    /// reverts SafeTransferFailed on false / failed call.
    function _safeTransfer(address to, uint256 amount) internal {
        (bool ok, bytes memory data) =
            address(token).call(abi.encodeWithSelector(IERC20Like.transfer.selector, to, amount));
        if (!ok || (data.length > 0 && !abi.decode(data, (bool)))) revert SafeTransferFailed();
    }

    function _safeTransferFrom(address from, address to, uint256 amount) internal {
        (bool ok, bytes memory data) =
            address(token).call(abi.encodeWithSelector(IERC20Like.transferFrom.selector, from, to, amount));
        if (!ok || (data.length > 0 && !abi.decode(data, (bool)))) revert SafeTransferFailed();
    }
}
