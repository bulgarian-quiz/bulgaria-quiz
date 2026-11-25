// Search metadata for every public route, shared by the app (useSeo) and the
// build step that writes a static HTML page per route (vite.config.ts).
// Relative imports only: vite.config.ts loads this file outside the "@" alias.
import { regionsData } from "../data/questions";
import { flashcardCategories, type Flashcard } from "../data/flashcards";
import { photoQuestions } from "../data/photoQuestions";

export const SITE_URL = "https://bulgaria-game.com";
export const SITE_NAME = "Опознай България";
export const PUBLISHER_NAME = "ПМГ „Христо Смирненски“, Перник";

export interface RouteSeo {
  path: string;
  title: string;
  description: string;
  h1: string;
  /** Pages that should not appear in search results. */
  noindex?: boolean;
}

const flashcardTitles: Record<string, { title: string; h1: string; description: string }> = {
  history: {
    title: "Флашкарти по история на България",
    h1: "Флашкарти по история на България",
    description: "Ключови събития от историята на България от 681 г. до днес, кратко и ясно, във флашкарти за ученици.",
  },
  geography: {
    title: "Флашкарти по география на България",
    h1: "Флашкарти по география на България",
    description: "Планини, реки, климат и природни забележителности на България във флашкарти за бързо учене.",
  },
  general: {
    title: "Интересни факти за България – флашкарти",
    h1: "Интересни факти за България",
    description: "Интересни и полезни факти за България: култура, символи, традиции и рекорди, във флашкарти.",
  },
};

export const ROUTES: RouteSeo[] = [
  {
    path: "/",
    title: "Опознай България – игри, куиз и флашкарти за всяка област",
    description: "Играй куиз за 28-те области, подреди картата и разгледай историята от 681 г. до днес. Безплатни образователни игри за ученици.",
    h1: "Опознай България – образователни игри за историята и географията на България",
  },
  {
    path: "/games",
    title: "Игри за България – куиз по области, карта и снимки",
    description: "Три безплатни игри за България: куиз за всяка от 28-те области, подреждане на областите на картата и „Познай мястото“ по снимка.",
    h1: "Игри за България",
  },
  {
    path: "/game",
    title: "Куиз за 28-те области на България – игра",
    description: "Избери област на картата и отговори на въпроси за нея: планини, реки, градове и забележителности. Безплатен куиз за България.",
    h1: "Куиз за 28-те области на България",
  },
  {
    path: "/drag-drop-game",
    title: "Подреди областите на България – игра с карта",
    description: "Постави всяка от 28-те области на правилното ѝ място на картата на България. Безплатна игра за ученици.",
    h1: "Подреди областите на България на картата",
  },
  {
    path: "/photo-quiz",
    title: "Познай мястото – куиз със снимки от България",
    description: "27 снимки на забележителности, личности и традиции на България. Избери верния отговор от четири или напиши името сам. Безплатна игра за ученици.",
    h1: "Познай мястото – куиз със снимки от България",
  },
  {
    path: "/flashcards",
    title: "Флашкарти за България – история, география и факти",
    description: "Безплатни флашкарти за България в три теми: история, география и интересни факти. Учи бързо с кратки карти.",
    h1: "Флашкарти за България",
  },
  ...flashcardCategories.map((c) => ({ path: `/flashcards/${c.id}`, ...flashcardTitles[c.id] })),
  {
    path: "/privacy-policy",
    title: `Политика за поверителност – ${"Опознай България"}`,
    description: "Какви данни събира „Опознай България“, защо и какви са правата ти: профил, игрови напредък, AI асистент, бисквитки.",
    h1: "Политика за поверителност",
  },
  {
    path: "/terms-and-conditions",
    title: `Общи условия – ${"Опознай България"}`,
    description: "Условия за използване на „Опознай България“: профил, правила за поведение, AI асистент, съдържание и отговорност.",
    h1: "Общи условия",
  },
  {
    path: "/about",
    title: "За проекта „Опознай България“ – ПМГ Перник",
    description: "„Опознай България“ е образователен проект на ученици от ПМГ „Христо Смирненски“ в Перник: игри и флашкарти за България.",
    h1: "За проекта „Опознай България“",
  },
];

/** Routes that exist but must stay out of search results. */
const PRIVATE: RouteSeo[] = [
  { path: "/profile", title: `Профил – ${SITE_NAME}`, description: "Твоят профил и точки.", h1: "Профил", noindex: true },
  { path: "/reset-password", title: `Нова парола – ${SITE_NAME}`, description: "Смяна на паролата.", h1: "Нова парола", noindex: true },
];

export const NOT_FOUND: RouteSeo = {
  path: "/404",
  title: `Страницата не е намерена – ${SITE_NAME}`,
  description: "Тази страница не съществува.",
  h1: "Страницата не е намерена",
  noindex: true,
};

