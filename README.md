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

## Adding content
New guide = new file in `src/content/guides/{en|es}/*.mdx`. Language versions share `translationKey`. Push to `main` → deploys automatically.

## Commands
```
npm install
npm run dev                                   # local dev (Astro)
npm run preview                               # build + wrangler dev (real Worker runtime, local D1)
npx wrangler d1 migrations apply nutrimetrics-db --local    # local DB
npx wrangler d1 migrations create nutrimetrics-db <name>    # new schema change
npx wrangler d1 migrations apply nutrimetrics-db --remote   # apply to production
```
