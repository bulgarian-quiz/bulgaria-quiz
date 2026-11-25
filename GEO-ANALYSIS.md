# GEO Analysis: https://bulgaria-game.com

Date: 2026-11-06. Scope: the homepage, plus the site-wide signals it depends on (robots.txt, routing, rendering).
Method: I fetched the raw HTML, requested the homepage with each AI crawler's user-agent, rendered the page in Chromium on desktop and mobile, and ran web searches for brand mentions. No AI-visibility measuring tools were connected (DataForSEO, SE Ranking, Profound), so the platform readiness below is qualitative, not measured.

## 1. GEO Readiness Score: 26/100

| Criterion | Weight | Score | Why |
|---|---|---|---|
| Citability | 25% | 10 | No self-contained factual passage. The only sentence of fact is "Хан Аспарух утвърждава държавата южно от Дунав." |
| Structural readability | 20% | 25 | Rendered page: one H1 (English, "Bulgaria") and three H2s, no lists, tables or question headings. Raw HTML: no headings at all. |
| Multi-modal | 15% | 55 | Strong interactive content (two map games, flashcards, a 23-chapter timeline with images) that crawlers cannot read. |
| Authority and brand | 20% | 15 | No dates, no sources, no structured data. The name "Опознай България" collides with an existing BNT television programme. No web mentions found. |
| Technical accessibility | 20% | 35 | Every AI crawler is allowed, but the page is client-rendered: crawlers that do not run JavaScript see only the words "Edit with". |

## 2. Platform readiness (qualitative, not measured)

- **Google AI Overviews and AI Mode:** low. Both use Googlebot's index. Googlebot runs JavaScript, so it can see the timeline, but there is little to cite. Every address returns the same title and description, and unknown addresses return 200, which blurs which page means what.
- **ChatGPT Search:** very low. OAI-SearchBot is allowed and gets HTTP 200, but it is reported not to run JavaScript, so it receives an empty page.
- **Perplexity:** very low, for the same reason. PerplexityBot also leans heavily on Reddit and Wikipedia, and the site has no presence there.
- **Claude search:** very low. Claude-SearchBot is allowed but gets the same empty HTML.
- **Bing Copilot:** low. Bingbot is allowed, but there is no sitemap and no IndexNow.

## 3. AI crawler access (robots.txt: specific allows plus `User-agent: * Allow: /`)

**Search citability** (the crawlers that decide whether a page can be cited)
| Crawler | Governs | robots.txt | Live request |
|---|---|---|---|
| Googlebot | Google Search, AI Overviews, AI Mode | Allowed (explicit) | 200 |
| Bingbot | Bing, Copilot | Allowed (explicit) | — |
| OAI-SearchBot | ChatGPT Search citations | Allowed (via `*`) | 200, 12,984 B |
| Claude-SearchBot | Claude search citations | Allowed (via `*`) | 200 |
| PerplexityBot | Perplexity search | Allowed (via `*`) | 200 |
| Applebot | Siri, Spotlight, Safari | Allowed (via `*`) | — |

**Model training** (separate decision, governed by licensing preference, not search visibility)
| Crawler | Governs | robots.txt |
|---|---|---|
| GPTBot | OpenAI model training | Allowed (via `*`) |
| ClaudeBot | Anthropic model training | Allowed (via `*`) |
| Google-Extended | Gemini and Vertex training and grounding (not Google Search) | Allowed (via `*`) |
| CCBot | Common Crawl | Allowed (via `*`) |
| Applebot-Extended | Apple Intelligence training opt-out | Allowed (via `*`) |

Nothing is blocked, and no robots.txt change is needed for visibility. If you would rather the students' content not be used for model training, add `Disallow: /` rules for GPTBot, ClaudeBot, Google-Extended and CCBot. That does not affect search citation.

## 4. llms.txt status

Missing (`/llms.txt` returns 404). Google says `llms.txt` does not help or hurt Search, and no major AI provider has confirmed using it, so it carries no weight in this score. If you want one for other tools, here is a template (`public/llms.txt`):

```
# Опознай България
> Безплатни образователни игри и флашкарти за историята и географията на България, създадени от ученици от ПМГ „Христо Смирненски“, Перник.

## Основни страници
- [Игри](https://bulgaria-game.com/games): Куиз по 28-те области и игра за подреждане на картата.
- [Флашкарти](https://bulgaria-game.com/flashcards): История, география и общи факти за България.
- [За нас](https://bulgaria-game.com/about): Кой е създал сайта и защо.

## Факти
- България има 28 области (27 области и столицата София).
- Сайтът включва хронология от 681 г. (основаване на България) до 2026 г.
```

## 5. Brand mention analysis

