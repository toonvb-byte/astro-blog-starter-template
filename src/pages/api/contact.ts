import type { APIRoute } from "astro";
import { LOCALES } from "../../i18n/config";
import { OPERATOR, SITE_NAME } from "../../lib/site";

export const prerender = false;

const json = (body: object, status = 200) =>
	new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
	});

const clean = (v: FormDataEntryValue | null, max: number) =>
	String(v ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max);

/**
 * Contact form → D1 (always) + email to the site inbox (when the EMAIL send_email binding exists,
 * which needs Cloudflare Email Routing on nutrimetrics.eu). Honeypot + 5 messages/hour per IP.
 */
export const POST: APIRoute = async ({ request, locals }) => {
	const { env } = locals.runtime as { env: Record<string, any> };
	let form: FormData;
	try { form = await request.formData(); } catch { return json({ ok: false, error: "bad_request" }, 400); }

	// Honeypot: bots fill every field. Pretend success.
	if (clean(form.get("website"), 200)) return json({ ok: true });

	const name = clean(form.get("name"), 120);
	const email = clean(form.get("email"), 200);
	const topic = clean(form.get("topic"), 80);
	const message = clean(form.get("message"), 5000);
	const loc = clean(form.get("locale"), 5);
	const locale = (LOCALES as readonly string[]).includes(loc) ? loc : null;

	if (!name || !message || message.length < 5 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
		return json({ ok: false, error: "invalid" }, 400);
	}

	// Rate limit per IP (hashed, kept 1 hour in KV).
	const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
	const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`contact:${ip}`));
	const key = "rl:contact:" + [...new Uint8Array(digest)].slice(0, 12).map((b) => b.toString(16).padStart(2, "0")).join("");
	if (env.CACHE) {
		const n = Number((await env.CACHE.get(key)) ?? 0);
		if (n >= 5) return json({ ok: false, error: "rate_limited" }, 429);
		await env.CACHE.put(key, String(n + 1), { expirationTtl: 3600 });
	}

	const row = await env.DB.prepare(
		"INSERT INTO contact_messages (locale, name, email, topic, message) VALUES (?1, ?2, ?3, ?4, ?5) RETURNING id",
	)
		.bind(locale, name, email, topic, message)
		.first<{ id: number }>();

	// Must be a verified destination address in Cloudflare Email Routing (Worker variable CONTACT_TO).
	const to: string = env.CONTACT_TO || OPERATOR.email;
	if (env.EMAIL) {
		try {
			const { EmailMessage } = await import("cloudflare:email");
			const from = `contact@nutrimetrics.eu`;
			const subject = `[${SITE_NAME}] ${topic || "Contact"} — ${name}`.replace(/[\r\n]+/g, " ");
			const enc = (s: string) => `=?UTF-8?B?${btoa(unescape(encodeURIComponent(s)))}?=`;
			const body = `${message}\n\n—\nName: ${name}\nEmail: ${email}\nTopic: ${topic}\nLanguage: ${locale ?? "-"}\nMessage #${row?.id ?? "?"}\n`;
			const raw = [
				`From: ${enc(SITE_NAME + " contact form")} <${from}>`,
				`To: <${to}>`,
				`Reply-To: <${email}>`,
				`Subject: ${enc(subject)}`,
				`Message-ID: <${crypto.randomUUID()}@nutrimetrics.eu>`,
				`Date: ${new Date().toUTCString()}`,
				"MIME-Version: 1.0",
				"Content-Type: text/plain; charset=utf-8",
				"Content-Transfer-Encoding: base64",
				"",
				btoa(unescape(encodeURIComponent(body))).replace(/.{76}/g, "$&\r\n"),
			].join("\r\n");
			await env.EMAIL.send(new EmailMessage(from, to, raw));
			if (row?.id) await env.DB.prepare("UPDATE contact_messages SET emailed = 1 WHERE id = ?1").bind(row.id).run();
		} catch (e) {
			console.error("contact email failed", e);
		}
	}
	return json({ ok: true });
};
