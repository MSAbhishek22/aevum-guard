# Architecture + Smart-Contract Specification — Aevum Guard

**Status:** SPECIFICATION ONLY (12 Nov 2026). No code written — build window opens 16 Nov 11:30 IST. This spec is the build blueprint for day 1 of the window.

## 1. Problem (one paragraph)

Stablecoin payments on a new chain are easy to send and hard to control: whoever holds the key can drain the wallet, an agent with a key can spend without limit, and after the fact there is no receipt a third party can verify. Aevum Guard puts three on-chain controls between the owner and the money — spending limits, scoped session keys, and a hash-chained audit trail — so a payment can only happen if a rule the owner wrote allows it, and every payment leaves verifiable proof.

## 2. System architecture

```
Owner (EOA, MetaMask on Aevum 44005)
  │  deploys + owns
  ▼
AevumGuard.sol ──holds tUSD8──► tUSD8 (0x456569838f1d43009A91ebA4263147Afd7233483)
  │  enforces limits / session keys / emits audit events
  ▼
Next.js UI (Vercel, single page, 5 sections) ──ethers.js/viem──► RPC https://rpc-test.qday.info
  │  reads events, rebuilds audit trail client-side, verifies hash chain
  ▼
Audit trail (on-chain events + client-side hash chain; explorer links per tx)
```

- **Chain:** Aevum testnet only, chain ID 44005. No mainnet code path exists.
- **Token:** tUSD8 only. Decimals to confirm from the token contract at window start (read `decimals()` before writing amount math).
- **Custody model:** the guard contract itself holds the tUSD8 (owner funds it via `fund()`). The owner EOA never gives its key to anyone; session keys are separate addresses with scoped, expiring, revocable permission. This is the Safe-module pattern in a single purpose-built contract (see `design/RESEARCH_REFERENCES.md` §1).
- **No backend server:** UI talks directly to the chain via the public RPC. Audit trail is rebuilt from emitted events (no private database, nothing to leak). A tiny Vercel serverless API is allowed ONLY for caching event reads if the public RPC rate-limits — decided in-window, not assumed.
- **No ERC-8004 required:** the submission's QDay-infra evidence is the guard contract itself + verified source + live demo (ERC-8004 is listed as an example, not mandatory). If the starter kit (16 Nov) ships an ERC-8004 helper that fits, adopt it as an optional identity attestation for session keys and document it; do not force it.

## 3. Contract: AevumGuard.sol (Solidity ^0.8.24, OpenZeppelin Ownable + ReentrancyGuard + SafeERC20)

### 3.1 State

| Variable | Type | Meaning |
|---|---|---|
| `token` | `IERC20 immutable` | tUSD8 address (constructor arg; verify == 0x4565…3483 at deploy) |
| `owner` | `address` (Ownable) | Deployer; only owner sets limits, grants/revokes keys, withdraws |
| `limits` | `mapping(address => Limit)` per recipient | `capPerTx`, `capPerDay`, `capPerWeek`, `category` (bytes32), `active` |
| `spentToday` / `spentThisWeek` | `mapping(address => SpendWindow)` | `{amount, windowStart}` — rolling 24h / 7d windows from first spend in window |
| `sessions` | `mapping(address => SessionKey)` | `{scope: bytes32 (allowed category), maxPerTx, expiresAt, revoked, spent}` |
| `auditNonce` | `uint256` | Increments per audited action; each receipt hashes the previous receipt hash |
| `lastReceiptHash` | `bytes32` | Head of the hash chain |

### 3.2 Functions (all state-changing functions emit an audit event)

