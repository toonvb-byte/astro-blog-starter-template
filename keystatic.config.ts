import { collection, config, fields } from "@keystatic/core";
import { KIND_LABEL, NEWS_KINDS, NEWS_REGIONS, REGION_LABEL } from "./src/lib/news-meta";

/**
 * Keystatic CMS — edit at /keystatic.
 * In production it saves straight to GitHub (each save = a commit = a redeploy).
 * Locally (`npm run dev`) it edits the files on disk.
 */

const CATEGORIES = {
	en: ["Buying guide", "Explainer", "Deals", "Sports nutrition", "Sleep & stress", "Health devices", "Food first"],
	es: ["Guía de compra", "Explicación", "Ofertas", "Nutrición deportiva", "Sueño y estrés", "Dispositivos de salud", "Comer bien"],
	de: ["Kaufberatung", "Erklärung", "Angebote", "Sporternährung", "Schlaf & Stress", "Gesundheitsgeräte", "Gut essen"],
};
const GUIDES_SEGMENT = { en: "guides", es: "guias", de: "ratgeber" };

/**
 * Images. Uploads are saved in src/assets/{guides|hubs}/{lang}/{slug}/ and referenced with a path relative
 * to the .mdx file (../../../assets/…), so Astro optimises them (AVIF/WebP, several sizes) at build time.
 * The hero file is always named heroImage.{ext} (Keystatic names it after the field). Images placed in the body keep
 * the name you upload, cleaned up by cleanFilename (lowercase, no accents or spaces), so name them after what they show.
 */
const heroImageFields = (kind: "guides" | "hubs" | "news", lang: "en" | "es" | "de") => ({
	heroImage: fields.image({
		label: "Hero image (top of the page)",
		description: "Shown above the text and used when the page is shared or appears in Google Discover. 16:9 landscape, at least 1600 px wide (2400 × 1350 is ideal), no text in the picture. Turn off location data on phone photos before uploading. Fill in the alt text below.",
		directory: `src/assets/${kind}/${lang}`,
		publicPath: `../../../assets/${kind}/${lang}/`,
	}),
	heroAlt: fields.text({
		label: "Hero image: alt text",
		description: "What the picture shows, in this page’s language, under 125 characters. Needed whenever there is a hero image.",
		validation: { length: { max: 160 } },
	}),
	heroCaption: fields.text({ label: "Hero image: caption (optional)", description: "Shown under the image, e.g. where and when a label was photographed." }),
	heroCredit: fields.text({ label: "Hero image: credit (optional)", description: "Only for photos you didn’t take, e.g. “Photo: Unsplash / Name”." }),
});
/** Lowercase, no accents or spaces: "Etiqueta Magnesio Ñ.JPG" → "etiqueta-magnesio-n.jpg", "Größe.png" → "groesse.png". */
const cleanFilename = (name: string) => {
	const dot = name.lastIndexOf(".");
	const base = dot > 0 ? name.slice(0, dot) : name;
	const ext = dot > 0 ? name.slice(dot + 1).toLowerCase() : "jpg";
	const slug = base
		.replace(/ä/gi, "ae").replace(/ö/gi, "oe").replace(/ü/gi, "ue").replace(/ß/g, "ss")
		.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
		.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
		.slice(0, 60) || "image";
	return `${slug}.${ext === "jpeg" ? "jpg" : ext}`;
};
const bodyImages = (kind: "guides" | "hubs" | "news", lang: "en" | "es" | "de") => ({
	image: {
		directory: `src/assets/${kind}/${lang}`,
		publicPath: `../../../assets/${kind}/${lang}/`,
		transformFilename: cleanFilename,
		schema: {
			alt: fields.text({ label: "Alt text", description: "What the image shows, in this page’s language. For a chart, state its main number." }),
			title: fields.text({ label: "Caption (optional)", description: "Shown under the image, e.g. “Label photographed on 3 Nov 2026 · bought at Mercadona”." }),
		},
	},
});

