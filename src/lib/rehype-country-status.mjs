/**
 * Rehype plugin: replaces a paragraph that only says [[country-status:{id}]] in a guide or supplement page
 * (src/content/{guides,hubs}/{locale}/*.mdx) with the country table from src/data/legal-status/{id}.json.
 *
 * One data file per ingredient feeds EN, ES and DE, so the three language versions can't drift apart.
 * Each row: ISO country code (or "EU"), status, optional limit, the rule in one sentence per language,
 * and at least one source. Rows get an id (#cs-melatonin-es) so a country can be linked directly.
 * The same data feeds /llms.txt (src/pages/llms.txt.ts).
 *
 * The build fails on an unknown id, a missing translation, a row without a source or a guide slug that
 * doesn't exist. It warns when a "watch" date (a pending decision) has passed, so the table gets rechecked.
 * Registered after rehype-glossary-links, so the table text is not auto-linked.
 */
import fs from "node:fs";
import path from "node:path";

const LOCALES = ["en", "es", "de"];
const DATE_FMT = { en: "en-GB", es: "es-ES", de: "de-DE" };
export const STATUS = ["supplement", "allowed", "warning", "restricted", "draft", "disputed", "banned", "medicine", "eu"];
export const STATUS_LABEL = {
	en: { supplement: "Supplement", allowed: "Allowed", warning: "Allowed, with warnings", restricted: "Restricted", draft: "Ban planned", disputed: "Disputed", banned: "Banned", medicine: "Medicine only", eu: "EU-wide" },
	es: { supplement: "Complemento", allowed: "Permitido", warning: "Permitido, con advertencias", restricted: "Restringido", draft: "Prohibición prevista", disputed: "Discutido", banned: "Prohibido", medicine: "Solo medicamento", eu: "Toda la UE" },
	de: { supplement: "Nahrungsergänzung", allowed: "Erlaubt", warning: "Erlaubt, mit Warnungen", restricted: "Eingeschränkt", draft: "Verbot geplant", disputed: "Umstritten", banned: "Verboten", medicine: "Nur Arzneimittel", eu: "EU-weit" },
};
const T = {
	en: { country: "Country", status: "Status", rule: "What the rule says", source: "Source", checked: "Checked", sources: "each row links its source", eu: "EU level", watch: "Next check", note: "National rules change. Check the date and the source before you rely on a row." },
	es: { country: "País", status: "Situación", rule: "Qué dice la norma", source: "Fuente", checked: "Revisado", sources: "cada fila enlaza su fuente", eu: "Nivel UE", watch: "Próxima revisión", note: "Las normas nacionales cambian. Mira la fecha y la fuente antes de fiarte de una fila." },
	de: { country: "Land", status: "Status", rule: "Was die Regel sagt", source: "Quelle", checked: "Geprüft", sources: "jede Zeile verlinkt ihre Quelle", eu: "EU-Ebene", watch: "Nächste Prüfung", note: "Nationale Regeln ändern sich. Prüfe Datum und Quelle, bevor du dich auf eine Zeile verlässt." },
};
/** Keep in sync with ROUTES.guides in src/i18n/config.ts */
const GUIDES = { en: "guides", es: "guias", de: "ratgeber" };
const PLACEHOLDER = /^\s*\\?\[\\?\[country-status:([a-z0-9-]+)\\?\]\\?\]\s*$/;

