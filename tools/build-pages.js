#!/usr/bin/env node
/* Builds one SEO article page per hotel that has an article.
   Run after adding/editing hotels or articles:   node tools/build-pages.js
   Inputs : data.js (hotels) + articles/<hotel-id>.json (the article text)
   Outputs: hotels/<hotel-id>.html, articles-index.js, sitemap.xml
   Exit code 1 if an article is invalid (so the daily task can't publish a broken page). */
const fs = require("fs"), vm = require("vm"), path = require("path");
const root = path.join(__dirname, "..");
const SITE = "https://cinematicstay.com";

const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, "data.js"), "utf8").replace(/^const /gm, "var "), ctx);
const HOTELS = ctx.HOTELS, CONFIG = ctx.CONFIG || {};
const byId = new Map(HOTELS.map((h) => [h.id, h]));

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const words = (s) => String(s).trim().split(/\s+/).filter(Boolean).length;
const bookingLink = (u) => (CONFIG.affiliateId ? u + (u.includes("?") ? "&" : "?") + "aid=" + encodeURIComponent(CONFIG.affiliateId) : u);

// ---------- load + validate articles ----------
const dir = path.join(root, "articles");
fs.mkdirSync(dir, { recursive: true });
const problems = [], warnings = [], articles = new Map();
for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
  const id = f.replace(/\.json$/, "");
  let a;
  try { a = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")); } catch (e) { problems.push(`${id}: invalid JSON (${e.message})`); continue; }
  if (!byId.has(id)) { problems.push(`${id}: no hotel with this id in data.js`); continue; }
  for (const k of ["title", "description", "intro", "filming", "visit", "updated"]) if (!a[k] || typeof a[k] !== "string") problems.push(`${id}: missing "${k}"`);
  if (!Array.isArray(a.facts) || a.facts.length < 3 || a.facts.length > 6) problems.push(`${id}: "facts" needs 3-6 items`);
  if (!Array.isArray(a.sources) || a.sources.length < 2 || a.sources.some((s) => !/^https?:\/\//.test(s))) problems.push(`${id}: "sources" needs at least 2 full URLs`);
  if (a.title && a.title.length > 62) warnings.push(`${id}: title is ${a.title.length} chars (aim for <= 60)`);
  if (a.description && (a.description.length < 110 || a.description.length > 165)) warnings.push(`${id}: description is ${a.description.length} chars (aim for 120-160)`);
  const wc = words([a.intro, a.filming, a.visit, ...(a.facts || [])].join(" "));
  if (wc < 150 || wc > 450) problems.push(`${id}: article is ${wc} words (target 200-350, hard limits 150-450)`);
  articles.set(id, a);
}

// ---------- templates ----------
const nav = (active) => `<header>
  <a href="/" class="logo">🎬 Cinematic<span class="grad">Stay</span></a>
  <nav>
    <a href="/">Hotels</a>
    <a href="/movies">By Movie</a>
    <a href="/guides"${active === "guides" ? ' class="active"' : ""}>Guides</a>
    <a href="/about">About</a>
  </nav>
</header>`;
const head = ({ title, description, url, image, type }) => `<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="${type}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:site_name" content="Cinematic Stay">
<meta property="og:image" content="${esc(image)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(image)}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/styles.css">`;
const footer = `<footer>
  © Cinematic Stay
  <div class="footer-links"><a href="/about">About</a> · <a href="/contact">Contact</a> · <a href="/privacy">Privacy</a></div>
</footer>`;

function page(h, a) {
  const url = `${SITE}/hotels/${h.id}`;
  const movies = h.movies.join(", ");
  const h1 = a.h1 || `${h.name}: the real hotel from ${h.movies[0]}`;
  const related = HOTELS.filter((o) => o.id !== h.id && articles.has(o.id) &&
      (o.country === h.country || o.movies.some((m) => h.movies.includes(m)) || o.genre === h.genre)).slice(0, 3);
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Article", headline: h1, description: a.description, image: h.photo || undefined,
        datePublished: a.updated, dateModified: a.updated, mainEntityOfPage: url,
        author: { "@type": "Organization", name: "Cinematic Stay" },
        publisher: { "@type": "Organization", name: "Cinematic Stay", url: SITE },
        about: { "@type": "Hotel", name: h.name, address: { "@type": "PostalAddress", addressLocality: h.city, addressCountry: h.country || undefined } } },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Hotels", item: SITE + "/" },
        { "@type": "ListItem", position: 2, name: h.name, item: url } ] },
    ],
  };
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(a.title)} | Cinematic Stay</title>
<meta name="description" content="${esc(a.description)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(a.title)}">
<meta property="og:description" content="${esc(a.description)}">
<meta property="og:url" content="${url}">
<meta property="og:site_name" content="Cinematic Stay">
<meta property="og:image" content="${esc(h.photo || SITE + "/og-image.png")}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(a.title)}">
<meta name="twitter:description" content="${esc(a.description)}">
<meta name="twitter:image" content="${esc(h.photo || SITE + "/og-image.png")}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/styles.css">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body>