const guideCollection = (lang: "en" | "es" | "de", label: string) =>
	collection({
		label,
		slugField: "title",
		path: `src/content/guides/${lang}/*`,
		format: { contentField: "content" },
		entryLayout: "content",
		columns: ["title", "publishDate"],
		previewUrl: `/${lang}/${GUIDES_SEGMENT[lang]}/{slug}/`,
		schema: {
			title: fields.slug({
				name: { label: "Title (H1)", description: "Max 60 characters: Google cuts longer titles. \" | NutriMetrics\" is added automatically when it fits.", validation: { length: { min: 1, max: 60 } } },
				slug: { label: "URL slug", description: "The last part of the page address. Don’t change it after publishing." },
			}),
			...heroImageFields("guides", lang),
			description: fields.text({
				label: "Meta description (shown in Google)",
				multiline: true,
				validation: { length: { min: 1, max: 155 } },
			}),
			dek: fields.text({ label: "Standfirst (intro under the title)", multiline: true, validation: { length: { min: 1 } } }),
			category: fields.select({
				label: "Category",
				options: CATEGORIES[lang].map((c) => ({ label: c, value: c })),
				defaultValue: CATEGORIES[lang][0],
			}),
			translationKey: fields.text({
				label: "Translation key",
				description: "Use the same value in every language version of this guide (e.g. magnesium-forms). Links the EN, ES and DE versions together.",
				validation: { length: { min: 1 } },
			}),
			author: fields.text({ label: "Author", validation: { length: { min: 1 } } }),
			authorBio: fields.text({ label: "Author bio", multiline: true }),
			reviewer: fields.text({ label: "Medical reviewer (name, credential)", description: "Only fill in if a named professional has actually reviewed this guide. Leave empty otherwise — never use a placeholder." }),
			publishDate: fields.date({ label: "Published", defaultValue: { kind: "today" }, validation: { isRequired: true } }),
			updatedDate: fields.date({ label: "Last updated", description: "Set to today only when the content really changes: new facts, numbers, sources or advice. Not for typos, images or links. It shows as \"Updated\" on the page and goes to Google (dateModified and the sitemap)." }),
			readingMinutes: fields.integer({ label: "Reading time (minutes)", defaultValue: 5, validation: { isRequired: true, min: 1 } }),
			featured: fields.checkbox({ label: "Featured on the guides page", defaultValue: false }),
			// Old card placeholder text: kept in the files, hidden in the editor.
			imageLabel: fields.ignored(),
			draft: fields.checkbox({ label: "Draft (hidden on the live site)", defaultValue: true }),
			tint: fields.select({
				label: "Card colour",
				options: [
					{ label: "Green", value: "#E3F1EA" },
					{ label: "Peach", value: "#FCEBDD" },
					{ label: "Blue", value: "#E8ECF4" },
				],
				defaultValue: "#E3F1EA",
			}),
			takeaways: fields.array(fields.text({ label: "Takeaway", description: "Use **double asterisks** for bold." }), {
				label: "Key takeaways",
				itemLabel: (p) => p.value || "Takeaway",
			}),
			faq: fields.array(
				fields.object({
					q: fields.text({ label: "Question" }),
					a: fields.text({ label: "Answer", multiline: true }),
				}),
				{ label: "FAQ", itemLabel: (p) => p.fields.q.value || "Question" },
			),
			sources: fields.array(
				fields.object({
					title: fields.text({ label: "Source title" }),
					url: fields.url({ label: "Link (optional)" }),
				}),
				{ label: "Sources", itemLabel: (p) => p.fields.title.value || "Source" },
			),
			content: fields.mdx({
				label: "Article body",
				description: "To add an image inside the text: put the cursor where it should go and click the picture icon (last button in the toolbar), or drag the file in. Name the file after what it shows, in this page’s language, before uploading.",
				extension: "mdx",
				options: bodyImages("guides", lang),
			}),
		},
	});

const HUBS_SEGMENT = { en: "supplements", es: "suplementos", de: "nahrungsergaenzung" };
const textList = (label: string, description?: string) =>
	fields.array(fields.text({ label: "Item", multiline: true, description: "Use **double asterisks** for bold." }), {
		label,
		description,
		itemLabel: (p) => p.value || "Item",
	});

