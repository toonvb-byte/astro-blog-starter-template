/**
 * Rehype plugin: links the first mention of glossary terms in guide and supplement-page bodies
 * (src/content/{guides,hubs}/{locale}/*.mdx) to /{locale}/{glossary}/#{id}.
 *
 * - Terms and their spellings per language: src/data/glossary/link-terms.mjs.
 * - One link per term per page, at most MAX_LINKS per page (lower priority number wins).
 * - Never inside headings, existing links, code, table headers or buttons.
 * - Fails the build if a term points to a glossary id that doesn't exist.
 * Frontmatter text (takeaways, FAQ, hub facts) is rendered separately and is not touched.
 */
import fs from "node:fs";
import path from "node:path";
import { LINK_TERMS } from "../data/glossary/link-terms.mjs";

const LOCALES = ["en", "es", "de"];
/** Keep in sync with ROUTES.glossary in src/i18n/config.ts */
const ROUTE = { en: "glossary", es: "glosario", de: "glossar" };
const LABEL = { en: "Glossary", es: "Glosario", de: "Glossar" };
const MAX_LINKS = 8;
const SKIP = new Set(["a", "h1", "h2", "h3", "h4", "h5", "h6", "code", "pre", "kbd", "script", "style", "button", "summary", "th", "dt", "label"]);
// Word boundaries that also work next to accented letters (á, ü, ß…).
const B = "(?<![\\p{L}\\p{N}_-])";
const E = "(?![\\p{L}\\p{N}_])";

function loadGlossaryNames() {
	const dir = path.join(process.cwd(), "src/data/glossary");
	const names = {};
	for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json"))) {
		for (const e of JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"))) {
			names[e.id] = { en: e.en.name, es: e.es.name, de: e.de.name };
		}
	}
	return names;
}

export default function rehypeGlossaryLinks() {
	const names = loadGlossaryNames();
	const compiled = {};
	for (const loc of LOCALES) {
		compiled[loc] = LINK_TERMS.filter((t) => t[loc]?.length).map((t) => {
			if (!names[t.id]) throw new Error(`Glossary link term "${t.id}" has no entry in src/data/glossary/*.json`);
			const source = t[loc].map((s) => `${B}(?:${s})${E}`).join("|");
			return { id: t.id, prio: t.p, re: new RegExp(source, t.cs ? "u" : "iu") };
		});
	}

	return (tree, file) => {
		const fp = String(file?.path ?? file?.history?.[0] ?? "").replace(/\\/g, "/");
		const m = fp.match(/\/src\/content\/(?:guides|hubs)\/(en|es|de)\//);
		if (!m) return;
		const loc = m[1];

		// Text nodes in document order, outside skipped elements.
		const texts = [];
		const walk = (node, parent, skip) => {
			if (node.type === "text") {
				if (!skip && parent && node.value.trim()) texts.push({ node, parent });
				return;
			}
			const isSkipped =
				skip ||
				(node.type === "element" && SKIP.has(node.tagName)) ||
				((node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement") && typeof node.name === "string" && SKIP.has(node.name.toLowerCase()));
			for (const child of node.children ?? []) walk(child, node, isSkipped);
		};
		walk(tree, null, false);
		if (!texts.length) return;

		// First occurrence of each term.
		const candidates = [];
		for (const term of compiled[loc]) {
			for (let i = 0; i < texts.length; i++) {
				const hit = term.re.exec(texts[i].node.value);
				if (hit) {
					candidates.push({ id: term.id, prio: term.prio, i, start: hit.index, end: hit.index + hit[0].length, text: hit[0] });
					break;
				}
			}
		}

		// Highest priority first, then earliest on the page; no overlapping matches.
		candidates.sort((a, b) => a.prio - b.prio || a.i - b.i || a.start - b.start);
		const chosen = [];
		for (const c of candidates) {
			if (chosen.length >= MAX_LINKS) break;
			if (chosen.some((o) => o.i === c.i && c.start < o.end && o.start < c.end)) continue;
			chosen.push(c);
		}

		// Split the affected text nodes into text + link + text.
		const byNode = new Map();
		for (const c of chosen) byNode.set(c.i, [...(byNode.get(c.i) ?? []), c]);
		for (const [i, list] of byNode) {
			const { node, parent } = texts[i];
			list.sort((a, b) => a.start - b.start);
			const pieces = [];
			let cursor = 0;
			for (const c of list) {
				if (c.start > cursor) pieces.push({ type: "text", value: node.value.slice(cursor, c.start) });
				pieces.push({
					type: "element",
					tagName: "a",
					properties: {
						href: `/${loc}/${ROUTE[loc]}/#${c.id}`,
						className: ["gl-term"],
						title: `${LABEL[loc]}: ${names[c.id][loc]}`,
					},
					children: [{ type: "text", value: c.text }],
				});
				cursor = c.end;
			}
			if (cursor < node.value.length) pieces.push({ type: "text", value: node.value.slice(cursor) });
			const idx = parent.children.indexOf(node);
			if (idx >= 0) parent.children.splice(idx, 1, ...pieces);
		}
	};
}
