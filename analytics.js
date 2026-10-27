/* Privacy-friendly analytics (GoatCounter: free, no cookies).
   Put your GoatCounter code below (the part before .goatcounter.com).
   Empty = analytics off. */
const ANALYTICS_CONFIG = { goatcounterCode: "basbasov" };

(function () {
  const code = ANALYTICS_CONFIG.goatcounterCode;
  if (!code) return;
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://gc.zgo.at/count.js";
  s.setAttribute("data-goatcounter", "https://" + code + ".goatcounter.com/count");
  document.head.appendChild(s);
})();

/* Booking-button click tracking.
   Every "Check availability" click is logged in GoatCounter as an event:
   path  = click/<hotel-name>   (which hotel)
   title = "<hotel> · from <page>"  (which page of the site it came from)
   The "Top referrers" panel shows where those visitors arrived from. */
document.addEventListener("click", function (e) {
  const link = e.target.closest && e.target.closest("a.cta");
  if (!link || !window.goatcounter || !window.goatcounter.count) return;
  const card = link.closest(".card");
  const name = card && card.querySelector("h3") ? card.querySelector("h3").textContent.trim() : "unknown";
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const page = location.pathname.replace(/^\/|\.html$/g, "") || "home";
  window.goatcounter.count({
    path: "click/" + slug,
    title: name + " · from " + page,
    event: true,
  });
});
