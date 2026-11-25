# Action Plan: bulgaria-game.com

SEO Health Score now: **29/100**. Each item shows what it unblocks, how to tell whether it worked, and a leading indicator to watch.

## Phase 1: Critical fixes (week 1)
1. **Fix blank nested pages.** In `vite.config.ts`, change `base: "./"` to `base: "/"`.
   - *Unblocks:* indexing of the 3 flashcard sets, and the sitemap.
   - *How to check:* a direct visit to https://bulgaria-game.com/flashcards/history shows the cards, and `curl` shows `src="/assets/…"`.
   - *Watch:* 0 blank pages in a re-crawl.
2. **Mark the 404, /profile and /reset-password pages `noindex`.**
   - *How to check:* Search Console URL Inspection on `/xyz` shows "Excluded by noindex".
3. **Give each route its own title, description, canonical and Bulgarian H1** (set per route in the app):
   | Route | Title |
   |---|---|
   | / | Опознай България – игри, куиз и флашкарти за всяка област |
   | /games | Игри за България – куиз по области и подреждане на картата |
   | /game | Куиз за 28-те области на България – игра |
   | /drag-drop-game | Подреди областите на България – игра с карта |
   | /flashcards | Флашкарти за България – история, география и факти |
   | /flashcards/history | Флашкарти по история на България |
   | /flashcards/geography | Флашкарти по география на България |
   | /flashcards/general | Интересни факти за България – флашкарти |
   | /about | За проекта „Опознай България“ – ПМГ Перник |
   - *How to check:* the "Duplicate title" count in Search Console's indexing report goes to 0.
4. **Add `sitemap.xml`** (see findings/sitemap.md) plus a robots.txt `Sitemap:` line, after item 1.

## Phase 2: High-impact improvements (weeks 2–3)
5. **Pre-render every route at build time** (for example `vite-react-ssg` or `vite-plugin-prerender`), so the HTML ships with headings, text and links.
   - *Unblocks:* AI citation (non-JS crawlers) and faster indexing.
   - *How to check:* `curl -A OAI-SearchBot https://bulgaria-game.com/games` contains the H1.
6. **Take the 5 MB Earth texture off the initial load.** Load it when the Earth section approaches, and serve 2K to phones.
   - *How to check:* homepage transfer drops below 3 MB and mobile lab LCP goes under 2.5 s.
7. **Add WebSite, LearningResource and EducationalOrganization JSON-LD.**
   - *How to check:* the Rich Results Test or Schema validator shows 0 errors.
8. **Change the www redirect from 302 to 301** (DNS or host setting).

## Phase 3: Content and authority (month 2)
9. **Add a homepage intro paragraph and a short factual passage per timeline chapter**, with sources (see GEO-ANALYSIS.md §10).
10. **Write alt text for the 23 timeline photos;** convert the images to WebP or AVIF with `srcset`.
11. **Give each game a landing page** with 3–5 sample questions as text, plus a 28-province reference table.
12. **Privacy:** replace the students' personal emails on /about (and in the chatbot context) with a school contact, and credit the school.
13. **Distinct branding versus BNT's "Опознай България"**, plus mentions from the school site, a YouTube demo and teacher communities.

## Phase 4: Monitoring (ongoing)
14. Verify the site in Google Search Console and Bing Webmaster Tools, submit the sitemap, and add IndexNow.
15. Capture a drift baseline after Phase 1 (`/seo drift baseline https://bulgaria-game.com`) and compare after each deploy.
16. Optional: add a PageSpeed or CrUX API key so future audits use real-user Core Web Vitals.
17. Account setting: hide the Lovable badge (Lovable → Project settings).
