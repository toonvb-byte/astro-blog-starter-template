/// <reference types="astro/client" />
type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

declare namespace App {
	interface Locals extends Runtime {}
}

// Worker secrets (not in wrangler.json, so `wrangler types` doesn't see them).
interface Env {
	AWIN_PUBLISHER_ID?: string;
}
