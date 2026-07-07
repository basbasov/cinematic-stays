/* ============================================================
   CINEMATIC STAYS — HOMEPAGE LOGIC
   ============================================================
   You should not need to edit this file to add or change hotels
   — that all happens in data.js (or Supabase once set up). This
   file just:
     1. Loads hotel data (via data-loader.js) and validates it
        (see hotel-utils.js — shared with movies.html too)
     2. Renders the hotel cards
     3. Builds the filter pills automatically from whatever
        cities/genres/eras exist in the data
     4. Wires up search + filtering + booking links
   ============================================================ */

async function init() {
  const grid = document.getElementById("grid");
  const errorBanner = document.getElementById("dataErrorBanner");
  const resultCount = document.getElementById("resultCount");

  if (typeof loadHotels !== "function") {
    errorBanner.style.display = "block";
    errorBanner.textContent = "⚠️ Couldn't find the data loader (data-loader.js). Make sure it's loaded before script.js and hasn't been renamed or deleted.";
    resultCount.textContent = "Showing 0 hotels";
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

  // Render cards
  grid.insertAdjacentHTML("afterbegin", hotels.map(cardHTML).join(""));

  // Build filters dynamically from whatever data exists
  document.getElementById("cityFilters").innerHTML = uniqueOptions(hotels, "city", "cityEmoji").map(pillHTML).join("");
  document.getElementById("genreFilters").innerHTML = uniqueOptions(hotels, "genre", "genreEmoji").map(pillHTML).join("");
  document.getElementById("eraFilters").innerHTML = uniqueOptions(hotels, "era").map(pillHTML).join("");

  // Filtering
  const state = { city: new Set(), genre: new Set(), era: new Set(), search: "" };
  const cards = Array.from(document.querySelectorAll(".card"));
  const emptyState = document.getElementById("emptyState");

  function applyFilters() {
    let visible = 0;
    cards.forEach((card) => {
      const matchesCity = state.city.size === 0 || state.city.has(card.dataset.city);
      const matchesGenre = state.genre.size === 0 || state.genre.has(card.dataset.genre);
      const matchesEra = state.era.size === 0 || state.era.has(card.dataset.era);
      const matchesSearch = state.search === "" || card.dataset.search.includes(state.search);
      const show = matchesCity && matchesGenre && matchesEra && matchesSearch;
      card.style.display = show ? "" : "none";
      if (show) visible++;
    });
    emptyState.style.display = visible === 0 ? "block" : "none";
    resultCount.textContent = `Showing ${visible} of ${cards.length} hotels`;
  }

  document.querySelectorAll(".pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      const group = pill.parentElement.dataset.group;
      const value = pill.dataset.value;
      if (state[group].has(value)) {
        state[group].delete(value);
        pill.classList.remove("active");
      } else {
        state[group].add(value);
        pill.classList.add("active");
      }
      applyFilters();
    });
  });

  document.getElementById("searchInput").addEventListener("input", (e) => {
    state.search = e.target.value.trim().toLowerCase();
    applyFilters();
  });

  document.getElementById("clearBtn").addEventListener("click", () => {
    state.city.clear();
    state.genre.clear();
    state.era.clear();
    state.search = "";
    document.getElementById("searchInput").value = "";
    document.querySelectorAll(".pill.active").forEach((p) => p.classList.remove("active"));
    applyFilters();
  });

  applyFilters();
}

document.addEventListener("DOMContentLoaded", init);
