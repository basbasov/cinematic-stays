/* ============================================================
   CINEMATIC STAYS — ADMIN PANEL LOGIC
   ============================================================
   Handles: checking Supabase is configured, login/logout via
   Supabase Auth, and add/edit/delete against the `hotels` table.
   Reuses REQUIRED_FIELDS/validateHotels from hotel-utils.js so
   the admin form enforces the same rules the public site relies on.
   ============================================================ */

let sb = null;

const GRADIENT_PALETTE = [
  "linear-gradient(135deg,#8e7cc3,#5b4a8a)",
  "linear-gradient(135deg,#e0a96d,#b97b3e)",
  "linear-gradient(135deg,#4fb3bf,#2c7a8c)",
  "linear-gradient(135deg,#d4af37,#8a6d1a)",
  "linear-gradient(135deg,#c9482e,#8f2f1c)",
  "linear-gradient(135deg,#e07a5f,#c14f36)",
  "linear-gradient(135deg,#3d5a5c,#1f3335)",
  "linear-gradient(135deg,#7d8ca3,#3f4b5e)",
  "linear-gradient(135deg,#5c7a63,#2f4a38)",
  "linear-gradient(135deg,#b8433a,#6e241e)",
];

function defaultGradientFor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return GRADIENT_PALETTE[hash % GRADIENT_PALETTE.length];
}

function show(id) {
  document.getElementById(id).style.display = "block";
}
function hide(id) {
  document.getElementById(id).style.display = "none";
}

function rowFromForm() {
  const movies = document.getElementById("f-movies").value
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  const name = document.getElementById("f-name").value.trim();
  const gradient = document.getElementById("f-photoGradient").value.trim() || defaultGradientFor(name);

  return {
    id: document.getElementById("f-id").value.trim(),
    name,
    city: document.getElementById("f-city").value.trim(),
    city_emoji: document.getElementById("f-cityEmoji").value.trim(),
    country: document.getElementById("f-country").value.trim(),
    genre: document.getElementById("f-genre").value.trim(),
    genre_emoji: document.getElementById("f-genreEmoji").value.trim(),
    era: document.getElementById("f-era").value.trim(),
    movies,
    scene: document.getElementById("f-scene").value.trim(),
    story: document.getElementById("f-story").value.trim() || null,
    booking_url: document.getElementById("f-bookingUrl").value.trim(),
    photo: document.getElementById("f-photo").value.trim() || null,
    photo_credit: document.getElementById("f-photoCredit").value.trim() || null,
    photo_gradient: gradient,
  };
}