export function seoFor(pathname: string): RouteSeo {
  const clean = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return [...ROUTES, ...PRIVATE].find((r) => r.path === clean) ?? NOT_FOUND;
}

export const canonicalUrl = (path: string) => `${SITE_URL}${path}`;

// ---------------------------------------------------------------- structured data

const publisher = {
  "@type": "EducationalOrganization",
  "@id": `${SITE_URL}/#publisher`,
  name: PUBLISHER_NAME,
  alternateName: "PMG Hristo Smirnenski, Pernik",
  address: { "@type": "PostalAddress", addressLocality: "Перник", addressCountry: "BG" },
};

const website = {
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: `${SITE_URL}/`,
  name: SITE_NAME,
  alternateName: "Опознай България – игри",
  inLanguage: "bg",
  description: ROUTES[0].description,
  publisher: { "@id": publisher["@id"] },
};

const aboutBulgaria = [
  { "@type": "Country", name: "България" },
  { "@type": "Thing", name: "История на България" },
  { "@type": "Thing", name: "География на България" },
];

export function jsonLdFor(route: RouteSeo): object | null {
  if (route.noindex) return null;
  const url = canonicalUrl(route.path);
  const page: Record<string, unknown> = {
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: route.title,
    description: route.description,
    inLanguage: "bg",
    isPartOf: { "@id": website["@id"] },
  };
  const graph: object[] = [website, publisher, page];
  const resourceType: Record<string, string[]> = {
    "/": ["Quiz", "Game", "Flashcard"],
    "/games": ["Game", "Quiz"],
    "/game": ["Quiz", "Game"],
    "/drag-drop-game": ["Game"],
    "/photo-quiz": ["Quiz", "Game"],
    "/flashcards": ["Flashcard"],
  };
  const types = resourceType[route.path] ?? (route.path.startsWith("/flashcards/") ? ["Flashcard"] : null);
  if (types) {
    graph.push({
      "@type": "LearningResource",
      "@id": `${url}#resource`,
      name: route.h1,
      description: route.description,
      url,
      inLanguage: "bg",
      learningResourceType: types,
      educationalLevel: "Начален и прогимназиален етап",
      isAccessibleForFree: true,
      about: aboutBulgaria,
      publisher: { "@id": publisher["@id"] },
      isPartOf: { "@id": website["@id"] },
    });
    page.mainEntity = { "@id": `${url}#resource` };
  }
  if (route.path !== "/") {
    const crumbs = [{ name: SITE_NAME, path: "/" }];
    if (route.path.startsWith("/flashcards/")) crumbs.push({ name: "Флашкарти", path: "/flashcards" });
    crumbs.push({ name: route.h1, path: route.path });
    graph.push({
      "@type": "BreadcrumbList",
      itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: canonicalUrl(c.path) })),
    });
  }
  return { "@context": "https://schema.org", "@graph": graph };
}

// ---------------------------------------------------------------- static page body
// Plain HTML that ships inside #root for crawlers that do not run JavaScript.
// React replaces it as soon as the app starts; it holds the same facts the app shows.

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const SITE_INTRO =
  "„Опознай България“ е безплатен образователен сайт с игри за историята и географията на България. " +
  "Можеш да решиш куиз за всяка от 28-те области, да подредиш областите на картата и да разгледаш " +
  "ключови моменти от основаването на държавата през 681 г. до днес. Сайтът е създаден от ученици " +
  "от ПМГ „Христо Смирненски“ в Перник.";

export const PROVINCE_FACT =
  "България е разделена на 28 области. Една от тях е столицата София (област София-град), а около нея е отделната Софийска област.";

/** Each province with its administrative centre. Every centre shares its province's
 *  name, except the two Sofia provinces, whose centre is Sofia. */
export function provinceList(): { name: string; centre: string }[] {
  return Object.entries(regionsData).map(([id, r]) => ({
    name: r.name.bg,
    centre: id === "sofiaCity" || id === "sofiaProvince" ? "София" : r.name.bg,
  }));
}

const nav = () =>
  `<nav aria-label="Основна навигация"><ul>${[
    ["/", "Начало"],
    ["/games", "Игри"],
    ["/game", "Куиз по области"],
    ["/drag-drop-game", "Подреди картата"],
    ["/photo-quiz", "Познай мястото"],
    ["/flashcards", "Флашкарти"],
    ["/about", "За нас"],
  ]
    .map(([href, label]) => `<li><a href="${href}">${label}</a></li>`)
    .join("")}</ul></nav>`;

const cardList = (cards: Flashcard[]) =>
  `<dl>${cards.map((c) => `<dt>${esc(c.title.bg)}</dt><dd>${esc(c.content.bg)}</dd>`).join("")}</dl>`;

