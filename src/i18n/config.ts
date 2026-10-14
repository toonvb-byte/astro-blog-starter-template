/** Launch locales. Add a locale here + in ui.ts + ROUTES below to switch it on. */
export const LOCALES = ["en", "es"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

/** All planned editions — shown in the footer; only LOCALES are linked. */
export const ALL_LANGUAGES: { code: string; name: string }[] = [
	{ code: "en", name: "English" },
	{ code: "de", name: "Deutsch" },
	{ code: "fr", name: "Français" },
	{ code: "es", name: "Español" },
	{ code: "it", name: "Italiano" },
	{ code: "nl", name: "Nederlands" },
	{ code: "pl", name: "Polski" },
	{ code: "pt", name: "Português" },
];

export const OG_LOCALE: Record<Locale, string> = { en: "en_GB", es: "es_ES" };

/** Default "ship to" country per locale (overridable by the visitor later). */
export const DEFAULT_COUNTRY: Record<Locale, string> = { en: "DE", es: "ES" };

/** Localised URL segments for every non-article page. */
export const ROUTES = {
	prices: { en: "price-tracker", es: "comparador-precios" },
	compare: { en: "compare", es: "comparar" },
	guides: { en: "guides", es: "guias" },
	about: { en: "about", es: "sobre-nosotros" },
	privacy: { en: "legal/privacy", es: "legal/privacidad" },
	cookies: { en: "legal/cookies", es: "legal/cookies" },
	imprint: { en: "legal/imprint", es: "legal/aviso-legal" },
	disclosure: { en: "legal/affiliate-disclosure", es: "legal/divulgacion-afiliados" },
} as const satisfies Record<string, Record<Locale, string>>;
export type RouteKey = keyof typeof ROUTES;

export const isLocale = (v: unknown): v is Locale => LOCALES.includes(v as Locale);

/** Absolute path to a page in a given locale, always with trailing slash. */
export function path(locale: Locale, key?: RouteKey, sub?: string): string {
	let p = `/${locale}/`;
	if (key) p += `${ROUTES[key][locale]}/`;
	if (sub) p += `${sub}/`;
	return p;
}

/** hreflang alternates for a fixed route in all launch locales. */
export function routeAlternates(key?: RouteKey): Partial<Record<Locale, string>> {
	return Object.fromEntries(LOCALES.map((l) => [l, path(l, key)]));
}
