import { getCollection, type CollectionEntry } from "astro:content";
import { LOCALES, RANKING_BASE, isLocale, type Locale } from "../i18n/config";

export type Ranking = CollectionEntry<"rankings">;
export type RankedProduct = Ranking["data"]["products"][number];
export type Criterion = keyof RankedProduct["scores"];

/**
 * NutriMetrics score weights — the same for every ranking and shown on every ranking page
 * (EU consumer law: the main ranking parameters and their relative weight must be disclosed).
 * Price is not a criterion yet: there is no allowed price source (Amazon prices only via the Creators API).
 */
export const WEIGHTS: Record<Criterion, number> = { dose: 35, form: 20, label: 20, additives: 15, practical: 10 }; // percent, sums to 100
export const CRITERIA = Object.keys(WEIGHTS) as Criterion[];

/** Weighted points out of 1000 (integers, so ties and rounding are exact). */
export const points = (p: RankedProduct) => CRITERIA.reduce((s, c) => s + p.scores[c] * WEIGHTS[c], 0);

/** Score out of 10, one decimal (8.85 → 8.9). */
export const total = (p: RankedProduct) => Math.round(points(p) / 10) / 10;

/** Products in ranking order: points, then dose, then label honesty. */
export const ranked = (r: Ranking) =>
	[...r.data.products].sort(
		(a, b) => points(b) - points(a) || b.scores.dose - a.scores.dose || b.scores.label - a.scores.label,
	);

export function rankingLocale(r: Ranking): Locale {
	const l = r.id.split("/")[0];
	if (!isLocale(l) || !RANKING_BASE[l]) throw new Error(`Ranking "${r.id}" must be inside es/ or de/`);
	return l;
}
export const rankingSlug = (r: Ranking) => r.id.split("/").slice(1).join("/");
export const rankingUrl = (r: Ranking) => `/${rankingLocale(r)}/${RANKING_BASE[rankingLocale(r)]}/${rankingSlug(r)}/`;

const visible = (r: Ranking) => import.meta.env.DEV || !r.data.draft;

export async function getRankings(locale?: Locale): Promise<Ranking[]> {
	const all = await getCollection("rankings", visible);
	return all.filter((r) => !locale || rankingLocale(r) === locale).sort((a, b) => a.data.name.localeCompare(b.data.name));
}

export async function rankingAlternates(r: Ranking): Promise<Partial<Record<Locale, string>>> {
	const all = await getRankings();
	const out: Partial<Record<Locale, string>> = {};
	for (const l of LOCALES) {
		const match = all.find((x) => x.data.rankingKey === r.data.rankingKey && rankingLocale(x) === l);
		if (match) out[l] = rankingUrl(match);
	}
	return out;
}

/** Rankings linked from a hub (same locale and hubKey). */
export async function rankingsForHub(hubKey: string, locale: Locale): Promise<Ranking[]> {
	return (await getRankings(locale)).filter((r) => r.data.hubKey === hubKey);
}

/** One decimal with the locale's separator: 8,9 / 8.9 */
export const fmtScore = (n: number, locale: Locale) =>
	new Intl.NumberFormat(locale === "en" ? "en-GB" : locale === "es" ? "es-ES" : "de-DE", {
		minimumFractionDigits: 1,
		maximumFractionDigits: 1,
	}).format(n);
