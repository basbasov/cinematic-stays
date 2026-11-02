/* Builds the "Guides" section: guides/<slug>.json -> guides/<slug>.html and guides.html (index).
   Called by tools/build-pages.js (run that one; it runs this automatically).
   Guide types: "movie" (all real hotels of one film/show) and "list" (a curated set, e.g. "Hotels from horror movies"). */
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");

module.exports = function buildGuides({ HOTELS, articles, esc, nav, footer, SITE, bookingLink, head }) {
  const byId = new Map(HOTELS.map((h) => [h.id, h]));
  const dir = path.join(root, "guides");
  fs.mkdirSync(dir, { recursive: true });
  const problems = [], warnings = [], guides = new Map();
  const words = (s) => String(s).trim().split(/\s+/).filter(Boolean).length;

  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
    const slug = f.replace(/\.json$/, "");
    let g;
    try { g = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")); } catch (e) { problems.push(`guide ${slug}: invalid JSON (${e.message})`); continue; }
    for (const k of ["type", "title", "description", "h1", "intro", "outro", "updated"]) if (!g[k] || typeof g[k] !== "string") problems.push(`guide ${slug}: missing "${k}"`);
    if (!["movie", "list"].includes(g.type)) problems.push(`guide ${slug}: type must be "movie" or "list"`);
    if (!Array.isArray(g.hotels) || g.hotels.length < 2) problems.push(`guide ${slug}: "hotels" needs at least 2 entries ({id, note?})`);
    else for (const e of g.hotels) if (!byId.has(e.id)) problems.push(`guide ${slug}: unknown hotel id "${e.id}"`);
    if (!Array.isArray(g.sources) || g.sources.length < 2 || g.sources.some((s) => !/^https?:\/\//.test(s))) problems.push(`guide ${slug}: "sources" needs at least 2 full URLs`);
    if (g.title && g.title.length > 62) warnings.push(`guide ${slug}: title is ${g.title.length} chars (aim for <= 60)`);
    if (g.description && (g.description.length < 110 || g.description.length > 165)) warnings.push(`guide ${slug}: description is ${g.description.length} chars (aim for 120-160)`);
    const wc = words([g.intro, g.outro, ...(g.hotels || []).map((e) => e.note || "")].join(" "));
    if (wc < 70 || wc > 450) problems.push(`guide ${slug}: ${wc} words of text (target 100-300; limits 70-450)`);
    guides.set(slug, g);
  }
  if (problems.length) return { problems, warnings };

  const hotelBlock = (e, i) => {
    const h = byId.get(e.id);
    const text = e.note || h.scene;
    return `  <article class="guide-hotel">
    ${h.photo ? `<img src="${esc(h.photo)}" alt="${esc(h.name)}, ${esc(h.city)}" loading="lazy" referrerpolicy="no-referrer" width="600" height="400">` : ""}
    <div class="guide-hotel-body">
      <h2>${i + 1}. ${esc(h.name)}</h2>
      <p class="article-meta">${esc(h.cityEmoji)} ${esc(h.city)}${h.country ? ", " + esc(h.country) : ""} · 🎬 ${esc(h.movies.join(", "))}</p>
      <p>${esc(text)}</p>
      ${h.photoCredit ? `<p class="photo-credit">📷 ${esc(h.photoCredit)}</p>` : ""}
      <p class="guide-links">${articles.has(h.id) ? `<a href="/hotels/${h.id}">Read the full story →</a> ` : ""}<a class="cta article-cta" data-hotel="${esc(h.name)}" href="${esc(bookingLink(h.bookingUrl))}" target="_blank" rel="noopener sponsored">Check availability →</a></p>
    </div>
  </article>`;
  };

  const outDir = path.join(root, "guides");
  for (const f of fs.readdirSync(outDir)) if (f.endsWith(".html") && !guides.has(f.replace(/\.html$/, ""))) fs.unlinkSync(path.join(outDir, f));
  const urls = [];
  for (const [slug, g] of guides) {
    const url = `${SITE}/guides/${slug}`;
    const first = byId.get(g.hotels[0].id);
    const ld = { "@context": "https://schema.org", "@graph": [
      { "@type": "Article", headline: g.h1, description: g.description, image: first.photo || undefined, datePublished: g.updated, dateModified: g.updated, mainEntityOfPage: url,
        author: { "@type": "Organization", name: "Cinematic Stay" }, publisher: { "@type": "Organization", name: "Cinematic Stay", url: SITE } },
      { "@type": "ItemList", itemListElement: g.hotels.map((e, i) => ({ "@type": "ListItem", position: i + 1, name: byId.get(e.id).name, url: `${SITE}/hotels/${e.id}` })) },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Guides", item: SITE + "/guides" },
        { "@type": "ListItem", position: 2, name: g.title, item: url } ] } ] };
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
${head({ title: g.title + " | Cinematic Stay", description: g.description, url, image: first.photo || SITE + "/og-image.png", type: "article" })}
<script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body>

${nav("guides")}

<main class="article-page guide-page">
  <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/guides">Guides</a> › <span>${esc(g.title)}</span></nav>
  <h1>${esc(g.h1)}</h1>
  <p class="article-intro">${esc(g.intro)}</p>

${g.hotels.map(hotelBlock).join("\n\n")}

  <p>${esc(g.outro)}</p>
  <p><a href="/guides">← All guides</a> · <a href="/movies">Browse by movie</a></p>

  <details class="article-sources">
    <summary>Sources</summary>
    <ul>
${g.sources.map((s) => `      <li><a href="${esc(s)}" rel="noopener nofollow" target="_blank">${esc(s.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""))}</a></li>`).join("\n")}
    </ul>
  </details>
</main>

${footer}

<script src="/analytics.js"></script>
</body>
</html>
`;
    fs.writeFileSync(path.join(outDir, slug + ".html"), html);
    urls.push({ loc: url, lastmod: g.updated });
  }

  // index page
  const sorted = [...guides].sort((a, b) => b[1].updated.localeCompare(a[1].updated) || a[0].localeCompare(b[0]));
  const idxUrl = SITE + "/guides";
  const idxDesc = "Guides to real movie hotels: where your favourite films were shot, plus curated lists of hotels you can actually book.";
  const idx = `<!DOCTYPE html>
<html lang="en">
<head>
${head({ title: "Movie Hotel Guides | Cinematic Stay", description: idxDesc, url: idxUrl, image: SITE + "/og-image.png", type: "website" })}
</head>
<body>

${nav("guides")}

<main class="article-page guide-index">
  <h1>Movie hotel guides</h1>
  <p class="article-intro">Where your favourite films were shot, and curated lists of real hotels you can book.</p>
  <div class="guide-tiles">
${sorted.map(([slug, g]) => { const h = byId.get(g.hotels[0].id); return `    <a class="guide-tile" href="/guides/${slug}">
      ${h.photo ? `<img src="${esc(h.photo)}" alt="" loading="lazy" referrerpolicy="no-referrer" width="600" height="400">` : ""}
      <div><span class="guide-kind">${g.type === "movie" ? "🎬 Movie guide" : "📋 List"}</span><h2>${esc(g.h1)}</h2><p>${esc(g.description)}</p></div>
    </a>`; }).join("\n")}
  </div>
</main>

${footer}

<script src="/analytics.js"></script>
</body>
</html>
`;
  fs.writeFileSync(path.join(root, "guides.html"), idx);
  return { problems, warnings, count: guides.size, urls };
};
