#!/usr/bin/env node
/* Backup: writes backups/hotels-YYYY-MM-DD.json from data.js.
   Run:  node tools/export-hotels.js   (commit the file to keep a history) */
const fs = require("fs"), vm = require("vm"), path = require("path");
const root = path.join(__dirname, "..");
const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, "data.js"), "utf8").replace(/^const /gm, "var "), ctx);
fs.mkdirSync(path.join(root, "backups"), { recursive: true });
const out = path.join(root, "backups", "hotels-" + new Date().toISOString().slice(0, 10) + ".json");
fs.writeFileSync(out, JSON.stringify(ctx.HOTELS, null, 2));
console.log("Wrote", out, "(" + ctx.HOTELS.length + " hotels)");
