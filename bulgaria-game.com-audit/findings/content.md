# Content Quality: 30/100

| Route | Rendered words | H1 | Notes |
|---|---|---|---|
| / | 100 | "Bulgaria" (English) | Mostly years and button labels; one factual sentence per timeline chapter |
| /games | 65 | Игри | Two game descriptions |
| /flashcards | 69 | Флашкарти | Three category blurbs |
| /about | 58 | За нас | Student names and personal emails |
| /game, /drag-drop-game | 31 | none (H2 "Конфигурация") | Setup dialog only |
| /flashcards/* | 0 | none | Blank on a direct visit (see technical.md) |
| /profile, /reset-password | 23–24 | none | Account utilities, should be noindex |

## Findings
- **High, thin content site-wide.** No page clears roughly 300 words of real copy. The flashcard and quiz content (the site's actual substance) lives in JS data files and only shows after interaction.
- **High, E-E-A-T.** No sources are cited for the historical claims, no dates, no "about this project" framing beyond names. The school is the natural authority signal and is not linked.
- **Medium, privacy.** `/about` publishes `mailto:` links to two students' personal school email addresses, and the chatbot's site description repeats them. They are minors. Credit the school and offer a school contact instead.
- **Medium, language mismatch.** The homepage H1 "Bulgaria" is English on a `lang="bg"` page.
- **Info, brand collision.** "Опознай България" is also a BNT TV programme for the same audience (see geo.md).
