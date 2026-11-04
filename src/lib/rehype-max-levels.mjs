/**
 * Rehype plugin: maximum amounts per daily dose of a food supplement, by country, from ONE data file
 * (src/data/max-levels.json). Replaces a paragraph that only contains a placeholder, in guide and
 * supplement-page MDX (src/content/{guides,hubs}/{locale}/*.mdx):
 *
 *   [[max-levels:all]]               full matrix: countries × nutrients (the maximum-levels guides)
 *   [[max-levels:zinc]]              one nutrient: the page's own market first, then EFSA, then the
 *                                    other countries from highest to lowest, "no maximum" grouped last
 *   [[max-levels:compare:FR,IT]]     nutrients × (EFSA + the listed countries), e.g. in a multivitamin guide
 *
 * Values are per recommended daily dose, adults. A missing value means "no national maximum".
 * The build fails on an unknown nutrient or country, a row without a source, a missing translation or a
 * guide slug that doesn't exist. The same data feeds /llms.txt (src/pages/llms.txt.ts).
 * Registered after rehype-glossary-links, so the table text is not auto-linked.
 */
import fs from "node:fs";
import path from "node:path";
import { countryName, GUIDES } from "./rehype-country-status.mjs";

const LOCALES = ["en", "es", "de"];
const TYPES = ["benchmark", "binding", "guidance", "none"];
const DATE_FMT = { en: "en-GB", es: "es-ES", de: "de-DE" };
/** es-ES doesn't group 4-digit numbers; the site writes 1.000 in ES and DE */
const NUM_FMT = { en: "en-GB", es: "de-DE", de: "de-DE" };
const T = {
	en: {
		country: "Country", type: "Type of rule", max: "Maximum per daily dose", source: "Source", nutrient: "Nutrient",
		checked: "Checked", sources: "each row links its source", none: "No national maximum", others: "Also no national maximum",
		efsa: "EFSA safety level (UL)", type_: { benchmark: "Benchmark, total intake", binding: "Binding", guidance: "Guidance", none: "None" },
		note: "Limits are per recommended daily dose of a supplement, for adults; several countries set lower ones for children and teenagers. Inside the EU, a product lawfully sold in one country can usually be sold in another even above its limit (mutual recognition).",
		full: "All 7 nutrients and 13 countries", nutrientCaption: (n) => `Maximum ${n.toLowerCase()} per daily dose of a supplement, by country`,
		compareCaption: "Maximum per daily dose of a supplement", noneIn: (c) => `${c} sets no national maximum`,
	},
	es: {
		country: "País", type: "Tipo de norma", max: "Máximo por dosis diaria", source: "Fuente", nutrient: "Nutriente",
		checked: "Revisado", sources: "cada fila enlaza su fuente", none: "Sin máximo nacional", others: "Tampoco tienen máximo nacional",
		efsa: "Nivel de seguridad EFSA (UL)", type_: { benchmark: "Referencia, ingesta total", binding: "Obligatorio", guidance: "Recomendación", none: "Sin máximo" },
		note: "Los límites son por dosis diaria recomendada de un complemento, para adultos; varios países fijan otros más bajos para niños y adolescentes. Dentro de la UE, un producto vendido legalmente en un país suele poder venderse en otro aunque supere su límite (reconocimiento mutuo).",
		full: "Los 7 nutrientes y 13 países", nutrientCaption: (n) => `Máximo de ${n.toLowerCase()} por dosis diaria de un complemento, por país`,
		compareCaption: "Máximo por dosis diaria de un complemento", noneIn: (c) => `${c} no fija máximo nacional`,
	},
	de: {
		country: "Land", type: "Art der Regel", max: "Höchstmenge pro Tagesdosis", source: "Quelle", nutrient: "Nährstoff",
		checked: "Geprüft", sources: "jede Zeile verlinkt ihre Quelle", none: "Keine nationale Höchstmenge", others: "Ebenfalls keine nationale Höchstmenge",
		efsa: "EFSA-Sicherheitswert", type_: { benchmark: "Referenz, Gesamtaufnahme", binding: "Verbindlich", guidance: "Empfehlung", none: "Keine" },
		note: "Die Werte gelten pro empfohlener Tagesdosis eines Präparats für Erwachsene; mehrere Länder haben niedrigere Grenzen für Kinder und Jugendliche. In der EU darf ein Produkt, das in einem Land legal verkauft wird, meist auch in einem anderen verkauft werden, selbst wenn es dort über der Grenze liegt (gegenseitige Anerkennung).",
		full: "Alle 7 Nährstoffe und 13 Länder", nutrientCaption: (n) => `Höchstmenge ${n} pro Tagesdosis eines Präparats, nach Land`,
		compareCaption: "Höchstmenge pro Tagesdosis eines Präparats", noneIn: (c) => `${c}: keine nationale Höchstmenge`,
	},
};
const PLACEHOLDER = /^\s*\\?\[\\?\[max-levels:([a-z0-9-]+)(?::([A-Z,]+))?\\?\]\\?\]\s*$/;

