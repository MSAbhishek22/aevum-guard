// Aevum Guard — local demo logic. Mirrors AevumGuard.sol rules client-side so
// every visible control works in demo mode: limit ordering, per-tx/daily/weekly
// caps, session scope/expiry/revoke, pay pre-check, hash-chained receipts and
// chain verification. Demo hash = FNV-1a (labelled DEMO); the on-chain contract
// uses keccak256 — see contracts/AevumGuard.sol.
"use strict";
const $ = (id) => document.getElementById(id);
const fmt = (n) => n.toFixed(2) + " tUSD8";
const isAddr = (a) => /^0x[0-9a-fA-F]{40}$/.test(a || "");
const DEMO_OWNER = "0x00000000000000000000000000000000000000A1";

function fnv(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return "0x" + h.toString(16).padStart(8, "0");
}

const state = {
  balance: 0,
  limits: new Map(),   // recipient -> {perTx, perDay, perWeek, category, active, spentDay, spentWeek}
  sessions: new Map(), // key -> {scope, maxPerTx, expiresAt, revoked, spent}
  receipts: [],        // {nonce, action, actor, recipient, amount, category, prev, hash, sample}
  spineIndex: 0,
  flat: false,
};

function appendReceipt(action, actor, recipient, amount, category, sample) {
  const nonce = state.receipts.length + 1;
  const prev = state.receipts.length ? state.receipts[state.receipts.length - 1].hash : "0x00000000";
  const hash = fnv([prev, nonce, action, actor, recipient, amount, category, Date.now()].join("|"));
  state.receipts.push({ nonce, action, actor, recipient, amount, category, prev, hash, sample: !!sample });
  renderSpine(); renderHero();
}

function renderHero() {
  $("heroAmount").textContent = fmt(state.balance);
  let cap = 0, spent = 0;
  state.limits.forEach((l) => { if (l.active) { cap += l.perDay; spent += l.spentDay; } });
  $("spendBar").style.width = cap ? Math.min(100, (spent / cap) * 100) + "%" : "0%";
  $("spendBar").classList.toggle("over", cap > 0 && spent >= cap);
  $("spendLine").textContent = "Spent today " + spent.toFixed(2) + " / " + cap.toFixed(2) + " tUSD8 across limited recipients";
  let next = null;
  state.sessions.forEach((s, k) => { if (!s.revoked && s.expiresAt > Date.now() && (!next || s.expiresAt < next.expiresAt)) next = { k, expiresAt: s.expiresAt }; });
  $("nextKeyLine").textContent = next
    ? "Next session key expiring: " + next.k.slice(0, 6) + "…" + next.k.slice(-4) + " at " + new Date(next.expiresAt).toLocaleTimeString()
    : "No active session keys";
}

function renderLimits() {
  const el = $("limitList");
  if (!state.limits.size) { el.innerHTML = '<p class="empty">No limits yet — set your first cap.</p>'; return; }
  el.innerHTML = "";
  state.limits.forEach((l, r) => {
    const row = document.createElement("div");
    row.className = "row" + (l.active ? "" : " paused");
    row.innerHTML = "<span class='mono'>" + r.slice(0, 6) + "…" + r.slice(-4) + "</span>" +
      "<span>tx " + l.perTx + " · day " + l.perDay + " · week " + l.perWeek + "</span>" +
      "<span class='tag'>" + l.category + "</span><span>" + (l.active ? "ACTIVE" : "PAUSED / REMOVED") + "</span>";
    const rm = document.createElement("button"); rm.type = "button"; rm.className = "danger"; rm.textContent = "Remove limit";
    rm.onclick = () => { l.active = false; appendReceipt("LIMIT_REMOVED", DEMO_OWNER, r, 0, l.category); renderLimits(); precheck(); };
    row.appendChild(rm); el.appendChild(row);
  });
}

function renderKeys() {
  const el = $("keyList");
  if (!state.sessions.size) { el.innerHTML = '<p class="empty">No session keys yet.</p>'; return; }
  el.innerHTML = "";
  state.sessions.forEach((s, k) => {
    const expired = s.expiresAt <= Date.now();
    const row = document.createElement("div");
    row.className = "row" + (s.revoked || expired ? " revoked" : "");
    row.innerHTML = "<span class='mono'>" + k.slice(0, 6) + "…" + k.slice(-4) + "</span>" +
      "<span class='tag'>" + s.scope + "</span><span>max/tx " + s.maxPerTx + "</span>" +
      "<span>" + (s.revoked ? "REVOKED" : expired ? "EXPIRED" : "expires " + new Date(s.expiresAt).toLocaleTimeString()) + "</span>";
    if (!s.revoked) {
      const rv = document.createElement("button"); rv.type = "button"; rv.className = "danger"; rv.textContent = "REVOKE";
      rv.onclick = () => { s.revoked = true; appendReceipt("SESSION_REVOKED", DEMO_OWNER, k, 0, s.scope); renderKeys(); renderHero(); };
      row.appendChild(rv);
    }
    el.appendChild(row);
  });
}

