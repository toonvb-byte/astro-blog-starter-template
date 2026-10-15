# NutriMetrics.eu

Multilingual supplement price-comparison site. Astro + Cloudflare Workers (static assets) + D1 + KV.
Spec: see the implementation brief in the claude.ai project "nutrimetrics.eu".

## Status (build order step 1–2 done, step 3 partly)
- EN + ES with localised slugs (`src/i18n/config.ts → ROUTES`), hreflang, canonical, JSON-LD
- Homepage, guides index (with search), article template, about/methodology, legal skeletons
- Price tracker + compare = "coming soon" pages
- `/go/{offerId}?p={placement}` affiliate redirect (D1 lookup → AWIN deep link → click log, no personal data)
- `/` redirects by Accept-Language
- **Pre-launch:** `SITE_LIVE = false` in `src/lib/site.ts` → every page noindex + robots.txt `Disallow: /`

## Cloudflare resources
| Binding | Resource |
|---|---|
| `DB` | D1 `nutrimetrics-db` (WEUR) — schema in `migrations/0001_initial_schema.sql` |
| `CACHE` | KV `nutrimetrics-cache` |
| secret `AWIN_PUBLISHER_ID` | set in dashboard → Worker → Settings → Variables & Secrets |

R2 (images) is not enabled on the account yet.

## Editing content — Keystatic CMS
Go to `/keystatic` on the live site and log in with GitHub. Every save is a commit to `main` → Cloudflare redeploys in ~1–2 min.
- Guides: `src/content/guides/{en|es}/{url-slug}.mdx` (file name = URL slug). Language versions share `translationKey`.
- New guides start as **Draft** (hidden on the live site) — untick Draft to publish.
- Page texts (menu, homepage, About, legal) are still code: `src/i18n/ui.ts`, `src/views/*.astro`.

Keystatic needs a GitHub App (`nutrimetrics-keystatic-toonvb`) and three Worker secrets:
`KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET`, `KEYSTATIC_SECRET`.
Callback URL: `https://<site>/api/keystatic/github/oauth/callback`. Locally (`npm run dev`) Keystatic edits files on disk, no login.

## Commands
```
npm install
npm run dev                                   # local dev (Astro)
npm run preview                               # build + wrangler dev (real Worker runtime, local D1)
npx wrangler d1 migrations apply nutrimetrics-db --local    # local DB
npx wrangler d1 migrations create nutrimetrics-db <name>    # new schema change
npx wrangler d1 migrations apply nutrimetrics-db --remote   # apply to production
```
