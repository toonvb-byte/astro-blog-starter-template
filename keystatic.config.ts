import { collection, config, fields } from "@keystatic/core";

/**
 * Keystatic CMS — edit at /keystatic.
 * In production it saves straight to GitHub (each save = a commit = a redeploy).
 * Locally (`npm run dev`) it edits the files on disk.
 */

const CATEGORIES = {
	en: ["Buying guide", "Explainer", "Deals", "Sports nutrition", "Sleep & stress", "Health devices"],
	es: ["Guía de compra", "Explicación", "Ofertas", "Nutrición deportiva", "Sueño y estrés", "Dispositivos de salud"],
};

const guideCollection = (lang: "en" | "es", label: string) =>
	collection({
		label,
		slugField: "title",
		path: `src/content/guides/${lang}/*`,
		format: { contentField: "content" },
		entryLayout: "content",
		columns: ["title", "publishDate"],
		previewUrl: `/${lang}/${lang === "en" ? "guides" : "guias"}/{slug}/`,
		schema: {
			title: fields.slug({
				name: { label: "Title (H1)", description: "Max 70 characters.", validation: { length: { min: 1, max: 70 } } },
				slug: { label: "URL slug", description: "The last part of the page address. Don’t change it after publishing." },
			}),
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
				description: "Use the same value in every language version of this guide (e.g. magnesium-forms). Links the EN and ES versions together.",
				validation: { length: { min: 1 } },
			}),
			author: fields.text({ label: "Author", validation: { length: { min: 1 } } }),
			authorBio: fields.text({ label: "Author bio", multiline: true }),
			reviewer: fields.text({ label: "Medical reviewer (name, credential)", description: "Leave empty if not reviewed yet." }),
			publishDate: fields.date({ label: "Published", defaultValue: { kind: "today" }, validation: { isRequired: true } }),
			updatedDate: fields.date({ label: "Last updated", description: "Set this when you make a meaningful update." }),
			readingMinutes: fields.integer({ label: "Reading time (minutes)", defaultValue: 5, validation: { isRequired: true, min: 1 } }),
			featured: fields.checkbox({ label: "Featured on the guides page", defaultValue: false }),
			draft: fields.checkbox({ label: "Draft (hidden on the live site)", defaultValue: true }),
			imageLabel: fields.text({ label: "Image description (placeholder until images are added)", defaultValue: "hero image" }),
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
				extension: "mdx",
				options: { image: false },
			}),
		},
	});

export default config({
	storage: import.meta.env.DEV
		? { kind: "local" }
		: { kind: "github", repo: "toonvb-byte/astro-blog-starter-template" },
	ui: {
		brand: { name: "NutriMetrics" },
		navigation: { Guides: ["guidesEn", "guidesEs"] },
	},
	collections: {
		guidesEn: guideCollection("en", "Guides — English"),
		guidesEs: guideCollection("es", "Guías — Español"),
	},
});
