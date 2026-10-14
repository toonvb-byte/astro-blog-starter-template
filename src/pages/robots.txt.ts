import type { APIRoute } from "astro";
import { SITE_LIVE, SITE_URL } from "../lib/site";

export const GET: APIRoute = () => {
	const body = SITE_LIVE
		? `User-agent: *\nDisallow: /go/\nDisallow: /api/\n\nSitemap: ${SITE_URL}/sitemap-index.xml\n`
		: `# Pre-launch: closed to crawlers. Flip SITE_LIVE in src/lib/site.ts at launch.\nUser-agent: *\nDisallow: /\n`;
	return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