// Pay pre-check — same rule order as the contract's pay().
function checkPay() {
  const r = $("payRecipient").value.trim(), amt = parseFloat($("payAmount").value), cat = $("payCategory").value;
  if (!isAddr(r)) return { ok: false, msg: "Enter a valid recipient address (0x…40 hex)." };
  if (!(amt > 0)) return { ok: false, msg: "Amount must be greater than zero (contract: ZeroAmount)." };
  const l = state.limits.get(r);
  if (!l || !l.active) return { ok: false, msg: "Blocked: NoActiveLimit — recipient has no active limit (default-deny)." };
  if (amt > l.perTx) return { ok: false, msg: "Blocked: OverPerTxCap — per-tx cap is " + l.perTx + "." };
  if (amt > l.perDay - l.spentDay) return { ok: false, msg: "Blocked: OverDailyCap — " + (l.perDay - l.spentDay).toFixed(2) + " left today." };
  if (amt > l.perWeek - l.spentWeek) return { ok: false, msg: "Blocked: OverWeeklyCap — " + (l.perWeek - l.spentWeek).toFixed(2) + " left this week." };
  if (amt > state.balance) return { ok: false, msg: "Blocked: InsufficientGuardBalance — guard holds " + fmt(state.balance) + "." };
  void cat;
  return { ok: true, msg: "Within caps · " + (l.perDay - l.spentDay - amt).toFixed(2) + " of daily cap will remain." };
}
function precheck() {
  const p = $("precheck");
  if (!$("payRecipient").value && !$("payAmount").value) { p.textContent = "Set a limit first."; p.className = "precheck"; return; }
  const c = checkPay();
  p.textContent = c.msg; p.className = "precheck " + (c.ok ? "ok" : "err");
  $("payBtn").disabled = false; // submit re-checks and blocks — mirrors contract revert
}

function renderSpine() {
  const spine = $("spine"); spine.innerHTML = "";
  state.receipts.forEach((r, i) => {
    const d = document.createElement("div");
    d.className = "receipt";
    const depth = Math.max(0, (state.receipts.length - 1 - i)) * -14;
    d.style.transform = state.flat || document.body.classList.contains("low-motion") ? "none" : "translateZ(" + depth + "px)";
    d.innerHTML = "<strong>#" + r.nonce + " " + r.action + (r.sample ? " · SAMPLE" : "") + "</strong><br>" +
      "<small>actor</small> <span class='mono'>" + r.actor.slice(0, 10) + "…</span> → <span class='mono'>" + String(r.recipient).slice(0, 10) + "…</span><br>" +
      (r.amount ? "<strong>" + fmt(r.amount) + "</strong> · " : "") + "<span>" + (r.category || "") + "</span><br>" +
      "<small>hash</small> <span class='receipt-hash'>" + r.hash + "</span><br><small>prev</small> <span class='receipt-hash'>" + r.prev + "</span>";
    spine.appendChild(d);
  });
  const tb = $("flatBody"); tb.innerHTML = "";
  state.receipts.forEach((r) => {
    const tr = document.createElement("tr");
    tr.innerHTML = "<td>" + r.nonce + "</td><td>" + r.action + (r.sample ? " (SAMPLE)" : "") + "</td><td class='mono'>" + r.actor.slice(0, 10) + "…</td><td class='mono'>" + String(r.recipient).slice(0, 10) + "…</td><td>" + r.amount + "</td><td class='mono'>" + r.hash + "</td>";
    tb.appendChild(tr);
  });
}

function msg(id, text, ok) { const e = $(id); e.textContent = text; e.className = "form-msg " + (ok ? "ok" : "err"); }

