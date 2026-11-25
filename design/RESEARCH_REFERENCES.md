# Research References — Aevum Guard

Inspected 12 Nov 2026. Rulebook §1.1 requires ≥5 real references: 2 same/related category, 1 exceptional interaction/motion, 1 strong typography/hierarchy, 1 useful 3D/spatial/data-viz. No reference is invented; each was actually read.

## 1. Same category — Safe{Wallet} spending-limits module pattern
- **URL:** https://chainscorelabs.com/guides/cryptocurrency-trading-and-investment/institutional-custody-architecture/how-to-architect-a-multi-signature-treasury-for-institutions (read 12 Nov 2026 via search result; corroborated by https://github.com/mendyedri/agent-pact/blob/HEAD/PLAN.md — session-key + spending-limit smart-wallet plan — and https://stablecoininsider.org/xdc-ai/)
- **Inspected:** How Safe modules/guards implement spending limits (periodic allowances, per-address, module-enforced) and session-key scoping (expiry, function allowlist, per-tx + rolling caps, instant revoke).
- **Learn from:** the module/guard split — policy lives in a separate contract the wallet cannot switch off; per-period caps (minute/hour/day/week/month); limit-0 = paused agent; raising a limit requires the owner, never the session key.
- **Do NOT copy:** Safe's multisig-threshold UX (Aevum Guard is solo-owner + session keys, not M-of-N); Safe's dense institutional dashboard chrome.
- **Translation:** AevumGuard contract mirrors the module pattern in one contract (limits + session keys + audit events); UI copies the "cap as a row with period + remaining" presentation, not Safe's layout.

## 2. Same category — QDay Wiki / Aevum testnet developer docs
- **URL:** https://wiki.qday.info/ and https://pqalabs.medium.com/aevum-testnet-how-do-i-get-started-qday-4dd0a6d64a34 (read 12 Nov 2026)
- **Inspected:** Chain params (44005, rpc-test.qday.info), faucet flow (faucet.qday.info for first claim, in-wiki widget after), tUSD8 + faucet contract addresses, EIP-1559 gas, "check chain ID before you sign" warning pattern, Remix/Foundry/Hardhat quickstarts.
- **Learn from:** the docs' blunt safety voice ("If your wallet shows a chain ID other than 44005, stop") — plain-language error handling is a judging criterion (§1, §7).
- **Do NOT copy:** Wiki IA (docs site, not a product UI).
- **Translation:** Aevum Guard's network badge + wrong-network hard warning copies this voice verbatim in spirit; the README's reproduction steps follow the wiki's step order (add network → faucet → deploy → verify).

## 3. Exceptional interaction/motion — NyayaSeal tamper demo + 3D stack
- **URL:** https://nyayaseal.vercel.app (read live 12 Nov 2026)
- **Inspected:** "Tamper demo" — flip exactly one character, re-run the check, watch a genuine hash mismatch produce TAMPERED; draggable 3D stack of sealed records; low-motion flat-grid fallback.
- **Learn from:** a demo that *proves* the claim with one interaction instead of describing it; the honest "what is real / what is a stub" disclosure block; drag-to-rotate with a flat fallback.
- **Do NOT copy:** the card-stack visual itself, or the numbered-section editorial layout.
- **Translation:** Aevum Guard's equivalent proof-interaction is "Try to overspend": set a 10 tUSD8 daily cap, attempt an 11 tUSD8 payment, watch the contract reject it on-chain with the exact rule named — plus the "Verify chain" one-click hash-chain re-check. Same proof-by-interaction, different mechanic.

## 4. Strong typography / hierarchy — YojanaSetu officer dashboard
- **URL:** https://yojanasetu-self.vercel.app (read live 12 Nov 2026)
- **Inspected:** Dense data hierarchy (totals → district map → scheme breakdowns → lookup → flags → trace), "Try: YS-1001 · Ramesh Singh" seeded examples, every flag showing its evidence, PASS/FAIL/UNKNOWN rule traces with source records.
- **Learn from:** evidence-first presentation (every verdict shows the record it was read from); seeded try-values so a first-time user can act in seconds; keyboard/rotation rules stated in-line.
- **Do NOT copy:** the multi-panel dashboard grid or the government-register visual language.
- **Translation:** Aevum Guard's pay form shows its pre-check evidence the same way ("Within daily cap · 12.40 / 50 remaining — rule: daily cap, recipient Groceries"); receipts show the rule that allowed/blocked them; seeded demo values (10 tUSD8 cap, sample recipient) are labelled SAMPLE.

## 5. Useful 3D / spatial / data-viz — YojanaSetu 3D district map (and NyayaSeal stack)
- **URL:** https://yojanasetu-self.vercel.app (read live 12 Nov 2026)
- **Inspected:** Block height = enrolment volume; drag/Alt+←/→ rotate ±20°; "Reset view"; "Flat map" 2D switch; rotation off on touch so scroll is never hijacked; plain 2D list for screen readers and reduced-motion users.
- **Learn from:** the fallback discipline — the 3D view is never the only way to read the data; touch and reduced-motion users get the flat equivalent automatically; rotation is bounded (±20°, not free-spin).
- **Do NOT copy:** the bar-map itself (wrong metaphor for payments).
- **Translation:** Aevum Guard's Ledger Spine adopts the same contract: bounded depth walk (not free spin), "Flat ledger" toggle, touch → flat automatically, screen-reader table always present in the DOM.

## Category-adjacent note (not counted as a reference)
- CageCheck (https://cagecheck.vercel.app, read live 12 Nov 2026): the "receipt you can quote back" pattern and the terse spec-list hero informed the receipt-card copy and the honest-capability block ("What is real / what is a stub") that Aevum Guard's README will carry. Its dark terminal look was deliberately NOT reused.
