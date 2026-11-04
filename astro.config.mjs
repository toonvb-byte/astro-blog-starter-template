// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import keystatic from "@keystatic/astro";
import rehypeGlossaryLinks from "./src/lib/rehype-glossary-links.mjs";
import rehypeFigureCaptions from "./src/lib/rehype-figure-captions.mjs";
import rehypeCountryStatus from "./src/lib/rehype-country-status.mjs";
import stripImageMetadata from "./src/lib/strip-image-metadata.mjs";
import indexNow from "./src/lib/indexnow.mjs";
import { lastmodFor } from "./src/lib/sitemap-lastmod.mjs";

// Build-time switch: pages are static, so the noindex flag is baked in at build.
// Flip SITE_LIVE in src/lib/site.ts at launch (and in wrangler.json vars for /robots.txt).
export default defineConfig({
	site: "https://nutrimetrics.eu",
	trailingSlash: "ignore",
	integrations: [
		react(),
		keystatic(),
		// Image captions from ![alt](src "caption"), then links to the glossary (see src/data/glossary/link-terms.mjs),
		// then [[country-status:{id}]] tables from src/data/legal-status/ (after the glossary, so table text stays unlinked).
		mdx({ rehypePlugins: [rehypeFigureCaptions, rehypeGlossaryLinks, rehypeCountryStatus] }),
		// Removes EXIF/GPS from every published image (originals of uploaded photos included).
		stripImageMetadata(),
		sitemap({
			filter: (page) => !page.includes("/go/") && !page.includes("/keystatic") && !/\/(price-tracker|comparador-precios|preisvergleich|compare|comparar|vergleichen)\/$/.test(page),
			i18n: { defaultLocale: "en", locales: { en: "en", es: "es", de: "de" } },
			// <lastmod> only where the content has a real date (updatedDate / publishDate / check dates).
			serialize(item) {
				const d = lastmodFor(item.url);
				if (d) item.lastmod = d;
				return item;
			},
		}),
		// After the sitemap: pings IndexNow (Bing etc.) with pages whose lastmod changed, on Workers Builds for main only.
		indexNow({ site: "https://nutrimetrics.eu" }),
	],
	// React 19 on Workers needs the edge build of react-dom/server (used by the Keystatic admin page).
	vite: {
		// Keystatic's API module imports astro:env, which Vite's dev pre-bundler can't resolve.
		optimizeDeps: { exclude: ["@keystatic/astro/api"] },
		// Public name of the GitHub App Keystatic uses (not a secret). Change if the app gets another name.
		define: { "import.meta.env.PUBLIC_KEYSTATIC_GITHUB_APP_SLUG": JSON.stringify("nutrimetrics-keystatic-toonvb") },
		resolve: {
			alias: process.env.NODE_ENV === "production" ? { "react-dom/server": "react-dom/server.edge" } : {},
		},
	},
	adapter: cloudflare({
		platformProxy: { enabled: true },
		imageService: "compile",
	}),
});
