// Tells Bing, Yandex, Seznam, Naver and the other IndexNow engines (DuckDuckGo
// and others draw on Bing's index) that the site's pages changed.
// Run after each publish:  node scripts/indexnow.mjs
const host = "bulgaria-game.com";
// Your IndexNow key; public/<key>.txt must contain the same value.
const key = process.env.INDEXNOW_KEY ?? "your-indexnow-key";
const paths = ["/", "/games", "/game", "/drag-drop-game", "/flashcards", "/flashcards/history", "/flashcards/geography", "/flashcards/general", "/about"];

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host, key, keyLocation: `https://${host}/${key}.txt`, urlList: paths.map((p) => `https://${host}${p}`) }),
});
console.log("IndexNow:", res.status, res.status === 200 || res.status === 202 ? "accepted" : await res.text());