- **Wikipedia, Reddit, YouTube, LinkedIn:** no mentions of bulgaria-game.com found. A search for the exact domain returned no page from it, only unrelated games-industry pages. The site is also absent from [Ahrefs' ranking of top Bulgarian games websites](https://ahrefs.com/websites/bulgaria/games).
- **Name collision:** "Опознай България" is already the name of a [BNT television programme](https://bnt.bg/bg/a/opoznaj-balgariya) that, by its own description, targets the same school audience. AI systems resolve names to entities, so on its own this name will point to BNT, not to the site. This is the biggest brand-level risk.
- **Comparable content that does get cited:** [Radio Bulgaria's UNESCO web quiz](https://bnr.bg/en/post/101483737/rila-monastery-and-old-nessebar-are-the-most-recognizable-unesco-sites-in-bulgaria-our-web-quiz-shows) is mentioned because it publishes results as an article, with numbers anyone can quote.

## 6. Passage-level citability

Self-contained answer blocks found: **0**. The rendered homepage has about 100 words, mostly years ("681, 864, 917…") and button labels. The 23 timeline chapters each have a heading and one sentence, all of it client-rendered and animated in as you scroll.

## 7. Server-side rendering check

| | Raw HTML (no JavaScript) | Rendered (Chromium) |
|---|---|---|
| Visible words | 2 ("Edit with", the Lovable badge) | ~100 |
| H1 / H2 | 0 / 0 | 1 / 3 |
| Internal links | 0 | 7 |
| Images | 0 | 23 timeline photos, all `alt=""` |
| JSON-LD | 0 | 0 |

This is a client-only React app. Every route (`/games`, `/about`, and also `/does-not-exist`) serves the same 12,984-byte shell.

## 8. Top 5 highest-impact changes

1. **Pre-render every route at build time**, so each one ships real HTML with its headings, text and links (for example with `vite-plugin-prerender` or `vite-react-ssg`).
   - **Why:** crawlers that skip JavaScript (OAI-SearchBot, PerplexityBot, Claude-SearchBot) can only cite what is in the HTML.
   - **Unlocks:** items 2 to 5.
   - **How to check:** `curl -A OAI-SearchBot https://bulgaria-game.com/games | grep -c "<h2"` is greater than 0.
   - **What to watch:** ChatGPT and Perplexity referrals in analytics.
2. **Give each route its own title, description and canonical, and add `noindex` to the 404 page.**
   - **Why:** each page needs its own identity, and a URL that serves everything means nothing.
   - **Depends on:** item 1, for the non-Google crawlers.
   - **How to check:** Search Console's URL Inspection shows a distinct title per route and the 404 page as excluded.
3. **Write one citable intro block on the homepage and a short factual passage per timeline chapter** (examples in section 10).
   - **Why:** AI answers quote specific, self-contained facts, and about 44% of citations reportedly come from the first 30% of a page (SE Ranking study).
   - **How to check:** ask ChatGPT or Perplexity "кога е основана България" and "колко области има България" a month after publishing and see whether the site appears.
4. **Separate the brand from the BNT programme.**
   - **Change:** use a distinctive site name ("Опознай България – игри" or a new name), use it identically everywhere, and add `WebSite` and `Organization` schema with `sameAs` pointing at the school's official page.
   - **Why:** entity resolution needs a unique name.
   - **What to watch:** branded searches stop returning BNT first.
5. **Earn third-party mentions.**
   - **Change:** a page or news item on the PMG Pernik school site, a short YouTube demo of the 3D mode, a post in Bulgarian teacher communities, and submissions to education resource lists.
   - **Why:** mentions correlate with AI citation far more than backlinks do (Ahrefs, 75k brands, 2025).
   - **What to watch:** referring domains and mention count over time.

## 9. Schema recommendations

- `WebSite` and `LearningResource` (`learningResourceType`: Quiz, Game, Flashcard; `inLanguage: bg`; `isAccessibleForFree`). The ready-made JSON-LD is in the `/seo page` report.
- `EducationalOrganization` for PMG "Hristo Smirnenski" as `publisher`, with `sameAs` pointing at the school's official site.
- On flashcard pages, `ItemList` of `Question` or `DefinedTerm` entries can expose the facts as structured data. Do not use FAQPage: Google retired FAQ rich results in May 2026.
- **Do not** add `Person` schema, `sameAs` profiles or bios for the student creators. They are minors, so authority should come from the school and the sources cited, not from personal profiles. For the same reason, consider removing the students' personal email addresses from the About page and from the chatbot's site description.

## 10. Content reformatting suggestions

**Homepage, before the film (place it in the HTML, visible or as a readable intro):**
> **Какво е „Опознай България“?** Безплатен образователен сайт с игри за историята и географията на България. Можеш да решиш куиз за всяка от 28-те области, да подредиш областите на картата и да разгледаш 23 ключови момента от основаването на държавата през 681 г. до днес. Сайтът е създаден от ученици от ПМГ „Христо Смирненски“ в Перник.

**Timeline chapter, current text:** "681 · Основаване на България · Хан Аспарух утвърждава държавата южно от Дунав."
**Rewrite as a self-contained block** (on a pre-rendered `/history/681` page or in the HTML):
> **Кога е основана България?** Дунавска България е призната през 681 г., след като хан Аспарух побеждава византийската армия на император Константин IV при Онгъла и Византия сключва мир, плащайки ежегоден данък. Новата държава обединява прабългари и славяни между Дунав и Стара планина, със столица Плиска.

(Check each historical claim against a textbook before publishing, and cite the source under the passage.)

**Games page:** add question headings with direct answers, for example "Колко области има България?" followed by "28: 27 области и столица София", and a table of the 28 provinces with their administrative centres. That table is citable data and doubles as study material.
