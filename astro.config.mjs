// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import cloudflare from "@astrojs/cloudflare";

// Build-time switch: pages are static, so the noindex flag is baked in at build.
// Flip SITE_LIVE in src/lib/site.ts at launch (and in wrangler.json vars for /robots.txt).
export default defineConfig({
	site: "https://nutrimetrics.eu",
	trailingSlash: "ignore",
	integrations: [
		mdx(),
		sitemap({
			filter: (page) => !page.includes("/go/"),
			i18n: { defaultLocale: "en", locales: { en: "en", es: "es" } },
		}),
	],
	adapter: cloudflare({
		platformProxy: { enabled: true },
		imageService: "compile",
	}),
});
