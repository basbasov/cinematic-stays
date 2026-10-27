/* Privacy-friendly analytics (Cloudflare Web Analytics: free, no cookies).
   Paste your token below to switch it on. Empty = analytics off. */
const ANALYTICS_CONFIG = { cloudflareToken: "" };

(function () {
  if (!ANALYTICS_CONFIG.cloudflareToken) return;
  const s = document.createElement("script");
  s.defer = true;
  s.src = "https://static.cloudflareinsights.com/beacon.min.js";
  s.setAttribute("data-cf-beacon", JSON.stringify({ token: ANALYTICS_CONFIG.cloudflareToken }));
  document.head.appendChild(s);
})();
