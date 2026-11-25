# Test Receipt — Aevum Guard

**Date:** Tue 17 Nov 2026 (build window day 2; window opened 16 Nov 11:30 IST)
**Environment:** Hardhat 2.22.19 + ethers 6, in-process local network, solc 0.8.24 (evm target: paris). Forge was not installed in this environment; Hardhat is the test plan's stated fallback.
**Code:** `~/workspace/hackathons/aevum/build/`

## Commands run

```
npx hardhat compile  → Compiled 2 Solidity files successfully
npx hardhat test     → 24 passing, 0 failing (run twice, same result)
node --check ui/app.js → syntax OK
```

## Results

- **Contract tests (TEST_PLAN §A): 24/24 PASS** — A1–A24 all green, including daily-window rollover (A10), weekly cap across days (A11), session expiry (A16) and revoke (A17), audit-chain verify (A21) + tamper index (A22), and the reentrancy attempt via `ReentrantToken` settling exactly one transfer (A23).
- **Integration tests (§B, Aevum testnet): NOT RUN** — blocked on the user's MetaMask address + faucet funds. See `build/DEPLOY_CHECKLIST.md`.
- **UI E2E (§C, Playwright): NOT RUN** — needs the deployed contract / live UI. The demo UI exists locally (`build/ui/`) with all controls functional in labelled demo mode; JS syntax-checked only.
- **Live-deploy smoke: NOT RUN** — nothing deployed yet.

## Known issues

- Spec deviation (documented in `build/BUILD_LOG.md`): event named `SessionKeyRevoked` instead of `SessionRevoked` — Solidity forbids an error and an event sharing one identifier; the revert error keeps the exact spec name.
- tUSD8 `decimals()` still unconfirmed (contract is decimals-agnostic; UI formatting needs the value at deploy time).
