/**
 * "Keep reading" on guides: picks related guides by shared ingredient and shared supplement page (hub),
 * not by category. Same language only.
 *
 * Signals, strongest first (weights in W):
 * - topic:   both guides are about the same ingredient. An ingredient is a guide's topic when the name of its
 *            ingredient hub (Magnesio, Eisen, Vitamin C…) appears in the guide's title in any language
 *            version, so ES/DE/EN versions get the same topics and German compounds (Eisenhaltige) are covered.
 * - hub:     both guides are listed on the same supplement page (hub `guides:` list). Ingredient hubs weigh
 *            more than goal hubs. Divided by √(number of hubs the candidate is on), so cross-cutting guides
 *            (EU claims table, label guide) don't crowd out ingredient-specific ones.
 * - cross:   one guide is about an ingredient whose hub lists the other.
 * - links:   this guide links to the candidate in its body (author's choice), or the candidate links back.
 * - category: tie-breaker only.
 * Equal scores keep the newest first. Guides with nothing in common (score < 1) are left out, so a page may
 * show 2 cards instead of an off-topic third; at least MIN are shown.
 */
import { getCollection } from "astro:content";
import type { Locale } from "../i18n/config";
import { getGuides, guideLocale, guideUrl, type Guide } from "./guides";
import { hubLocale, type Hub } from "./hubs";

const W = { topic: 6, ingredientHub: 3, goalHub: 2, cross: 2, linksTo: 2, linkedFrom: 1, category: 0.5 };
const MIN = 2;

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** Hub name → title patterns. "Cúrcuma y curcumina" → both words. German: prefix match for compounds. */
function namePatterns(name: string, locale: Locale): RegExp[] {
	const end = locale === "de" ? "" : "(?!\\p{L})";
	return name
		.split(/\s+(?:y|und|and|&)\s+/i)
		.map((p) => p.trim())
		.filter(Boolean)
		.map((p) => new RegExp(`(?<![\\p{L}\\p{N}_-])${esc(p)}${end}`, "iu"));
}

interface Index {
	/** translationKey → hubKeys of the ingredients the guide is about (any language) */
	topics: Map<string, Set<string>>;
	/** `${locale}:${translationKey}` → hubKeys of the hubs (same locale) that list the guide */
	member: Map<string, Set<string>>;
	/** `${locale}:${hubKey}` → hub kind */
	kind: Map<string, "ingredient" | "goal">;
}
let cached: Promise<Index> | undefined;

async function buildIndex(): Promise<Index> {
	const [guides, hubs] = await Promise.all([getGuides(), getCollection("hubs", (h: Hub) => import.meta.env.DEV || !h.data.draft)]);
	const kind = new Map<string, "ingredient" | "goal">();
	const member = new Map<string, Set<string>>();
	const patterns: { locale: Locale; hubKey: string; re: RegExp[] }[] = [];
	for (const h of hubs) {
		const l = hubLocale(h);
		kind.set(`${l}:${h.data.hubKey}`, h.data.kind);
		if (h.data.kind === "ingredient") patterns.push({ locale: l, hubKey: h.data.hubKey, re: namePatterns(h.data.name, l) });
		for (const key of h.data.guides) {
			const k = `${l}:${key}`;
			if (!member.has(k)) member.set(k, new Set());
			member.get(k)!.add(h.data.hubKey);
		}
	}
	const topics = new Map<string, Set<string>>();
	for (const g of guides) {
		const l = guideLocale(g);
		const set = topics.get(g.data.translationKey) ?? new Set<string>();
		for (const p of patterns) if (p.locale === l && p.re.some((re) => re.test(g.data.title))) set.add(p.hubKey);
		topics.set(g.data.translationKey, set);
	}
	return { topics, member, kind };
}

const none = new Set<string>();
const intersect = (a: Set<string>, b: Set<string>) => [...a].filter((x) => b.has(x));

/** Up to `n` related guides in the guide's own language. */
export async function relatedGuides(guide: Guide, n = 3): Promise<Guide[]> {
	cached ??= buildIndex();
	const { topics, member, kind } = await cached;
	const locale = guideLocale(guide);
	const d = guide.data;
	const body = guide.body ?? "";
	const url = guideUrl(guide);
	const tG = topics.get(d.translationKey) ?? none;
	const mG = member.get(`${locale}:${d.translationKey}`) ?? none;

	const score = (c: Guide) => {
		const tC = topics.get(c.data.translationKey) ?? none;
		const mC = member.get(`${locale}:${c.data.translationKey}`) ?? none;
		const sharedTopics = intersect(tG, tC);
		let s = W.topic * sharedTopics.length;
		for (const h of intersect(mG, mC)) {
			s += (kind.get(`${locale}:${h}`) === "goal" ? W.goalHub : W.ingredientHub) / Math.sqrt(mC.size);
		}
		const cross = new Set([...intersect(tG, mC), ...intersect(tC, mG)].filter((h) => !sharedTopics.includes(h)));
		if (cross.size) s += W.cross;
		if (body.includes(guideUrl(c))) s += W.linksTo;
		if ((c.body ?? "").includes(url)) s += W.linkedFrom;
		if (c.data.category === d.category) s += W.category;
		return s;
	};

	const ranked = (await getGuides(locale))
		.filter((g) => g.id !== guide.id)
		.map((g, i) => ({ g, s: score(g), i }))
		.sort((a, b) => b.s - a.s || a.i - b.i);
	// Only guides with a real connection (a shared hub, topic or link — not just the category);
	// pad to MIN with the next best so the block never shows a single lonely card.
	const strong = ranked.filter((x) => x.s >= 1);
	return (strong.length >= MIN ? strong : ranked.slice(0, MIN)).slice(0, n).map((x) => x.g);
}
