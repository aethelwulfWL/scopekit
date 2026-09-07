"use strict";
const { normalize, calculate, proposal, money } = ScopeCore;
const $ = (s) => document.querySelector(s),
  form = $("#quote-form"),
  key = "scopekit-v1";
const presets = {
  landing: {
    title: "A landing page with a purpose",
    timeline: "2–3 weeks",
    items: [
      { name: "Discovery & page strategy", qty: 1, rate: 250 },
      { name: "Landing page design & build", qty: 1, rate: 1200 },
      { name: "Responsive QA & launch", qty: 1, rate: 250 },
    ],
  },
  website: {
    title: "A better home for your business",
    timeline: "4–6 weeks",
    items: [
      { name: "Discovery & sitemap", qty: 1, rate: 400 },
      { name: "Page design & development", qty: 5, rate: 450 },
      { name: "CMS setup & handover", qty: 1, rate: 350 },
    ],
  },
  care: {
    title: "Website care — one month",
    timeline: "One month from agreed start date",
    items: [
      { name: "Updates, backups & monitoring", qty: 1, rate: 100 },
      { name: "Content changes (hours)", qty: 2, rate: 75 },
    ],
  },
};
let draft = {
  studio: "Northline Studio",
  client: "Juniper Coffee Co.",
  currency: "USD",
  deposit: 50,
  revision: 2,
  notes:
    "Work begins after the deposit and all required content are received. The client supplies final copy, images and feedback from one decision-maker. Timing depends on feedback arriving within two business days.",
  exclusions:
    "Copywriting, brand identity, paid fonts, hosting and domain registration. Services beyond the deliverables listed above, extra pages and new functionality require a separate estimate.",
  ...structuredClone(presets.landing),
};
let toastTimer;
function toast(msg) {
  $("#toast").textContent = msg;
  $("#toast").style.display = "block";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ($("#toast").style.display = "none"), 4500);
}
function row(item, index) {
  const el = document.createElement("div");
  el.className = "line-item";
  for (const [field, label, type, min, max, step] of [
    ["name", "Deliverable", "text"],
    ["qty", "Quantity", "number", "0.01", "10000", "0.01"],
    ["rate", "Unit price", "number", "0", "1000000", "0.01"],
  ]) {
    const input = document.createElement("input");
    input.type = type;
    input.value = item[field];
    input.dataset.field = field;
    input.setAttribute("aria-label", `${label} ${index + 1}`);
    input.required = true;
    if (type === "number") {
      input.min = min;
      input.max = max;
      input.step = step;
    } else input.maxLength = 1000;
    el.append(input);
  }
  const b = document.createElement("button");
  b.type = "button";
  b.className = "remove";
  b.textContent = "×";
  b.setAttribute("aria-label", `Remove deliverable ${index + 1}`);
  b.disabled = draft.items.length === 1;
  b.addEventListener("click", () => {
    if (!read()) return;
    draft.items.splice(index, 1);
    paint();
    update();
  });
  el.append(b);
  return el;
}
function paint() {
  for (const k of [
    "studio",
    "client",
    "title",
    "timeline",
    "currency",
    "deposit",
    "revision",
    "notes",
    "exclusions",
  ])
    form.elements[k].value = draft[k];
  $("#items").replaceChildren(...draft.items.map(row));
}
function read() {
  if (!form.checkValidity()) {
    $("#save-status").textContent = "Check highlighted fields";
    $("#print").disabled =
      $("#export-html").disabled =
      $("#backup").disabled =
        true;
    return false;
  }
  const candidate = {};
  for (const k of [
    "studio",
    "client",
    "title",
    "timeline",
    "currency",
    "deposit",
    "revision",
    "notes",
    "exclusions",
  ])
    candidate[k] = form.elements[k].value;
  candidate.items = Array.from(document.querySelectorAll(".line-item"), (r) =>
    Object.fromEntries(
      Array.from(r.querySelectorAll("input"), (i) => [
        i.dataset.field,
        i.value,
      ]),
    ),
  );
  try {
    draft = normalize(candidate);
    return true;
  } catch (e) {
    toast(e.message);
    return false;
  }
}
function update() {
  if (!read()) return;
  $("#preview").innerHTML = proposal(draft);
  const t = calculate(draft);
  $("#total-label").textContent = money(t.subtotal, draft.currency);
  $("#item-count").textContent =
    `${draft.items.length} DELIVERABLE${draft.items.length === 1 ? "" : "S"}`;
  $("#print").disabled =
    $("#export-html").disabled =
    $("#backup").disabled =
      false;
  try {
    localStorage.setItem(key, JSON.stringify(draft));
    $("#save-status").textContent = "✓ Saved on this device";
  } catch {
    $("#save-status").textContent = "Use backup to save";
  }
}
function download(name, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 15000);
}
const filename = () =>
  (draft.client || "project")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "project";
