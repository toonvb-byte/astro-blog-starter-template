# News routine (runs every 3 days)

A scheduled task runs this procedure every three days. It finds supplement news for Spain, Germany, the UK and the EU, publishes the items worth covering in the news section (`/en/news/`, `/es/noticias/`, `/de/aktuelles/`), updates items whose follow-up date has passed, and pushes to `main` (which deploys the site). Everything a run needs is in this file; the claude.ai Project doc `claude/news-section.md` has the same background if the Projects tool is available.

**Publishing nothing is a normal result.** Publish only what passes every rule below. When in doubt, leave it out and list it under "Checked and left out" in the report.

## 1. Set up

1. Repo: `toonvb-byte/astro-blog-starter-template`, branch `main`. Clone or pull, then `npm ci`.
2. Existing news: `src/content/news/{en,es,de}/*.mdx`. Read the frontmatter of all items (newsKey, title, eventDate, publishDate) so nothing is covered twice. The newest `publishDate` is the previous run.
3. Scan window: from 3 days before the newest `publishDate` up to today. Older news only if it was clearly missed and is still relevant (max 30 days old).
4. Valid keys for related pages, same language as the item:
   - hubs: `grep -h '^hubKey' src/content/hubs/en/*.mdx`
   - guides: `grep -h '^translationKey' src/content/guides/{en,es,de}/*.mdx` (check the language you need: some guides exist only in DE)
   - rankings (ES/DE only): `grep -h '^rankingKey' src/content/rankings/{es,de}/*.md`

## 2. Follow-ups due

Check this table first. When a date has passed, find the outcome. If there is one, update the item(s): set `updatedDate` to today, rewrite the affected sentences, add the new source. If the outcome changes a legal status, also update the matching row in `src/data/legal-status/*.json` (with a source; bump `checked`) and remove the passed `watch` date. Then edit this table: delete done rows, add new ones.

| Date | What | Items / data to update |
| --- | --- | --- |
| 16 Nov 2026 | FSA consultation on 16 novel foods closes | `uk-eu-sps-summit` only if the FSA publishes a decision |
| 20 Nov 2026 | UK-EU summit in Brussels (SPS food deal) | `uk-eu-sps-summit` (EN); new item if a deal is signed |
| 7 Dec 2026 | EU standstill ends for the Dutch herbal decree (ashwagandha leaf ban) | `nl-herbal-decree` (EN/ES/DE), `src/data/legal-status/ashwagandha.json` |
| 8 Dec 2026 | UK Committee on Toxicity meeting (ashwagandha statement pending) | new UK item if a statement is published; `ashwagandha.json` UK row |
| monthly | European Commission initiative page on EU maximum levels for vitamins and minerals | `eu-max-levels-delay` (EN/ES/DE) if the timeline changes |

## 3. Where to look

Search each market separately (one query per source type), with the month and year in the query.

