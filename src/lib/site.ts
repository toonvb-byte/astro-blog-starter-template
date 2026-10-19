export const SITE_NAME = "NutriMetrics.eu";
export const SITE_URL = "https://nutrimetrics.eu";

/**
 * Pre-launch guard. While false, every page gets <meta name="robots" content="noindex">
 * so placeholder content never lands in Google. Set to true on launch day
 * (also set SITE_LIVE="true" in wrangler.json so /robots.txt opens up).
 */
export const SITE_LIVE = false;

/** Operator details — used on the legal pages (Aviso legal / Impressum / Imprint) and the About page. */
export const OPERATOR = {
	name: "Toon Van Buylaere",
	taxId: "X9397486P", // NIE — required on the Spanish Aviso legal (LSSI art. 10)
	street: "Pasaje Mas De Roda 26",
	postcode: "08005",
	city: "Barcelona",
	country: { en: "Spain", es: "España", de: "Spanien" },
	email: "hello@nutrimetrics.eu",
	privacyEmail: "hello@nutrimetrics.eu",
} as const;

/**
 * Google Analytics 4 Measurement ID (e.g. "G-XXXXXXXXXX").
 * Empty = GA is not loaded, no consent banner is shown and the legal pages don't mention GA.
 * When set, GA only loads after the visitor accepts analytics cookies in the consent banner.
 */
export const GA_MEASUREMENT_ID = "";
export const GA_ENABLED = GA_MEASUREMENT_ID !== "";

/**
 * Affiliate networks that are live. Switch on only once the account is approved and links use it —
 * the disclosure, privacy and cookie pages adapt automatically (Amazon also adds its required sentence).
 */
export const AFFILIATE = { awin: false, amazon: false } as const;
