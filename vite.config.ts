import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";
import { NOT_FOUND, ROUTES, SITE_URL, headTagsFor, seoFor, staticBodyFor, type RouteSeo } from "./src/seo/routes";

/**
 * Writes one HTML file per public route after the build, each with its own
 * title, description, canonical, structured data and readable content, plus
 * sitemap.xml and a noindex 404 page. Crawlers that do not run JavaScript
 * (ChatGPT, Perplexity, Claude search) then see real pages, and the app
 * still boots from the same bundle on every route.
 */
function seoPages(): Plugin {
  let outDir = "dist";
  return {
    name: "seo-pages",
    apply: "build",
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      // Hash-routed previews have one address only, so there is nothing to write.
      if (process.env.VITE_ROUTER === "hash") return;
      const template = fs.readFileSync(path.join(outDir, "index.html"), "utf8");
      const start = template.indexOf("<!-- seo:start");
      const end = template.indexOf("<!-- seo:end -->");
      if (start < 0 || end < 0 || !template.includes('<div id="root"></div>')) {
        throw new Error("seo-pages: index.html is missing the seo markers or the empty #root");
      }
      // The static text is for crawlers and no-JavaScript visitors; it only fades in
      // if the app has not replaced it after a few seconds, so nobody sees it flash.
      const style =
        "<style>.seo-static{max-width:46rem;margin:0 auto;padding:2rem 1rem;font:1rem/1.6 -apple-system,BlinkMacSystemFont,Inter,sans-serif;opacity:0;animation:seo-static-in .3s 3s forwards}" +
        ".seo-static table{border-collapse:collapse}.seo-static td,.seo-static th{padding:.2rem .6rem;text-align:left}" +
        "@keyframes seo-static-in{to{opacity:1}}</style>";
      const render = (route: RouteSeo) =>
        template.slice(0, start) +
        headTagsFor(route) + "\n    " + style + "\n" +
        template.slice(end + "<!-- seo:end -->".length).replace('<div id="root"></div>', `<div id="root">${staticBodyFor(route)}</div>`);
      const write = (file: string, html: string) => {
        const target = path.join(outDir, file);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, html);
      };

      for (const route of [...ROUTES, seoFor("/profile"), seoFor("/reset-password")]) {
        const html = render(route);
        if (route.path === "/") { write("index.html", html); continue; }
        // Both forms, so the page is found whether the host maps /games to
        // games.html or to games/index.html.
        write(`${route.path.slice(1)}.html`, html);
        write(`${route.path.slice(1)}/index.html`, html);
      }
      write("404.html", render(NOT_FOUND));

      const today = new Date().toISOString().slice(0, 10);
      const urls = ROUTES.map((r) => `  <url>\n    <loc>${SITE_URL}${r.path}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`).join("\n");
      write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  root: ".",
  publicDir: "public",
  // Absolute asset paths, so nested routes such as /flashcards/history load
  // /assets/... rather than /flashcards/assets/... (which returned 404 and a blank page).
  base: "/",
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger(), seoPages()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