${nav()}

<main class="article-page">
  <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Hotels</a> › <span>${esc(h.name)}</span></nav>
  <h1>${esc(h1)}</h1>
  <p class="article-meta">${esc(h.cityEmoji)} ${esc(h.city)}${h.country ? ", " + esc(h.country) : ""} · 🎬 ${esc(movies)} · ${esc(h.era)}</p>
  ${h.photo ? `<figure class="article-photo">
    <img src="${esc(h.photo)}" alt="${esc(h.name)}, ${esc(h.city)} — the real hotel seen in ${esc(h.movies[0])}" referrerpolicy="no-referrer" width="1200" height="800">
    ${h.photoCredit ? `<figcaption>📷 ${esc(h.photoCredit)}</figcaption>` : ""}
  </figure>` : ""}
  <p class="article-intro">${esc(a.intro)}</p>

  <h2>On screen: ${esc(h.movies[0])}</h2>
  <p>${esc(a.filming)}</p>

  <h2>Fun facts</h2>
  <ul class="fact-list">
${a.facts.map((f) => `    <li>${esc(f)}</li>`).join("\n")}
  </ul>

  <h2>Visiting today</h2>
  <p>${esc(a.visit)}</p>
  <p><a class="cta article-cta" data-hotel="${esc(h.name)}" href="${esc(bookingLink(h.bookingUrl))}" target="_blank" rel="noopener sponsored">Check availability for ${esc(h.name)} →</a></p>

${related.length ? `  <h2>More movie hotels</h2>
  <ul class="related-list">
${related.map((o) => `    <li><a href="/hotels/${o.id}">${esc(o.name)}</a> — ${esc(o.movies[0])}, ${esc(o.city)}</li>`).join("\n")}
  </ul>
` : `  <p><a href="/movies">Browse all movie hotels →</a></p>
`}
  <details class="article-sources">
    <summary>Sources</summary>
    <ul>
${a.sources.map((s) => `      <li><a href="${esc(s)}" rel="noopener nofollow" target="_blank">${esc(s.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""))}</a></li>`).join("\n")}
    </ul>
  </details>
</main>

${footer}

<script src="/analytics.js"></script>
</body>
</html>
`;
}

// ---------- write outputs ----------
const guideRes = require("./build-guides")({ HOTELS, articles, esc, nav, footer, SITE, bookingLink, head });
guideRes.problems.forEach((p) => problems.push(p)); guideRes.warnings.forEach((w) => warnings.push(w));
if (problems.length) { problems.forEach((p) => console.log("ERROR", p)); warnings.forEach((w) => console.log("WARN ", w)); process.exit(1); }

const outDir = path.join(root, "hotels");
fs.mkdirSync(outDir, { recursive: true });
for (const f of fs.readdirSync(outDir)) if (f.endsWith(".html") && !articles.has(f.replace(/\.html$/, ""))) fs.unlinkSync(path.join(outDir, f));
for (const [id, a] of articles) fs.writeFileSync(path.join(outDir, id + ".html"), page(byId.get(id), a));

const ids = [...articles.keys()];
fs.writeFileSync(path.join(root, "articles-index.js"),
  `/* Auto-generated by tools/build-pages.js — hotels that have a full article page. */\nconst ARTICLE_IDS = ${JSON.stringify(ids)};\n`);

const today = new Date().toISOString().slice(0, 10);
const statics = [["/", "weekly", "1.0"], ["/movies", "weekly", "0.8"], ["/guides", "weekly", "0.8"], ["/about", "monthly", "0.5"], ["/contact", "yearly", "0.3"], ["/privacy", "yearly", "0.3"]];
const urls = statics.map(([p, c, pr]) => `  <url>\n    <loc>${SITE}${p}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${c}</changefreq>\n    <priority>${pr}</priority>\n  </url>`)
  .concat(guideRes.urls.map((u) => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`))
  .concat(ids.map((id) => `  <url>\n    <loc>${SITE}/hotels/${id}</loc>\n    <lastmod>${articles.get(id).updated}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`));
fs.writeFileSync(path.join(root, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`);

const missing = HOTELS.filter((h) => !articles.has(h.id)).map((h) => h.id);
console.log(`Built ${ids.length} article page(s) and ${guideRes.count} guide(s). Hotels still without an article: ${missing.length}`);
warnings.forEach((w) => console.log("WARN ", w));
if (process.argv.includes("--require-all") && missing.length) { console.log("ERROR hotels without an article: " + missing.join(", ")); process.exit(1); }
if (process.argv.includes("--list-missing")) console.log(missing.join("\n"));
