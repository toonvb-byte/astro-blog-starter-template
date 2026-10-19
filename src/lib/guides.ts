import { getCollection, type CollectionEntry } from "astro:content";
import { LOCALES, isLocale, path, type Locale } from "../i18n/config";

export type Guide = CollectionEntry<"guides">;

/** Locale + URL slug come from the file path: {locale}/{slug}.mdx */
export function guideLocale(g: Guide): Locale {
	const l = g.id.split("/")[0];
	if (!isLocale(l)) throw new Error(`Guide "${g.id}" is not inside a locale folder (en/, es/, de/)`);
	return l;
}
export const guideSlug = (g: Guide) => g.id.split("/").slice(1).join("/");

const visible = (g: Guide) => import.meta.env.DEV || !g.data.draft;

export async function getGuides(locale?: Locale): Promise<Guide[]> {
	const all = await getCollection("guides", visible);
	return all
		.filter((g) => !locale || guideLocale(g) === locale)
		.sort((a, b) => +(b.data.updatedDate ?? b.data.publishDate) - +(a.data.updatedDate ?? a.data.publishDate));
}

export const guideUrl = (g: Guide) => path(guideLocale(g), "guides", guideSlug(g));

/** hreflang map for a guide: only translations that exist. */
export async function guideAlternates(g: Guide): Promise<Partial<Record<Locale, string>>> {
	const all = await getGuides();
	const out: Partial<Record<Locale, string>> = {};
	for (const l of LOCALES) {
		const match = all.find((x) => x.data.translationKey === g.data.translationKey && guideLocale(x) === l);
		if (match) out[l] = guideUrl(match);
	}
	return out;
}

/** Minimal inline markdown for frontmatter strings (**bold** only). */
export const inlineMd = (s: string) =>
	s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
