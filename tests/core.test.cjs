const { test } = require("node:test");
const assert = require("node:assert/strict");
const { calculate, normalize, proposal } = require("../core.js");
const draft = () => ({
  studio: "Studio",
  client: "Client",
  title: "Website",
  currency: "USD",
  deposit: 50,
  revision: 2,
  timeline: "3 weeks",
  notes: "Text supplied by client",
  exclusions: "Hosting",
  items: [{ name: "Design", qty: 2, rate: 125.25 }],
});
test("deposit and remaining balance reconcile in cents", () => {
  const d = draft();
  d.deposit = 33;
  assert.deepEqual(calculate(d), {
    lines: [25050],
    subtotal: 25050,
    deposit: 8267,
    balance: 16783,
  });
});
test("fractional quantities round per line, not after summing", () => {
  const d = draft();
  d.items = [
    { name: "A", qty: 1.5, rate: 0.01 },
    { name: "B", qty: 1.5, rate: 0.01 },
  ];
  assert.equal(calculate(d).subtotal, 4);
});
test("zero deposit leaves entire balance", () => {
  const d = draft();
  d.deposit = 0;
  assert.equal(calculate(d).deposit, 0);
  assert.equal(calculate(d).balance, 25050);
});
test("full deposit leaves no balance", () => {
  const d = draft();
  d.deposit = 100;
  assert.equal(calculate(d).balance, 0);
});
test("reject negative or nonfinite prices", () => {
  for (const rate of [-1, Infinity, "oops"]) {
    const d = draft();
    d.items[0].rate = rate;
    assert.throws(() => normalize(d));
  }
});
test("reject malformed and oversized imports", () => {
  for (const d of [
    null,
    {},
    [],
    { ...draft(), items: [] },
    { ...draft(), items: Array(101).fill(draft().items[0]) },
    { ...draft(), deposit: 101 },
    { ...draft(), currency: "BOGUS" },
  ])
    assert.throws(() => normalize(d));
});
test("preserve valid zero and fractional values through normalization", () => {
  const d = draft();
  d.deposit = 0;
  d.items[0].qty = 0.5;
  assert.equal(normalize(d).deposit, 0);
  assert.equal(normalize(d).items[0].qty, 0.5);
});
test("client output escapes all user-controlled content", () => {
  const d = draft();
  d.client = "<img src=x onerror=alert(1)>";
  d.items[0].name = "<script>alert(1)</script>";
  d.notes = "A & B";
  const html = proposal(d);
  assert.ok(!html.includes("<img"));
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes("&lt;img"));
  assert.ok(html.includes("A &amp; B"));
});
test("proposal contains client scope and financial breakdown", () => {
  const html = proposal(draft());
  for (const s of ["Client", "Hosting", "3 weeks", "250.50", "125.25"])
    assert.ok(html.includes(s), s);
});
test("reject extreme quantities before unsafe arithmetic", () => {
  const d = draft();
  d.items[0].qty = 1e15;
  assert.throws(() => normalize(d));
});
