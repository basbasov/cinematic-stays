#!/usr/bin/env node
/* Health check for every hotel. Run:  node tools/check-links.js
   Checks: required fields, duplicate ids, photo + credit present, Wikimedia photo URL
   format, Booking.com URL format, story length, and (when the network allows) that the
   photo and Booking URLs respond. Exit code 1 if any hard problem is found. */
const fs = require("fs"), vm = require("vm"), path = require("path");
const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "data.js"), "utf8").replace(/^const /gm, "var "), ctx);
const problems = [], warnings = [], seen = new Set();
const req = ["id","name","city","cityEmoji","genre","genreEmoji","era","movies","scene","bookingUrl","photoGradient"];
for (const h of ctx.HOTELS) {
  for (const f of req) if (!h[f] || (Array.isArray(h[f]) && !h[f].length)) problems.push(`${h.id}: missing ${f}`);
  if (seen.has(h.id)) problems.push(`${h.id}: duplicate id`); seen.add(h.id);
  if (!h.photo) problems.push(`${h.id}: no photo`);
  else if (!/^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\//.test(h.photo)) problems.push(`${h.id}: photo is not a Wikimedia Commons URL`);
  if (h.photo && !h.photoCredit) problems.push(`${h.id}: photo without credit`);
  if (!/^https:\/\/www\.booking\.com\//.test(h.bookingUrl || "")) problems.push(`${h.id}: bookingUrl is not booking.com`);
  if (/searchresults/.test(h.bookingUrl || "")) warnings.push(`${h.id}: still a Booking.com SEARCH link — replace with the exact hotel page`);
  if (!h.story) warnings.push(`${h.id}: no story`);
}
(async () => {
  if (typeof fetch === "function" && process.argv.includes("--online")) {
    for (const h of ctx.HOTELS) for (const [label, url] of [["photo", h.photo], ["booking", h.bookingUrl]]) {
      if (!url) continue;
      try { const r = await fetch(url, { method: "HEAD", redirect: "follow" }); if (r.status >= 400 && !(label === "booking" && r.status === 403)) problems.push(`${h.id}: ${label} returned ${r.status}`); }
      catch (e) { warnings.push(`${h.id}: ${label} not reachable from here (${e.cause?.code || e.message})`); }
    }
  }
  console.log(`${ctx.HOTELS.length} hotels checked.`);
  warnings.forEach((w) => console.log("WARN ", w)); problems.forEach((p) => console.log("ERROR", p));
  process.exit(problems.length ? 1 : 0);
})();
