import { glob } from "astro/loaders";
import { defineCollection } from "astro:content";
import { z } from "astro/zod";

/**
 * Guides live in src/content/guides/{locale}/{slug}.mdx.
 * `translationKey` ties language versions of the same guide together (hreflang + "Also in").
 * `slug` is the localised URL slug.
 */
const guides = defineCollection({
	loader: glob({ base: "./src/content/guides", pattern: "**/*.{md,mdx}" }),
	schema: z.object({
		locale: z.enum(["en", "es"]),
		slug: z.string(),
		translationKey: z.string(),
		title: z.string().max(70),
		/** Meta description, ≤155 chars. */
		description: z.string().max(155),
		/** Visible standfirst under the H1. */
		dek: z.string(),
		category: z.string(),
		author: z.string(),
		authorBio: z.string().optional(),
		reviewer: z.string().optional(),
		publishDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		readingMinutes: z.number().int().positive(),
		featured: z.boolean().default(false),
		draft: z.boolean().default(false),
		imageLabel: z.string().default("hero image"),
		tint: z.string().default("#E3F1EA"),
		takeaways: z.array(z.string()).default([]),
		faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
		sources: z.array(z.object({ title: z.string(), url: z.string().url().optional() })).default([]),
	}),
});

export const collections = { guides };
