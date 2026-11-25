# Images: 45/100

- **Medium, alt text:** 27 of 27 images on `/` have empty `alt`, including the 23 timeline photos that carry content (for example 681, the founding of Bulgaria). There are 3 more on /flashcards and 1 on /about. Write short descriptive alt text for content images, and keep `alt=""` only for the decorative mosaic tiles.
- **Medium, format and size:** JPEG at 1536 px for every viewport, with no `srcset`. Use WebP or AVIF and responsive sizes.
- **Critical-size asset:** the 5.0 MB Earth texture (see performance.md).
- **What works:** explicit dimensions on every image, native lazy loading below the fold, a decoded `eager` first image.
