# Start-of-Window Checklist — Mon 16 Nov 2026, 11:30 IST

**Trigger:** 16 Nov 2026, 14:00 HKT = 06:00 UTC = **11:30 IST**. Registration opens and the starter kit releases at this moment. Do not write production code before it.

## Phase 0 — Register + get the kit (11:30–12:00 IST)

1. Open https://dorahacks.io/hackathon/qday/detail — confirm registration is open; register as **solo, M S Abhishek** (GitHub MSAbhishek22, msabhishekbdps@gmail.com). Record the registration confirmation (screenshot + text).
2. Download/clone the starter kit. Read its README in full. Record: stack (Foundry vs Hardhat), tUSD8 ABI/decimals if included, any ERC-8004/session-key helpers, deploy + verify steps.
3. Check the QDay Wiki chain-parameters page for the **Aevum explorer URL**; record it. Read tUSD8 `decimals()` (via explorer or a cast/ethers call) — record the value; all amount math depends on it.
4. Create the GitHub repo **`aevum-guard`** (parent's live browser — connector repo creation returns 403, known). Public, MIT licence, README stub. Verify it exists via `list_commits` / repo page before pushing anything.

## Phase 1 — Wallet + testnet setup (12:00–12:30 IST)

5. **User input needed:** MetaMask wallet address — copy it from the user's MetaMask app (never invented). Add Aevum testnet to MetaMask (chain ID 44005, RPC https://rpc-test.qday.info, currency tQDAY).
6. First faucet claim at https://faucet.qday.info (covers gas for a zero-balance wallet). Confirm tQDAY balance on the explorer. Then claim tUSD8 per the kit/wiki instructions; confirm balance.
7. Sanity check: send a tiny tUSD8 transfer on testnet; confirm the tx hash on the explorer. If the explorer URL is still unknown, use the RPC + a cast call to confirm.

## Phase 2 — Scaffold from the kit (12:30–14:00 IST)

8. Scaffold the project in `~/workspace/hackathons/aevum/aevum-guard/` from the starter kit (do not fight the kit's stack). Adopt its Foundry/Hardhat + ethers/viem choices.
9. Write `AevumGuard.sol` per `docs/ARCHITECTURE_AND_CONTRACT_SPEC.md` §3. No deviations without noting them in the spec file.
10. Write contract tests per `docs/TEST_PLAN.md` §A. Run them: `forge test` (or Hardhat equivalent). **Gate: all §A tests pass before any UI work.**

## Phase 3 — Deploy + verify (14:00–15:30 IST)

11. Deploy to Aevum testnet (44005) from the deployer wallet. Record contract address + deploy tx hash.
12. Verify source on the Aevum explorer. Record the verification link.
13. Fund the guard with test tUSD8; run test-plan §B integration checks on-chain; record tx hashes.

## Phase 4 — UI + 3D (15:30 IST onwards, days 1–3)

14. Build the Next.js single page per `design/DESIGN_CONSTITUTION.md` (5 sections, Ledger Spine, CSS-3D spine + flat fallback). Every control from `qa/INTERACTION_INVENTORY.md` must work or be removed.
15. Wire wallet connect (MetaMask, 44005 guard + wrong-network warning), limits, session keys, pay form with live pre-check, audit trail with one-click chain verify.
16. Run E2E (test-plan §C) + manual QA (§D). Record `qa/TEST_RECEIPT.md` with exact counts.

## Phase 5 — Ship (by 9 Dec, ahead of the 11 Dec 13:30 IST deadline)

17. Push to GitHub (`aevum-guard`, main); verify head SHA with `list_commits`.
18. Deploy UI to Vercel (non-interactive CLI attempt; if auth is required, deploy via the parent's browser-connected Vercel flow — do not create accounts in the sandbox). Smoke-test the LIVE URL end-to-end from a fresh session.
19. Record the demo video (60–90s) from the LIVE URL: fund → limit → session key → pay → receipt → overspend rejection → verify chain. Publish to YouTube (user-approved) and verify the URL by reading the page back.
20. Fill the DoraHacks submission (repo link, contract address + verified source, live demo URL, docs, video) and submit **no later than 10 Dec** (buffer before the 11 Dec 13:30 IST hard close). Record the submission confirmation.

## Hard stops (do not proceed past these)

- If the starter kit contradicts this spec (different token, different chain, mandatory ERC-8004), STOP, re-read the kit, update the spec, and report the change before writing code.
- If any step asks for a card, payment, mainnet, or real funds — STOP and report. Free-only, testnet-only.
- If the wallet address is unavailable, Phases 2–3 can still proceed with a fresh test-only wallet ONLY if the user approves that in the window (his MetaMask address is preferred; a throwaway testnet-only key is acceptable for testnet, never for mainnet, and must be labelled as such).
