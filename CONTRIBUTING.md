# Join Astronaut Academy / 参加ガイド

This is GatsbyZero's independent, free educational game. Japanese and English players use the same lesson IDs, scoring, and local progress. You can contribute without donating.

| Contribution | Where |
| --- | --- |
| Play impressions and specific usability feedback / 感想・操作感 | GitHub Discussions → **Play feedback / プレイ感想** |
| Factual, source, or translation corrections / 教材・出典・翻訳の訂正 | GitHub Discussions → **Content & sources / 教材・出典** or **Translation / 翻訳** |
| New exercise and design ideas / アイデア | GitHub Discussions → **Ideas / アイデア** |
| Reproducible bugs / 再現できる不具合 | GitHub Issues → bug report form |
| Ready changes / 修正・翻訳 | Pull request |

For content corrections, name the module and lesson or question ID, explain the proposed correction, and include a primary source URL with the relevant date or condition. For a bug, include browser, device, steps, expected and actual behavior. Please avoid personal, medical, or operationally sensitive information.

## Local checks

```sh
npm ci
npm test
npm run check:content
npm run build:pages
npm run pack:itch
```

Keep IDs, answers, difficulty, source references, and progress semantics stable across languages. Add English wording to `src/content/translations/en/` whenever you change a Japanese lesson or question. Add verified citations for new factual claims. Do not add NASA logos, unreviewed media, or third-party assets without an explicit rights record in `ASSET-CREDITS.md`.

By submitting code, you agree that your contribution can be distributed under MIT. By submitting original educational prose or translations, you agree that it can be distributed under CC BY 4.0. Do not submit material you cannot license on those terms.

We respond to feedback in public and link the resulting change or explanation in the same thread. Respectful disagreement and evidence-backed corrections are welcome. Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
