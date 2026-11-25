# Full SEO Audit: bulgaria-game.com

Date: 2026-11-06. Crawled: 11 routes (all internal URLs found, plus known app routes), rendered in Chromium, plus raw-HTML, header and robots checks.
Data sources: on-site evidence and lab measurements only. No Search Console, CrUX, GA4, Matomo, Moz or DataForSEO credentials are configured, so there is no ranking, traffic, field Core Web Vitals or backlink data. Google update ledger last verified 2026-10-22 (not stale). No drift baseline existed.

## Executive summary

**SEO Health Score: 29/100**

| Category | Weight | Score |
|---|---|---|
| Technical SEO | 22% | 30 |
| Content Quality | 23% | 30 |
| On-Page SEO | 20% | 25 |
| Schema / Structured Data | 10% | 0 |
| Performance (CWV, lab) | 10% | 55 |
| AI Search Readiness | 10% | 25 |
| Images | 5% | 45 |

**Business type:** non-commercial educational games and learning resource, in Bulgarian, made by a school (PMG "Hristo Smirnenski", Pernik). No local, ecommerce or SaaS signals.

**What this means:** the product is strong for people who reach it, but search engines can barely see it. Every page presents itself with the same 8-character title, the HTML Google first receives is empty, and three pages are blank when opened from a link.

### Top 5 critical issues
1. **Nested pages are blank on a direct visit.** `vite.config.ts` has `base: "./"`, so `/flashcards/history`, `/geography` and `/general` request `/flashcards/assets/index-*.js` and get a 404. A visitor or crawler arriving from a link or a search result sees an empty page.
2. **Soft 404s.** Any made-up URL returns 200 with the homepage shell, so the site has an unlimited number of duplicate addresses.
3. **The same title ("България") and description on all 11 routes**, and no H1 on 6 of them.
4. **Client-side rendering only.** The raw HTML has no headings, links or text, so non-JavaScript crawlers (ChatGPT Search, Perplexity, Claude) cannot read anything.
5. **No sitemap, no canonical and no structured data.**

### Top 5 quick wins
1. Change `base` to `"/"` (one line).
2. Set the title, description, canonical and Bulgarian H1 per route.
3. Mark the 404 page, /profile and /reset-password `noindex`.
4. Add `sitemap.xml` and a `Sitemap:` line in robots.txt.
5. Paste in the WebSite and LearningResource JSON-LD.

## Technical SEO (30)
**Critical**
- Blank nested routes (`base: "./"`).
- Soft 404s.

**High**
- Client-side rendering only.
- No sitemap.
- No canonical.

**Medium**
- `www` redirects with a 302 instead of a 301.

**Works:** HTTPS with HSTS, security headers, http to https 301, robots.txt allows everything, 0 JavaScript errors.

Details: `findings/technical.md`.

## Content quality (30)
Rendered pages carry 23 to 100 words. The real substance, the flashcards and quiz questions, sits behind interaction or on the blank routes.

There are no sources, dates or publisher entity. The homepage H1 is English. The About page publishes the students' personal emails, and they are minors.

Details: `findings/content.md`.

## On-page SEO (25)
- The same title and description on 11 of 11 routes.
- The H1 is missing on 6 of 11 routes.
- `og:image` is still Lovable's image on the live site. This is fixed in the repository but not deployed.
- `og:url` is missing.
- The Lovable badge adds an outbound link to every page.

Per-route titles are in ACTION-PLAN.md. Details: `findings/onpage.md`.

## Schema and structured data (0)
None. Recommended: WebSite, LearningResource and EducationalOrganization (the school as publisher). Do not add Person schema for the students, FAQPage (retired) or HowTo (deprecated).

Details: `findings/schema.md`.

## Performance (55, lab only)
Measured on a throttled mobile profile: FCP 0.63 s, LCP 3.64 s (needs improvement), CLS 0.00, tap response 21 ms. There is no field data.

The biggest cost is the 5 MB Earth texture that loads on the homepage. Unthrottled, a full load transfers 10.5 MB.

Details: `findings/performance.md`.

## Images (45)
- 27 of 27 homepage images have empty alt text, including the 23 timeline photos that carry content.
- All are 1536 px JPEGs with no `srcset` and no WebP or AVIF version.
- Dimensions are set on every image, which is good for layout stability.

Details: `findings/images.md`.

## AI search readiness (25)
All AI crawlers are allowed, but the non-JavaScript ones get an empty page. There are no citable passages. The name "Опознай България" collides with a BNT television programme.

Details: `findings/geo.md` and `../GEO-ANALYSIS.md`.

## Also reviewed
- **Search experience:** `findings/sxo.md`. Searchers for quiz and province queries expect visible questions and reference tables.
- **Visual and mobile:** `findings/visual.md`. There is no statement of what the site is in the first screen.
- **Agent readiness:** `findings/agentic.md`. Buttons and map provinces have accessible names, which is good. Lighthouse could not run here.
- **Sitemap:** `findings/sitemap.md`, with a ready-made file.
- **Backlinks:** `findings/backlinks.md`. No data sources were available.

## Limitations
- The plugin's own renderer and Lighthouse refuse to run through this environment's network proxy, so I rendered with Playwright Chromium through the proxy.
- Performance is one lab run, not real-user data.
- The crawl covered the 11 routes the app exposes. The site has no other internal URLs.

Action plan: `ACTION-PLAN.md`. Structured data for PDF generation: `audit-data.json`.
