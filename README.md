# Astronaut Academy / 宇宙飛行士訓練アカデミー

GatsbyZero制作の無料ブラウザゲーム。NASAの公開資料をもとに、9つの訓練コースを日英の講義・クイズと3Dの実技で学びます。NASAによる制作・認定・推奨を受けたものではありません。ゲーム内の修了証は実際のNASA資格ではありません。

**English:** A free, independent browser game by GatsbyZero with nine astronaut-training courses, bilingual lessons and quizzes, and interactive 3D exercises. NASA did not create, certify, or endorse it.

感想・教材の訂正・翻訳への参加は[CONTRIBUTING.md](CONTRIBUTING.md)へ。自作コード、教材、NASA素材、独自アートの権利区分は[CONTENT-LICENSE.md](CONTENT-LICENSE.md)と[ASSET-CREDITS.md](ASSET-CREDITS.md)へ。支援は任意で、教材と参加権は変わりません。

## 起動

Node.js 22.12以降（Vite 8対応）を使用します。

```sh
npm ci
npm run dev -- --host 127.0.0.1
```

本番用のローカルプレビュー：

```sh
npm run build
npm run preview -- --host 127.0.0.1
```

公開用ビルドは配布先別に生成します。GitHub Pagesは`/astronaut-academy/`、itch.ioは相対パスでアセットを参照します。外部サービスのキーやサーバーは不要です。各講義からNASAの画像アーカイブへ移動できますが、権利確認前の検索結果はゲームに埋め込みません。

```sh
npm run build:pages       # dist-pages/
npm run pack:itch         # output/astronaut-academy-itch.zip
```

