# 投稿の下書き / Launch copy

外部投稿は公開ページと権利確認済みの実プレイ素材が揃ってから行う。URLは公開後に置き換える。寄付を感想依頼に混ぜない。

## 日英の作品紹介

**JA** — Astronaut Academyは、NASAの公開資料をもとにGatsbyZeroが制作した無料の宇宙飛行士訓練ゲームです。9つのコースでISSのシステム、宇宙医学、船外活動、ロボティクス、飛行、緊急対応、月の地質学、管制を学び、3Dの実技とクイズに挑みます。日本語と英語で遊べます。NASAによる制作・認定・推奨は受けていません。

**EN** — Astronaut Academy is a free, independent educational game by GatsbyZero, built from publicly available NASA sources. Explore nine courses covering ISS systems, space medicine, EVA, robotics, flight, emergency response, lunar geology, and mission control. Learn through lessons, quizzes, and interactive 3D exercises in Japanese or English. NASA did not create, certify, or endorse this game.

## GitHub Discussions welcome

**Title:** Welcome / ようこそ — play, question, and improve Astronaut Academy

**Body:** Astronaut Academy is a free bilingual training game and an independent GatsbyZero project. Please play at [GAME_URL] and tell us what helped you learn or where you got stuck. プレイ後に、分かりやすかった点・迷った点・直してほしい箇所を教えてください。

- **Play feedback / プレイ感想:**操作感、所要時間、画面の読みやすさ。
- **Content & sources / 教材・出典:** コース・レッスンIDと一次資料を添えた事実の訂正。
- **Ideas / アイデア:** 新しい演習や改善案。
- **Translation / 翻訳:** 日英の自然さ、用語、欠落の修正。

Reproducible bugs belong in Issues, and ready code or wording changes in Pull Requests. All courses and participation are free; Ko-fi support is optional and separate. NASA did not create, certify, or endorse this game, and its in-game certificate is not a NASA qualification.

## itch.io Get Feedback

**Title:** Feedback wanted: can you find your way through Astronaut Academy's first training course?

**Body:** I made Astronaut Academy, a free browser game about astronaut training. The first course introduces Earth orbit and the ISS through short lessons, a quiz, and a 3D scan exercise. It is playable in Japanese and English: [ITCH_GAME_URL]. I would value feedback on two things: (1) Is it clear what to scan next without extra explanation? (2) On a phone, can you read the lesson and reach the quiz comfortably? Approximate test time: 10–15 minutes. This is an independent project based on public NASA sources, not a NASA product. I will reply with what I change based on your feedback.

## itch.io Release Announcements

**Title:** Astronaut Academy — free bilingual 3D astronaut training game

**Body:** Astronaut Academy is live and free in the browser: [ITCH_GAME_URL]. Nine courses combine lessons, 144 quiz questions, and 3D exercises about ISS systems, space medicine, EVA, robotics, lunar geology, and mission control. Japanese and English included. [EMBED_RIGHTS_CLEARED_GAMEPLAY_IMAGE_OR_VIDEO]. Made independently by GatsbyZero using credited public sources; not created or endorsed by NASA.

## r/playmygame

**Title:** [PC] [Web] I made a free bilingual astronaut training game with 9 courses and 3D exercises

**Body:** Play free now: [ITCH_GAME_URL]. I'm GatsbyZero, the creator. Astronaut Academy is an independent educational browser game based on public NASA sources, with Japanese and English lessons, quizzes, and short 3D exercises. I would especially like to know whether the first ISS scan teaches its goals clearly, and whether the lesson-to-quiz transition feels natural. A 10–15 minute first-course test is enough. NASA did not create or endorse the game. [Only post after meaningful feedback on other games and a final rules check.]

## r/indiegames

**Title:** I built a free astronaut training game with nine playable courses

**Body:** [RIGHTS_CLEARED_GAMEPLAY_CLIP] Astronaut Academy is an independent free browser game with Japanese and English lessons, quizzes, and interactive 3D exercises. Start in Earth orbit, then work through the ISS, EVA, robotics, medicine, and lunar geology. Made by GatsbyZero from credited public sources; NASA did not create or endorse it. [Add playable URL only if the current rules permit it; choose Promotion flair.]

## Zenn technical article outline

Title: 「NASA公開資料を教材にするWebゲームで、出典・権利・日英IDをどう管理したか」

1. 実装したデータ型と出典IDの照合。
2. ViteのGitHub Pagesサブパスとitch.io相対パスを実コードで示す。
3. NASA画像検索結果を埋め込まない判断と第三者素材のリスク。
4. 軽量3Dの分割読み込みと実測。
5. 失敗した点、修正、再現手順。記事は技術知見として完成させ、宣伝・寄付の本文にしない。
