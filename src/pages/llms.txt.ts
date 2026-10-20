import type { APIRoute } from "astro";
import { LOCALES, path } from "../i18n/config";
import { getGuides, guideUrl, guideLocale } from "../lib/guides";
import { SITE_NAME, SITE_URL } from "../lib/site";

/**
 * /llms.txt — a plain-text index for AI assistants and answer engines (llmstxt.org format):
 * what the site is, how it sources health statements, and every published guide per language.
 */
export const prerender = true;

const LANG: Record<string, string> = { en: "English", es: "Español", de: "Deutsch" };

export const GET: APIRoute = async () => {
	const guides = await getGuides();
	const abs = (p: string) => new URL(p, SITE_URL).href;
	const lines: string[] = [
		`# ${SITE_NAME}`,
		"",
		"> Independent, multilingual guides and price comparisons for food supplements in Europe (Spain and Germany first). Products are compared by cost per effective dose. Every health statement links to an official source: the EU Register of nutrition and health claims, EFSA, national authorities (AESAN, BfR) or systematic reviews. Health claims are only described in their EU-authorised wording. Not medical advice.",
		"",
		`- Methodology and editorial policy: ${abs(path("en", "about"))}`,
		`- Affiliate disclosure: ${abs(path("en", "disclosure"))}`,
		`- Supplement goal finder (evidence by goal): ${abs(path("en", "finder"))}`,
	];
	for (const l of LOCALES) {
		const list = guides.filter((g) => guideLocale(g) === l);
		if (!list.length) continue;
		lines.push("", `## Guides — ${LANG[l] ?? l}`, "");
		for (const g of list) lines.push(`- [${g.data.title}](${abs(guideUrl(g))}): ${g.data.description.replace(/\s+/g, " ").trim()}`);
	}
	return new Response(lines.join("\n") + "\n", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
