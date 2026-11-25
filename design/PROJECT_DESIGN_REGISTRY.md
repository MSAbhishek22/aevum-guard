# Project Design Registry — Aevum Guard comparison

**Rulebook §1.3:** before approving a new design, compare with at least the three most recent fleet projects. Inspected 12 Nov 2026 via live-site reads (browser.open, fresh crawls).

## The three most recent fleet projects (as inspected)

### 1. NyayaSeal — https://nyayaseal.vercel.app
- **Concept/metaphor:** Legal-document sealing; "the hash is the address". Numbered sections 01–05 (Seal / Verify / Vault / Audit / How it works).
- **Palette/typography:** Light editorial, long-form explanatory copy, numbered section markers, serif-flavoured legal tone.
- **Layout/navigation:** Single-page scroll, stacked numbered sections, upload drop-zones, data table (vault), hash-chained audit log.
- **Hero:** Statement headline + explanatory paragraph + live counters (documents sealed / verifications / audit chain).
- **Signature interaction/animation:** 3D stack of sealed-document cards (drag to rotate), tamper demo (flip one character → TAMPERED verdict).
- **3D technique:** Draggable 3D card stack; low-motion mode shows a flat grid instead.

### 2. YojanaSetu — https://yojanasetu-self.vercel.app
- **Concept/metaphor:** Officer dashboard for beneficiary data governance; district enrolment as a 3D height-map.
- **Palette/typography:** Government-dashboard register: dense data tables, district/scheme breakdowns, synthetic-ID lookups.
- **Layout/navigation:** Multi-panel dashboard: totals, district map, enrolments by scheme, inclusion gaps, lookup, duplicate detection, eligibility trace, scheme registry.
- **Hero:** "Officer Dashboard" — totals first, data-dense from the first screen.
- **Signature interaction/animation:** 3D district map (block height = enrolment volume; drag/Alt+arrows rotate ±20°; "Flat map" 2D fallback; rotation off on touch).
- **3D technique:** Isometric-ish 3D bar map with keyboard + screen-reader 2D list alternative.

### 3. CageCheck — https://cagecheck.vercel.app
- **Concept/metaphor:** "Check the agent's code in a cage before it touches your repo" — throwaway sandbox per check, policy outside the cage.
- **Palette/typography:** Dark, terse, terminal-adjacent; short punchy lines, spec-list presentation (5s timeout, 256 MB, 1 MB file).
- **Layout/navigation:** Minimal single-purpose page: pitch → cage spec list → past receipts → health link.
- **Hero:** One headline + one paragraph + bullet spec list. No marketing banner.
- **Signature interaction/animation:** Receipts ledger ("Past receipts"), health endpoint; function-first, decoration-free.
- **3D technique:** None prominent on the inspected page (receipts list is flat).

## Aevum Guard — how it is recognisably different

| Dimension | NyayaSeal | YojanaSetu | CageCheck | **Aevum Guard** |
|---|---|---|---|---|
| Metaphor | Seal / vault of documents | Officer dashboard / map | Cage / sandbox | **Ledger spine — one ruled column of receipts** |
| Palette | Light editorial | Gov data neutrals | Dark terminal | **Bone paper + ink + vault green/red (film-noir ledger); one inverted ink section** |
| Typography | Explanatory prose, numbered sections | Dense data labels | Terse spec lines | **Condensed grotesque uppercase + mono for all hashes/amounts; amounts are the largest type** |
| Layout | Numbered stacked sections | Multi-panel dashboard grid | Minimal single-purpose | **Left guard rail + single central spine; hero IS the live balance/cap state** |
| Hero | Headline + counters | Totals dashboard | Headline + spec list | **Live guarded balance, spend-vs-cap ruled bar, next expiring key — no marketing copy** |
| Signature interaction | 3D card stack, tamper demo | 3D height-map, rotate | Receipts list | **Walkable 3D ledger spine (CSS 3D depth by recency) + hash-chain verify + live pre-check on the pay form** |
| 3D technique | Draggable card stack | 3D bar map | None | **CSS-3D spine, no WebGL; flat-table fallback; touch = flat automatically** |
| Motion | Reveal, drag-rotate | Map rotate | Minimal | **Scroll reveal + mask-reveal headings + kinetic hero amount only; no particles/parallax/magnetic** |

**Verdict: PASS — distinct.** Different visual concept (ledger spine vs seal-stack / district-map / cage), different information hierarchy (one column of truth vs numbered sections / dashboard grid / minimal page), different typography (condensed grotesque + mono vs editorial / data-dense / terminal), different 3D (CSS depth spine vs card stack / bar map / none), different motion language. More than an accent-colour change on every dimension.
