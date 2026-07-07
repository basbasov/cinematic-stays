/* ============================================================
   CINEMATIC STAYS — "BY MOVIE" PAGE LOGIC
   ============================================================
   Groups the same hotel data used on the homepage (see
   hotel-utils.js / data-loader.js) by movie title instead of
   rendering one flat grid. A hotel that appeared in more than
   one movie shows up under each movie it's tied to. Nothing here
   needs to change when hotels are added — new movies just appear
   as new groups automatically.
   ============================================================ */

async function init() {
  const container = document.getElementById("movieGroups");
  const errorBanner = document.getElementById("dataErrorBanner");
  const emptyState = document.getElementById("emptyState");

  if (typeof loadHotels !== "function") {
    errorBanner.style.display = "block";
    errorBanner.textContent = "⚠️ Couldn't find the data loader (data-loader.js). Make sure it's loaded before movies.js.";
    return;
  }

  const { hotels: rawHotels, source } = await loadHotels();
  console.info(`Cinematic Stays: hotel data loaded from ${source === "supabase" ? "Supabase (live)" : "the bundled data.js file"}.`);

  const { valid: hotels, errors } = validateHotels(rawHotels);

  if (errors.length > 0) {
    errorBanner.style.display = "block";
    errorBanner.innerHTML = `⚠️ ${errors.length} hotel entr${errors.length === 1 ? "y was" : "ies were"} skipped due to missing info:<br>` + errors.join("<br>");
    console.warn("Cinematic Stays data issues:\n" + errors.join("\n"));
  }

  if (hotels.length === 0) {
    emptyState.style.display = "block";
    return;
  }

  // Group hotels by movie title
  const byMovie = new Map();
  hotels.forEach((hotel) => {
    hotel.movies.forEach((movie) => {
      if (!byMovie.has(movie)) byMovie.set(movie, []);
      byMovie.get(movie).push(hotel);
    });
  });

  // Sort movies alphabetically for a predictable, scannable list
  const movieTitles = Array.from(byMovie.keys()).sort((a, b) => a.localeCompare(b));

  const html = movieTitles
    .map((movie) => {
      const hotelsForMovie = byMovie.get(movie);
      const genres = uniqueOptions(hotelsForMovie, "genre", "genreEmoji");
      const genreBadge = genres[0] ? `${genres[0].emoji} ${genres[0].value}` : "";
      const era = hotelsForMovie[0].era;

      return `
        <section class="movie-group">
          <div class="movie-group-header">
            <h2>🎬 ${movie}</h2>
            <span class="movie-meta">${genreBadge}${genreBadge && era ? " · " : ""}${era}</span>
          </div>
          <div class="grid movie-grid">
            ${hotelsForMovie.map(cardHTML).join("")}
          </div>
        </section>
      `;
    })
    .join("");

  container.insertAdjacentHTML("afterbegin", html);
}

document.addEventListener("DOMContentLoaded", init);