const fmtDate = (iso, loc) => new Date(`${iso}T12:00:00Z`).toLocaleDateString(DATE_FMT[loc], { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
export const countryName = (code, loc) => (code === "EU" ? T[loc].eu : new Intl.DisplayNames([loc], { type: "region" }).of(code === "UK" ? "GB" : code));

/** All datasets, validated. Also used by /llms.txt. */
export function loadLegalStatus() {
	const dir = path.join(process.cwd(), "src/data/legal-status");
	const out = {};
	for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json"))) {
		const d = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
		const where = `src/data/legal-status/${f}`;
		if (d.id !== f.replace(/\.json$/, "")) throw new Error(`${where}: id "${d.id}" must match the file name`);
		if (!/^\d{4}-\d{2}-\d{2}$/.test(d.checked)) throw new Error(`${where}: "checked" must be YYYY-MM-DD`);
		for (const loc of LOCALES) {
			for (const k of ["name", "caption"]) if (!d[k]?.[loc]) throw new Error(`${where}: ${k}.${loc} missing`);
			const slug = d.guide?.[loc];
			if (slug && !fs.existsSync(path.join(process.cwd(), "src/content/guides", loc, `${slug}.mdx`))) throw new Error(`${where}: guide.${loc} "${slug}" does not exist`);
		}
		const seen = new Set();
		for (const r of d.rows) {
			const id = `${where} row ${r.code}`;
			if (seen.has(r.code)) throw new Error(`${id}: duplicate country`);
			seen.add(r.code);
			if (!STATUS.includes(r.status)) throw new Error(`${id}: unknown status "${r.status}"`);
			if (!r.sources?.length || r.sources.some((s) => !s.title || !/^https?:\/\//.test(s.url ?? ""))) throw new Error(`${id}: needs at least one source with title and url`);
			for (const loc of LOCALES) {
				if (!r.rule?.[loc]) throw new Error(`${id}: rule.${loc} missing`);
				if (r.limit && !r.limit[loc]) throw new Error(`${id}: limit.${loc} missing`);
			}
		}
		const today = new Date().toISOString().slice(0, 10);
		for (const w of d.watch ?? []) {
			if (w.date < today) console.warn(`[country-status] ${d.id}: watch date ${w.date} has passed (${w.text.en}) — recheck the table and update "checked".`);
		}
		out[d.id] = d;
	}
	return out;
}

const el = (tagName, properties = {}, children = []) => ({ type: "element", tagName, properties, children });
const txt = (value) => ({ type: "text", value });
const textOf = (node) => (node.type === "text" ? node.value : (node.children ?? []).map(textOf).join(""));

function table(d, loc) {
	const t = T[loc];
	const head = el("thead", {}, [el("tr", {}, [t.country, t.status, t.rule, t.source].map((h) => el("th", { scope: "col" }, [txt(h)])))]);
	const rows = d.rows.map((r) => {
		const statusCell = [el("span", { className: ["cs-badge", `cs-${r.status}`] }, [txt(STATUS_LABEL[loc][r.status])])];
		if (r.limit) statusCell.push(el("span", { className: ["cs-limit"] }, [txt(r.limit[loc])]));
		const src = r.sources.flatMap((s, i) => [
			...(i ? [el("br")] : []),
			el("a", { href: s.url, rel: ["noopener"], target: "_blank" }, [txt(s.title)]),
		]);
		if (r.checked && r.checked !== d.checked) src.push(el("br"), el("span", { className: ["cs-checked"] }, [txt(`${t.checked}: ${fmtDate(r.checked, loc)}`)]));
		return el("tr", { id: `cs-${d.id}-${r.code.toLowerCase()}` }, [
			el("th", { scope: "row", dataLabel: t.country }, [txt(countryName(r.code, loc))]),
			el("td", { dataLabel: t.status, className: ["cs-status"] }, statusCell),
			el("td", { dataLabel: t.rule }, [txt(r.rule[loc])]),
			el("td", { dataLabel: t.source, className: ["cs-src"] }, src),
		]);
	});
	const caption = el("caption", {}, [
		el("strong", {}, [txt(d.caption[loc])]),
		txt(` · ${t.checked}: `),
		el("time", { dateTime: d.checked }, [txt(fmtDate(d.checked, loc))]),
		txt(` · ${t.sources}`),
	]);
	const children = [el("div", { className: ["table-wrap"] }, [el("table", { className: ["cs-table", "stack"] }, [caption, head, el("tbody", {}, rows)])])];
	const notes = [txt(t.note)];
	const watch = (d.watch ?? []).filter((w) => w.date >= new Date().toISOString().slice(0, 10));
	if (watch.length) notes.push(txt(` ${t.watch}: `), ...watch.flatMap((w, i) => [...(i ? [txt("; ")] : []), el("time", { dateTime: w.date }, [txt(fmtDate(w.date, loc))]), txt(` (${w.text[loc]})`)]), txt("."));
	children.push(el("p", { className: ["cs-note"] }, notes));
	return el("div", { className: ["cs-wrap"], id: `cs-${d.id}` }, children);
}

export default function rehypeCountryStatus() {
	const data = loadLegalStatus();
	return (tree, file) => {
		const fp = String(file?.path ?? file?.history?.[0] ?? "").replace(/\\/g, "/");
		const m = fp.match(/\/src\/content\/(?:guides|hubs)\/(en|es|de)\//);
		if (!m) return;
		const loc = m[1];
		const visit = (node) => {
			if (!node.children) return;
			node.children = node.children.map((c) => {
				if (c.type === "element" && c.tagName === "p") {
					const hit = textOf(c).match(PLACEHOLDER);
					if (hit) {
						const d = data[hit[1]];
						if (!d) throw new Error(`${fp}: [[country-status:${hit[1]}]] has no file in src/data/legal-status/`);
						return table(d, loc);
					}
				}
				visit(c);
				return c;
			});
		};
		visit(tree);
	};
}

export { GUIDES };
