export const SITE_NAME = "NutriMetrics.eu";
export const SITE_URL = "https://nutrimetrics.eu";

/**
 * Pre-launch guard. While false, every page gets <meta name="robots" content="noindex">
 * so placeholder content never lands in Google. Set to true on launch day
 * (also set SITE_LIVE="true" in wrangler.json so /robots.txt opens up).
 */
export const SITE_LIVE = false;