/** Supplement hubs (category pages). Must stay in sync with the `hubs` schema in src/content.config.ts. */
const hubCollection = (lang: "en" | "es" | "de", label: string) =>
	collection({
		label,
		slugField: "title",
		path: `src/content/hubs/${lang}/*`,
		format: { contentField: "content" },
		entryLayout: "content",
		columns: ["title", "order"],
		previewUrl: `/${lang}/${HUBS_SEGMENT[lang]}/{slug}/`,
		schema: {
			title: fields.slug({
				name: { label: "Title (H1)", description: "Max 60 characters: Google cuts longer titles. \" | NutriMetrics\" is added automatically when it fits.", validation: { length: { min: 1, max: 60 } } },
				slug: { label: "URL slug", description: "The last part of the page address. Don’t change it after publishing." },
			}),
			...heroImageFields("hubs", lang),
			description: fields.text({ label: "Meta description (shown in Google)", multiline: true, validation: { length: { min: 1, max: 155 } } }),
			dek: fields.text({ label: "Standfirst (intro under the title)", multiline: true, validation: { length: { min: 1 } } }),
			name: fields.text({ label: "Short name (breadcrumb, cards, menu)", validation: { length: { min: 1 } } }),
			hubKey: fields.text({ label: "Hub key", description: "Same value in every language version (e.g. magnesium).", validation: { length: { min: 1 } } }),
			kind: fields.select({ label: "Kind", options: [{ label: "Ingredient", value: "ingredient" }, { label: "Goal", value: "goal" }], defaultValue: "ingredient" }),
			group: fields.select({
				label: "Group on the A–Z page",
				options: [
					{ label: "Vitamins", value: "vitamins" },
					{ label: "Minerals", value: "minerals" },
					{ label: "Omega-3 & CoQ10", value: "fatty" },
					{ label: "Sports nutrition", value: "sports" },
					{ label: "Skin & joints", value: "skinJoints" },
					{ label: "Plants & botanicals", value: "botanicals" },
					{ label: "Sleep", value: "sleep" },
				],
				defaultValue: "vitamins",
			}),
			order: fields.integer({ label: "Order within the group", defaultValue: 100 }),
			author: fields.text({ label: "Author", validation: { length: { min: 1 } } }),
			publishDate: fields.date({ label: "Published", defaultValue: { kind: "today" }, validation: { isRequired: true } }),
			updatedDate: fields.date({ label: "Last checked", description: "Set to today when you re-check the numbers, limits or claims (even if nothing changed). Not for typos or images. Shows as \"Checked\" on the page and goes to Google (dateModified and the sitemap)." }),
			draft: fields.checkbox({ label: "Draft (hidden on the live site)", defaultValue: true }),
			takeaways: textList("Quick answer (3–4 bullets)"),
			facts: fields.array(
				fields.object({
					label: fields.text({ label: "Label" }),
					value: fields.text({ label: "Value (e.g. 250 mg)" }),
					note: fields.text({ label: "Note (optional)", multiline: true }),
				}),
				{ label: "Key numbers", itemLabel: (p) => p.fields.label.value || "Number" },
			),
			checklist: textList("How to choose (steps)"),
			claims: textList("EU-authorised claims", "Only claims listed in the EU register, with the minimum dose."),
			notClaims: textList("Claims that are NOT authorised"),
			cautions: textList("Who should be careful"),
			finderIngredients: fields.array(fields.text({ label: "Ingredient id" }), {
				label: "Finder ingredient ids (for the product table)",
				description: "Ids from scripts/seed/finder-data.json, e.g. magnesium, vitamin_d.",
				itemLabel: (p) => p.value || "id",
			}),
			finderShow: fields.array(fields.text({ label: "Ingredient id" }), {
				label: "Extra nutrients to show in the product table",
				description: "e.g. zinc, selenium for biotin products",
				itemLabel: (p) => p.value || "id",
			}),
			finderGoal: fields.text({ label: "Finder goal id (goal hubs only)", description: "e.g. sleep, gut" }),
			guides: fields.array(fields.text({ label: "Guide translation key" }), { label: "Related guides (translation keys)", itemLabel: (p) => p.value || "key" }),
			faq: fields.array(
				fields.object({ q: fields.text({ label: "Question" }), a: fields.text({ label: "Answer", multiline: true }) }),
				{ label: "FAQ", itemLabel: (p) => p.fields.q.value || "Question" },
			),
			sources: fields.array(
				fields.object({ title: fields.text({ label: "Source title" }), url: fields.url({ label: "Link (optional)" }) }),
				{ label: "Sources", itemLabel: (p) => p.fields.title.value || "Source" },
			),
			content: fields.mdx({ label: "Body (forms table + evidence)", description: "To add an image: click the picture icon (last button in the toolbar) or drag the file in.", extension: "mdx", options: bodyImages("hubs", lang) }),
		},
	});

const NEWS_SEGMENT = { en: "news", es: "noticias", de: "aktuelles" };

