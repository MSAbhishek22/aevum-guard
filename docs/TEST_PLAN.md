# Test Plan — Aevum Guard

**Status:** PLAN ONLY (12 Nov 2026). Zero tests run — no code exists yet (build window opens 16 Nov 11:30 IST). Run this plan in-window; record the receipt in `qa/TEST_RECEIPT.md` with exact commands and counts.

## Stack (to confirm at window start from the starter kit)

- Contract tests: Foundry (`forge test`) preferred (fast, no node needed); fallback Hardhat + ethers if the kit is Hardhat-based.
- UI tests: Vitest (component) + Playwright (E2E, critical journeys only).
- Target: contract tests ≥ 20 cases, all passing; E2E ≥ 5 journeys, all passing; 0 console errors on the live deploy.

## A. Contract unit tests (Foundry/Hardhat, local + Aevum testnet fork where possible)

| # | Case | Expected |
|---|---|---|
| A1 | Deploy with tUSD8 address; owner = deployer | `token()` correct, `owner()` = deployer |
| A2 | `fund()` without prior `approve` | Reverts |
| A3 | `fund()` with approval | Guard balance increases; `Funded` emitted |
| A4 | `setLimit` by non-owner | Reverts (`OwnableUnauthorizedAccount`) |
| A5 | `setLimit` with perTx > perDay | Reverts (ordering invariant) |
| A6 | `setLimit` all-zero | Recipient paused (payments revert) |
| A7 | `pay` to recipient with no limit | Reverts `NoActiveLimit` |
| A8 | `pay` over per-tx cap | Reverts `OverPerTxCap` (exact rule named) |
| A9 | Two pays inside daily cap, third exceeding it | First two succeed, third reverts `OverDailyCap` |
| A10 | Daily window rolls over after 24h | `spentToday` resets; payment succeeds again |
| A11 | Weekly cap enforced across days | Reverts `OverWeeklyCap` |
| A12 | `grantSession` by non-owner | Reverts |
| A13 | Session key pays within scope + cap | Succeeds; `Payment` emitted with session actor |
| A14 | Session key pays outside its scope category | Reverts `ScopeMismatch` |
| A15 | Session key pays over its maxPerTx | Reverts `OverPerTxCap` |
| A16 | Session key pays after expiry | Reverts `SessionExpired` |
| A17 | Owner revokes session; key pays after | Reverts `SessionRevoked` |
| A18 | Session key tries `setLimit` / `withdraw` | Reverts (owner-only) |
| A19 | `withdraw` by owner | Funds leave guard; `Withdrawn` emitted |
| A20 | `pay` exceeding guard balance | Reverts `InsufficientGuardBalance` |
| A21 | Audit chain: 5 actions → `verifyChain` | Returns `(true, 0)` |
| A22 | Audit chain: tamper one receipt hash → `verifyChain` | Returns `(false, <tampered index>)` |
| A23 | Reentrancy attempt on `pay` (malicious token mock) | No double-spend; single transfer |
| A24 | Zero-amount `pay` | Reverts (no zero-value receipt spam) |

## B. Integration tests (deployed contract on Aevum testnet, 44005)

| # | Case |
|---|---|
| B1 | Deploy via Foundry/Hardhat to 44005; verify source on the Aevum explorer; record contract address + tx hash |
| B2 | Fund guard with faucet tUSD8 (faucet.qday.info first claim) — record balance |
| B3 | Full happy path on testnet: set limit → grant session → session-key pay → receipt visible in UI + explorer |
| B4 | Negative path on testnet: over-cap pay reverts; UI shows the exact rule + receipt NOT appended |
| B5 | Revoke mid-session: key pays once, owner revokes, same key pays again → reverts |
| B6 | Audit trail rebuilt from events matches `verifyChain` on-chain result |

## C. E2E UI tests (Playwright, against local build then LIVE deploy)

| # | Journey |
|---|---|
| C1 | Connect wallet (mocked provider) → network badge shows "Aevum · 44005"; wrong network (e.g. 1) shows hard warning |
| C2 | Set a limit → pending state → confirmed receipt appears on the spine |
| C3 | Grant session key → key card shows scope chips + countdown → revoke → card struck-through |
| C4 | Pay within cap → pre-check line correct → success receipt with explorer link |
| C5 | Pay over cap → form blocked client-side with the rule named; no tx sent |
| C6 | Audit trail: "Verify chain" → PASS; tamper simulation → FAIL with index |
| C7 | Mobile 390px: no horizontal overflow; bottom tab bar navigates all 5 sections; 3D spine is flat |
| C8 | Reduced motion: flat ledger, no count-up, all actions still work |

## D. Manual QA checklist (record in the test receipt)

- [ ] Desktop 1440px, tablet 820px, mobile 390px — no overflow, no clipped actions
- [ ] Keyboard-only run of the full journey (Tab order, visible focus, Esc closes modals)
- [ ] Console: 0 errors, 0 failed network calls on live deploy
- [ ] Every link resolves (explorer links, repo, docs); no `href="#"`, no dead buttons (see `qa/INTERACTION_INVENTORY.md`)
- [ ] Secret scan: no private keys, no `.env` committed, no wallet address invented
- [ ] Lighthouse (or equivalent) run on the live URL — record actual numbers, don't fabricate

## E. Test receipt format (to fill in-window)

`qa/TEST_RECEIPT.md` will record: date, environment, commands run, contract tests x/y PASS, E2E x/y PASS, live-deploy smoke result, known issues with severity. No counts are claimed here — there is nothing to count yet.
