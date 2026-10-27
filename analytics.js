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
