import { useEffect } from "react";
import { canonicalUrl, jsonLdFor, seoFor, type RouteSeo } from "./routes";

function setMeta(attr: "name" | "property", key: string, content: string | null) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (content === null) { el?.remove(); return; }
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

function setCanonical(href: string | null) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (href === null) { el?.remove(); return; }
  if (!el) {
    el = document.createElement("link");
    el.rel = "canonical";
    document.head.appendChild(el);
  }
  el.href = href;
}

function setJsonLd(data: object | null) {
  let el = document.getElementById("seo-jsonld");
  if (data === null) { el?.remove(); return; }
  if (!el) {
    el = document.createElement("script");
    el.id = "seo-jsonld";
    el.setAttribute("type", "application/ld+json");
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

/** Keeps the document's title, description, canonical and structured data in step with the route. */
export function applySeo(route: RouteSeo) {
  document.title = route.title;
  const url = route.noindex ? null : canonicalUrl(route.path);
  setMeta("name", "description", route.description);
  setMeta("name", "robots", route.noindex ? "noindex, follow" : null);
  setCanonical(url);
  setMeta("property", "og:title", route.title);
  setMeta("property", "og:description", route.description);
  setMeta("property", "og:url", url);
  setMeta("name", "twitter:title", route.title);
  setMeta("name", "twitter:description", route.description);
  setJsonLd(jsonLdFor(route));
}

/** Pass the route path ("/games"); unknown paths get the noindex "not found" metadata. */
export function useSeo(path: string) {
  useEffect(() => {
    applySeo(seoFor(path));
  }, [path]);
}
