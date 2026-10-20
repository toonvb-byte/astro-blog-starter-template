import { getCollection, type CollectionEntry } from "astro:content";
import { LOCALES, isLocale, path, type Locale } from "../i18n/config";
import { HUB_GROUPS } from "./hub-groups";
import FINDER from "../../scripts/seed/finder-data.json";

export type Hub = CollectionEntry<"hubs">;

/** Locale + URL slug come from the file path: {locale}/{slug}.mdx */
export function hubLocale(h: Hub): Locale {
	const l = h.id.split("/")[0];
	if (!isLocale(l)) throw new Error(`Hub "${h.id}" is not inside a locale folder (en/, es/, de/)`);
	return l;
}
export const hubSlug = (h: Hub) => h.id.split("/").slice(1).join("/");
export const hubUrl = (h: Hub) => path(hubLocale(h), "supplements", hubSlug(h));

const visible = (h: Hub) => import.meta.env.DEV || !h.data.draft;

/** All hubs (optionally one locale), goal hubs first, then by group and order. */
export async function getHubs(locale?: Locale): Promise<Hub[]> {
	const all = await getCollection("hubs", visible);
	const g = (h: Hub) => (h.data.kind === "goal" ? -1 : HUB_GROUPS.indexOf(h.data.group));
	return all
		.filter((h) => !locale || hubLocale(h) === locale)
		.sort((a, b) => g(a) - g(b) || a.data.order - b.data.order || a.data.name.localeCompare(b.data.name));
}

export async function hubAlternates(h: Hub): Promise<Partial<Record<Locale, string>>> {
	const all = await getHubs();
	const out: Partial<Record<Locale, string>> = {};
	for (const l of LOCALES) {
		const match = all.find((x) => x.data.hubKey === h.data.hubKey && hubLocale(x) === l);
		if (match) out[l] = hubUrl(match);
	}
	return out;
}

/** Hubs (same locale) that list a guide's translationKey — used for the "part of" link on articles. */
export async function hubsForGuide(translationKey: string, locale: Locale): Promise<Hub[]> {
	const k = (h: Hub) => (h.data.kind === "ingredient" ? 0 : 1);
	return (await getHubs(locale)).filter((h) => h.data.guides.includes(translationKey)).sort((a, b) => k(a) - k(b));
}

// ---------- Finder data (label-checked products and the goal → ingredient evidence map) ----------

type L10n = { en: string; es: string; de: string };
export interface FinderIngredient extends L10n { id: string; unit: string; effective: number }
export interface FinderProduct {
	id: string;
	brand: string;
	name: string;
	dose: L10n;
	pack?: string;
	vegan?: boolean;
	markets: Record<string, "verified" | "likely">;
	ingredients: { i: string; amt: number | null; form?: string | null }[];
	source?: string;
	note?: Partial<L10n>;
	/** Explicit hub membership (hubKeys). When set, it replaces the main-ingredient rule. */
	hubs?: string[];
	flags?: L10n[];
	partial?: boolean;
	excluded?: string;
	checked?: string;
}
export interface GoalLink extends L10n { g: string; i: string; ev: 1 | 2 | 3; claim: boolean; cond?: boolean | null }

const D = FINDER as unknown as {
	meta: { checked: string; evidenceScale: Record<string, L10n> };
	goals: (L10n & { id: string })[];
	ingredients: FinderIngredient[];
	goalIngredients: GoalLink[];
	products: FinderProduct[];
};

export const finderChecked = D.meta.checked;
export const evidenceLabel = (ev: number, locale: Locale) => D.meta.evidenceScale[String(ev)]?.[locale] ?? String(ev);
export const ingredient = (id: string) => D.ingredients.find((i) => i.id === id);

/**
 * Products for a hub. A product belongs to an ingredient hub when its main (first-listed) ingredient is one of the
 * hub's finderIngredients, or — if the product has an explicit `hubs` list — only when that list names the hub.
 * Goal hubs use the main-ingredient rule over the goal's ingredients. Sorted A–Z by brand and name.
 */
export function productsFor(ids: string[], hubKey?: string): FinderProduct[] {
	const inHub = (p: FinderProduct) =>
		p.hubs?.length ? Boolean(hubKey && p.hubs.includes(hubKey)) : ids.includes(p.ingredients[0]?.i);
	return D.products
		.filter((p) => !p.excluded && inHub(p))
		.sort((a, b) => `${a.brand} ${a.name}`.localeCompare(`${b.brand} ${b.name}`));
}

/** Latest label-check date among the given products (falls back to the dataset date). */
export const checkedDate = (ps: FinderProduct[]) =>
	ps.map((p) => p.checked ?? D.meta.checked).sort().at(-1) ?? D.meta.checked;

/** Evidence rows for a finder goal, strongest first. */
export function goalRows(goalId: string): GoalLink[] {
	return D.goalIngredients.filter((r) => r.g === goalId).sort((a, b) => b.ev - a.ev || Number(b.claim) - Number(a.claim));
}

/** Format an amount with the locale's decimal separator. */
export function amount(n: number | null | undefined, unit: string, locale: Locale): string | null {
	if (n === null || n === undefined) return null;
	const s = new Intl.NumberFormat(locale === "en" ? "en-GB" : locale === "es" ? "es-ES" : "de-DE", { maximumFractionDigits: 2 }).format(n);
	const u = unit === "bn CFU" ? (locale === "de" ? "Mrd. KBE" : locale === "es" ? "mil millones UFC" : "bn CFU") : unit;
	return `${s} ${u}`;
}
