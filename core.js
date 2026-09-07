(function (root) {
  "use strict";
  const esc = (s) =>
    String(s).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  function number(v, min, max) {
    if (
      v === "" ||
      v === null ||
      typeof v === "boolean" ||
      !["string", "number"].includes(typeof v)
    )
      throw Error("Enter a valid number.");
    const n = Number(v);
    if (!Number.isFinite(n) || n < min || n > max)
      throw Error(`Numbers must be between ${min} and ${max}.`);
    return n;
  }
  function normalize(d) {
    if (
      !d ||
      typeof d !== "object" ||
      !Array.isArray(d.items) ||
      d.items.length < 1 ||
      d.items.length > 100
    )
      throw Error("A draft must contain 1–100 line items.");
    if (!["USD", "EUR", "GBP", "TRY", "CAD", "AUD"].includes(d.currency))
      throw Error("Choose a supported currency.");
    const out = {
      currency: d.currency,
      deposit: number(d.deposit, 0, 100),
      revision: number(d.revision, 0, 100),
    };
    if (!Number.isInteger(out.revision))
      throw Error("Revision rounds must be a whole number.");
    for (const key of [
      "studio",
      "client",
      "title",
      "timeline",
      "notes",
      "exclusions",
    ]) {
      if (typeof d[key] !== "string" || d[key].length > 10000)
        throw Error("Draft text is missing or too long.");
      out[key] = d[key];
    }
    out.items = d.items.map((i) => {
      if (!i || typeof i.name !== "string" || i.name.length > 1000)
        throw Error("Each item needs a valid description.");
      return {
        name: i.name,
        qty: number(i.qty, 0.01, 10000),
        rate: number(i.rate, 0, 1000000),
      };
    });
    return out;
  }
  function calculate(input) {
    const d = normalize(input);
    const lines = d.items.map((i) =>
      Math.round(Math.round((i.rate + Number.EPSILON) * 100) * i.qty),
    );
    const subtotal = lines.reduce((a, b) => a + b, 0);
    const deposit = Math.round((subtotal * d.deposit) / 100);
    return { lines, subtotal, deposit, balance: subtotal - deposit };
  }
  const money = (c, currency) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(c / 100);
  function proposal(input) {
    const d = normalize(input),
      t = calculate(d),
      m = (c) => money(c, d.currency),
      e = esc;
    return `<header class="doc-head"><span>${e(d.studio || "Your studio")}</span><span>PROJECT PROPOSAL</span></header><p class="doc-kicker">PREPARED FOR ${e(d.client || "Your client")}</p><h1>${e(d.title || "Project proposal")}</h1><p class="doc-intro">A clear scope. A shared starting point.</p><div class="doc-facts"><div><small>ESTIMATED TIMELINE</small><strong>${e(d.timeline || "To be agreed")}</strong></div><div><small>REVISION ROUNDS</small><strong>${d.revision} included</strong></div></div><h2>Scope & investment</h2><table><thead><tr><th>Deliverable</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>${d.items.map((i, n) => `<tr><td>${e(i.name || "Untitled deliverable")}</td><td>${i.qty}</td><td>${m(Math.round(i.rate * 100))}</td><td>${m(t.lines[n])}</td></tr>`).join("")}</tbody></table><div class="doc-total"><span>Total project fee <small>${d.currency} · before any applicable taxes</small></span><strong>${m(t.subtotal)}</strong></div><div class="doc-payment"><p><span>Deposit to begin (${d.deposit}%)</span><b>${m(t.deposit)}</b></p><p><span>Remaining project balance</span><b>${m(t.balance)}</b></p></div><h2>Working together</h2><p class="preserve">${e(d.notes || "Project details to be agreed before work begins.")}</p><h2>Outside this scope</h2><p class="preserve">${e(d.exclusions || "Any additional deliverables require a separate estimate.")}</p><p>Includes ${d.revision} round${d.revision === 1 ? "" : "s"} of consolidated revisions. Additional rounds and changes to the agreed deliverables will be quoted separately before work begins.</p><footer class="doc-footer">Next step: confirm scope, timing and payment terms together before beginning. This proposal is an estimate, not a signed agreement.</footer>`;
  }
  const api = { normalize, calculate, proposal, money };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.ScopeCore = api;
})(globalThis);
