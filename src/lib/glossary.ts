/**
 * Glossary of ingredients, nutrients, label forms and legal terms (EN/ES/DE).
 * Data: src/data/glossary/{group}.json — one file per section, edited in code (not Keystatic).
 * Every entry with a health statement carries at least one official source in `src`.
 * Entry ids are stable anchors (/{locale}/{glossary}/#{id}) — link to them from guides and hubs.
 */
import { path, type Locale } from "../i18n/config";
import vitamins from "../data/glossary/vitamins.json";
import minerals from "../data/glossary/minerals.json";
import fats from "../data/glossary/fats.json";
import other from "../data/glossary/other.json";
import botanicals from "../data/glossary/botanicals.json";
import forms from "../data/glossary/forms.json";
import label from "../data/glossary/label.json";

export type ClaimStatus = "authorised" | "none" | "onhold" | null;
export interface GlossaryText { name: string; aka: string; desc: string; facts: string[] }
export interface GlossaryEntry {
	id: string;
	claim: ClaimStatus;
	/** hubKey of the related supplement page, if any */
	hub: string | null;
	/** translationKey of the related guide, if any */
	guide: string | null;
	/** [title, url] pairs */
	src: [string, string][];
	en: GlossaryText;
	es: GlossaryText;
	de: GlossaryText;
}

/** Date the facts (NRVs, EFSA levels, claim status) were last checked. */
export const GLOSSARY_CHECKED = "2026-10-26";

export const GLOSSARY_GROUPS = [
	{ key: "vitamins", entries: vitamins },
	{ key: "minerals", entries: minerals },
	{ key: "fats", entries: fats },
	{ key: "other", entries: other },
	{ key: "botanicals", entries: botanicals },
	{ key: "forms", entries: forms },
	{ key: "label", entries: label },
] as unknown as { key: string; entries: GlossaryEntry[] }[];

export const allGlossaryEntries = (): GlossaryEntry[] => GLOSSARY_GROUPS.flatMap((g) => g.entries);

/** Entries of one group, sorted by their name in the given language. */
export function sortedEntries(entries: GlossaryEntry[], locale: Locale): GlossaryEntry[] {
	const coll = new Intl.Collator(locale, { sensitivity: "base", numeric: true });
	return [...entries].sort((a, b) => coll.compare(a[locale].name, b[locale].name));
}

// Fail the build early on duplicate ids or missing translations.
{
	const seen = new Set<string>();
	for (const e of allGlossaryEntries()) {
		if (seen.has(e.id)) throw new Error(`Glossary: duplicate id "${e.id}"`);
		seen.add(e.id);
		for (const l of ["en", "es", "de"] as const) {
			if (!e[l]?.name || !e[l]?.desc) throw new Error(`Glossary: "${e.id}" is missing ${l} name or description`);
		}
	}
}

/** Finder ingredient id (scripts/seed/finder-data.json) → glossary id. */
export const FINDER_TO_GLOSSARY: Record<string, string> = {
	melatonin: "melatonin", magnesium: "magnesium", valerian: "valerian", passionflower: "passionflower",
	california_poppy: "california-poppy", lemon_balm: "lemon-balm", chamomile: "chamomile", lavender: "lavender",
	htp5: "5-htp", ashwagandha: "ashwagandha", l_theanine: "l-theanine", rhodiola: "rhodiola", iron: "iron",
	b12: "vitamin-b12", b6: "vitamin-b6", folate: "folate", b1: "vitamin-b1", b2: "vitamin-b2", b3: "vitamin-b3",
	b5: "vitamin-b5", vitamin_c: "vitamin-c", zinc: "zinc", vitamin_d: "vitamin-d", vitamin_k2: "vitamin-k2",
	dha: "dha", epa: "epa", creatine: "creatine", collagen: "collagen", curcuminoids: "turmeric",
	silymarin: "milk-thistle", artichoke: "artichoke", dandelion: "dandelion", psyllium: "psyllium",
	probiotics: "probiotics", biotin: "biotin", selenium: "selenium", vitamin_a: "vitamin-a",
	hyaluronic_acid: "hyaluronic-acid", glucosamine: "glucosamine", chondroitin: "chondroitin", msm: "msm", coq10: "coq10",
};

/** URL of a glossary term in a given language, e.g. /es/glosario/#nrv */
export const glossaryUrl = (locale: Locale, id: string) => `${path(locale, "glossary")}#${id}`;

// Every finder ingredient must have a glossary entry.
{
	const ids = new Set(allGlossaryEntries().map((e) => e.id));
	for (const [k, v] of Object.entries(FINDER_TO_GLOSSARY)) {
		if (!ids.has(v)) throw new Error(`Glossary: finder ingredient "${k}" maps to missing id "${v}"`);
	}
}
