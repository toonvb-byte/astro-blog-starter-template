/**
 * Astro integration: after a production build on Cloudflare Workers Builds (branch main), tells IndexNow
 * (Bing, Yandex, Seznam, Naver …; ChatGPT search and Copilot use Bing's index) which pages changed.
 *
 * "Changed" = the page's sitemap <lastmod> is within the last DAYS days. lastmod only moves when content really
 * changes (src/lib/sitemap-lastmod.mjs), so unchanged pages are not resubmitted.
 * The key file is public/{INDEXNOW_KEY}.txt (a public value by design: it only proves we own the host).
 * Runs after @astrojs/sitemap (keep it after sitemap() in astro.config.mjs). Never fails the build.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const INDEXNOW_KEY = "ec02a438870e84b41165df0d4f6feb87";
const ENDPOINT = "https://api.indexnow.org/indexnow";
const DAYS = 2;

export default function indexNow({ site }) {
	return {
		name: "indexnow",
		hooks: {
			"astro:build:done": async ({ dir, logger }) => {
				try {
					const ci = process.env.WORKERS_CI === "1";
					const branch = process.env.WORKERS_CI_BRANCH;
					if (!ci || (branch && branch !== "main")) {
						logger.info(`skipped (only on Workers Builds for main; WORKERS_CI=${process.env.WORKERS_CI ?? "-"}, branch=${branch ?? "-"})`);
						return;
					}
					const out = fileURLToPath(dir);
					const cutoff = Date.now() - DAYS * 864e5;
					const urls = [];
					for (const f of fs.readdirSync(out).filter((x) => /^sitemap-\d+\.xml$/.test(x))) {
						const xml = fs.readFileSync(path.join(out, f), "utf8");
						for (const m of xml.matchAll(/<url><loc>([^<]+)<\/loc>(?:<lastmod>([^<]+)<\/lastmod>)?/g)) {
							if (m[2] && Date.parse(m[2]) >= cutoff) urls.push(m[1]);
						}
					}
					if (!urls.length) {
						logger.info("no pages changed in the last 2 days, nothing submitted");
						return;
					}
					const host = new URL(site).host;
					const res = await fetch(ENDPOINT, {
						method: "POST",
						headers: { "Content-Type": "application/json; charset=utf-8" },
						body: JSON.stringify({ host, key: INDEXNOW_KEY, keyLocation: `${site.replace(/\/$/, "")}/${INDEXNOW_KEY}.txt`, urlList: urls.slice(0, 10000) }),
						signal: AbortSignal.timeout(15000),
					});
					logger.info(`submitted ${urls.length} changed URL(s) → HTTP ${res.status}`);
				} catch (e) {
					logger.warn(`IndexNow submission failed (build continues): ${e?.message ?? e}`);
				}
			},
		},
	};
}
