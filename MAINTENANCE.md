# Cinematic Stays — maintenance checklist

## After every hotel change
1. `node tools/check-links.js` — catches missing photos/credits, duplicates, search-style Booking links.
2. `node tools/sync-supabase-seed.js` — keeps `supabase_schema.sql` identical to `data.js`.
3. Push once (every push = 1 Netlify deploy ≈ 15 credits; batch changes).

## Monthly (10 minutes)
- [ ] Netlify → Deploys: latest deploy is "Published"; Usage & billing: credits left.
- [ ] Cloudflare → Domain registration: auto-renew on, card valid (renews yearly).
- [ ] GoatCounter (basbasov.goatcounter.com): which hotels get `click/` events; add similar hotels.
- [ ] Open the live site on a phone: filters work, photos load, "Check availability" opens Booking.com.
- [ ] `node tools/check-links.js --online` from a normal computer: no ERROR lines.
- [ ] Google Search Console: coverage errors, new queries.
- [ ] Replace any Booking.com *search* links with exact hotel pages once you have them.
- [ ] Add your Booking.com affiliate ID in `data.js` (CONFIG.affiliateId) once approved, then add a disclosure line back to the footer.

## GitHub token (rotate every 90 days or when it expires)
1. GitHub → Settings → Developer settings → Fine-grained tokens → create a new token: repo `basbasov/cinematic-stays` only, permission **Contents: Read and write**, expiry 90 days.
2. Replace it in `.github-token` (never commit it) and in the weekly scheduled task prompt.
3. Delete the old token on GitHub.
Set a calendar reminder ~10 days before expiry.

## Backups
- Code + data: GitHub repo `basbasov/cinematic-stays` (full history).
- Snapshots: `node tools/export-hotels.js` writes `backups/hotels-YYYY-MM-DD.json`. Run it monthly and commit.
- Supabase (once live): Dashboard → Table editor → hotels → Export CSV monthly.

## Search Console (one time)
Add property `https://cinematicstay.com`, verify with the DNS TXT record in Cloudflare, submit `https://cinematicstay.com/sitemap.xml`.

## Publishing: once a day, 23:59
All changes (mine and yours) are pushed to the **staging** branch, which Netlify ignores (no credits used).
The GitHub Action `.github/workflows/publish-daily.yml` merges staging into main every day at 23:59 (UTC+2) — only if something changed — and that single push is the day's one deploy.
To publish immediately: GitHub → Actions → "Publish daily" → Run workflow.

After each publish the workflow opens a GitHub issue titled "Deployed <date>" that lists every change and file that went live; GitHub emails it to you.
