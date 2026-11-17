import type { APIRoute } from "astro";

/**
 * Internal price entry for shop offers (not linked from the site, noindex, token-protected).
 * Set the Worker secret ADMIN_TOKEN (wrangler secret put ADMIN_TOKEN). Without it the page stays closed.
 * Amazon offers are shown read-only: Associates rules don't allow storing or showing Amazon prices.
 */
export const prerender = false;

const NOINDEX = "noindex, nofollow";
const COOKIE = "nm_admin";
const MARKETS = ["ES", "DE"] as const;
type Market = (typeof MARKETS)[number];

const esc = (s: unknown) =>
	String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const CSS = `
body{font:15px/1.45 system-ui,sans-serif;margin:0;background:#f7f7f5;color:#1d1d1b}
main{max-width:1100px;margin:0 auto;padding:24px 16px 80px}
h1{font-size:22px;margin:0 0 12px} .muted{color:#6b6b66;font-size:13px}
.tabs{display:flex;gap:8px;margin:16px 0}
.tabs a{padding:8px 14px;border:1px solid #cfcfc9;border-radius:999px;text-decoration:none;color:#1d1d1b;background:#fff}
.tabs a.on{background:#1d1d1b;color:#fff;border-color:#1d1d1b}
table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #e2e2dc}
th,td{text-align:left;padding:8px 10px;border-bottom:1px solid #eee;vertical-align:top}
th{font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:#6b6b66;background:#fafaf8}
tr.first td{border-top:2px solid #cfcfc9}
input[type=text]{width:110px;padding:6px 8px;border:1px solid #bdbdb5;border-radius:6px;font:inherit}
button{padding:10px 18px;border:0;border-radius:8px;background:#1d1d1b;color:#fff;font:inherit;cursor:pointer}
.amz{color:#7a4b00;background:#fff4df;padding:2px 8px;border-radius:999px;font-size:12px}
.shop{color:#2d5a3d;background:#e7f2ea;padding:2px 8px;border-radius:999px;font-size:12px}
.note{padding:10px 12px;border-radius:8px;background:#fff;border:1px solid #e2e2dc;margin:12px 0}
.ok{background:#e7f2ea;border-color:#b9d7c2} .err{background:#fbe9e7;border-color:#e6b3ab}
.login{max-width:360px;margin:12vh auto;background:#fff;border:1px solid #e2e2dc;border-radius:12px;padding:24px}
.login input{width:100%;box-sizing:border-box;margin:8px 0 14px;padding:10px;border:1px solid #bdbdb5;border-radius:8px;font:inherit}
.login button{width:100%}
`;

