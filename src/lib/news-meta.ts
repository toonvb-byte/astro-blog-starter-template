import type { Locale } from "../i18n/config";

/**
 * News regions (country filter on the news index) and kinds (badge). Imported by content.config.ts,
 * keystatic.config.ts and the news views, so keep this file free of astro:content imports.
 */
export const NEWS_REGIONS = ["es", "de", "uk", "eu", "world"] as const;
export type NewsRegion = (typeof NEWS_REGIONS)[number];

export const NEWS_KINDS = ["rules", "advice", "alert", "test", "study", "market", "ads"] as const;
export type NewsKind = (typeof NEWS_KINDS)[number];

export const REGION_LABEL: Record<Locale, Record<NewsRegion, string>> = {
	en: { es: "Spain", de: "Germany", uk: "UK", eu: "EU", world: "Worldwide" },
	es: { es: "España", de: "Alemania", uk: "Reino Unido", eu: "UE", world: "Mundo" },
	de: { es: "Spanien", de: "Deutschland", uk: "Großbritannien", eu: "EU", world: "Weltweit" },
};

export const KIND_LABEL: Record<Locale, Record<NewsKind, string>> = {
	en: { rules: "Rules", advice: "Official advice", alert: "Safety alert", test: "Product test", study: "Study", market: "Market", ads: "Ads & enforcement" },
	es: { rules: "Normativa", advice: "Recomendación oficial", alert: "Alerta", test: "Análisis de productos", study: "Estudio", market: "Mercado", ads: "Publicidad y control" },
	de: { rules: "Recht", advice: "Behördenrat", alert: "Warnung", test: "Produkttest", study: "Studie", market: "Markt", ads: "Werbung & Kontrolle" },
};

/** Region order per edition: the reader's own country first. */
export const REGION_ORDER: Record<Locale, NewsRegion[]> = {
	en: ["uk", "eu", "es", "de", "world"],
	es: ["es", "eu", "de", "uk", "world"],
	de: ["de", "eu", "es", "uk", "world"],
};
