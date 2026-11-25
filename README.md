# Aevum Guard

Guarded stablecoin payments on the **QDay Aevum testnet (chain 44005)**: the owner
sets per-recipient spending limits, grants scoped session keys that expire and can
be revoked instantly, and every action lands in a **hash-chained on-chain audit
trail**. A payment can only happen if a rule the owner wrote allows it — and every
payment leaves verifiable proof.

Built solo by **M S Abhishek** for the **Aevum Builder Challenge #1** (DoraHacks,
$1,500 USDT, submissions close **11 Dec 2026, 13:30 IST**). Testnet only — tUSD8
test tokens, no real value.

## Why not just a multisig?

A multisig controls *who* can sign; Aevum Guard controls *what a payment is allowed
to be*: per-recipient per-tx / daily / weekly caps, per-category session scopes,
expiry, instant revocation, and a receipt chain a third party can verify with one
`verifyChain` call. It is the guarded-payment primitive for treasurers and for
humans who let an AI agent spend on their behalf.

## Contract — `contracts/AevumGuard.sol`

Solidity ^0.8.24, no external imports (Ownable / ReentrancyGuard / SafeERC20
semantics implemented inline, same revert names). Functions:

| Function | Who | What |
|---|---|---|
| `fund(amount)` | owner | Move tUSD8 into the guard (approve first) |
| `setLimit(recipient, perTx, perDay, perWeek, category)` | owner | Caps; `perTx ≤ perDay ≤ perWeek`; all-zero pauses |
| `removeLimit(recipient)` | owner | Default-deny: payments to them revert |
| `grantSession(key, scope, maxPerTx, expiresInSeconds)` | owner | Scoped key, max 7-day expiry |
| `revokeSession(key)` | owner | Instant revoke, same block |
| `pay(recipient, amount, category)` | owner or live session key | The guarded payment (checks below) |
| `withdraw(amount, to)` | owner | Emergency withdrawal |
| `verifyChain(receiptHashes)` | anyone | Recomputes the hash chain → `(ok, failedIndex)` |
| `getLimit / getSession / getSpent / receiptHash(nonce)` | anyone | Read helpers for the UI |

`pay` checks, in order, each reverting with the exact rule name: caller is owner or
a live session key (`NotOwnerOrSession`, `SessionRevoked`, `SessionExpired`,
`ScopeMismatch`, session cap `OverPerTxCap`) → recipient has an active limit
(`NoActiveLimit`) → `OverPerTxCap` → `OverDailyCap` → `OverWeeklyCap` →
`InsufficientGuardBalance`. Zero amounts revert `ZeroAmount`.

Every state-changing action appends a receipt:
`receiptHash = keccak256(prevHash ‖ nonce ‖ action ‖ actor ‖ recipient ‖ amount ‖ category ‖ timestamp)`,
emitted with the action's event (`Funded`, `LimitSet`, `LimitRemoved`,
`SessionGranted`, `SessionKeyRevoked`, `Payment`, `Withdrawn`).

> Documented deviation: the prep spec named both an error and an event
> `SessionRevoked`; Solidity forbids an error and an event sharing one identifier,
> so the **event** is `SessionKeyRevoked` while the **revert error** keeps the exact
> spec name `SessionRevoked`.

## Tests

TEST_PLAN §A implemented in full — **24/24 PASS** (17 Nov 2026, Hardhat, local):

```
npx hardhat compile
npx hardhat test
```

Covers caps (per-tx/daily/weekly + window rollover), session scope/expiry/revoke,
owner-only guards, audit-chain verify + tamper detection, a reentrancy attempt via
a malicious token mock (single transfer settles), and zero-amount rejection.
Integration tests (§B, on testnet) and UI E2E (§C) run after deploy — see
`DEPLOY_CHECKLIST.md`.

## Demo UI — `ui/`

Static Ledger Spine demo (design: bone ledger paper + ink, CSS-3D receipt spine
with a flat-table fallback, `prefers-reduced-motion` respected). It mirrors the
contract rules client-side in a clearly labelled local demo mode — no chain calls
until the testnet deploy wires it to the deployed contract. Open `ui/index.html`.

## Testnet facts

- Chain: Aevum testnet **44005** · RPC `https://rpc-test.qday.info` · Explorer `https://explorer-test.qday.info`
- tUSD8: `0x456569838f1d43009A91ebA4263147Afd7233483` (decimals to confirm on-chain at deploy — the contract is decimals-agnostic)
- Faucet: `0xE5074CBbd046AFb491EB8692abD6cF7ECCC6dEE5` · https://faucet.qday.info
- Contract address: **NOT DEPLOYED YET** — blocked only on the user's MetaMask address (see `DEPLOY_CHECKLIST.md`)

## Not in scope for v1

Multi-sig owners, ERC-8004 attestations (optional stretch), fiat ramps, recurring
payments, cross-chain, upgrade proxies (simplicity = auditability; mainnet roadmap).

## Release status (rulebook §10)

`OVERALL_RELEASE: IN_PROGRESS` — Gates A–D pass locally (research/design done in
prep; contract + 24/24 tests + demo UI built 17 Nov 2026). Gate E (deploy) BLOCKED
on the user's MetaMask address. Gates F–G pending deploy.

MIT licence.
