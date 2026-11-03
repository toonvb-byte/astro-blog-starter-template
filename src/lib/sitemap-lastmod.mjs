/**
 * <lastmod> for the sitemap (used by @astrojs/sitemap's serialize in astro.config.mjs).
 *
 * Only dates that mean "the content really changed" are used, so Google can trust them:
 * - Guides:      updatedDate, else publishDate (Keystatic: "Last updated").
 * - Hubs:        updatedDate, else publishDate (Keystatic: "Last checked").
 * - Rankings:    the latest of publishDate, updatedDate and checked (label/price check date).
 * - Index pages: the newest date among the pages they list (home = newest of everything in that language).
 * - News:        updatedDate, else publishDate; the news index = newest of its items.
 * - Glossary:    GLOSSARY_CHECKED in src/lib/glossary.ts.
 * - Finder:      the later of the finder data check date and PAGE_UPDATED.finder below.
 * Pages without a meaningful date (legal, about, contact…) get no <lastmod>, which is better than a wrong one.
 * Read at config time, so this parses the files itself instead of using astro:content.
 */
import fs from "node:fs";
import path from "node:path";
import { LOCALES, ROUTES, RANKING_BASE } from "../i18n/config.ts";

/** Bump when a page built from code (not content files) changes significantly. */
const PAGE_UPDATED = { finder: "2026-11-02" };

const ROOT = process.cwd();
const DATE = /^\d{4}-\d{2}-\d{2}/;

/** Top-level scalar keys of a Markdown file's YAML frontmatter (enough for dates and flags). */
function frontmatter(file) {
	const m = fs.readFileSync(file, "utf8").match(/^---\r?\n([\s\S]*?)\r?\n---/);
	const out = {};
	if (!m) return out;
	for (const line of m[1].split(/\r?\n/)) {
		const kv = line.match(/^([A-Za-z]\w*):\s*['"]?([^'"#]*?)['"]?\s*$/);
		if (kv) out[kv[1]] = kv[2];
	}
	return out;
}
const day = (v) => (typeof v === "string" && DATE.test(v) ? v.slice(0, 10) : undefined);
const latest = (...ds) => ds.filter(Boolean).sort().at(-1);

function collection(dir) {
	const out = [];
	const base = path.join(ROOT, "src/content", dir);
	if (!fs.existsSync(base)) return out;
	for (const locale of fs.readdirSync(base)) {
		const ldir = path.join(base, locale);
		if (!LOCALES.includes(locale) || !fs.statSync(ldir).isDirectory()) continue;
		for (const f of fs.readdirSync(ldir).filter((x) => /\.mdx?$/.test(x))) {
			const fm = frontmatter(path.join(ldir, f));
			if (fm.draft === "true") continue;
			out.push({ locale, slug: f.replace(/\.mdx?$/, ""), fm });
		}
	}
	return out;
}

let cache;
function build() {
	const map = new Map();
	const byLocale = () => Object.fromEntries(LOCALES.map((l) => [l, []]));
	const guides = byLocale(), hubs = byLocale(), news = byLocale(), all = byLocale();
	const set = (url, d, bucket, locale) => {
		if (!d) return;
		map.set(url, d);
		bucket?.[locale]?.push(d);
		all[locale]?.push(d);
	};
	for (const { locale, slug, fm } of collection("guides")) {
		set(`/${locale}/${ROUTES.guides[locale]}/${slug}/`, day(fm.updatedDate) ?? day(fm.publishDate), guides, locale);
	}
	for (const { locale, slug, fm } of collection("hubs")) {
		set(`/${locale}/${ROUTES.supplements[locale]}/${slug}/`, day(fm.updatedDate) ?? day(fm.publishDate), hubs, locale);
	}
	for (const { locale, slug, fm } of collection("news")) {
		set(`/${locale}/${ROUTES.news[locale]}/${slug}/`, day(fm.updatedDate) ?? day(fm.publishDate), news, locale);
	}
	for (const { locale, slug, fm } of collection("rankings")) {
		if (!RANKING_BASE[locale]) continue;
		set(`/${locale}/${RANKING_BASE[locale]}/${slug}/`, latest(day(fm.publishDate), day(fm.updatedDate), day(fm.checked)), null, locale);
	}
	const glossary = fs.readFileSync(path.join(ROOT, "src/lib/glossary.ts"), "utf8").match(/GLOSSARY_CHECKED\s*=\s*"(\d{4}-\d{2}-\d{2})"/)?.[1];
	const finderData = JSON.parse(fs.readFileSync(path.join(ROOT, "scripts/seed/finder-data.json"), "utf8"));
	const finder = latest(day(finderData.meta?.checked), PAGE_UPDATED.finder);
	for (const l of LOCALES) {
		if (glossary) map.set(`/${l}/${ROUTES.glossary[l]}/`, glossary);
		if (finder) map.set(`/${l}/${ROUTES.finder[l]}/`, finder);
		const g = latest(...guides[l]);
		const h = latest(...hubs[l]);
		if (g) map.set(`/${l}/${ROUTES.guides[l]}/`, g);
		if (h) map.set(`/${l}/${ROUTES.supplements[l]}/`, h);
		const n = latest(...news[l]);
		if (n) map.set(`/${l}/${ROUTES.news[l]}/`, n);
		const home = latest(...all[l]);
		if (home) map.set(`/${l}/`, home);
	}
	return map;
}

/** YYYY-MM-DD for a page URL (absolute or path), or undefined. */
export function lastmodFor(url) {
	cache ??= build();
	let p = url.startsWith("http") ? new URL(url).pathname : url;
	if (!p.endsWith("/")) p += "/";
	return cache.get(p);
}

/** For checks: every URL with a date. */
export function lastmodMap() {
	cache ??= build();
	return cache;
}
