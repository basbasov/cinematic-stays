/* ============================================================
   CINEMATIC STAYS — SHARED HOTEL UTILITIES
   ============================================================
   Used by every page that displays hotels (index.html/script.js,
   movies.html/movies.js). Validates hotel data, renders the card
   markup, and builds filter options — kept in one place so the
   homepage grid and the "By Movie" page always look and behave
   consistently, and a fix here fixes both pages at once.

   You should not need to edit this file for normal content
   updates — that all happens in data.js (or Supabase once set up).
   ============================================================ */

const REQUIRED_FIELDS = [
  "id", "name", "city", "cityEmoji", "genre", "genreEmoji",
  "era", "movies", "scene", "bookingUrl", "photoGradient",
];

function validateHotels(rawHotels) {
  const valid = [];
  const errors = [];

  if (!Array.isArray(rawHotels)) {
    errors.push("Hotel data is not a list — check data.js (or Supabase) wasn't accidentally broken.");
    return { valid, errors };
  }

  rawHotels.forEach((hotel, index) => {
    const missing = REQUIRED_FIELDS.filter((field) => {
      const value = hotel ? hotel[field] : undefined;
      if (Array.isArray(value)) return value.length === 0;
      return value === undefined || value === null || value === "";
    });

    if (missing.length > 0) {
      const label = hotel && hotel.name ? hotel.name : `entry #${index + 1}`;
      errors.push(`Skipped "${label}" — missing: ${missing.join(", ")}`);
      return;
    }

    valid.push(hotel);
  });

  return { valid, errors };
}

function buildBookingLink(baseUrl) {
  if (typeof CONFIG === "undefined" || !CONFIG || !CONFIG.affiliateId) return baseUrl;
  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}aid=${encodeURIComponent(CONFIG.affiliateId)}`;
}

function cardHTML(hotel) {
  const movieList = hotel.movies.join(" · ");
  const searchBlob = [hotel.name, hotel.city, hotel.country, ...hotel.movies]
    .join(" ")
    .toLowerCase();

  return `
    <article class="card" data-city="${hotel.city}" data-genre="${hotel.genre}" data-era="${hotel.era}" data-search="${searchBlob}">
      <div class="photo" style="background:${hotel.photoGradient};">
        <span class="photo-fallback-text">${hotel.name}</span>
        ${hotel.photo ? `<img class="photo-img" src="${hotel.photo}" alt="${hotel.name} — real exterior photo" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove();">` : ""}
        <span class="movie-badge">🎬 ${movieList}</span>
        <span class="era-badge">${hotel.era}</span>
        <span class="hotel-badge">🏨 Real, bookable hotel</span>
        ${hotel.photoCredit ? `<span class="photo-credit">📷 ${hotel.photoCredit}</span>` : ""}
      </div>
      <div class="body">
        <span class="movie-tag">${hotel.genreEmoji} ${movieList}</span>
        <h3>${hotel.name}</h3>
        <div class="location">${hotel.cityEmoji} ${hotel.city}${hotel.country ? ", " + hotel.country : ""}</div>
        <p class="scene">${hotel.scene}</p>
        <a class="cta" href="${buildBookingLink(hotel.bookingUrl)}" target="_blank" rel="noopener sponsored">Check availability →</a>
      </div>
    </article>
  `;
}

function uniqueOptions(hotels, valueField, emojiField) {
  const seen = new Map();
  hotels.forEach((hotel) => {
    if (!seen.has(hotel[valueField])) {
      seen.set(hotel[valueField], emojiField ? hotel[emojiField] || "" : "");
    }
  });
  return Array.from(seen.entries()).map(([value, emoji]) => ({ value, emoji }));
}

function pillHTML(option) {
  return `<div class="pill" data-value="${option.value}">${option.emoji ? option.emoji + " " : ""}${option.value}</div>`;
}
