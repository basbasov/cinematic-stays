# Cinematic Stays — site guide

A quick reference for coming back to this project later (by yourself or by asking Claude).

## Pages

- `index.html` — **Hotels.** The main browsable grid with search + filters (Destination/Genre/Era).
- `movies.html` — **By Movie.** The same hotels, grouped by the film they appeared in.
- `about.html` — **About.** Site story, photo policy, and the Booking.com affiliate disclosure.
- `admin.html` — **Admin panel** (not linked in the nav — bookmark it). Sign in and add/edit/delete hotels without touching any code.

## Files

- `styles.css` — all visual design (colors, fonts, spacing, layout) shared by every page.
- `admin.css` — extra styles used only by `admin.html`.
- `data.js` — the bundled hotel list. This is the **offline fallback** — see "How data loads" below.
- `hotel-utils.js` — shared logic (validation + the hotel card template) used by both `index.html` and `movies.html`, so a fix in one place fixes both pages.
- `data-loader.js` — decides whether to pull hotels from Supabase (live) or fall back to `data.js`.
- `script.js` — homepage-only logic (filters, search).
- `movies.js` — "By Movie" page logic (groups hotels by film).
- `admin.js` — admin panel logic (login, add/edit/delete against Supabase).
- `supabase-config.js` — where you paste your Supabase Project URL + anon key (see setup below).
- `supabase_schema.sql` — run this once in Supabase to create the database table and load your current 26 hotels into it.

## How data loads (this is the "backend")

The site now supports two data sources, and always falls back gracefully:

1. **Supabase (live database)** — once you've set it up (steps below) and filled in `supabase-config.js`, every page fetches hotels from your live Supabase database. Edits made in the admin panel appear on the site immediately, with no code changes.
2. **`data.js` (bundled fallback)** — if Supabase isn't configured yet, or is briefly unreachable, the site automatically uses the hotel list bundled in `data.js` instead. Nothing breaks either way — you'll just see a note in the browser console (F12 → Console) saying which source was used.

## Setting up the real backend (Supabase + admin panel)

This is a one-time setup, roughly 10 minutes:

1. Go to [supabase.com](https://supabase.com) and create a free account, then create a new project (pick any name/region/password — you won't need the database password day-to-day).
2. Once the project is ready, go to the **SQL Editor** (left sidebar) → New query → paste in the entire contents of `supabase_schema.sql` from this folder → **Run**. This creates the `hotels` table, locks it down with security rules (public can read, only signed-in admins can write), and loads your current 26 hotels into it.
3. Go to **Project Settings** (gear icon) → **API**. Copy the **Project URL** and the **`anon` `public`** key.
4. Open `supabase-config.js` in this folder and paste those two values in:
   ```js
   const SUPABASE_CONFIG = {
     url: "https://your-project.supabase.co",
     anonKey: "your-anon-key-here",
   };
   ```
5. Create your admin login: in Supabase, go to **Authentication** → **Users** → **Add user**, and set an email + password for yourself. This is what you'll use to sign in at `admin.html`.
6. Open `admin.html` in your browser, sign in, and you're managing the live site.

The anon key is safe to have in a public file — the security rules in `supabase_schema.sql` mean it can only ever read hotels publicly, and can only add/edit/delete if someone is actually signed in with a real admin account.

## How to add, edit, or remove a hotel

**Preferred way (once Supabase is set up):** open `admin.html`, sign in, and use the form — no code involved. Fields match what's described in `data.js`; leave "Fallback color" blank and one is picked automatically.

**Manual way (works with or without Supabase):** open `data.js`, copy one of the existing entries in the `HOTELS` array, fill in the fields, save. If Supabase is set up, this only updates the offline fallback — the live site still reads from Supabase until you also add the hotel there (via `admin.html` or by running an INSERT in the Supabase SQL Editor).

If any hotel entry (from either source) is missing a required field, that one hotel is skipped with a warning banner and a browser console message — the rest of the site keeps working normally.

## Photo rule — read this before adding a hotel

Every hotel card must show a real photo of the hotel itself (never a screenshot from the movie — film stills are copyrighted, and using them on a monetized site is a real legal risk). Full policy: Wikimedia Commons only, real exterior/interior photo of the actual hotel, credit the author/license exactly as listed on the Commons file page. The design automatically overlays a movie-title badge and a "Real, bookable hotel" badge on top of the photo, so it's always clear both which film it's from and that it's a genuine, bookable place. If a photo URL ever breaks, the card falls back to a gradient placeholder instead of breaking the page. Full details are documented above the `HOTELS` array in `data.js`.

## How to set up real Booking.com affiliate tracking

At the top of `data.js` there's a `CONFIG` object:

```js
const CONFIG = {
  affiliateId: null,
  ...
};
```

Once you have a Booking.com Affiliate Partner ID, put it in `affiliateId`. Every "Check availability" button across the whole site will automatically include it — you never need to edit individual hotel links.

## How to preview the site

Double-click `index.html` — it opens directly in your browser, no server needed, and works even before Supabase is set up (it'll just use `data.js`).

## How to publish it

Still a plain set of static files (no build step) — deploy by dragging the folder onto any static host: Netlify, Vercel, or GitHub Pages are the easiest, free options. The Supabase backend is hosted separately (free tier) and works from any of these. When you're ready, let Claude know and it can walk you through picking a host and going live.

## Known placeholders / next steps

- `bookingUrl` values were found via web search and should be spot-checked before launch.
- `admin.html` isn't linked from the site's nav on purpose (it's a management tool, not a visitor page) — bookmark it directly.