- **EU:** European Commission (food supplements, nutrition and health claims register, novel food authorisations in the Official Journal), EFSA news and opinions, Court of Justice judgments, TRIS notifications on food supplements, NutraIngredients "Regulation & policy" Europe page, HBW Insight.
- **Spain:** AESAN alerts, category "complementos alimenticios" (https://www.aesan.gob.es/en/alertas/alertas-alimentarias), AESAN news, AEMPS notas informativas (medicamentos ilegales, seguridad), BOE, OCU (open the original press release on ocu.org and check its date), CNMC and Autocontrol rulings on supplement ads.
- **Germany:** BfR press releases, opinions and FAQs, BVL press releases and lebensmittelwarnung.de (Nahrungsergänzungsmittel), Verbraucherzentrale, Öko-Test, Stiftung Warentest.
- **UK:** FSA news and consultations, ASA rulings and enforcement reports on food supplements, COT meetings and statements, MHRA, NHS guidance changes, Which?.
- **Worldwide:** large trials or reviews on supplements we cover (published in the window: check the journal date, not the date of the press coverage), market news that affects prices in Europe (fish oil, IFFO, GOED).

## 4. What qualifies

An item qualifies only if all of these are true:

- It changes what a supplement may contain, claim or cost, or how safe it is, for readers in Spain, Germany, the UK or the EU.
- It happened in the scan window. **Check the original date.** Aggregator sites republish old press releases with new dates (example: OCU complaints from 2025 reappeared in Oct 2026 with 2026 dates).
- It is not already covered. If it is a development of an existing story, update that item instead (follow-up rules above).
- It has a primary source (authority, court, journal, the testing organisation) or, if none is readable, two independent reputable reports.

Skip: brand press releases, business deals and funding, US-only regulation, product launches, sponsored studies without peer review, celebrity or influencer stories, libido and weight-loss product promotion (safety alerts about hidden drugs in such products are fine, grouped into one roundup item per market and month).

**Maximum 2 new stories per run.** Pick the ones with the clearest consequence for readers. Updates to existing items don't count towards the limit.

## 5. Facts and sourcing

- Every number, date and name must come from a source read in this run (fetched page or search result with a visible date). Prefer the official page. If a page can't be fetched, use the search result text and say so in the report.
- Write everything in your own words. No quote longer than 15 words, at most one quote per source. Never copy article structure.
- Health statements: describe only what the source says. Claims only in their authorised wording (EU register; GB register for UK readers). No promises, no dosing advice beyond what an authority says; point readers to a doctor or pharmacist where the source does.
- Check consistency with the site: `grep -rn` the key numbers in `src/content/guides` and `src/content/hubs`. If the news makes an existing statement on the site wrong, fix that statement minimally, set the page's `updatedDate`, and list it in the report.
- Mark paywalled sources in the source title: "subscription" / "de pago" / "kostenpflichtig".

## 6. Writing an item

Copy the frontmatter of an existing item as a template (for example `src/content/news/en/eu-supplement-limits-no-consultation-2026.mdx`).

- **Languages:** EU and worldwide news → EN, ES and DE (same `newsKey`). Spain → ES, plus EN if it matters to English-speaking buyers in Spain. Germany → DE, plus EN if useful. UK → EN only.
- **File name = URL slug:** lowercase ASCII, hyphens, 3–8 words, in the item's language (ä→ae, ö→oe, ü→ue, ß→ss, ñ→n).
- **title** ≤ 65 characters (hard max 70), says what happened. **description** ≤ 155 characters. **dek**: 1–2 sentences, what happened and why it matters.
- **region**: es, de, uk, eu or world (country filter). **place**: only if more precise, e.g. "Netherlands" / "Países Bajos" / "Niederlande".
- **kind**: rules, advice, alert, test, study, market or ads.
- **eventDate**: date of the decision, report, alert or publication. **publishDate**: today. **author**: Toon Van Buylaere. **draft**: false.
- **hubs / guides / rankings**: only keys that exist in that language (section 1); an unknown key fails the build.
- **sources**: official source first; title with publisher, document and date; language in brackets when it is not the page's language.
- **Body**: 180–350 words, two H2 sections: EN "What happened" / "What it means for you"; ES "Qué ha pasado" / "Qué significa para ti"; DE "Was passiert ist" / "Was das für dich heißt". Bullets in the second section, each starting with a short bold phrase. Links to our own pages with full paths in the same language (e.g. `/es/guias/...`). No affiliate links, no product recommendations, no Amazon prices.
- **Style:** EN = British spelling, UK-first (NHS, FSA, GB register), decimal point. ES = tú, decimal comma, «comillas». DE = du throughout, decimal comma, „Anführungszeichen“. Plain, factual, no hype; numbers with units (µg, mg, g).

## 7. Build, check, publish

1. `npx astro build` (about 2–3 minutes). Fix any schema error. Note any "watch date has passed" warning and handle it (section 2).
2. `python3 scripts/news/check_dist.py` must report 0 problems.
3. Commit only the news files and the minimal related edits. Message: `News: <short list of items>` plus the attribution lines the session asks for. Push to `main`.
4. Wait for the "Workers Builds" check on the commit: `gh api repos/toonvb-byte/astro-blog-starter-template/commits/<sha>/check-runs`. If it fails with no code change, push one empty retry commit; if it fails again, stop and report.
5. If nothing qualified and no follow-up was due, do not commit anything.

## 8. Record and report

- If the Projects tool is available, update `claude/news-section.md`: add rows to "Published items", move "Checked and left out" entries, update "Rechecks / follow-ups". Keep this file's follow-up table in sync and commit it with the news.
- End with a short report: items published (title, language versions, live URL), items updated and why, candidates left out with the reason, and anything the owner must decide.