form.addEventListener("input", update);
form.addEventListener("change", update);
form.addEventListener("submit", (e) => e.preventDefault());
$("#add-item").addEventListener("click", () => {
  if (!read()) {
    form.reportValidity();
    return;
  }
  if (draft.items.length >= 100) {
    toast("Maximum 100 deliverables per proposal.");
    return;
  }
  draft.items.push({ name: "Additional deliverable", qty: 1, rate: 0 });
  paint();
  update();
  $("#items").lastElementChild.querySelector("input").focus();
});
document.querySelectorAll("[data-preset]").forEach((b) =>
  b.addEventListener("click", () => {
    if (
      !confirm(
        "Replace the current deliverables, project title and timeline with this template? Your client details and boundaries stay.",
      )
    )
      return;
    if (!read()) {
      form.reportValidity();
      return;
    }
    Object.assign(draft, structuredClone(presets[b.dataset.preset]));
    document
      .querySelectorAll("[data-preset]")
      .forEach((x) => x.classList.toggle("active", x === b));
    paint();
    update();
    toast("Template loaded. Review the example fees.");
  }),
);
$("#backup").addEventListener("click", () => {
  if (read()) {
    download(
      `${filename()}-scopekit.json`,
      JSON.stringify(draft, null, 2),
      "application/json",
    );
    toast("Draft backup downloaded.");
  }
});
$("#restore").addEventListener("click", () => $("#import-file").click());
$("#import-file").addEventListener("change", async (e) => {
  const f = e.target.files[0];
  if (!f) return;
  try {
    if (f.size > 500000)
      throw Error("Draft files must be smaller than 500 KB.");
    const next = normalize(JSON.parse(await f.text()));
    if (!confirm("Replace your current draft with this backup?")) return;
    draft = next;
    paint();
    update();
    document
      .querySelectorAll("[data-preset]")
      .forEach((b) => b.classList.remove("active"));
    toast("Draft imported.");
  } catch (err) {
    toast(`Import failed. Current draft kept. ${err.message}`);
  } finally {
    e.target.value = "";
  }
});
$("#export-html").addEventListener("click", () => {
  if (!read()) {
    form.reportValidity();
    return;
  }
  const css = document.querySelector("style").textContent;
  download(
    `${filename()}-proposal.html`,
    '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Project proposal</title><style>' +
      css +
      '\nbody{background:#e9ece5;padding:30px 12px}.document{max-width:800px;margin:auto;padding:45px}@media(max-width:500px){.document{padding:22px}}@media print{body{padding:0}.document{max-width:none;padding:0}}</style></head><body><article class="document">' +
      proposal(draft) +
      "</article></body></html>",
    "text/html",
  );
  toast("Client proposal downloaded.");
});
$("#print").addEventListener("click", () => {
  if (read()) window.print();
  else form.reportValidity();
});
$("#help").addEventListener("click", () => $("#guide").showModal());
for (const id of ["close-help", "start"])
  $("#" + id).addEventListener("click", () => $("#guide").close());
try {
  const saved = localStorage.getItem(key);
  if (saved) {
    draft = normalize(JSON.parse(saved));
    document
      .querySelectorAll("[data-preset]")
      .forEach((b) => b.classList.remove("active"));
  }
} catch {
  toast(
    "Saved draft unavailable. Starting with an example; import a backup if you have one.",
  );
}
paint();
update();