const provinceTable = () =>
  `<table><caption>Областите на България и техните административни центрове</caption><thead><tr><th>Област</th><th>Административен център</th></tr></thead><tbody>${provinceList()
    .map((p) => `<tr><td>${esc(p.name)}</td><td>${esc(p.centre)}</td></tr>`)
    .join("")}</tbody></table>`;

const sampleQuestions = () =>
  `<ul>${Object.values(regionsData)
    .map((r) => {
      const q = r.questions[0];
      return `<li><strong>${esc(r.name.bg)}:</strong> ${esc(q.question.bg)} Отговор: ${esc(q.options.bg[q.correctIndex])}.</li>`;
    })
    .join("")}</ul>`;

export function staticBodyFor(route: RouteSeo): string {
  const parts: string[] = [nav(), `<h1>${esc(route.h1)}</h1>`, `<p>${esc(route.description)}</p>`];
  const cat = flashcardCategories.find((c) => `/flashcards/${c.id}` === route.path);
  switch (route.path) {
    case "/":
      parts.push(
        `<h2>Какво е „Опознай България“?</h2><p>${esc(SITE_INTRO)}</p>`,
        `<h2>Колко области има България?</h2><p>${esc(PROVINCE_FACT)}</p>`,
        `<h2>Какво има в сайта</h2><ul><li><a href="/game">Куиз за 28-те области</a></li><li><a href="/drag-drop-game">Игра за подреждане на областите на картата</a></li><li><a href="/photo-quiz">Познай мястото по снимка</a></li><li><a href="/flashcards/history">Флашкарти по история</a></li><li><a href="/flashcards/geography">Флашкарти по география</a></li><li><a href="/flashcards/general">Интересни факти за България</a></li></ul>`,
      );
      break;
    case "/games":
      parts.push(
        `<h2><a href="/game">Куиз за 28-те области</a></h2><p>Избери област на картата и отговори на три въпроса за нея.</p>`,
        `<h2><a href="/drag-drop-game">Подреди картата</a></h2><p>Постави всяка област на правилното ѝ място.</p>`,
        `<h2><a href="/photo-quiz">Познай мястото</a></h2><p>Разпознай 27 забележителности, личности и традиции на България по снимка.</p>`,
        `<h2>Колко области има България?</h2><p>${esc(PROVINCE_FACT)}</p>`,
        provinceTable(),
      );
      break;
    case "/game":
      parts.push(`<h2>Примерни въпроси от куиза</h2>`, sampleQuestions());
      break;
    case "/photo-quiz":
      parts.push(
        `<h2>Какво има в играта?</h2><ul>${photoQuestions.map((q) => `<li>${esc(q.answer.bg)}</li>`).join("")}</ul>`,
        `<h2>Как се играе?</h2><p>В лесния режим избираш отговора от четири възможности. В напредналия режим пишеш името сам; приемат се и малки грешки, членуване и главни или малки букви.</p>`,
      );
      break;
    case "/drag-drop-game":
      parts.push(`<h2>Колко области има България?</h2><p>${esc(PROVINCE_FACT)}</p>`, provinceTable());
      break;
    case "/flashcards":
      parts.push(
        ...flashcardCategories.map((c) => `<h2><a href="/flashcards/${c.id}">${esc(flashcardTitles[c.id].h1)}</a></h2><p>${esc(flashcardTitles[c.id].description)}</p>`),
      );
      break;
    case "/about":
      parts.push(`<h2>Какво е „Опознай България“?</h2><p>${esc(SITE_INTRO)}</p>`);
      break;
    default:
      if (cat) parts.push(cardList(cat.cards));
  }
  parts.push(`<p>Създадено от ученици от ${esc(PUBLISHER_NAME)}.</p>`);
  return `<div class="seo-static">${parts.join("")}</div>`;
}

/** The tags each static page carries in <head>. */
export function headTagsFor(route: RouteSeo): string {
  const url = canonicalUrl(route.path);
  const tags = [
    `<title>${esc(route.title)}</title>`,
    `<meta name="description" content="${esc(route.description)}" />`,
    route.noindex ? `<meta name="robots" content="noindex, follow" />` : `<link rel="canonical" href="${url}" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:locale" content="bg_BG" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${esc(route.title)}" />`,
    `<meta property="og:description" content="${esc(route.description)}" />`,
    route.noindex ? "" : `<meta property="og:url" content="${url}" />`,
    `<meta name="twitter:card" content="summary" />`,
    `<meta name="twitter:title" content="${esc(route.title)}" />`,
    `<meta name="twitter:description" content="${esc(route.description)}" />`,
  ];
  const ld = jsonLdFor(route);
  if (ld) tags.push(`<script type="application/ld+json" id="seo-jsonld">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>`);
  return tags.filter(Boolean).join("\n    ");
}
