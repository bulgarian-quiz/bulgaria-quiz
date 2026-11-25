# Sitemap

`/sitemap.xml` returns 404. Proposed `public/sitemap.xml` (indexable routes only):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://bulgaria-game.com/</loc></url>
  <url><loc>https://bulgaria-game.com/games</loc></url>
  <url><loc>https://bulgaria-game.com/game</loc></url>
  <url><loc>https://bulgaria-game.com/drag-drop-game</loc></url>
  <url><loc>https://bulgaria-game.com/flashcards</loc></url>
  <url><loc>https://bulgaria-game.com/flashcards/history</loc></url>
  <url><loc>https://bulgaria-game.com/flashcards/geography</loc></url>
  <url><loc>https://bulgaria-game.com/flashcards/general</loc></url>
  <url><loc>https://bulgaria-game.com/about</loc></url>
</urlset>
```

Exclude /profile and /reset-password (mark both noindex). Add `Sitemap: https://bulgaria-game.com/sitemap.xml` to robots.txt. Only submit the flashcard URLs after the `base: "/"` fix, or Google will index blank pages.
