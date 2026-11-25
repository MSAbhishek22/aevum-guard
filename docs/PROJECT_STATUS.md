# Aevum Builder Challenge #1 — Aevum Guard

**Project:** Aevum Guard — a guarded stablecoin-payment app on the Aevum testnet.
**Entrant:** M S Abhishek (GitHub `MSAbhishek22`, msabhishekbdps@gmail.com, Shobhit University Meerut, BTech CSE 7th sem). Solo.
**Status (16 Nov 2026, 13:33 IST): PREPARATION COMPLETE — build window OPEN since 11:30 IST today. No production code written yet (window-gated). No repo created. No submission filed. Awaiting the user's 3 start taps: DoraHacks solo registration + starter kit, public repo `MSAbhishek22/aevum-guard`, MetaMask wallet address.**

## Step 0 — Event verification (official page, fetched 12 Nov 2026)

Source: https://dorahacks.io/hackathon/qday/detail (page crawled 11 Nov 2026 07:32 UTC; read in full, 141 lines).

| Fact | Verified value |
|---|---|
| Edition / year | Aevum Builder Challenge #1, 2026 — event window listed as 2026-11-04 → 2026-12-11 |
| Prize | **$1,500 USDT total: 1st $800 / 2nd $500 / 3rd $200.** An aggregator once said $2,000 — official page wins, $1,500 is correct. |
| Registration opens + starter kit | **Mon 16 Nov 2026, 14:00 HKT = 06:00 UTC = 11:30 IST** |
| Build period | **16 Nov – 11 Dec 2026** |
| Submissions close | **Fri 11 Dec 2026, 16:00 HKT = 08:00 UTC = 13:30 IST** |
| Judging | 12–14 Dec 2026 |
| Demo Day | Top 5, Mon 15 Dec 2026, 14:00 HKT (06:00 UTC = 11:30 IST) |
| Team | **Solo developers or teams of 2–4** — solo allowed |
| Cost / format / scope | **Free, online, worldwide** ("free, online hackathon for developers worldwide") |
| Chain | **Aevum testnet only, tUSD8, test tokens only, no tokens issued or promised** |
| Deliverables | Public GitHub repo; smart contract + simple UI/script; verified source; live demo or Docker image; short demo; docs |
| ERC-8004 | Listed as an **EXAMPLE** of QDay-infra evidence ("such as smart contracts, ERC-8004, QDay dapps") — **not mandatory** |
| Fast track | Winners/participants earn fast track into the mainnet builder program ahead of QDay mainnet launch in February |

### Build-window rule — exact wording (Eligibility → Build Constraints)

> "All code must be developed during the build window. All smart contracts must run on the Aevum testnet with test tokens only (no tokens are issued or promised)."

**Consequence:** today is Thu 12 Nov 2026; the window opens Mon 16 Nov 11:30 IST — 4 days away. **No production code has been written in this task.** All work below is verification, design, specification, test planning and submission-pack preparation, which is the only compliant work possible before the window opens.

### Judging criteria — spending limits, session keys, audit trails (§5 + §7, quoted)

- §5 Technical quality: "Deep, correct adoption of native platform tooling, including **smart accounts, scoped session keys, spending limits, and identity primitives**."
- §7 Safety, trust and controls: "Strict adherence to **least-privilege permissions, session expiration, and spend caps** to guard against compromised keys, runaway spending, or prompt injection" and "Clear transaction review and approval steps, **instant revocation mechanisms**, full user data privacy, and **verifiable on-chain audit trails**."
- Also §2: "verifiable on-chain activity, including visible transaction hashes, explorer links, and verifiable state changes."

The Aevum Guard concept maps 1:1 onto §5 + §7 (see `docs/ARCHITECTURE_AND_CONTRACT_SPEC.md`).

### Testnet facts (official QDay sources)

