import type { APIRoute } from "astro";
import { DEFAULT_LOCALE, LOCALES } from "../i18n/config";

export const prerender = false;

/** `/` → best locale from Accept-Language (302, never on locale URLs). */
export const GET: APIRoute = ({ request }) => {
	const header = request.headers.get("accept-language") ?? "";
	const wanted = header
		.split(",")
		.map((part) => {
			const [tag, q] = part.trim().split(";q=");
			return { lang: tag.slice(0, 2).toLowerCase(), q: q ? Number(q) : 1 };
		})
		.sort((a, b) => b.q - a.q)
		.map((x) => x.lang);
	const locale = wanted.find((l) => (LOCALES as readonly string[]).includes(l)) ?? DEFAULT_LOCALE;
	return new Response(null, {
		status: 302,
		headers: { Location: `/${locale}/`, Vary: "Accept-Language", "Cache-Control": "private, max-age=0" },
	});
};
