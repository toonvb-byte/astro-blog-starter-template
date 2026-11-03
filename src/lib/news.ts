import { getCollection, type CollectionEntry } from "astro:content";
import { LOCALES, isLocale, path, type Locale } from "../i18n/config";

export type NewsItem = CollectionEntry<"news">;

/** Locale + URL slug come from the file path: {locale}/{slug}.mdx */
export function newsLocale(n: NewsItem): Locale {
	const l = n.id.split("/")[0];
	if (!isLocale(l)) throw new Error(`News item "${n.id}" is not inside a locale folder (en/, es/, de/)`);
	return l;
}
export const newsSlug = (n: NewsItem) => n.id.split("/").slice(1).join("/");
export const newsUrl = (n: NewsItem) => path(newsLocale(n), "news", newsSlug(n));

const visible = (n: NewsItem) => import.meta.env.DEV || !n.data.draft;

/** Newest first: by the date the news happened, then by our publish date. */
export async function getNews(locale?: Locale): Promise<NewsItem[]> {
	const all = await getCollection("news", visible);
	return all
		.filter((n) => !locale || newsLocale(n) === locale)
		.sort((a, b) => +b.data.eventDate - +a.data.eventDate || +b.data.publishDate - +a.data.publishDate || a.data.title.localeCompare(b.data.title));
}

/** hreflang map for a news item: only translations that exist. */
export async function newsAlternates(n: NewsItem): Promise<Partial<Record<Locale, string>>> {
	const all = await getNews();
	const out: Partial<Record<Locale, string>> = {};
	for (const l of LOCALES) {
		const match = all.find((x) => x.data.newsKey === n.data.newsKey && newsLocale(x) === l);
		if (match) out[l] = newsUrl(match);
	}
	return out;
}

/** Latest date on a news item (for dateModified and the sitemap). */
export const newsModified = (n: NewsItem) => n.data.updatedDate ?? n.data.publishDate;

/** News items (same locale) that list a hub or guide as related — for "In the news" on those pages. */
export async function newsFor(locale: Locale, ref: { hub?: string; guide?: string }, limit = 3): Promise<NewsItem[]> {
	const list = await getNews(locale);
	return list
		.filter((n) => (ref.hub && n.data.hubs.includes(ref.hub)) || (ref.guide && n.data.guides.includes(ref.guide)))
		.slice(0, limit);
}
