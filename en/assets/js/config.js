/* FreeNav site config — the only place to change your domain.
 * Before going live: replace freenav.net with your real domain.
 * Also update the freenav.net placeholder in index.html / sitemap.xml / robots.txt
 * and each column page's <link rel="canonical">.
 */
window.FREENAV_SITE_URL = "https://freenav.net";

/*
 * CPS affiliate slots (monetization, zero-config to fill).
 * Usage: drop your affiliate link into url; the homepage auto-renders a "Sponsored" card.
 * Empty array [] hides all cards. Keep tag (compliance label "Ad").
 */
window.FREENAV_AFFILIATE = [
  {
    name: "Namecheap · Domains & Hosting",
    note: "FreeNav itself runs on Namecheap domains. Competitive prices, and using this link supports the site at no extra cost to you.",
    url: "https://www.namecheap.com/",
    tag: "Ad"
  }
];
