# Agent Readiness

Lighthouse could not run here (the plugin's renderer refuses this environment's proxy), so there is no Agentic Browsing fraction.

- Every button on the 11 routes has an accessible name (0 nameless buttons in the rendered DOM). Navigation uses real `<a href>` links.
- Games are canvas or SVG plus button-based. Province paths have `role="button"`, `aria-label` and keyboard handlers, which is good for agents and accessibility.
- Blank nested routes (technical.md) also break agents that deep-link.
- No `/.well-known` discovery files, Markdown alternates or WebMCP tools. These are optional, low priority for a school project.
