/**
 * Which glossary terms get linked automatically in guide and supplement-page bodies (MDX),
 * and how each term is written in each language. Used by src/lib/rehype-glossary-links.mjs.
 *
 * - id: glossary entry id (anchor) — must exist in src/data/glossary/*.json (the build checks).
 * - p:  priority. With a cap of links per page, lower numbers win: 1 label/law terms,
 *       2 forms on the label, 3 ingredients without a supplement page of their own, 4 study terms,
 *       5 broad terms, 6 agencies.
 * - en/es/de: regex sources, tried as alternatives (put longer phrases first). Word boundaries
 *       are added automatically and work with accented letters. Only the first match per page is linked.
 * - cs: true = case-sensitive (acronyms such as NRV, IU). Everything else ignores case.
 *
 * Ingredients that have their own supplement page (magnesium, creatine, omega-3…) are not listed:
 * guides already link to those pages.
 */
export const LINK_TERMS = [
	// 1 — label and law terms
	{ id: "nrv", p: 1, cs: true, en: ["% ?NRVs?", "NRVs?"], es: ["% ?VRN", "VRN"], de: ["Nährstoffbezugswert(?:e|es|en)?", "% ?NRV", "NRV"] },
	{ id: "elemental", p: 1, en: ["elemental (?:magnesium|iron|zinc|calcium)", "elemental"], es: ["(?:magnesio|hierro|zinc|calcio) elemental", "elemental"], de: ["elementare[nsrm]? (?:Magnesium|Eisen|Zink|Calcium)", "elementare[nsrm]?"] },
	{ id: "upper-level", p: 1, en: ["tolerable upper intake levels?", "(?:safe )?upper (?:intake )?levels?"], es: ["niveles? máximos? de ingesta tolerable", "niveles? máximos? (?:seguros?|tolerables?)"], de: ["tolerierbare[nr]? Höchstaufnahmemengen?", "tolerierbare[nr]? Höchstmengen?", "EFSA-Höchstmengen?", "sicheren? Höchstmengen?"] },
	{ id: "daily-dose", p: 1, en: ["recommended daily doses?", "daily doses?"], es: ["dosis diarias? recomendadas?", "dosis diarias?"], de: ["empfohlene[nr]? tägliche[nr]? Verzehrmengen?", "Tagesdosis", "Tagesdosen"] },
	{ id: "health-claim", p: 1, en: ["authori[sz]ed (?:EU )?(?:health )?claims?", "health claims?"], es: ["declaraci(?:ón|ones) de propiedades saludables", "declaraci(?:ón|ones) (?:de salud )?autorizadas?", "declaraci(?:ón|ones) de salud"], de: ["gesundheitsbezogenen? Angaben?", "zugelassene[nr]? (?:EU-)?Angaben?", "Health Claims?"] },
	{ id: "on-hold-claims", p: 1, en: ["on hold"], es: ["en espera"], de: ["on hold", "zurückgestellt(?:e[nr]?)?"] },
	{ id: "maximum-levels", p: 1, en: ["national maximum (?:levels|amounts)", "maximum (?:levels|amounts)"], es: ["cantidad(?:es)? máximas?", "máximos? nacional(?:es)?"], de: ["Höchstmengenempfehlung(?:en)?", "empfohlene[nr]? Höchstmengen?", "nationale[nr]? Höchstmengen?"] },
	{ id: "mutual-recognition", p: 1, en: ["mutual recognition"], es: ["reconocimiento mutuo"], de: ["gegenseitige[nr]? Anerkennung"] },
	{ id: "reference-intake", p: 1, en: ["adequate intakes?"], es: ["ingestas? adecuadas?"], de: ["Schätzwert(?:e)? für (?:die |eine )?angemessene Zufuhr", "angemessene[nr]? Zufuhr"] },
	{ id: "novel-food", p: 1, en: ["novel foods?"], es: ["nuevos? alimentos?", "novel foods?"], de: ["Novel Foods?", "neuartige[nr]? Lebensmittel(?:n)?"] },
	{ id: "traditional-herbal-medicine", p: 1, en: ["traditional herbal medicin(?:es?|al products?)"], es: ["medicamentos? tradicional(?:es)? a base de plantas"], de: ["traditionelle[sn]? pflanzliche[sn]? Arzneimittel(?:n)?"] },
	{ id: "iu", p: 1, cs: true, en: ["IU"], es: ["UI"], de: ["IE"] },

	// 2 — forms on the label
	{ id: "bisglycinate", p: 2, en: ["(?:magnesium |iron |zinc |ferrous )?bis-?glycinates?", "glycinates?"], es: ["bisglicinatos?(?: (?:de magnesio|ferroso|de hierro|de zinc))?"], de: ["(?:Magnesium|Eisen|Zink)?bisglycinat", "Glycinat"] },
	{ id: "citrate", p: 2, en: ["(?:magnesium |zinc |calcium )?citrates?"], es: ["citratos?(?: de (?:magnesio|zinc|calcio))?"], de: ["(?:Magnesium|Zink|Calcium)?citrat"] },
	{ id: "oxide", p: 2, en: ["(?:magnesium |zinc )?oxides?"], es: ["óxidos?(?: de (?:magnesio|zinc))?"], de: ["(?:Magnesium|Zink)?oxid"] },
	{ id: "cholecalciferol", p: 2, en: ["cholecalciferol", "ergocalciferol"], es: ["colecalciferol", "ergocalciferol"], de: ["Cholecalciferol", "Ergocalciferol"] },
	{ id: "mk-7", p: 2, cs: true, en: ["MK-7"], es: ["MK-7"], de: ["MK-7"] },
	{ id: "cobalamin-forms", p: 2, en: ["methylcobalamin", "cyanocobalamin", "hydroxocobalamin"], es: ["metilcobalamina", "cianocobalamina", "hidroxocobalamina"], de: ["Methylcobalamin", "Cyanocobalamin", "Hydroxocobalamin"] },
	{ id: "methylfolate", p: 2, en: ["methylfolate", "5-MTHF"], es: ["metilfolato", "5-MTHF"], de: ["Methylfolat", "5-MTHF"] },
	{ id: "creapure", p: 2, cs: true, en: ["Creapure"], es: ["Creapure"], de: ["Creapure"] },
	{ id: "piperine", p: 2, en: ["piperine"], es: ["piperina"], de: ["Piperin"] },
	{ id: "standardised-extract", p: 2, en: ["standardi[sz]ed extracts?"], es: ["extractos? estandarizados?"], de: ["standardisierte[nr]? Extrakte?"] },

	// 3 — ingredients without a supplement page of their own
	{ id: "vitamin-a", p: 3, cs: true, en: ["[Vv]itamin A"], es: ["[Vv]itamina A"], de: ["Vitamin A"] },
	{ id: "vitamin-b1", p: 3, en: ["thiamine?", "vitamin B1"], es: ["tiamina", "vitamina B1"], de: ["Thiamin", "Vitamin B1"] },
	{ id: "vitamin-b2", p: 3, en: ["riboflavin", "vitamin B2"], es: ["riboflavina", "vitamina B2"], de: ["Riboflavin", "Vitamin B2"] },
	{ id: "vitamin-b3", p: 3, en: ["niacin(?:amide)?", "nicotinamide", "vitamin B3"], es: ["niacina", "nicotinamida", "vitamina B3"], de: ["Niacin", "Nicotinamid", "Vitamin B3"] },
	{ id: "vitamin-b5", p: 3, en: ["pantothenic acid", "vitamin B5"], es: ["ácido pantoténico", "vitamina B5"], de: ["Pantothensäure", "Vitamin B5"] },
	{ id: "vitamin-b6", p: 3, en: ["vitamin B6", "pyridoxine"], es: ["vitamina B6", "piridoxina"], de: ["Vitamin B6", "Pyridoxin"] },
	{ id: "folate", p: 3, en: ["folic acid", "folate"], es: ["ácido fólico", "folato"], de: ["Folsäure", "Folat"] },
	{ id: "selenium", p: 3, en: ["selenium"], es: ["selenio"], de: ["Selen"] },
	{ id: "vitamin-k2", p: 3, cs: true, en: ["[Vv]itamin K2", "K2"], es: ["[Vv]itamina K2", "K2"], de: ["Vitamin K2", "K2"] },
	{ id: "l-theanine", p: 3, en: ["L-theanine", "theanine"], es: ["L-teanina", "teanina"], de: ["L-Theanin", "Theanin"] },
	{ id: "5-htp", p: 3, cs: true, en: ["5-HTP"], es: ["5-HTP"], de: ["5-HTP"] },
	{ id: "psyllium", p: 3, en: ["psyllium(?: husk)?", "ispaghula"], es: ["psyllium", "ispágula"], de: ["Flohsamenschalen", "Psyllium"] },
	{ id: "probiotics", p: 3, en: ["probiotics?"], es: ["probióticos?"], de: ["Probiotika", "Probiotikum"] },
	{ id: "rhodiola", p: 3, en: ["rhodiola"], es: ["rhodiola"], de: ["Rosenwurz", "Rhodiola"] },
	{ id: "valerian", p: 3, en: ["valerian"], es: ["valeriana"], de: ["Baldrian"] },
	{ id: "passionflower", p: 3, en: ["passionflower"], es: ["pasiflora"], de: ["Passionsblume"] },
	{ id: "california-poppy", p: 3, en: ["California poppy"], es: ["amapola de California"], de: ["Kalifornische[rn]? Mohn"] },
	{ id: "lemon-balm", p: 3, en: ["lemon balm"], es: ["melisa"], de: ["Melisse"] },
	{ id: "chamomile", p: 3, en: ["chamomile"], es: ["manzanilla"], de: ["Kamille"] },
	{ id: "lavender", p: 3, en: ["lavender"], es: ["lavanda"], de: ["Lavendel"] },
	{ id: "milk-thistle", p: 3, en: ["milk thistle", "silymarin"], es: ["cardo mariano", "silimarina"], de: ["Mariendistel", "Silymarin"] },
	{ id: "artichoke", p: 3, en: ["artichoke"], es: ["alcachofa"], de: ["Artischocke(?:n)?"] },
	{ id: "dandelion", p: 3, en: ["dandelion"], es: ["diente de león"], de: ["Löwenzahn"] },

	// 4 — study and measurement terms
	{ id: "meta-analysis", p: 4, en: ["meta-analys[ie]s", "systematic reviews?"], es: ["metaanálisis", "revisi(?:ón|ones) sistemáticas?"], de: ["Metaanalysen?", "systematische[nr]? Übersichtsarbeit(?:en)?"] },
	{ id: "rct", p: 4, en: ["randomi[sz]ed (?:placebo-)?controlled trials?", "randomi[sz]ed trials?", "randomi[sz]ed"], es: ["ensayos? (?:clínicos? )?aleatorizados?", "aleatorizad[oa]s?"], de: ["randomisierte[nr]? (?:kontrollierte[nr]? )?Studien?", "randomisiert(?:e[nr]?)?"] },
	{ id: "bioavailability", p: 4, en: ["bioavailab(?:le|ility)"], es: ["biodisponib(?:le|ilidad)"], de: ["Bioverfügbarkeit", "bioverfügbar(?:e[nr]?)?"] },
	{ id: "cfu", p: 4, cs: true, en: ["CFU"], es: ["UFC"], de: ["KBE"] },

	// 5 — broad terms
	{ id: "food-supplement", p: 5, en: ["food supplements?"], es: ["complementos? alimenticios?"], de: ["Nahrungsergänzungsmitteln?", "Nahrungsergänzungsmittels"] },

	// 6 — agencies
	{ id: "efsa", p: 6, cs: true, en: ["EFSA"], es: ["EFSA"], de: ["EFSA"] },
	{ id: "bfr", p: 6, cs: true, en: ["BfR"], es: ["BfR"], de: ["BfR"] },
	{ id: "aesan", p: 6, cs: true, en: ["AESAN"], es: ["AESAN"], de: ["AESAN"] },
];