- Network: **QDay Aevum testnet, chain ID 44005**, RPC `https://rpc-test.qday.info`, native currency **tQDAY, 18 decimals**. Source: https://qday.io/official-links (last verified 10 Nov 2026).
- **tUSD8** (QDay's USD-pegged stablecoin on Aevum): `0x456569838f1d43009A91ebA4263147Afd7233483`. Source: same page.
- **QDayFaucet**: `0xE5074CBbd046AFb491EB8692abD6cF7ECCC6dEE5`. First claim via https://faucet.qday.info (covers gas for a zero-balance wallet); in-wiki widget thereafter (per-address cooldown, EOA only). Source: https://qday.io/official-links + https://pqalabs.medium.com/aevum-testnet-how-do-i-get-started-qday-4dd0a6d64a34 (16 Oct 2026).
- Aevum is EVM-compatible: Solidity, MetaMask, Remix, Foundry, Hardhat, ethers.js, viem, wagmi all work; EIP-1559 gas. Do NOT confuse chain IDs: 44001 = original mainnet, 44003 = original testnet, **44005 = Aevum testnet**.
- **Aevum block explorer — CONFIRMED 16 Nov 2026 ~13:33 IST:** `https://explorer-test.qday.info` — linked from the official QDay addresses page (https://qday.io/official-links, crawled 16 Nov 08:02 UTC) on both the QDayFaucet and tUSD8 rows, and the tUSD8 address page loads there. Use it for tx hashes / verified source in the submission.
- **Not yet confirmed from an official source:** tUSD8 decimals (expected 6 or 18 — verify by reading the token contract on the explorer at window start; a direct RPC `eth_call` for `decimals()` was blocked in this preparation environment, so do NOT assume a value), and the starter-kit contents (kit releases with registration on 16 Nov — see `docs/STARTER_KIT_RESEARCH.md`). None of these blocks design/spec work.

## Verdict

**GO — with a hard start date.** Event is real, free, solo-eligible, testnet-only, 2026 edition. Nothing fails. Work may start **Mon 16 Nov 2026, 11:30 IST** (see `docs/START_OF_WINDOW_CHECKLIST.md`).

## Files in this folder

| File | What it is |
|---|---|
| `README.md` (this file) | Verification + status + release card |
| `design/DESIGN_CONSTITUTION.md` | Visual identity, palette, type, motion, 3D concept |
| `design/PROJECT_DESIGN_REGISTRY.md` | Comparison vs NyayaSeal / YojanaSetu / CageCheck |
| `design/RESEARCH_REFERENCES.md` | 5 grounded design + product references |
| `docs/ARCHITECTURE_AND_CONTRACT_SPEC.md` | System design + full contract function spec + judging-criteria mapping |
| `docs/TEST_PLAN.md` | Unit / integration / E2E / manual test plan (to run in-window) |
| `docs/STARTER_KIT_RESEARCH.md` | What is known / not yet public about the starter kit |
| `docs/START_OF_WINDOW_CHECKLIST.md` | Ordered first commands for 16 Nov 11:30 IST |
| `qa/INTERACTION_INVENTORY.md` | Planned control inventory (all PLANNED — nothing built yet) |
| `submission/SUBMISSION_PACK.md` | Submission-pack draft: filled vs still needed, deadline |

## Release card (rulebook §10) — as of 12 Nov 2026

| Deliverable | Evidence / status |
|---|---|
| Project identity | Aevum Guard — guarded tUSD8 payments: per-recipient/category spending limits, scoped session keys, on-chain audit trail. Solo, M S Abhishek. |
| Research | This README + `design/RESEARCH_REFERENCES.md` (official pages + inspected live fleet sites) |
| Live application | **NOT DEPLOYED — BLOCKED on build window (opens 16 Nov 11:30 IST).** No code exists to deploy. |
| GitHub | Repo name **`aevum-guard` checked free** for user MSAbhishek22 (GitHub search `aevum-guard user:MSAbhishek22` returned 0 results, 12 Nov 2026). Repo **NOT created** — creation is via parent's live browser (connector repo creation returns 403, known). No commit SHA exists. |
| Deployment | N/A yet — deploy-ready plan in `docs/START_OF_WINDOW_CHECKLIST.md`. Vercel CLI exists in sandbox but has no auth; deploy attempt only in-window, non-interactively. |
| UI quality | `design/DESIGN_CONSTITUTION.md` + registry comparison done; screenshots N/A (no UI built yet) |
| 3D experience | Specified: spatial audit-trail "ledger spine" (see constitution §9). Not built — window-gated. |
| Functional controls | `qa/INTERACTION_INVENTORY.md` — planned inventory only, all PLANNED |
| QA | `docs/TEST_PLAN.md` written; **0 tests run (no code)** — test receipt will exist only after 16 Nov |
| Demo video | **None.** No live product exists. No local draft (no running local app). YouTube-ready title + description drafted in `submission/SUBMISSION_PACK.md`. Video must be recorded from the LIVE product in-window. |
| Published video | BLOCKED — nothing to publish |
| Submission | Draft in `submission/SUBMISSION_PACK.md`. Deadline **Fri 11 Dec 2026, 13:30 IST**. Nothing filed. |

**Gate summary:** A (Research + design) — PASS (verification + constitution + registry + spec). B–G — **BLOCKED on the build-window rule**, not on effort. Overall: **IN_PROGRESS (preparation complete; build gated to 16 Nov 11:30 IST).**

**Needed inputs (not blockers for prep):** user's MetaMask wallet address (recoverable only from his MetaMask app — never invented; needed at deploy/faucet time); starter kit (16 Nov); tUSD8 decimals + explorer URL (confirm 16 Nov).