/** News items. Must stay in sync with the `news` schema in src/content.config.ts. */
const newsCollection = (lang: "en" | "es" | "de", label: string) =>
	collection({
		label,
		slugField: "title",
		path: `src/content/news/${lang}/*`,
		format: { contentField: "content" },
		entryLayout: "content",
		columns: ["title", "eventDate"],
		previewUrl: `/${lang}/${NEWS_SEGMENT[lang]}/{slug}/`,
		schema: {
			title: fields.slug({
				name: { label: "Headline (H1)", description: "Aim for 60 characters or less (max 70). Say what happened, not a teaser.", validation: { length: { min: 1, max: 70 } } },
				slug: { label: "URL slug", description: "The last part of the page address. Don’t change it after publishing." },
			}),
			...heroImageFields("news", lang),
			description: fields.text({ label: "Meta description (shown in Google)", multiline: true, validation: { length: { min: 1, max: 155 } } }),
			dek: fields.text({ label: "Standfirst (one or two sentences: what happened and why it matters)", multiline: true, validation: { length: { min: 1 } } }),
			newsKey: fields.text({ label: "News key", description: "Same value in every language version of this item (e.g. eu-max-levels-delay).", validation: { length: { min: 1 } } }),
			region: fields.select({
				label: "Region (country filter)",
				options: NEWS_REGIONS.map((r) => ({ label: REGION_LABEL[lang][r], value: r })),
				defaultValue: lang === "en" ? "uk" : lang,
			}),
			place: fields.text({ label: "Place shown on the badge (optional)", description: "Only if more precise than the region, e.g. “Netherlands” for a Dutch rule filed under EU." }),
			kind: fields.select({
				label: "Kind",
				options: NEWS_KINDS.map((k) => ({ label: KIND_LABEL[lang][k], value: k })),
				defaultValue: "rules",
			}),
			eventDate: fields.date({ label: "Date of the news", description: "When it happened: the decision, report, alert or publication date (shown as the dateline).", validation: { isRequired: true } }),
			author: fields.text({ label: "Author", defaultValue: "Toon Van Buylaere", validation: { length: { min: 1 } } }),
			publishDate: fields.date({ label: "Published on NutriMetrics", defaultValue: { kind: "today" }, validation: { isRequired: true } }),
			updatedDate: fields.date({ label: "Last updated", description: "Only when the facts change (e.g. a draft law is adopted). Shows as \"Updated\"." }),
			draft: fields.checkbox({ label: "Draft (hidden on the live site)", defaultValue: true }),
			hubs: fields.array(fields.text({ label: "Hub key" }), { label: "Related supplement pages (hub keys, e.g. magnesium)", itemLabel: (p) => p.value || "key" }),
			rankings: fields.array(fields.text({ label: "Ranking key" }), { label: "Related rankings (ranking keys, ES/DE only)", itemLabel: (p) => p.value || "key" }),
			guides: fields.array(fields.text({ label: "Guide translation key" }), { label: "Related guides (translation keys)", itemLabel: (p) => p.value || "key" }),
			sources: fields.array(
				fields.object({ title: fields.text({ label: "Source title (publisher, title, date)" }), url: fields.url({ label: "Link" }) }),
				{ label: "Sources (at least one; official source first)", itemLabel: (p) => p.fields.title.value || "Source", validation: { length: { min: 1 } } },
			),
			content: fields.mdx({
				label: "Body",
				description: "Two short sections: “What happened” and “What it means for you” (H2). Facts from the sources only, with numbers and dates.",
				extension: "mdx",
				options: bodyImages("news", lang),
			}),
		},
	});

export default config({
	storage: import.meta.env.DEV
		? { kind: "local" }
		: { kind: "github", repo: "toonvb-byte/astro-blog-starter-template" },
	ui: {
		brand: { name: "NutriMetrics" },
		navigation: { Guides: ["guidesEn", "guidesEs", "guidesDe"], "Supplement pages": ["hubsEn", "hubsEs", "hubsDe"], News: ["newsEn", "newsEs", "newsDe"] },
	},
	collections: {
		guidesEn: guideCollection("en", "Guides — English"),
		guidesEs: guideCollection("es", "Guías — Español"),
		guidesDe: guideCollection("de", "Ratgeber — Deutsch"),
		hubsEn: hubCollection("en", "Supplement pages — English"),
		hubsEs: hubCollection("es", "Suplementos — Español"),
		hubsDe: hubCollection("de", "Wirkstoffe — Deutsch"),
		newsEn: newsCollection("en", "News — English"),
		newsEs: newsCollection("es", "Noticias — Español"),
		newsDe: newsCollection("de", "Aktuelles — Deutsch"),
	},
});
