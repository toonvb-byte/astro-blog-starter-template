import type { APIRoute } from "astro";
import { LOCALES } from "../../i18n/config";

export const prerender = false;

interface OfferRow {
	id: number;
	merchant_url: string;
	country: string;
	network: string | null;
	awin_mid: string | null;
}

/**
 * Affiliate redirect (brief §6): /go/{offerId}?p={placement}
 * 1. look up offer + retailer  2. build the network deep link
 * 3. log the click (no IP / personal data)  4. 302
 */
export const GET: APIRoute = async ({ params, url, request, locals }) => {
	const { env, ctx } = locals.runtime;
	const id = Number(params.id);
	const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };
	if (!Number.isInteger(id) || id <= 0) return new Response("Not found", { status: 404, headers });

	const offer = await env.DB.prepare(
		`SELECT o.id, o.merchant_url, o.country, r.network, r.awin_mid
		 FROM offers o JOIN retailers r ON r.id = o.retailer_id
		 WHERE o.id = ?1 AND r.active = 1`,
	)
		.bind(id)
		.first<OfferRow>();

	if (!offer || !/^https?:\/\//i.test(offer.merchant_url)) {
		return new Response("Offer not found", { status: 404, headers });
	}

	const placement = (url.searchParams.get("p") ?? "").replace(/[^\w:.\-/]/g, "").slice(0, 80);
	const refPath = (() => {
		try { return new URL(request.headers.get("referer") ?? "").pathname; } catch { return ""; }
	})();
	const locale = LOCALES.find((l) => refPath.startsWith(`/${l}/`)) ?? null;

	let target = offer.merchant_url;
	if (offer.network === "awin" && offer.awin_mid && env.AWIN_PUBLISHER_ID) {
		// Check parameter names against AWIN's current link-builder docs before launch.
		const u = new URL("https://www.awin1.com/cread.php");
		u.searchParams.set("awinmid", offer.awin_mid);
		u.searchParams.set("awinaffid", env.AWIN_PUBLISHER_ID);
		if (placement) u.searchParams.set("clickref", placement);
		u.searchParams.set("ued", offer.merchant_url);
		target = u.toString();
	} else if (offer.network === "amazon") {
		// Amazon Associates: the store tag per marketplace is a Worker secret (AMAZON_TAG_ES / AMAZON_TAG_DE).
		// Without it the visitor gets the plain product link. Also flip AFFILIATE.amazon in src/lib/site.ts.
		const tag = offer.country === "ES" ? env.AMAZON_TAG_ES : offer.country === "DE" ? env.AMAZON_TAG_DE : undefined;
		if (tag) {
			const u = new URL(offer.merchant_url);
			u.searchParams.set("tag", tag);
			target = u.toString();
		}
	}

	ctx.waitUntil(
		env.DB.prepare("INSERT INTO clicks (offer_id, page, locale) VALUES (?1, ?2, ?3)")
			.bind(offer.id, placement || null, locale)
			.run()
			.catch((e: unknown) => console.error("click log failed", e)),
	);

	return new Response(null, { status: 302, headers: { ...headers, Location: target } });
};
