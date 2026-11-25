# Aevum Testnet Token Alternatives — Faucet Research

**Date:** 17 Nov 2026 (state read on-chain ~10:25–10:35 IST)
**Problem:** faucet.qday.info refuses claims for deployer `0x7A0b8936322EC4409cCEe5c4C3989CD151f689d0` because it holds no ETH/USDT/USDC on Ethereum mainnet. Funding mainnet is **forbidden** (user's free-only rule).
**Verified on-chain today (RPC `https://rpc-test.qday.info`):** deployer holds **0 tQDAY** and **0 tUSD8**. A solution must deliver BOTH tQDAY (gas) and tUSD8 (the token AevumGuard integrates).

## Headline verdict

1. **The mainnet-balance gate is the faucet WEBSITE's policy, not the contract's rule.** The on-chain QDayFaucet has no mainnet check (a chain-44005 contract cannot read Ethereum mainnet balances) — its only rules are a 24h cooldown + EOA-only. **But the contract is currently PAUSED and holds 0 tQDAY**, so the direct on-chain route cannot pay out today either. Both facts verified on-chain (details below).
2. **Best immediate route for gas:** the third-party ZalalenA faucet (no balance requirement, captcha only) — unofficial, verify before use.
3. **Best route for tUSD8:** there is **no on-chain tUSD8 faucet**. Ask the organisers (support@qday.io / official Telegram / DoraHacks) for a builder grant, or receive a peer transfer. No documented builder airdrop programme exists anywhere in the official resources.

---

## 1. On-chain audit of the faucet contract — `0xE5074CBbd046AFb491EB8692abD6cF7ECCC6dEE5`

The contract is **not verified** on explorer-test.qday.info (the Blockscout API returns no source code and no ABI — only bytecode). Functions below were identified from the deployed bytecode's dispatcher selectors, resolved via the 4byte signature directory, and the state values were read directly via `eth_call` on 17 Nov 2026.

| Function | Selector | Meaning |
|---|---|---|
| `claim(address)` | `0x1e83409a` | Claim the drip for an address |
| `lastClaim(address)` | `0x5c16e15e` | Last claim timestamp per address |
| `cooldown()` | `0x787a08a6` | **86,400 s = 24 h** (read on-chain) |
| `dripAmount()` | `0x35a1529b` | **5 tQDAY** per claim (read on-chain; matches the website's "Claim 5 tQDAY") |
| `eoaOnly()` | `0xab546bc8` | **true** — contract callers rejected |
| `paused()` | `0x5c975abb` | **true — the faucet is PAUSED right now** |
| `owner()` / `pendingOwner()` / `acceptOwnership()` / `transferOwnership(address)` | — | Standard ownable |
| `setCooldown(uint256)` / `setDripAmount(uint256)` / `setPaused(bool)` / `withdraw(address,uint256)` | — | Owner-only admin |

**Live state, 17 Nov 2026:**
- Contract native balance: **0 tQDAY** (explorer API + `eth_getBalance` agree).
- `paused()` = true; `lastClaim(deployer)` = 0 (he has never claimed).
- Explorer history: a burst of `claim()` calls on 10 Oct 2026 all **errored**, and the owner's most recent call (20 Oct 2026) was `setPaused(bool)`. This is consistent with the team switching distribution to the website backend (which sends from its own wallet after its own eligibility check — that is where the mainnet-balance rule lives).

**Conclusion:** the contract's rules genuinely differ from the website UI (cooldown + EOA only, no mainnet-balance condition — and none is technically possible on-chain without an oracle). But with `paused = true` and a 0 balance, calling `claim()` today would simply revert. Re-check `paused()` and the contract balance before ever relying on this route — the owners can unpause/refill at any time, e.g. for the hackathon window.

Sources: https://explorer-test.qday.info/address/0xE5074CBbd046AFb491EB8692abD6cF7ECCC6dEE5 · RPC reads against https://rpc-test.qday.info · https://www.4byte.directory

## 2. The documented routes (official)

The QDay Wiki names exactly two claim paths, both ultimately the same system:

- **faucet.qday.info** — first claim, gas-covered by the site. This is the site applying the mainnet-balance eligibility check that blocks the deployer. Per the parent agent's browser session, the site offers "Claim 5 tQDAY" and "Claim 1 tUSD8" (24h cooldown) — i.e. **the website is also the only documented source of tUSD8**.
- **The in-docs widget** ("Get testnet tokens" page in the wiki) — calls the faucet contract directly, so it follows the contract rules above; the docs warn a 0-balance wallet cannot pay the gas for its own first claim through it, and right now the contract is paused/empty anyway.

Sources: https://wiki.qday.info/guide/faq (§3.6–3.8) · https://wiki.qday.info/guide/handbook/getting-started/ · https://pqalabs.medium.com/aevum-testnet-how-do-i-get-started-qday-4dd0a6d64a34 · https://qday.io/official-links

## 3. Options, ranked

### Option A — ZalalenA third-party faucet (tQDAY gas only) — TRY FIRST for gas
- **What:** Multi-chain testnet faucet hub; its QDay page offers tQDAY with **"No login • No balance • Instant claim"**, hCaptcha verification, up to 10 claims/day, 60-minute cooldown between claims. Its FAQ explicitly says brand-new zero-balance wallets can claim, and describes the network as "QDay Aevum".
- **Needs the user?** No account and no wallet signature — just the public address + a captcha in a browser session (a captcha is the one step that may need a human present).
- **Caveats (honest):** This is a **third party, NOT a QDay official source** — QDay's official-links page warns that anything not listed there is unofficial. It only ever asks for a public address (never keys/signatures, per its own rules page), which keeps the risk low, but **verify on the claim page that the target network is chain 44005 (Aevum) before submitting** — QDay also has an older testnet (44003, "QDay Origin") and tokens sent on the wrong chain are useless. It dispenses **tQDAY only — no tUSD8**.
- Source: https://faucet.zalalena.com/qday

### Option B — Direct on-chain claim (wiki widget / own script) — BLOCKED TODAY, keep as a re-check
- **What:** Call `claim(0x7A0b…89d0)` on the faucet contract directly (via the wiki widget, Remix, or a script). Contract rules = 24h cooldown + EOA only; no mainnet-balance condition exists in the contract.
- **Why not now:** `paused() = true` and contract balance = 0 (17 Nov). A claim transaction would revert. It also needs gas to send, so it only works *after* some tQDAY has landed (e.g. via Option A) — and even then only if the owners unpause and refill.
- **Needs the user?** Yes — his MetaMask signature (or his deployer key in the deploy script env).
- Sources: contract audit in §1 · https://wiki.qday.info/guide/faq §3.6

### Option C — Ask the organisers for a builder token grant — the tUSD8 route
- **What:** No documented airdrop/airdrop-to-builders programme was found on the DoraHacks challenge page, QDay news, or the wiki (checked 17 Nov). But three official contact routes exist, and "registered Builder Challenge participant blocked by the faucet website's mainnet-balance gate on a fresh wallet" is a legitimate support case:
  - **support@qday.io** (listed on the official-links page)
  - **Official QDay Telegram group** (the docs route bug/support reports there — wiki FAQ §7.6 via the Medium guide)
  - **DoraHacks** hackathon page Q&A / organiser contact for Aevum Builder Challenge #1: https://dorahacks.io/hackathon/qday/detail
- **Needs the user?** No — the parent can draft and send from his accounts; he only supplies the deployer address (already known). Ask for: a one-off grant of tQDAY + tUSD8 to the deployer address, or a waiver/lifting of the website gate for registered builders.
- **Note:** QDay's own safety rules — team members never DM first and never ask for keys; only trust replies through these official channels.

### Option D — Peer transfer from another Aevum user
- **What:** tQDAY and tUSD8 are ordinary transferable assets on chain 44005 — anyone holding them (e.g. another builder in the QDay Telegram/Discord community) can send directly to `0x7A0b…89d0`. On-chain data confirms tUSD8 is actively circulating between user wallets today (17 Nov).
- **Needs the user?** No — just the public address. Pairs naturally with Option C (ask in the same community post).

### Option E — Engineering fallback while tokens are pending (does NOT replace real tUSD8)
- Deploy a self-made mock ERC-20 with the same interface (6 decimals) on Aevum once gas exists, and run AevumGuard's integration tests (§B) against it so development is never blocked. **The final submission evidence (tx hashes, demo) should use the real tUSD8** — the challenge requires building with tUSD8, so treat the mock strictly as a parallel test scaffold, never as the submitted integration.

### Ruled out
- **Testnet bridge:** The wiki's QDay Bridge / Abelian Bridge move *real* assets between QDay Origin mainnet and other chains. That means spending real funds (forbidden) and it does not mint Aevum testnet tokens anyway.
- **DEX swap on Aevum:** No DEX on chain 44005 appears in any official doc, and the deployer holds no Aevum asset to swap from. Dead end.
- **A second official faucet:** None exists — the wiki names only faucet.qday.info + the widget (same contract).
- **Buying/mainnet funding of any kind:** Forbidden by the user's free-only rule; not attempted.

## 4. Recommended sequence

1. **Now (parent, browser):** ZalalenA claim for tQDAY to the deployer address (Option A) — captcha step may need the user present for a minute. Confirm the tokens land on chain 44005 in the explorer.
2. **Same day (parent):** Send the organiser ask (Option C) via support@qday.io + a post in the official Telegram, covering tUSD8 (and tQDAY as backup). This is the only realistic tUSD8 source besides a peer transfer (Option D — same post can ask).
3. **Before deploying:** Re-read `paused()` + faucet contract balance; if the owners unpause/refill for the hackathon window, Option B becomes the clean official route for repeat tQDAY claims.
4. **In parallel (local):** Keep AevumGuard integration testing unblocked with the Option E mock if real tUSD8 has not arrived within a couple of days. Deadline is 11 Dec 13:30 IST — there is time, but the token ask should go out today.

## 5. Sources

- DoraHacks — Aevum Builder Challenge #1: https://dorahacks.io/hackathon/qday/detail
- QDay Wiki FAQ (faucet §3.6, tokens §3.8): https://wiki.qday.info/guide/faq
- QDay Wiki Getting Started: https://wiki.qday.info/guide/handbook/getting-started/
- QDay official links & contract addresses (QDayFaucet, tUSD8): https://qday.io/official-links
- Medium — "Aevum Testnet: How do I get started?" (PQA Labs): https://pqalabs.medium.com/aevum-testnet-how-do-i-get-started-qday-4dd0a6d64a34
- Explorer — faucet contract (address, tx history, balance): https://explorer-test.qday.info/address/0xE5074CBbd046AFb491EB8692abD6cF7ECCC6dEE5
- ZalalenA QDay faucet page: https://faucet.zalalena.com/qday
- On-chain reads (eth_call/eth_getBalance) against https://rpc-test.qday.info, 17 Nov 2026; selectors resolved via https://www.4byte.directory