// ── Wiring ────────────────────────────────────────────────────────────────
$("connectBtn").onclick = () => {
  $("demoNote").textContent = "Wallet connection activates after the testnet deploy — it needs your MetaMask address (see DEPLOY_CHECKLIST.md). This page is running in local demo mode; nothing here touches the chain.";
  $("connectBtn").textContent = "Demo mode — no wallet";
};
$("fundForm").onsubmit = (e) => {
  e.preventDefault();
  const a = parseFloat($("fundAmount").value);
  if (!(a > 0)) return msg("fundMsg", "Amount must be greater than zero.", false);
  state.balance += a; appendReceipt("FUNDED", DEMO_OWNER, "guard", a, "");
  msg("fundMsg", "Funded " + fmt(a) + " (demo).", true); renderHero();
};
$("limitForm").onsubmit = (e) => {
  e.preventDefault();
  const r = $("limRecipient").value.trim();
  const perTx = parseFloat($("limPerTx").value), perDay = parseFloat($("limPerDay").value), perWeek = parseFloat($("limPerWeek").value);
  if (!isAddr(r)) return msg("limitMsg", "Invalid recipient address.", false);
  if (!(perTx <= perDay && perDay <= perWeek)) return msg("limitMsg", "Blocked: perTx ≤ perDay ≤ perWeek required (contract: InvalidLimitOrdering).", false);
  const active = !(perTx === 0 && perDay === 0 && perWeek === 0);
  state.limits.set(r, { perTx, perDay, perWeek, category: $("limCategory").value, active, spentDay: 0, spentWeek: 0 });
  appendReceipt("LIMIT_SET", DEMO_OWNER, r, perTx, $("limCategory").value);
  msg("limitMsg", active ? "Limit saved." : "Recipient paused (all-zero limit).", true);
  renderLimits(); precheck();
};
$("keyForm").onsubmit = (e) => {
  e.preventDefault();
  const k = $("keyAddress").value.trim();
  const max = parseFloat($("keyMax").value), hrs = parseFloat($("keyHours").value);
  if (!isAddr(k)) return msg("keyMsg", "Invalid key address.", false);
  if (!(max > 0)) return msg("keyMsg", "Max per-tx must be greater than zero.", false);
  if (!(hrs >= 1 && hrs <= 168)) return msg("keyMsg", "Expiry must be 1–168 hours (contract max 7 days).", false);
  state.sessions.set(k, { scope: $("keyScope").value, maxPerTx: max, expiresAt: Date.now() + hrs * 3600 * 1000, revoked: false, spent: 0 });
  appendReceipt("SESSION_GRANTED", DEMO_OWNER, k, max, $("keyScope").value);
  msg("keyMsg", "Session granted.", true); renderKeys(); renderHero();
};
["payRecipient", "payAmount", "payCategory"].forEach((id) => $(id).addEventListener("input", precheck));
$("payForm").onsubmit = (e) => {
  e.preventDefault();
  const c = checkPay();
  if (!c.ok) return msg("payMsg", c.msg + " No payment sent (mirrors the on-chain revert).", false);
  const r = $("payRecipient").value.trim(), amt = parseFloat($("payAmount").value), l = state.limits.get(r);
  state.balance -= amt; l.spentDay += amt; l.spentWeek += amt;
  appendReceipt("PAYMENT", DEMO_OWNER, r, amt, $("payCategory").value);
  msg("payMsg", "Paid " + fmt(amt) + " (demo receipt appended to the spine).", true);
  renderHero(); precheck();
};
$("overspendBtn").onclick = () => {
  const first = [...state.limits.entries()].find(([, l]) => l.active);
  if (!first) return msg("payMsg", "Set an active limit first, then try to overspend.", false);
  $("payRecipient").value = first[0];
  $("payAmount").value = (first[1].perDay + 1).toFixed(2);
  $("payCategory").value = first[1].category;
  precheck();
  msg("payMsg", "Form filled with daily cap + 1 — the pre-check names the rule that blocks it.", false);
};
$("verifyBtn").onclick = () => {
  let prev = "0x00000000", bad = -1;
  for (let i = 0; i < state.receipts.length; i++) {
    const r = state.receipts[i];
    if (r.prev !== prev) { bad = i; break; }
    prev = r.hash;
  }
  $("verifyResult").textContent = bad === -1
    ? "CHAIN PASS — " + state.receipts.length + " receipts linked (demo hash; on-chain uses verifyChain + keccak256)."
    : "CHAIN FAIL at receipt index " + bad + ".";
};
$("flatToggle").onclick = () => {
  state.flat = !state.flat;
  $("flatTable").hidden = !state.flat;
  $("spineScene").hidden = state.flat;
  $("flatToggle").textContent = state.flat ? "3D spine" : "Flat ledger";
  renderSpine();
};
$("spineBack").onclick = () => { state.spineIndex = Math.max(0, state.spineIndex - 1); $("spine").style.transform = "translateY(" + state.spineIndex * 10 + "px)"; };
$("spineFwd").onclick = () => { state.spineIndex = Math.min(state.receipts.length, state.spineIndex + 1); $("spine").style.transform = "translateY(" + state.spineIndex * 10 + "px)"; };
$("motionToggle").onchange = (e) => {
  document.body.classList.toggle("low-motion", e.target.checked);
  localStorage.setItem("aevum-low-motion", e.target.checked ? "1" : "0");
  renderSpine();
};
if (localStorage.getItem("aevum-low-motion") === "1" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  $("motionToggle").checked = true; document.body.classList.add("low-motion");
}

// One clearly-labelled sample receipt so the spine is never shown with fake history.
appendReceipt("PAYMENT", DEMO_OWNER, "0x00000000000000000000000000000000000000B2", 0, "sample", true);
renderLimits(); renderKeys(); renderHero();
