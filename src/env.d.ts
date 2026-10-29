/// <reference types="astro/client" />
type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

declare namespace App {
	interface Locals extends Runtime {}
}

// Worker secrets (not in wrangler.json, so `wrangler types` doesn't see them).
interface Env {
	AWIN_PUBLISHER_ID?: string;
	/** Amazon Associates store tags, e.g. "nutrimetrics-21". Used by /go/ for offers of retailers with network 'amazon'. */
	AMAZON_TAG_ES?: string;
	AMAZON_TAG_DE?: string;
}