function fillFormFromRow(row) {
  document.getElementById("editingId").value = row.id;
  document.getElementById("f-id").value = row.id;
  document.getElementById("f-id").disabled = true;
  document.getElementById("f-name").value = row.name;
  document.getElementById("f-city").value = row.city;
  document.getElementById("f-cityEmoji").value = row.city_emoji;
  document.getElementById("f-country").value = row.country || "";
  document.getElementById("f-genre").value = row.genre;
  document.getElementById("f-genreEmoji").value = row.genre_emoji;
  document.getElementById("f-era").value = row.era;
  document.getElementById("f-movies").value = (row.movies || []).join(", ");
  document.getElementById("f-scene").value = row.scene;
  document.getElementById("f-story").value = row.story || "";
  document.getElementById("f-bookingUrl").value = row.booking_url;
  document.getElementById("f-photo").value = row.photo || "";
  document.getElementById("f-photoCredit").value = row.photo_credit || "";
  document.getElementById("f-photoGradient").value = row.photo_gradient || "";

  document.getElementById("formTitle").textContent = `Editing: ${row.name}`;
  document.getElementById("submitBtn").textContent = "Save Changes";
  show("cancelEditBtn");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetForm() {
  document.getElementById("hotelForm").reset();
  document.getElementById("editingId").value = "";
  document.getElementById("f-id").disabled = false;
  document.getElementById("formTitle").textContent = "Add a new hotel";
  document.getElementById("submitBtn").textContent = "Add Hotel";
  hide("cancelEditBtn");
  hide("formError");
  hide("formSuccess");
}

function hotelListItemHTML(row) {
  return `
    <div class="admin-list-item">
      <div class="admin-list-info">
        <strong>${row.genre_emoji || ""} ${row.name}</strong>
        <span>${row.city_emoji || ""} ${row.city}${row.country ? ", " + row.country : ""} · ${(row.movies || []).join(", ")} · ${row.era}</span>
      </div>
      <div class="admin-list-actions">
        <button class="admin-btn small" data-action="edit" data-id="${row.id}">Edit</button>
        <button class="admin-btn small danger" data-action="delete" data-id="${row.id}">Delete</button>
      </div>
    </div>
  `;
}

async function loadAndRenderHotels() {
  const listEl = document.getElementById("hotelList");
  const countEl = document.getElementById("hotelListCount");
  const { data, error } = await sb.from("hotels").select("*").order("created_at", { ascending: true });

  if (error) {
    listEl.innerHTML = `<div class="admin-error">Couldn't load hotels: ${error.message}</div>`;
    return;
  }

  countEl.textContent = data.length;
  listEl.innerHTML = data.map(hotelListItemHTML).join("") || "<p>No hotels yet — add your first one above.</p>";

  listEl.querySelectorAll("[data-action='edit']").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const row = data.find((r) => r.id === btn.dataset.id);
      if (row) fillFormFromRow(row);
    });
  });

  listEl.querySelectorAll("[data-action='delete']").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const row = data.find((r) => r.id === btn.dataset.id);
      if (!row) return;
      if (!confirm(`Delete "${row.name}"? This can't be undone.`)) return;
      const { error: delError } = await sb.from("hotels").delete().eq("id", row.id);
      if (delError) {
        alert(`Couldn't delete: ${delError.message}`);
        return;
      }
      loadAndRenderHotels();
    });
  });
}

async function checkAuthAndRender() {
  const { data } = await sb.auth.getSession();
  if (data.session) {
    hide("loginPanel");
    show("dashboard");
    document.getElementById("whoami").textContent = `Signed in as ${data.session.user.email}`;
    loadAndRenderHotels();
  } else {
    hide("dashboard");
    show("loginPanel");
  }
}

function initAuthAndForms() {
  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const errEl = document.getElementById("loginError");
    errEl.textContent = "";

    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      errEl.textContent = error.message;
      return;
    }
    checkAuthAndRender();
  });

  document.getElementById("signOutBtn").addEventListener("click", async () => {
    await sb.auth.signOut();
    checkAuthAndRender();
  });

  document.getElementById("cancelEditBtn").addEventListener("click", resetForm);

  document.getElementById("hotelForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const errEl = document.getElementById("formError");
    const okEl = document.getElementById("formSuccess");
    hide("formError");
    hide("formSuccess");

    const row = rowFromForm();
    const { valid, errors } = validateHotels([
      {
        id: row.id, name: row.name, city: row.city, cityEmoji: row.city_emoji,
        genre: row.genre, genreEmoji: row.genre_emoji, era: row.era, movies: row.movies,
        scene: row.scene, bookingUrl: row.booking_url, photoGradient: row.photo_gradient,
      },
    ]);

    if (valid.length === 0) {
      errEl.textContent = errors[0] || "Please fill in all required fields.";
      show("formError");
      return;
    }

    const editingId = document.getElementById("editingId").value;

    if (editingId) {
      const { error } = await sb.from("hotels").update(row).eq("id", editingId);
      if (error) {
        errEl.textContent = error.message;
        show("formError");
        return;
      }
      okEl.textContent = "Saved.";
    } else {
      const { error } = await sb.from("hotels").insert(row);
      if (error) {
        errEl.textContent = error.message;
        show("formError");
        return;
      }
      okEl.textContent = "Hotel added.";
    }

    show("formSuccess");
    resetForm();
    loadAndRenderHotels();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const configured =
    typeof SUPABASE_CONFIG !== "undefined" && SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey;

  if (!configured) {
    show("notConfigured");
    return;
  }

  sb = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
  initAuthAndForms();
  checkAuthAndRender();
});
