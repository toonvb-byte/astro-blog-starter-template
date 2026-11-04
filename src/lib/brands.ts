import { getCollection, type CollectionEntry } from "astro:content";
import { BRAND_BASE, LOCALES, isLocale, type Locale } from "../i18n/config";
import { CRITERIA, getRankings, points, ranked, rankingUrl, total, type Criterion, type RankedProduct, type Ranking } from "./rankings";

export type Brand = CollectionEntry<"brands">;

/** Gate from claude/page-plan.md: a brand page needs at least this many ranked products in its market. */
export const MIN_BRAND_PRODUCTS = 5;

export function brandLocale(b: Brand): Locale {
	const l = b.id.split("/")[0];
	if (!isLocale(l) || !BRAND_BASE[l]) throw new Error(`Brand "${b.id}" must be inside es/ or de/`);
	return l;
}
export const brandSlug = (b: Brand) => b.id.split("/").slice(1).join("/");
export const brandUrl = (b: Brand) => `/${brandLocale(b)}/${BRAND_BASE[brandLocale(b)]}/${brandSlug(b)}/`;

const visible = (b: Brand) => import.meta.env.DEV || !b.data.draft;

export async function getBrands(locale?: Locale): Promise<Brand[]> {
	const all = await getCollection("brands", visible);
	return all.filter((b) => !locale || brandLocale(b) === locale).sort((a, b) => a.data.name.localeCompare(b.data.name));
}

export async function brandAlternates(b: Brand): Promise<Partial<Record<Locale, string>>> {
	const all = await getBrands();
	const out: Partial<Record<Locale, string>> = {};
	for (const l of LOCALES) {
		const match = all.find((x) => x.data.brandKey === b.data.brandKey && brandLocale(x) === l);
		if (match) out[l] = brandUrl(match);
	}
	return out;
}

/** One ranked product of a brand, with where it sits in its ranking. */
export interface BrandProduct {
	p: RankedProduct;
	ranking: Ranking;
	pos: number;
	of: number;
	score: number;
	url: string;
}

/** All products of this brand in the rankings of the brand page's market, best score first. */
export async function brandProducts(b: Brand): Promise<BrandProduct[]> {
	const rankings = await getRankings(brandLocale(b));
	const out: BrandProduct[] = [];
	for (const r of rankings) {
		const list = ranked(r);
		list.forEach((p, i) => {
			if (p.brand === b.data.match) out.push({ p, ranking: r, pos: i + 1, of: list.length, score: total(p), url: `${rankingUrl(r)}#p-${p.id}` });
		});
	}
	return out.sort((x, y) => points(y.p) - points(x.p) || x.ranking.data.name.localeCompare(y.ranking.data.name));
}

/** Average of each criterion and of the total score (one decimal), for the brand profile. */
export function brandProfile(list: BrandProduct[]): { avg: number; byCriterion: Record<Criterion, number> } {
	const n = list.length || 1;
	const r1 = (x: number) => Math.round(x * 10) / 10;
	const byCriterion = Object.fromEntries(CRITERIA.map((c) => [c, r1(list.reduce((s, x) => s + x.p.scores[c], 0) / n)])) as Record<Criterion, number>;
	return { avg: r1(list.reduce((s, x) => s + x.score, 0) / n), byCriterion };
}

/** Brand page of a product's brand in the same locale (for "More from {brand}" links on rankings). */
export async function brandFor(brandName: string, locale: Locale): Promise<Brand | undefined> {
	return (await getBrands(locale)).find((b) => b.data.match === brandName);
}

/** Brand pages whose `linkFrom` lists this guide (same locale). */
export async function brandsForGuide(translationKey: string, locale: Locale): Promise<Brand[]> {
	return (await getBrands(locale)).filter((b) => b.data.linkFrom.includes(translationKey));
}
