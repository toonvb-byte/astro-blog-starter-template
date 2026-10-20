import { glob } from "astro/loaders";
import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { HUB_GROUPS } from "./lib/hub-groups";

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

/**
 * Supplement hubs (category pages) live in src/content/hubs/{locale}/{url-slug}.mdx — one per ingredient or goal.
 * URL: /{locale}/{supplements route}/{url-slug}/. `hubKey` ties the language versions together.
 * The page template (views/Hub.astro) adds the product table from scripts/seed/finder-data.json
 * and related guides; the MDX body holds the forms table and the evidence summary.
 * Field definitions must stay in sync with keystatic.config.ts.
 */
const hubs = defineCollection({
	loader: glob({ base: "./src/content/hubs", pattern: "**/*.{md,mdx}" }),
	schema: z.object({
		title: z.string().max(70),
		description: z.string().max(155),
		dek: z.string(),
		hubKey: z.string(),
		kind: z.enum(["ingredient", "goal"]).default("ingredient"),
		group: z.enum(HUB_GROUPS).default("vitamins"),
		name: z.string(),
		order: z.number().int().default(100),
		author: z.string(),
		publishDate: z.coerce.date(),
		updatedDate: optionalDate,
		draft: z.boolean().default(false),
		takeaways: z.array(z.string()).default([]),
		facts: z.array(z.object({ label: z.string(), value: z.string(), note: optionalString })).default([]),
		checklist: z.array(z.string()).default([]),
		claims: z.array(z.string()).default([]),
		notClaims: z.array(z.string()).default([]),
		cautions: z.array(z.string()).default([]),
		finderIngredients: z.array(z.string()).default([]),
		finderShow: z.array(z.string()).default([]),
		finderGoal: optionalString,
		guides: z.array(z.string()).default([]),
		faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
		sources: z.array(z.object({ title: z.string(), url: optionalString })).default([]),
	}),
});

export const collections = { guides, hubs };
