/* ============================================================
   CINEMATIC STAYS — DATA LOADER
   ============================================================
   Shared by every page (index.html, movies.html, about.html).

   Tries Supabase first (your live, editable database). If
   Supabase isn't configured yet (supabase-config.js still has
   blank url/anonKey), or the request fails for any reason —
   offline, Supabase down, a typo in the config — it automatically
   falls back to the bundled HOTELS list in data.js. The site
   never breaks; it just serves the last-known list until Supabase
   is reachable again.

   Load order in HTML must be:
     <script src="supabase-config.js"></script>
     <script src="data.js"></script>
     <script src="data-loader.js"></script>
     <script src="script.js"></script>  (or movies.js / about.js)
   ============================================================ */

async function loadHotels() {
  const configured =
    typeof SUPABASE_CONFIG !== "undefined" &&
    SUPABASE_CONFIG.url &&
    SUPABASE_CONFIG.anonKey;

  if (configured) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(
        `${SUPABASE_CONFIG.url}/rest/v1/hotels?select=*&order=created_at.asc`,
        {
          headers: {
            apikey: SUPABASE_CONFIG.anonKey,
            Authorization: `Bearer ${SUPABASE_CONFIG.anonKey}`,
          },
          signal: controller.signal,
        }
      );
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`Supabase responded with ${res.status}`);
      const rows = await res.json();
      if (!Array.isArray(rows)) throw new Error("Unexpected response shape from Supabase");
      return { hotels: rows.map(rowToHotel), source: "supabase" };
    } catch (err) {
      console.warn(
        "Cinematic Stays: couldn't load hotels from Supabase, falling back to the bundled data.js list.",
        err
      );
    }
  }

  return {
    hotels: typeof HOTELS !== "undefined" ? HOTELS : [],
    source: "local",
  };
}

function rowToHotel(row) {
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    cityEmoji: row.city_emoji,
    country: row.country,
    genre: row.genre,
    genreEmoji: row.genre_emoji,
    era: row.era,
    movies: row.movies,
    scene: row.scene,
    bookingUrl: row.booking_url,
    photo: row.photo,
    photoCredit: row.photo_credit,
    photoGradient: row.photo_gradient,
  };
}
