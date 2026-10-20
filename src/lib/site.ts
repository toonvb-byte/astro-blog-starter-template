export const SITE_NAME = "NutriMetrics.eu";
export const SITE_URL = "https://nutrimetrics.eu";

/**
 * Launch switch. While false, every page gets <meta name="robots" content="noindex">
 * and robots.txt disallows everything. Live since 20 Oct 2026.
 */
export const SITE_LIVE = true;

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
export const GA_MEASUREMENT_ID = "G-BV4NJDJT5M";
export const GA_ENABLED = GA_MEASUREMENT_ID !== "";

/**
 * Affiliate networks that are live. Switch on only once the account is approved and links use it —
 * the disclosure, privacy and cookie pages adapt automatically (Amazon also adds its required sentence).
 */
export const AFFILIATE = { awin: false, amazon: false } as const;
