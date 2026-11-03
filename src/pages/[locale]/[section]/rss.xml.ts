import type { APIRoute, GetStaticPaths } from "astro";
import { LOCALES, ROUTES, OG_LOCALE, path, type Locale } from "../../../i18n/config";
import { useT } from "../../../i18n/ui";
import { getNews, newsModified, newsUrl } from "../../../lib/news";
import { KIND_LABEL, REGION_LABEL } from "../../../lib/news-meta";
import { SITE_NAME, SITE_URL } from "../../../lib/site";

/** RSS 2.0 feed of the news section per language: /en/news/rss.xml, /es/noticias/rss.xml, /de/aktuelles/rss.xml. */
export const prerender = true;

export const getStaticPaths = (() =>
	LOCALES.map((locale) => ({ params: { locale, section: ROUTES.news[locale] } }))) satisfies GetStaticPaths;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const GET: APIRoute = async ({ params }) => {
	const locale = params.locale as Locale;
	const t = useT(locale);
	const items = (await getNews(locale)).slice(0, 50);
	const home = new URL(path(locale, "news"), SITE_URL).href;
	const self = `${home}rss.xml`;
	const latest = items.reduce<Date | undefined>((m, n) => (!m || +newsModified(n) > +m ? newsModified(n) : m), undefined);
	const xml = [
		`<?xml version="1.0" encoding="UTF-8"?>`,
		`<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">`,
		`<channel>`,
		`<title>${esc(`${SITE_NAME} · ${t("news.h1")}`)}</title>`,
		`<link>${home}</link>`,
		`<atom:link href="${self}" rel="self" type="application/rss+xml"/>`,
		`<description>${esc(t("news.description"))}</description>`,
		`<language>${OG_LOCALE[locale].replace("_", "-").toLowerCase()}</language>`,
		...(latest ? [`<lastBuildDate>${latest.toUTCString()}</lastBuildDate>`] : []),
		...items.map((n) => {
			const url = new URL(newsUrl(n), SITE_URL).href;
			return [
				`<item>`,
				`<title>${esc(n.data.title)}</title>`,
				`<link>${url}</link>`,
				`<guid isPermaLink="true">${url}</guid>`,
				`<pubDate>${n.data.publishDate.toUTCString()}</pubDate>`,
				`<category>${esc(n.data.place?.trim() || REGION_LABEL[locale][n.data.region])}</category>`,
				`<category>${esc(KIND_LABEL[locale][n.data.kind])}</category>`,
				`<description>${esc(n.data.dek)}</description>`,
				`</item>`,
			].join("");
		}),
		`</channel>`,
		`</rss>`,
	].join("\n");
	return new Response(xml + "\n", { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
};