GitHub Pages側はPagesのソースをGitHub Actionsに設定します。itch.io側はHTML5 ZIPをアップロードし、無料公開・**No payments**に設定します。公開リポジトリは[Gatsby007max/astronaut-academy](https://github.com/Gatsby007max/astronaut-academy)です。公開ビルドの支援先は[GatsbyZeroのKo-fi](https://ko-fi.com/gatsbyzero)で、`.env.production`に設定しています。Ko-fiは個人創作への任意支援であり、ゲームの利用・参加権には影響しません。設定例は[.env.example](.env.example)。

## 学習内容

| コース | 実技 |
| --- | --- |
| オリエンテーション | ISS・地球の特徴をスキャン |
| ISSシステム | 区画の特定、水・酸素の循環 |
| 宇宙医学・生理学 | 180日間の運動・栄養・回復計画 |
| 船外活動・中性浮力 | 錘と浮きの調整、プレブリーズ方式の判断 |
| ロボティクス | 3カメラと7リンクのアームで補給船を把持 |
| T-38飛行・サバイバル | 出発前確認の順序と状況判断 |
| 緊急事態対応 | 火災・圧力低下・有害物質などの判断 |
| 地質学・アルテミス | 2試料の選択と記録、月面撮影 |
| 管制室総合演習 | 8事象の担当卓への振り分けと対処 |

各コースに10レッスン・16問のクイズ・用語集・深掘り欄・NASA出典リンクがあります（合計90レッスン・144問）。言語切替後も教材ID、クイズの正解、採点、保存済み進捗は共通です。英訳の初稿、コード制作の一部、公開用の独自表紙図版にはCodexの支援を使用しました。内容や用語の改善はGitHub Discussionsで受け付けます。

クイズ70%以上、実技600/1000点以上でコース修了。解放条件はハブに表示します。全9コースを終えるとゲーム内修了証を表示・印刷できます。修了証は実際のNASA資格を意味しません。

XPは自己ベストの改善と初回達成に付与します。誤答は復習へ登録し、復習で正解すると削除されます。進捗・音量・画質はこのブラウザのlocalStorageに保存します。アカウント同期はありません。設定から確認操作を経てリセットできます。

## 操作

### デバッグで全コンテンツを見る

タイトルまたは設定の「デバッグで全て見る」で有効にします。URL末尾に `?debug=1` を付けても、全コースが開いたハブへ直接入れます。

- ヘッダーの **DEBUG**：全9コースのレッスン・知識確認・実技・結果へ直接移動。
- 知識確認：問題番号の選択、正解と解説の表示、結果画面への移動。
- 結果：合格／不合格のサンプル切り替え。修了証・全バッジ・復習のサンプルも確認可能。
- デバッグ中の既読・成績・XP・修了状況・復習リストは保存されません。通常の保存済み進捗を保持します。画質・音量設定は通常どおり保存します。
- DEBUGメニューまたは設定で終了すると、通常の解放条件へ戻ります。`?debug=1` が付いたURLでは再読み込み後もデバッグで開きます。

### 通常の操作

- マウス・タッチ：ボタン、3Dマーカー、スライダー。
- キーボード：Tab / Shift+Tabで移動、Enter / Spaceで決定、スライダーは矢印キー。
- ISS：ドラッグで回転、ホイールで拡大。区画選択はパネルのボタンからも操作可能。
- 実技の制限時間は判断演習内で一時停止できます。
- 画質は自動・低・中・高・最高。重い場合は低を選択してください。

## 資料・アセット

- `src/content/modules/*.ts`：日本語の講義・クイズ・用語・出典。
- `src/content/translations/en/*.json`：同じID・出典・正解を維持する英語訳。
- `scripts/asset-sources.mjs`：NASA原本の取得先・クレジット。
- `scripts/fetch-nasa-assets.mjs`：原本を`assets-src/`へ取得。
- `scripts/optimize-assets.mjs`：meshopt、ポリゴン削減、WebP化、月南極の標高変換。
- `public/assets/manifest.json`：生成物の容量と出典。UIは同内容の`src/content/generated/assets.json`からクレジットを表示。
- `npm run assets`：原本から再生成。原本は生成物より大きいため、通常の起動には不要です。
- `node scripts/audit-sources.mjs`：リンク応答を検査し`output/source-audit.json`へ出力。

NASAのISS・EMUモデル、Blue Marble / Black Marble、Deep Star Maps、LRO/LOLAデータを使用しています。原本EMUの布まで透過する素材指定を、変換時に不透明の布へ補正しています。図解用の人体・機体・アーム・船内・管制室、月の岩石と調査地点は本作独自の概念模型です。軌道図やモニターの値は実時間のNASAテレメトリではありません。

数値や手順は資料の対象年代・条件を伴って学習してください。実技の時間、閾値、得点、医学の健康指数は教育用の設定で、運用手順や生理学的予測を再現するものではありません。医療、操縦、緊急避難の実務に転用するための教材ではありません。

## 技術と検証

### 点群の流れとISSの描画

- 点の流れは、[OpenAIの参照ページ](https://openai.com/ja-JP/index/hugging-face-incident-and-the-road-ahead/)で観察した二つの渦を巡る表現を参考に、Lorenz軌道のGPUサンプリングで独自実装しています。元ページのアルゴリズムを取得・学習したものではありません。
- タイトルの点群アニメーションと点群専用プレビューボタンは削除済み。流動表現は訓練中と読み込み中に使用します。
- ISSは専用の点群レンダラーへ刷新。NASA原本の配置から表面と点列の輪郭を生成し、太陽電池／居住区／トラス／放熱板を学習用の色で区別します。
- 居住区などの立体構造は色を描かない奥行き処理で背後の点を隠します。薄い太陽電池と放熱板は両面の点を残し、重なった面でパネルが消えることを防ぎます。
- ISSは全体の点数予算の72%を使用し、周囲のモデルは残りの予算を使用します。低品質ではISS 50,400点。ISSの追加描画は点群1回と奥行き1回です。
- 試験中は表面の点を全て表示し、ISSの流動変位を収束させます。「静止」および端末の動きを減らす設定にも対応します。
- NASA原本は旧構成です。Nauka・Prichal・iROSAを含む現行構成へのモデル更新ではありません。画面内にも構成と配色の説明を表示します。

公開前の確認項目は[launch/LAUNCH-CHECKLIST.md](launch/LAUNCH-CHECKLIST.md)を参照してください。

React 19 / TypeScript / Vite 8 / Three.js / React Three Fiber / drei / postprocessing / Zustand / Tailwind CSS / Motion。外部の物理エンジンは使用していません。

初回は圧縮写真とUIのみを読み込み、訓練開始時に3Dエンジンを読み込みます。講座の文章、3Dシーン、実技パネルは必要に応じて分割読み込み。画質の自動変更はシェーダー準備後に行い、タブ非表示時は描画停止、クイズ・出典などの静止画面はカメラが落ち着いてから要求時のみ描画します。

```sh
npm test
npm run check:content
npm run check:build
npm run build:pages
npm run pack:itch
```

出典URLの応答確認はネットワーク利用可能な環境で`npm run audit:sources`。再現用ブラウザ操作は`scripts/qa/README.md`を参照してください。スマホ画面幅の検証と実機スマホの性能検証は区別しています。無料広報の候補調査、日英投稿文、週次指標は[launch/COMMUNITY-RESEARCH.md](launch/COMMUNITY-RESEARCH.md)と[launch/POST-DRAFTS.md](launch/POST-DRAFTS.md)にあります。
