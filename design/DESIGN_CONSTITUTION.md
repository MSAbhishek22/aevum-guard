# Design Constitution — Aevum Guard

**Project:** Aevum Guard — guarded stablecoin payments on Aevum testnet (tUSD8)
**Date:** 12 Nov 2026 (pre-window design; no code yet)
**Entrant:** M S Abhishek · solo

## 1. Product personality and emotional tone

Aevum Guard is a **vault door, not a casino**. The feeling is calm control: every rupee-equivalent of tUSD8 sits behind a rule the owner wrote, and every movement leaves a receipt. Tone: precise, plain-spoken, slightly severe. No hype copy, no "moon" language, no fake urgency. The user should feel like a treasurer with a ledger, not a trader with a chart.

## 2. Target user and context of use

A solo builder / small-team treasurer (or an AI agent's human owner) who must let money move on-chain without handing over unlimited keys: paying contributors, per-category budgets, an agent that pays per API call. Used on desktop for setup (limits, keys) and on mobile for quick approve/revoke and checking the audit trail. First-time user must complete: connect wallet → set one limit → make one guarded payment → see the receipt, in under 3 minutes.

## 3. Central design idea / visual metaphor

**The Ledger Spine.** The whole app is one vertical spine — a ruled ledger line down the centre of the page — with every action (limit set, key granted, payment, revocation) hanging off it as a dated, hash-chained receipt card. Money flows *along* the spine; rules *guard* the spine. The 3D element is the spine itself rendered in depth (see §9): receipts sit at different depths by recency, and the user can walk the spine.

This is deliberately unlike a card-grid dashboard: there is exactly one column of truth, and everything else (limits, keys) is a control panel docked to its side.

## 4. Colour palette (semantic roles)

Style family: **Cinematic / Film Noir + Swiss Minimalism** (ledger = Swiss grid discipline; noir = vault severity). NOT glassmorphism (NyayaSeal/CageCheck lane), NOT the warm editorial of YojanaSetu.

| Role | Colour | Hex | Use |
|---|---|---|---|
| Paper / background | Bone ledger paper | `#F4F1EA` | Page background (light, paper-like — the ledger) |
| Ink | Near-black ink | `#141412` | Headings, body text, spine |
| Vault green | Approved / within-limit | `#0E6B3A` | Allowed payments, PASS states, healthy limits |
| Alarm red | Blocked / revoked / over-limit | `#B3261E` | Rejections, revocations, danger actions |
| Amber | Pending / expiring soon | `#9A6A00` | Session keys expiring < 1h, pending approvals |
| Rule blue | Informational / links | `#1D4ED8` | Links, explorer hashes, secondary actions |
| Muted grey | Secondary text, rules | `#6B6B66` | Labels, timestamps, helper text |

Dark section: the audit-trail spine section inverts to ink background (`#141412`) with bone text — the "vault interior". One inversion only, used once, for the trail.

## 5. Typography

- **Display / headings:** A condensed grotesque (system stack: "Archivo", "Arial Narrow", sans-serif — no webfont dependency at build; if a font is bundled, Archivo Expanded/Condensed pair). Uppercase, tight tracking, large numerals for amounts.
- **Body / labels:** Inter/system sans, 15–16px, generous line-height. Labels in small caps with letter-spacing (ledger column headers).
- **Mono:** `ui-monospace, "SF Mono", "Cascadia Code", monospace` for ALL addresses, hashes, amounts-with-decimals, and timestamps. Hashes truncated middle (`0x4565…3483`) with copy button; full value on click.
- Type scale: 12 (labels) / 14 (helper) / 16 (body) / 20 (section) / 32 (page) / 56 (hero amount). Amounts are the largest thing on the page.

## 6. Layout grid, spacing, composition

- 12-column grid, max width 1120px, 24px gutters. Single-column spine layout: left rail (320px) = Guard panel (limits + session keys); centre (640px) = the Ledger Spine (payments + receipts); right rail collapses below 1024px into stacked sections.
- Hero is NOT a marketing banner: the hero IS the product — "Guarded balance" amount, today's spend vs daily cap as a ruled bar, and the next expiring session key. One screen, no scroll needed to understand state.
- Spacing: 8px base unit; section gaps 64px; receipt cards 16px padding, 1px ink rule (no shadows, no rounded glass — ruled lines only, like a ledger).
- No card-grid hero, no gradient blobs, no floating orbs.

## 7. Navigation and information architecture

Single page, five anchored sections in order (matches the judging walkthrough):
1. **Guard** (hero: balance, spend-vs-cap, key health)
2. **Limits** (set/edit per-recipient and per-category caps)
3. **Session keys** (grant, scope, expiry, revoke)
4. **Pay** (guarded payment form — the one real action)
5. **Audit trail** (hash-chained receipts, verify chain, explorer links)

Top nav: wordmark "AEVUM GUARD" + anchor links + wallet connect button + network badge (must read "Aevum · 44005" or show a hard warning). Mobile: nav collapses to a bottom tab bar with the same five anchors.

## 8. Component behaviour and interaction patterns

- **Buttons:** rectangular, 1px ink border, uppercase 12px labels. Primary = ink fill, bone text. Danger = red outline. Disabled states state the reason in-line ("Set a limit first").
- **Limit editor:** per-recipient rows with amount + period (per-tx / daily / weekly) + category tag; saving a limit is an on-chain tx with pending → confirmed states and a receipt appended to the spine.
- **Session-key card:** key fingerprint (mono, truncated), scope chips (allowed contracts/functions), expiry countdown, big REVOKE button; expired keys render struck-through automatically.
- **Payment form:** recipient, amount, category; live pre-check line ("Within daily cap · 12.40 / 50 tUSD8 remaining") computed from on-chain state BEFORE submit; over-limit submits are blocked client-side AND rejected on-chain — the UI shows the exact rule that would fire.
- **Receipts:** every on-chain action appends a receipt card to the spine with tx hash (explorer link), block, prev-hash link (hash chain), and status. "Verify chain" button re-hashes the whole trail client-side and reports PASS/FAIL with the failing index.
- **Feedback:** every async action shows pressed → pending (spinner + "waiting for Aevum…") → confirmed (green receipt) or failed (red, plain-language reason + retry). No fake success toasts.
- **Empty states:** "No limits yet — set your first cap" with the action inline; "No payments yet" spine shows a single sample receipt clearly labelled SAMPLE (never fake real history).

## 9. 3D concept — the Ledger Spine in depth

**Why 3D:** the audit trail IS the product's trust story; depth makes recency and chaining legible — newest receipts closest, older ones receding along the spine, each receipt's hash link drawn as a visible thread to the previous one.

**Implementation:** CSS 3D transforms (no WebGL dependency): the spine is a `perspective` scene; receipt cards translateZ by recency; drag / arrow keys walk the spine forward/back; scroll-driven: as the user scrolls the audit section, the spine advances one receipt. A "Flat ledger" toggle renders the same data as a plain 2D table (fallback for reduced motion, touch, low-power, or no-3D support). No Three.js — the effect is depth, not a scene, and must cost almost nothing.

**Fallbacks:** `prefers-reduced-motion` → flat table, no animation. Touch → no drag, buttons + scroll only. If transforms unsupported → table.

## 10. Motion language (≥2 techniques from the palette)

- **Scroll reveal + stagger:** receipt cards reveal in chain order as the spine section enters view (transform + opacity only).
- **Mask reveal / clip-path:** the hero amount counts up with a clip reveal on load; section headings wipe in left-to-right like a ledger rule being drawn.
- **Kinetic type (restrained):** the hero amount only — tabular numerals, no bouncing text elsewhere.
- No particles, no parallax layers, no magnetic hover (a ledger does not wobble). All animation transform/opacity only; off-screen animations paused via IntersectionObserver; low-motion mode toggle in the footer + `prefers-reduced-motion` respected.

## 11. Responsive behaviour

- Desktop ≥1024px: left rail + spine as specified.
- Tablet 640–1023px: rails stack above the spine; spine stays single column.
- Mobile <640px: bottom tab bar; hero amount 40px; receipt cards full-width; 3D spine auto-switches to flat table on touch (rotation/scroll hijack is forbidden — cf. YojanaSetu's touch rule, adopted here).
- No horizontal overflow at 360px; all mono hashes truncate with copy.

## 12. Accessibility and reduced motion

- All form fields labelled; errors announced with `aria-live`; focus visible (2px ink outline); keyboard: Tab order follows spine order, arrow keys walk the 3D spine, Esc closes modals.
- Contrast: ink on bone 15.8:1; green on bone 5.9:1; red on bone 6.1:1 (all ≥ 4.5:1).
- Reduced motion: flat ledger, no count-up, no reveal — content fully usable.

## 13. What this design is NOT (anti-copy list)

- Not NyayaSeal's seal/vault card-stack 3D, not its dark-hero editorial.
- Not YojanaSetu's officer-dashboard multi-panel grid or 3D district map.
- Not CageCheck's dark terminal/cage aesthetic or receipt-list page.
- No glassmorphism, no gradient hero, no floating blobs, no sidebar dashboard template.

## 14. References

See `design/RESEARCH_REFERENCES.md` (inspected 12 Nov 2026).