function page(body: string, status = 200, headers: Record<string, string> = {}) {
	return new Response(
		`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="${NOINDEX}"><title>Prices · admin</title><style>${CSS}</style></head><body><main>${body}</main></body></html>`,
		{ status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": NOINDEX, ...headers } },
	);
}

async function digest(token: string): Promise<string> {
	const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("nm-admin-v1:" + token));
	return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function isAuthed(request: Request, token: string | undefined): Promise<boolean> {
	if (!token) return false;
	const m = (request.headers.get("cookie") ?? "").match(/(?:^|;\s*)nm_admin=([0-9a-f]{64})/);
	return !!m && m[1] === (await digest(token));
}

const loginForm = (error?: string) =>
	page(
		`<form class="login" method="post" action="/admin/prices">
			<h1>Prices</h1>
			<p class="muted">Internal. Enter the admin token.</p>
			${error ? `<div class="note err">${esc(error)}</div>` : ""}
			<input type="password" name="token" autocomplete="current-password" required autofocus>
			<input type="hidden" name="action" value="login">
			<button type="submit">Open</button>
		</form>`,
		error ? 401 : 200,
	);

const parsePrice = (raw: string): number | null => {
	const v = Number(raw.trim().replace(/\s/g, "").replace(",", "."));
	return Number.isFinite(v) && v >= 0 && v < 10000 ? Math.round(v * 100) / 100 : null;
};

export const GET: APIRoute = async ({ request, url, locals }) => {
	const { env } = locals.runtime as { env: Record<string, any> };
	if (!env.ADMIN_TOKEN) return page(`<h1>Prices</h1><div class="note err">ADMIN_TOKEN is not set on the Worker, so this page is closed.</div>`, 503);
	if (!(await isAuthed(request, env.ADMIN_TOKEN))) return loginForm();

	const market: Market = url.searchParams.get("market") === "DE" ? "DE" : "ES";
	const saved = url.searchParams.get("saved");

	const { results } = await env.DB.prepare(
		`SELECT o.id AS offer_id, o.price, o.merchant_url, r.name AS retailer, r.network,
		        p.id AS product_id, p.brand, p.name, p.pack_label
		 FROM offers o
		 JOIN products p ON p.id = o.product_id
		 JOIN retailers r ON r.id = o.retailer_id
		 WHERE o.country = ?1
		 ORDER BY p.brand COLLATE NOCASE, p.name COLLATE NOCASE, r.network = 'amazon' DESC, o.id`,
	)
		.bind(market)
		.all();

	const counts = { total: results.length, amazon: results.filter((r: any) => r.network === "amazon").length };
	let lastProduct = -1;
	const rows = results
		.map((r: any) => {
			const first = r.product_id !== lastProduct;
			lastProduct = r.product_id;
			const isAmazon = r.network === "amazon";
			const price = isAmazon
				? `<span class="muted">Amazon price not stored (Associates rule)</span>`
				: `<input type="text" inputmode="decimal" name="p_${r.offer_id}" value="${r.price > 0 ? esc(String(r.price).replace(".", ",")) : ""}" placeholder="0,00"> €${r.price > 0 ? ` <span class="muted">now ${esc(r.price)} €</span>` : ` <span class="muted">not set</span>`}`;
			return `<tr class="${first ? "first" : ""}">
				<td>${first ? `<strong>${esc(r.brand)}</strong><br>${esc(r.name)}<br><span class="muted">${esc(r.pack_label ?? "")} · #${r.product_id}</span>` : ""}</td>
				<td>${esc(r.retailer)}<br><a class="muted" href="${esc(r.merchant_url)}" target="_blank" rel="noopener">open shop page ↗</a></td>
				<td>${isAmazon ? `<span class="amz">Amazon · linked</span>` : `<span class="shop">Shop</span>`}</td>
				<td>${price}</td>
			</tr>`;
		})
		.join("");

	const tabs = MARKETS.map((m) => `<a href="/admin/prices?market=${m}" class="${m === market ? "on" : ""}">${m === "ES" ? "Spain (ES)" : "Germany (DE)"}</a>`).join("");

	return page(`
		<h1>Shop prices</h1>
		<p class="muted">${counts.total} offers in ${market} · ${counts.amazon} Amazon (read-only). Leave a field empty to keep it; enter 0 to clear. Prices are shown on the site only where set.</p>
		${saved ? `<div class="note ok">Saved ${esc(saved)} price(s) for ${esc(market)}.</div>` : ""}
		<div class="tabs">${tabs}</div>
		<form method="post" action="/admin/prices">
			<input type="hidden" name="action" value="save">
			<input type="hidden" name="market" value="${market}">
			<table>
				<thead><tr><th>Product</th><th>Shop</th><th>Type</th><th>Price (incl. VAT)</th></tr></thead>
				<tbody>${rows || `<tr><td colspan="4" class="muted">No offers for ${market} yet.</td></tr>`}</tbody>
			</table>
			<p><button type="submit">Save prices</button></p>
		</form>`);
};

export const POST: APIRoute = async ({ request, locals }) => {
	const { env } = locals.runtime as { env: Record<string, any> };
	if (!env.ADMIN_TOKEN) return new Response("Not configured", { status: 503, headers: { "X-Robots-Tag": NOINDEX } });
	const form = await request.formData();
	const action = String(form.get("action") ?? "");

	if (action === "login") {
		if (String(form.get("token") ?? "") !== env.ADMIN_TOKEN) return loginForm("Wrong token.");
		return new Response(null, {
			status: 303,
			headers: {
				Location: "/admin/prices",
				"Set-Cookie": `${COOKIE}=${await digest(env.ADMIN_TOKEN)}; Path=/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000`,
				"Cache-Control": "no-store",
			},
		});
	}

	if (!(await isAuthed(request, env.ADMIN_TOKEN))) return loginForm("Your session has expired. Log in again.");
	if (action !== "save") return new Response("Bad request", { status: 400 });

	const market = String(form.get("market") ?? "");
	if (!(MARKETS as readonly string[]).includes(market)) return new Response("Bad market", { status: 400 });

	let n = 0;
	const stmts: any[] = [];
	for (const [key, value] of form.entries()) {
		if (!key.startsWith("p_") || typeof value !== "string" || value.trim() === "") continue;
		const id = Number(key.slice(2));
		const price = parsePrice(value);
		if (!Number.isInteger(id) || price === null) continue;
		// Only shop offers in this market; Amazon offers can never be priced here.
		stmts.push(
			env.DB.prepare(
				`UPDATE offers SET price = ?1, checked_at = date('now')
				 WHERE id = ?2 AND country = ?3 AND retailer_id NOT IN (SELECT id FROM retailers WHERE network = 'amazon')`,
			).bind(price, id, market),
		);
		n++;
	}
	if (stmts.length) await env.DB.batch(stmts);

	return new Response(null, {
		status: 303,
		headers: { Location: `/admin/prices?market=${market}&saved=${n}`, "Cache-Control": "no-store" },
	});
};
