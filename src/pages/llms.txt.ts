import type { APIRoute } from "astro";
import { LOCALES, RANKING_BASE, path } from "../i18n/config";
import { getGuides, guideUrl, guideLocale } from "../lib/guides";
import { getHubs, hubUrl, hubLocale } from "../lib/hubs";
import { getRankings, rankingUrl, rankingLocale } from "../lib/rankings";
import { getNews, newsUrl, newsLocale } from "../lib/news";
import { SITE_NAME, SITE_URL } from "../lib/site";
import { loadLegalStatus, countryName, STATUS_LABEL } from "../lib/rehype-country-status.mjs";

/**
 * /llms.txt — a plain-text index for AI assistants and answer engines (llmstxt.org format):
 * what the site is, how it sources health statements, and every published guide per language.
 */
export const prerender = true;

const LANG: Record<string, string> = { en: "English", es: "Español", de: "Deutsch" };

export const GET: APIRoute = async () => {
	const guides = await getGuides();
	const hubs = await getHubs();
	const abs = (p: string) => new URL(p, SITE_URL).href;
	const lines: string[] = [
		`# ${SITE_NAME}`,
		"",
		"> Independent, multilingual guides and price comparisons for food supplements in the UK and Europe. The English edition follows the rules in Great Britain first (GB nutrition and health claims register, NHS advice, FSA/COT and MHRA positions) and notes where the EU and Northern Ireland differ; the Spanish and German editions follow EU, Spanish and German rules. Products are compared by the real amount per daily dose on the label (price is not scored yet); product checks cover Spain and Germany so far. Every health statement links to an official source: the GB or EU claims register, the NHS, EFSA, national authorities (FSA, AESAN, BfR) or systematic reviews. Health claims are only described in their authorised wording. Not medical advice.",
		"",
		`- Methodology and editorial policy: ${abs(path("en", "about"))}`,
		`- Affiliate disclosure: ${abs(path("en", "disclosure"))}`,
		`- Supplement goal finder (evidence by goal): ${abs(path("en", "finder"))}`,
		`- Supplements A–Z (one page per ingredient: forms, doses, UK/EU claims, NHS and EFSA limits, label-checked products): ${abs(path("en", "supplements"))}`,
		`- Glossary of ingredients, label forms and UK/EU legal terms, with NRVs, NHS and EFSA upper levels and UK/EU claim status: ${abs(path("en", "glossary"))} (Español: ${abs(path("es", "glossary"))}, Deutsch: ${abs(path("de", "glossary"))})`,
		`- Supplement news (rule changes, safety alerts, product tests and studies for the UK, Spain, Germany and the EU, each with its official source and what it means for readers): ${abs(path("en", "news"))} (Español: ${abs(path("es", "news"))}, Deutsch: ${abs(path("de", "news"))}); RSS: ${abs(path("en", "news"))}rss.xml`,
	];
	// Country-by-country legal status (same data as the tables in the guides, src/data/legal-status/).
	const legal = Object.values(loadLegalStatus());
	if (legal.length) {
		lines.push("", "## Legal status by country (food supplements)", "");
		for (const d of legal) {
			const guideUrlEn = d.guide?.en ? abs(`/en/guides/${d.guide.en}/`) : "";
			lines.push(`### ${d.name.en} — checked ${d.checked}${guideUrlEn ? ` — full table: ${guideUrlEn}#cs-${d.id}` : ""}`, "");
			for (const r of d.rows) {
				const status = STATUS_LABEL.en[r.status] + (r.limit ? `, ${r.limit.en}` : "");
				const src = r.sources.map((x: { title: string; url: string }) => `${x.title} (${x.url})`).join("; ");
				lines.push(`- ${countryName(r.code, "en")}: ${status}. ${r.rule.en} Source: ${src}`);
			}
			lines.push("");
		}
	}
	for (const l of LOCALES) {
		const list = hubs.filter((h) => hubLocale(h) === l);
		if (!list.length) continue;
		lines.push("", `## Supplement pages — ${LANG[l] ?? l}`, "");
		for (const h of list) lines.push(`- [${h.data.title}](${abs(hubUrl(h))}): ${h.data.description.replace(/\s+/g, " ").trim()}`);
	}
	const rankings = await getRankings();
	for (const l of LOCALES) {
		const list = rankings.filter((r) => rankingLocale(r) === l);
		if (!list.length) continue;
		lines.push(
			"",
			`## Rankings — ${LANG[l] ?? l} (${l === "es" ? "Amazon.es" : "Amazon.de"} market; label-verified products only, scored on dose, form, label honesty, additives and practicality; weights shown on each page; price not scored)`,
			"",
		);
		lines.push(`- All rankings in this market: ${abs(`/${l}/${RANKING_BASE[l]}/`)}`);
		for (const r of list) lines.push(`- [${r.data.title}](${abs(rankingUrl(r))}): ${r.data.description.replace(/\s+/g, " ").trim()}`);
	}
	const news = await getNews();
	for (const l of LOCALES) {
		const list = news.filter((n) => newsLocale(n) === l);
		if (!list.length) continue;
		lines.push("", `## News — ${LANG[l] ?? l}`, "");
		for (const n of list) lines.push(`- [${n.data.title}](${abs(newsUrl(n))}) (${n.data.eventDate.toISOString().slice(0, 10)}): ${n.data.description.replace(/\s+/g, " ").trim()}`);
	}
	for (const l of LOCALES) {
		const list = guides.filter((g) => guideLocale(g) === l);
		if (!list.length) continue;
		lines.push("", `## Guides — ${LANG[l] ?? l}`, "");
		for (const g of list) lines.push(`- [${g.data.title}](${abs(guideUrl(g))}): ${g.data.description.replace(/\s+/g, " ").trim()}`);
	}
	return new Response(lines.join("\n") + "\n", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
