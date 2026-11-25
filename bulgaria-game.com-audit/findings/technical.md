# Technical SEO: 30/100

Evidence: live requests to https://bulgaria-game.com on 2026-11-06, raw HTML and Chromium-rendered crawl of 11 routes (`../crawl.json`).

## Critical
- **Nested routes render blank on a direct visit.** `vite.config.ts` sets `base: "./"`, so the HTML loads `./assets/index-Br-tkwr6.js`. On `/flashcards/history` that resolves to `/flashcards/assets/index-Br-tkwr6.js` and returns 404 (`text/plain`), so React never starts. The rendered text is only "Edit with" (the Lovable badge). Affected: `/flashcards/history`, `/flashcards/geography`, `/flashcards/general`, and any future nested route. **Fix:** `base: "/"`. The preview build already overrides this with `--base ./` and hash routing, so it is unaffected.
- **Soft 404s.** `/this-page-does-not-exist` returns 200 with the full app shell. Every unknown URL is indexable as a duplicate of the homepage. **Fix:** make `NotFound` set `<meta name="robots" content="noindex">`. The SPA host always answers 200, so this is the practical fix.

## High
- **Client-side rendering only.** Raw HTML has no headings, no links and a 3-word body. Googlebot renders it later and less reliably; non-JS crawlers (OAI-SearchBot, PerplexityBot, Claude-SearchBot) see nothing. **Fix:** pre-render routes at build time.
- **No sitemap.** `/sitemap.xml` returns 404, and robots.txt has no `Sitemap:` line.
- **No canonical on any of the 11 routes.**

## Medium
- `www.bulgaria-game.com` uses a **302** to the apex domain. It should be a permanent **301** (a DNS or host setting).

## What works
- HTTPS with HSTS (`max-age=31536000; includeSubDomains`), `X-Content-Type-Options: nosniff`, a referrer policy, and http→https with a 301.
- robots.txt allows every crawler, and the mobile viewport is set.
- 0 JavaScript errors on all 11 routes.
