# Starter-Kit Research — Aevum Builder Challenge #1

**Date:** 12 Nov 2026. **Finding: the starter kit is NOT public yet.**

## What the official page says

From https://dorahacks.io/hackathon/qday/detail (Timeline):

> "16 Nov, 14:00 HKT (06:00 UTC): Registration opens; starter kit released."

Registration and the kit release are the same moment: **Mon 16 Nov 2026, 11:30 IST**. There is no kit link, repo, or download on the DoraHacks page today, and no kit content is described anywhere on the page.

## What was checked (12 Nov 2026)

| Source checked | Result |
|---|---|
| DoraHacks detail page (full read) | No kit link; only the release date above |
| QDay news page (https://qday.io/news) | Challenge announcement (4 Nov 2026) confirms "$1,500 in USDT prizes… ship one working stablecoin payment flow with tUSD8 between Nov 16 and Dec 11" — no kit contents |
| QDay Wiki (https://wiki.qday.info/) | Developer docs exist (chain params, RPC, dApp quickstart) but no challenge-specific starter kit |
| Medium guide (https://pqalabs.medium.com/aevum-testnet-how-do-i-get-started-qday-4dd0a6d64a34) | Testnet onboarding only (wallet, faucet, Remix/Foundry/Hardhat deploy) — no kit |
| Web search "QDay Aevum testnet docs starter kit" | No starter-kit repo or contents surfaced |

## What the kit most plausibly contains (inference — NOT verified, do not build against it)

Based on the challenge requirements (contract + simple UI/script + verified source + live demo/Docker) and the wiki's quickstarts, a typical kit would contain: a Foundry or Hardhat scaffold pre-configured for chain 44005 + RPC `https://rpc-test.qday.info`; tUSD8 address/ABI; faucet instructions; a minimal UI or script example; deployment + verification steps. **Treat this as a guess until 16 Nov.** The window-start checklist's first job is to read the actual kit and adopt its stack (Foundry vs Hardhat, ethers vs viem) rather than fighting it.

## What is already known without the kit (verified, usable for the spec)

- Chain 44005, RPC `https://rpc-test.qday.info`, native tQDAY (18 decimals) — https://qday.io/official-links
- tUSD8 `0x456569838f1d43009A91ebA4263147Afd7233483`; QDayFaucet `0xE5074CBbd046AFb491EB8692abD6cF7ECCC6dEE5` — same page
- Faucet: https://faucet.qday.info for the first (gas-covered) claim; in-wiki widget after; per-address cooldown; EOA only — Medium guide
- EVM-compatible: Solidity, MetaMask, Remix, Foundry, Hardhat, ethers.js, viem, wagmi — Medium guide + wiki
- Submission needs: public GitHub repo, verified source, live demo or Docker image, docs, demo — DoraHacks page

## Still unknown until 16 Nov (do not guess in code)

1. Starter-kit repo URL + contents + stack (Foundry vs Hardhat).
2. tUSD8 decimals (read `decimals()` on-chain at window start).
3. Aevum block-explorer URL (for verified source + tx links; the wiki's "Chain parameters" page is the authority — check it first).
4. Whether the kit includes ERC-8004 / session-key / smart-account helpers (if yes, adopt; if no, build the spec'd contract as written).
5. DoraHacks submission-page fields (exact form; check after registration opens).

**Action:** re-check the DoraHacks page + QDay channels at 16 Nov 11:30 IST as step 1 of the start-of-window checklist.