const fmtDate = (iso, loc) => new Date(`${iso}T12:00:00Z`).toLocaleDateString(DATE_FMT[loc], { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const fmtNum = (n, loc) => new Intl.NumberFormat(NUM_FMT[loc], { maximumFractionDigits: 1 }).format(n);

/** The dataset, validated. Also used by /llms.txt. */
export function loadMaxLevels() {
	const where = "src/data/max-levels.json";
	const d = JSON.parse(fs.readFileSync(path.join(process.cwd(), where), "utf8"));
	const ids = new Set(d.nutrients.map((n) => n.id));
	for (const loc of LOCALES) {
		if (!d.caption?.[loc]) throw new Error(`${where}: caption.${loc} missing`);
		if (!fs.existsSync(path.join(process.cwd(), "src/content/guides", loc, `${d.guide[loc]}.mdx`))) throw new Error(`${where}: guide.${loc} "${d.guide[loc]}" does not exist`);
		for (const n of d.nutrients) if (!n.name?.[loc]) throw new Error(`${where}: nutrient ${n.id} name.${loc} missing`);
		const codes = d.rows.map((r) => r.code);
		const ord = d.order?.[loc] ?? [];
		if (ord.length !== codes.length || codes.some((c) => !ord.includes(c))) throw new Error(`${where}: order.${loc} must list every row once`);
	}
	const seen = new Set();
	for (const r of d.rows) {
		const id = `${where} row ${r.code}`;
		if (seen.has(r.code)) throw new Error(`${id}: duplicate`);
		seen.add(r.code);
		if (!TYPES.includes(r.type)) throw new Error(`${id}: unknown type "${r.type}"`);
		if (!r.sources?.length || r.sources.some((s) => !s.title || !/^https?:\/\//.test(s.url ?? ""))) throw new Error(`${id}: needs at least one source with title and url`);
		for (const k of Object.keys(r.values ?? {})) if (!ids.has(k)) throw new Error(`${id}: unknown nutrient "${k}"`);
		for (const k of Object.keys(r.nutrientSources ?? {})) if (!ids.has(k)) throw new Error(`${id}: unknown nutrient "${k}" in nutrientSources`);
		if (r.scope) for (const loc of LOCALES) if (!r.scope[loc]) throw new Error(`${id}: scope.${loc} missing`);
		if (r.type === "none" && Object.keys(r.values ?? {}).length) throw new Error(`${id}: type "none" can't have values`);
	}
	return d;
}

const el = (tagName, properties = {}, children = []) => ({ type: "element", tagName, properties, children });
const txt = (value) => ({ type: "text", value });
const textOf = (node) => (node.type === "text" ? node.value : (node.children ?? []).map(textOf).join(""));

const rowName = (r, loc) => (r.code === "EFSA" ? T[loc].efsa : countryName(r.code, loc));
const typeLabel = (r, loc) => {
	let s = T[loc].type_[r.type];
	if (r.by) s += ` (${r.by})`;
	if (r.scope) s += ` (${r.scope[loc]})`;
	return s;
};
const badge = (r, loc) => el("span", { className: ["cs-badge", `mx-${r.type}`] }, [txt(typeLabel(r, loc))]);
const valueText = (r, n, loc) => {
	const x = r.values?.[n.id];
	if (x == null) return "—";
	const note = r.notes?.[n.id]?.[loc];
	return `${fmtNum(x, loc)} ${n.unit}${note ? ` (${note})` : ""}`;
};
const srcLinks = (list) => list.flatMap((s, i) => [...(i ? [el("br")] : []), el("a", { href: s.url, rel: ["noopener"], target: "_blank" }, [txt(s.title)])]);
const guideHref = (d, loc) => `/${loc}/${GUIDES[loc]}/${d.guide[loc]}/`;

function caption(d, loc, title, r0) {
	const t = T[loc];
	const date = r0?.checked && r0.checked > d.checked ? r0.checked : d.checked;
	return el("caption", {}, [el("strong", {}, [txt(title)]), txt(` · ${t.checked}: `), el("time", { dateTime: date }, [txt(fmtDate(date, loc))]), txt(` · ${t.sources}`)]);
}
function wrap(id, tableNode, loc, d, withLink) {
	const t = T[loc];
	const note = [txt(t.note)];
	if (withLink) note.push(txt(" "), el("a", { href: guideHref(d, loc) }, [txt(`${t.full} →`)]));
	return el("div", { className: ["cs-wrap", "mx-wrap"], id }, [el("div", { className: ["table-wrap"] }, [tableNode]), el("p", { className: ["cs-note"] }, note)]);
}

/** Full matrix: countries × nutrients. */
function matrix(d, loc) {
	const t = T[loc];
	const byCode = Object.fromEntries(d.rows.map((r) => [r.code, r]));
	const market = d.market[loc];
	const head = el("thead", {}, [el("tr", {}, [t.country, t.type, ...d.nutrients.map((n) => `${n.name[loc]} (${n.unit})`), t.source].map((h) => el("th", { scope: "col" }, [txt(h)])))]);
	const rows = d.order[loc].map((code) => {
		const r = byCode[code];
		const cells = d.nutrients.map((n) => {
			const x = r.values?.[n.id];
			const note = r.notes?.[n.id]?.[loc];
			return el("td", { dataLabel: `${n.name[loc]} (${n.unit})`, className: ["mx-num"] }, [txt(x == null ? "—" : `${fmtNum(x, loc)}${note ? ` (${note})` : ""}`)]);
		});
		const cls = [code === market ? "mx-market" : "", code === "EFSA" ? "mx-efsa" : ""].filter(Boolean);
		return el("tr", { id: `mx-${code.toLowerCase()}`, className: cls }, [
			el("th", { scope: "row", dataLabel: t.country }, [txt(rowName(r, loc))]),
			el("td", { dataLabel: t.type, className: ["cs-status"] }, [badge(r, loc)]),
			...cells,
			el("td", { dataLabel: t.source, className: ["cs-src"] }, srcLinks(r.sources)),
		]);
	});
	const tbl = el("table", { className: ["cs-table", "stack", "mx-matrix"] }, [caption(d, loc, d.caption[loc]), head, el("tbody", {}, rows)]);
	return wrap("mx-all", tbl, loc, d, false);
}

/** One nutrient: market first, EFSA, others high → low, "no maximum" grouped. */
function single(d, n, loc) {
	const t = T[loc];
	const market = d.market[loc];
	const has = (r) => r.values?.[n.id] != null;
	const name = (r) => rowName(r, loc);
	const mk = d.rows.find((r) => r.code === market);
	const efsa = d.rows.find((r) => r.code === "EFSA");
	const rest = d.rows.filter((r) => r.code !== market && r.code !== "EFSA");
	const withMax = rest.filter(has).sort((a, b) => b.values[n.id] - a.values[n.id] || name(a).localeCompare(name(b), loc));
	const without = rest.filter((r) => !has(r)).sort((a, b) => name(a).localeCompare(name(b), loc));
	const srcFor = (r) => r.nutrientSources?.[n.id] ?? r.sources;
	const row = (r, extra = []) =>
		el("tr", { id: `mx-${n.id}-${r.code.toLowerCase()}`, className: extra }, [
			el("th", { scope: "row", dataLabel: t.country }, [txt(name(r))]),
			el("td", { dataLabel: t.max, className: ["mx-num"] }, [txt(has(r) ? valueText(r, n, loc) : t.none)]),
			el("td", { dataLabel: t.type, className: ["cs-status"] }, [badge(r, loc)]),
			el("td", { dataLabel: t.source, className: ["cs-src"] }, srcLinks(srcFor(r))),
		]);
	const rows = [row(mk, ["mx-market"]), row(efsa, ["mx-efsa"]), ...withMax.map((r) => row(r))];
	if (without.length) {
		// One overview source covers all of them; national sources would mostly be about other nutrients
		const srcs = d.overview ? [d.overview] : without.flatMap(srcFor).filter((s, i, a) => a.findIndex((x) => x.url === s.url) === i);
		rows.push(
			el("tr", { id: `mx-${n.id}-none` }, [
				el("th", { scope: "row", dataLabel: t.country, className: ["mx-group"] }, [txt(without.map(name).join(", "))]),
				el("td", { dataLabel: t.max, className: ["mx-num"] }, [txt(has(mk) ? t.none : t.others)]),
				el("td", { dataLabel: t.type, className: ["cs-status"] }, [txt("—")]),
				el("td", { dataLabel: t.source, className: ["cs-src"] }, srcLinks(srcs)),
			]),
		);
	}
	const head = el("thead", {}, [el("tr", {}, [t.country, t.max, t.type, t.source].map((h) => el("th", { scope: "col" }, [txt(h)])))]);
	const tbl = el("table", { className: ["cs-table", "stack", "mx-single"] }, [caption(d, loc, t.nutrientCaption(n.name[loc]), mk), head, el("tbody", {}, rows)]);
	return wrap(`mx-${n.id}`, tbl, loc, d, true);
}

/** Nutrients × (EFSA + listed countries). */
function compare(d, codes, loc, fp) {
	const t = T[loc];
	const byCode = Object.fromEntries(d.rows.map((r) => [r.code, r]));
	for (const c of codes) if (!byCode[c]) throw new Error(`${fp}: [[max-levels:compare:${codes.join(",")}]] — unknown country ${c}`);
	const cols = ["EFSA", ...codes.filter((c) => c !== "EFSA")].map((c) => byCode[c]);
	const colHead = (r) => (r.code === "EFSA" ? t.efsa : `${rowName(r, loc)} · ${typeLabel(r, loc)}`);
	const head = el("thead", {}, [el("tr", {}, [el("th", { scope: "col" }, [txt(t.nutrient)]), ...cols.map((r) => el("th", { scope: "col" }, [txt(colHead(r))]))])]);
	const rows = d.nutrients.map((n) =>
		el("tr", {}, [
			el("th", { scope: "row", dataLabel: t.nutrient }, [txt(n.name[loc])]),
			...cols.map((r) => el("td", { dataLabel: rowName(r, loc), className: ["mx-num"] }, [txt(valueText(r, n, loc))])),
		]),
	);
	const srcs = [];
	for (const r of cols) for (const s of r.sources) if (!srcs.some((x) => x.url === s.url)) srcs.push(s);
	const latest = cols.reduce((a, r) => (r.checked && r.checked > a ? r.checked : a), d.checked);
	const tbl = el("table", { className: ["cs-table", "stack", "mx-compare"] }, [caption(d, loc, t.compareCaption, { checked: latest }), head, el("tbody", {}, rows)]);
	const node = wrap(`mx-compare`, tbl, loc, d, true);
	node.children.push(el("p", { className: ["cs-note", "cs-src"] }, srcLinks(srcs)));
	return node;
}

export default function rehypeMaxLevels() {
	const d = loadMaxLevels();
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
						const [, what, list] = hit;
						if (what === "all") return matrix(d, loc);
						if (what === "compare") {
							if (!list) throw new Error(`${fp}: [[max-levels:compare:…]] needs country codes`);
							return compare(d, list.split(","), loc, fp);
						}
						const n = d.nutrients.find((x) => x.id === what);
						if (!n) throw new Error(`${fp}: [[max-levels:${what}]] — unknown nutrient (use ${d.nutrients.map((x) => x.id).join(", ")}, all or compare)`);
						return single(d, n, loc);
					}
				}
				visit(c);
				return c;
			});
		};
		visit(tree);
	};
}