| Function | Caller | Behaviour |
|---|---|---|
| `constructor(address _token)` | deployer | Sets token + owner. |
| `fund(uint256 amount)` | owner | `transferFrom` tUSD8 into the guard (owner must `approve` first). Emits `Funded`. |
| `setLimit(address recipient, uint256 perTx, uint256 perDay, uint256 perWeek, bytes32 category)` | owner only | Creates/updates a recipient's caps. `perTx ≤ perDay ≤ perWeek` enforced; setting all three to 0 pauses that recipient. Emits `LimitSet`. |
| `removeLimit(address recipient)` | owner only | Deactivates a recipient's limit (payments to them then revert — default-deny). Emits `LimitRemoved`. |
| `grantSession(address key, bytes32 scope, uint256 maxPerTx, uint256 expiresInSeconds)` | owner only | Registers a session key: allowed category scope, per-tx cap, expiry (max 7 days), not revoked. Emits `SessionGranted`. |
| `revokeSession(address key)` | owner only | Instant revoke, effective in the same block for subsequent calls. Emits `SessionRevoked`. |
| `pay(address recipient, uint256 amount, bytes32 category)` | owner OR active session key | **The guarded payment.** Checks in order: (1) caller is owner or a live session key (not expired, not revoked, scope matches category); (2) recipient has an active limit; (3) `amount ≤ perTx`; (4) `amount ≤ perDay - spentToday`; (5) `amount ≤ perWeek - spentThisWeek`; (6) guard balance ≥ amount. Then transfers tUSD8, updates spend windows, appends audit receipt, emits `Payment`. Reverts with a specific error naming the failed rule (`OverPerTxCap`, `OverDailyCap`, `OverWeeklyCap`, `SessionExpired`, `SessionRevoked`, `ScopeMismatch`, `NoActiveLimit`, `InsufficientGuardBalance`). |
| `withdraw(uint256 amount, address to)` | owner only | Emergency owner withdrawal (e.g. wind-down). Emits `Withdrawn`. |
| `verifyChain(bytes32[] calldata receiptHashes)` | view, anyone | Recomputes the hash chain over supplied receipt hashes; returns `(bool ok, uint256 failedIndex)`. UI calls this for the one-click chain check. |
| `getLimit / getSession / getSpent / receiptHash(uint256)` | view | Read helpers for the UI pre-check line and the audit trail. |

### 3.3 Events (the audit trail)

`Funded`, `LimitSet`, `LimitRemoved`, `SessionGranted`, `SessionRevoked`, `Payment`, `Withdrawn` — every event carries: `auditNonce`, `prevReceiptHash`, `receiptHash = keccak256(prevHash ‖ nonce ‖ action ‖ actor ‖ recipient ‖ amount ‖ category ‖ block.timestamp)`, plus the action's own fields. The UI rebuilds the chain from events and verifies it with `verifyChain`. Each receipt card links its tx hash to the Aevum explorer (URL confirmed at window start).

### 3.4 Security notes

- Checks-Effects-Interactions + `nonReentrant` on `pay`/`fund`/`withdraw`; `SafeERC20` for the tUSD8 transfer (non-standard return values).
- Default-deny: no limit ⇒ no payment; no session ⇒ no delegated payment; expired/revoked ⇒ revert.
- Owner-only limit changes: a session key can never raise its own cap (matches the Safe-module lesson).
- No `selfdestruct`, no upgrade proxy in v1 (simplicity = auditability for a 3-week build); document as a known limitation + mainnet roadmap item.
- Testnet-only: no real value; contract comments state this.

## 4. UI (Next.js, single page — see design constitution for visuals)

Sections in order: 1 Guard (hero: balance, spend-vs-cap, key health) · 2 Limits · 3 Session keys · 4 Pay · 5 Audit trail. Stack: Next.js (App Router) + ethers.js v6 (or viem — decide at window start from the starter kit's stack; do not pre-commit). Wallet: MetaMask via `wallet_addEthereumChain` for 44005 with a hard wrong-network warning. All amounts formatted with the confirmed tUSD8 decimals.

## 5. Judging-criteria mapping (official criteria §1–§8)

| Criterion | How Aevum Guard answers it | Evidence in submission |
|---|---|---|
| §1 UX + presentation | One-page ledger; first-time flow < 3 min; plain-language errors naming the exact rule; responsive + reduced-motion | Live demo + video |
| §2 Demo clear + structured | End-to-end: fund → limit → session key → pay → receipt; every step shows tx hash + explorer link; "try to overspend" negative demo | Video (60–90s) + README walkthrough |
| §3 Documentation | README with architecture diagram, env vars, testnet addresses, step-by-step reproduction; this spec file | README + docs/ |
| §4 Innovation | Guarded-payment primitive for agent commerce: session keys + caps + hash-chained receipts in one purpose-built contract (not a generic multisig clone) | README "why not just a multisig" section |
| §5 Technical quality + platform integration | Native Aevum/EVM integration; **scoped session keys, spending limits, smart-account-style guard** — the exact primitives §5 names | Contract + verified source |
| §6 Real-world utility | Treasurer + AI-agent-owner use cases; path to mainnet (Feb 2027 launch) + fast-track builder program | README roadmap |
| §7 Safety, trust, controls | **Least-privilege sessions, expiry, spend caps, instant revoke, verifiable on-chain audit trail** — the exact §7 checklist; default-deny; owner-only cap changes | Contract events + verify-chain feature + §7 checklist in README |
| §8 Ecosystem contribution | MIT-licensed, modular single-contract + reusable UI components; documented for other builders | Public repo, LICENSE, reusable `AevumGuard.sol` |

## 6. What is NOT in scope for v1 (say so in the README)

Multi-sig owners, ERC-8004 identity attestations (optional stretch only), fiat on/off-ramps, recurring/subscription payments, cross-chain. Each is a roadmap line, not a hidden gap.
