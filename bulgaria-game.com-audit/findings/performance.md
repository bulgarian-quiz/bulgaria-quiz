# Performance (lab only): 55/100

There is no CrUX field data (no Google API key), so these are lab numbers from one throttled run: 390×844 mobile, about 1.6 Mbps, 150 ms latency, 4× CPU slowdown. Treat them as directional.

| Metric | Value | Rating |
|---|---|---|
| FCP | 0.63 s | Good |
| LCP | 3.64 s (element: the intro "Skip" button) | Needs improvement (2.5–4.0 s) |
| CLS | 0.00 | Good |
| Tap response (proxy for INP) | 21 ms | Good (one sample; not true INP) |
| Transfer, unthrottled full load | 10.5 MB | Very heavy |

## Findings
- **High:** `textures/earth-day-8k.webp` (5.0 MB) downloads on the homepage for every visitor, phones included. Load it only when the Earth section approaches, and serve a 2K version to phones.
- **Medium:** 23 timeline JPEGs at 1536×1024 and 160–280 KB each. Use WebP or AVIF with `srcset` (expect about 60–100 KB each). Only the first is `loading="eager"`, which is correct.
- **Medium:** the main bundle is 540 kB and three.js (`Stars-*.js`) is 800 kB. Routes are already split; check that the Earth chunk is not on the critical path.
- **What works:** width and height on every image (CLS 0), lazy loading below the fold, Cloudflare edge, and fast TTFB on desktop (125 ms).
