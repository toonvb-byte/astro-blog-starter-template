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
 * Amazon Associates store tag per marketplace. Not secret: it is visible in every Amazon link.
 * /go/ adds it as `tag=` to offers of retailers with network 'amazon' in that country.
 * Empty = no account for that store yet → visitors get the plain product link and that market's
 * pages don't show the Amazon disclosure. ES live since 3 Nov 2026.
 */
export const AMAZON_TAGS = { ES: "nutrimetric0e-21", DE: "" } as const;
export type AmazonMarket = keyof typeof AMAZON_TAGS;

/** Amazon market whose links appear on a locale's pages (Spanish → Amazon.es, German → Amazon.de, English → none). */
export const AMAZON_MARKET_BY_LOCALE: Partial<Record<string, AmazonMarket>> = { es: "ES", de: "DE" };

/** True when Amazon links in this market carry our tag. */
export const amazonLive = (market: string | null | undefined): boolean =>
	!!market && market in AMAZON_TAGS && AMAZON_TAGS[market as AmazonMarket] !== "";

/** Amazon's required sentence, per page language (Amazon Associates Operating Agreement). */
export const AMAZON_STATEMENT = {
	es: "En calidad de Afiliado de Amazon, obtengo ingresos por las compras adscritas que cumplen los requisitos aplicables.",
	de: "Als Amazon-Partner verdiene ich an qualifizierten Verkäufen.",
	en: "As an Amazon Associate I earn from qualifying purchases.",
} as const;

/**
 * Affiliate networks that are live. Switch on only once the account is approved and links use it —
 * the disclosure, privacy and cookie pages adapt automatically (Amazon also adds its required sentence).
 * Amazon is on as soon as any marketplace in AMAZON_TAGS has a tag.
 */
export const AFFILIATE = { awin: false, amazon: Object.values(AMAZON_TAGS).some((t) => t !== "") } as const;
