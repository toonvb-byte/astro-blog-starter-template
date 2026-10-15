import { glob } from "astro/loaders";
import { defineCollection } from "astro:content";
import { z } from "astro/zod";

/**
 * Guides live in src/content/guides/{locale}/{url-slug}.mdx — edited via Keystatic (/keystatic).
 * Locale and URL slug come from the file path (see lib/guides.ts).
 * `translationKey` ties language versions of the same guide together (hreflang + "Also in").
 * Field definitions must stay in sync with keystatic.config.ts.
 */
const optionalDate = z.union([z.null(), z.coerce.date()]).optional();
const optionalString = z.string().nullish();

const guides = defineCollection({
	loader: glob({ base: "./src/content/guides", pattern: "**/*.{md,mdx}" }),
	schema: z.object({
		title: z.string().max(70),
		description: z.string().max(155),
		dek: z.string(),
		category: z.string(),
		translationKey: z.string(),
		author: z.string(),
		authorBio: optionalString,
		reviewer: optionalString,
		publishDate: z.coerce.date(),
		updatedDate: optionalDate,
		readingMinutes: z.number().int().positive(),
		featured: z.boolean().default(false),
		draft: z.boolean().default(false),
		imageLabel: z.string().default("hero image"),
		tint: z.string().default("#E3F1EA"),
		takeaways: z.array(z.string()).default([]),
		faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
		sources: z.array(z.object({ title: z.string(), url: optionalString })).default([]),
	}),
});

export const collections = { guides };
