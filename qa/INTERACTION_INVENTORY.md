# Interaction Inventory — Aevum Guard (PLANNED)

**Status:** PLANNED ONLY (12 Nov 2026). No UI exists; no control has been implemented or tested. Every row is `PLANNED` by design — this inventory is the build checklist for the window, not a test result. Do not mark anything PASS until test-plan §C runs against the live deploy.

| # | Page / section | Control | User action | Expected behaviour | Status |
|---|---|---|---|---|---|
| 1 | Nav | "AEVUM GUARD" wordmark | Click | Scrolls to top (Guard section) | PLANNED |
| 2 | Nav | Anchor links: Guard / Limits / Keys / Pay / Audit | Click | Smooth-scrolls to the section; active section highlighted | PLANNED |
| 3 | Nav | Connect wallet button | Click | Opens MetaMask; adds/switches to Aevum 44005; shows truncated address when connected | PLANNED |
| 4 | Nav | Network badge | Read | Shows "Aevum · 44005"; wrong network → hard warning banner + actions disabled | PLANNED |
| 5 | 1 Guard | Guarded balance (hero amount) | Read | Live tUSD8 balance of the guard contract, formatted with confirmed decimals | PLANNED |
| 6 | 1 Guard | Spend-vs-cap ruled bar | Read | Today's spend vs daily cap across recipients; updates after each payment | PLANNED |
| 7 | 1 Guard | Next expiring session key | Read | Countdown to nearest session expiry; "none active" empty state | PLANNED |
| 8 | 2 Limits | Recipient address input | Type/paste | Validates 0x-address format; invalid → inline error, save disabled | PLANNED |
| 9 | 2 Limits | Per-tx / daily / weekly amount inputs | Type | Numeric, > 0; enforces perTx ≤ perDay ≤ perWeek; violations named inline | PLANNED |
| 10 | 2 Limits | Category select | Select | Groceries / Contributors / Agent ops / Other (bytes32 scope) | PLANNED |
| 11 | 2 Limits | Save limit button | Click | Sends `setLimit` tx; pending → confirmed; receipt appended to spine | PLANNED |
| 12 | 2 Limits | Pause recipient (set all-zero) button | Click | Sends `setLimit(0,0,0)`; recipient row shows PAUSED; payments to them revert | PLANNED |
| 13 | 2 Limits | Remove limit button | Click | Sends `removeLimit`; row removed; payments to them revert (default-deny) | PLANNED |
| 14 | 3 Session keys | Key address input | Type/paste | Validates address; rejects owner address (owner needs no session) | PLANNED |
| 15 | 3 Session keys | Scope select + max-per-tx + expiry inputs | Fill | Scope = category; maxPerTx > 0; expiry 1h–7d; invalid → inline error | PLANNED |
| 16 | 3 Session keys | Grant session button | Click | Sends `grantSession`; key card appears with scope chips + countdown | PLANNED |
| 17 | 3 Session keys | REVOKE button (per key card) | Click | Sends `revokeSession`; card struck-through immediately on confirmation; later pays from that key revert | PLANNED |
| 18 | 4 Pay | Recipient input | Type/paste/select from limits | Validates address; offers saved limited recipients as quick-pick | PLANNED |
| 19 | 4 Pay | Amount input | Type | Numeric; live pre-check line updates ("Within daily cap · X / Y remaining" or the exact rule that would fail) | PLANNED |
| 20 | 4 Pay | Category select | Select | Must match a scope for session-key pays; mismatch → pre-check error | PLANNED |
| 21 | 4 Pay | Pay button | Click | Blocked client-side if pre-check fails (no tx sent); else sends `pay`; pending → confirmed receipt with explorer link | PLANNED |
| 22 | 4 Pay | "Try to overspend" demo button | Click | Fills the form with amount = daily cap + 1; runs the pre-check + (on confirm) the on-chain revert, showing the exact rule | PLANNED |
| 23 | 5 Audit trail | Receipt cards (per action) | Read/click | Shows action, actor, amount, tx hash (explorer link), prev-hash link; copy-hash button copies full hash | PLANNED |
| 24 | 5 Audit trail | Verify chain button | Click | Recomputes hash chain client-side + `verifyChain` on-chain; reports PASS or FAIL with failing index | PLANNED |
| 25 | 5 Audit trail | Ledger-spine walk (drag / arrow keys) | Drag / ← → | Advances the 3D spine one receipt; bounded; keyboard-accessible | PLANNED |
| 26 | 5 Audit trail | "Flat ledger" toggle | Click | Switches 3D spine to a plain 2D table with identical data | PLANNED |
| 27 | Footer | Low-motion mode toggle | Click | Disables count-up + reveals + spine depth (flat table); persists in localStorage | PLANNED |
| 28 | Footer | Repo / docs / explorer links | Click | Open the GitHub repo, README, and contract on the explorer in a new tab | PLANNED |
| 29 | Global | Copy buttons (addresses, hashes) | Click | Copies full value; shows "Copied" confirmation | PLANNED |
| 30 | Global | Error / retry states | Trigger | Failed tx shows plain-language reason + Retry; no fake success toasts anywhere | PLANNED |

**Rule:** any control that cannot be implemented in-window is removed from the release UI or marked explicitly unavailable — never left looking functional while dead (rulebook §4).
