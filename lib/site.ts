/** Profiles that identify the same person as this site, for `sameAs` in structured data. */
export const SITE_SOCIALS = [
  "https://github.com/mathis-lambert",
  "https://www.linkedin.com/in/mathis-lambert/",
];

/** The site's own origin, for the places a URL has to be absolute rather than routed. */
export const SITE_URL = (process.env.PUBLIC_BASE_URL || "https://mathislambert.fr").replace(/\/$/, "");
