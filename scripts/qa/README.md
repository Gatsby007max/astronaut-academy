# ブラウザ検証スクリプト

Playwright CLIの`run-code --filename`へ渡す関数です。Vitest用ファイルではありません。
専用ブラウザセッション`academy`を使います。`quiz-first.js`はそのセッション内の学習進捗をリセットするため、普段の学習用プロファイルでは実行しないでください。

開発サーバーを5180、本番プレビューを5181で起動し、専用セッションで5180を開いて、次の順に実行します。

1. `quiz-first.js`、`quiz-rest.js`：全144問を画面上で解答。
2. `mini-first.js`、`mini-rest.js`：全9実技を操作し修了証まで進む。
3. `mobile.js`：390×844で各実技を開き、横幅と設定を検査。
4. `review.js`：スマホの導入実技、意図的な誤答、復習、再読み込み、修了証。
5. `production.js`：開発セッションの完了済みデータを専用本番セッションへ移し、9シーンと画質・静止描画を確認。
6. `final-production.js`：本番の画質計測、用語集、深掘り欄、EVA、スマホヘッダー。
7. `delivery.js`：最終容量ゲート、修了証の再表示と印刷、クレジット。
8. `onboarding.js`：確認付きリセット、新規導入、初期ロック、最初のレッスン。

実行例（プロジェクトルートから）：

```sh
npx --yes --package @playwright/cli playwright-cli -s=academy open http://127.0.0.1:5180/ --headed
npx --yes --package @playwright/cli playwright-cli -s=academy run-code --filename=scripts/qa/quiz-first.js
```

実技・クイズの得点はUI操作から得ます。シーン遷移と正解の取得には開発ストア・教材データを使い、本番の性能試験には完了済み保存データを使用しています。自然な初見プレイや人による学習効果の試験ではありません。

出力は`output/playwright/`の画像と、ブラウザの`window.__qa`、`window.__production`、`window.__final`、`window.__delivery`。今回実行したJSONの保存先と数値は`output/verification.md`を参照してください。`requestAnimationFrame`による計測値はGPU処理時間そのものではありません。

## 点群版の回帰確認

本番プレビュー5181と専用セッション`particles`を使います。**`particles.js`はこの専用プロファイルの保存データを完了済みのテストデータで置き換えます。普段の学習用プロファイルでは実行しないでください。**

```sh
npx --yes --package @playwright/cli playwright-cli -s=particles open http://127.0.0.1:5181/
npx --yes --package @playwright/cli playwright-cli -s=particles run-code --filename=scripts/qa/particles.js
npx --yes --package @playwright/cli playwright-cli -s=particles run-code --filename=scripts/qa/particles-interaction.js
npx --yes --package @playwright/cli playwright-cli -s=particles run-code --filename=scripts/qa/particles-layout.js
```

- `particles.js`：9シーンの点群表示、4シーンの試験時の収束、実行時エラーを検査。
- `particles-interaction.js`：ISS区画マーカー、ロボットアームと3視点、月面採取と実際の撮影、粒子の停止設定とOSの視差効果軽減を確認。
- `particles-layout.js`：390×844でISS全景、5区画の実クリック、1440×1000への復帰を検査。
- 結果は順に `window.__particlesQA`、`window.__particlesInteraction`、`window.__particlesLayout`。画像は `output/playwright/particles-*.png`。
- `node scripts/audit-iss-model.mjs`：NASA原本と軽量化モデルの名前・範囲、8つの主太陽電池翼、2つの放熱器群を照合。原本は `assets-src/ISS_stationary.glb` が必要。

点群版の結果・出典・性能の測定範囲は `output/particle-verification.md` を参照してください。

### 輪郭表示

`contours.js`は上記の9シーン確認に輪郭の存在・線分数上限の検査を追加したものです。専用セッション`contours`の進捗をテストデータで置き換えます。

```sh
npx --yes --package @playwright/cli playwright-cli -s=contours open http://127.0.0.1:5181/
npx --yes --package @playwright/cli playwright-cli -s=contours run-code --filename=scripts/qa/contours.js
```

出力は `window.__contoursQA` と `output/playwright/contours-*.png`。既存の操作・レイアウト検査も、出力名を`contours-`へ変えた `output/contour-interactions.js` と `output/contour-layout.js` で実行済みです。結果は `output/contour-verification.md` を参照してください。

## デバッグモード

本番プレビュー5181を、新規の専用セッション `debug` で開いて実行します。完了済みデータは注入せず、通常のUIで最初のレッスンを学習した後、その保存データがデバッグ中も維持されることを比較します。

1. `debug-mode.js`：全9コースのレッスン1/10、問題16の解答と解説、全9実技の開始、結果の切り替え、全バッジ、復習、修了証、再読み込み、宇宙医学実技の完了を検査。
2. `debug-mobile.js`：390×844で直接移動・解答表示・修了証・導入・出典・通常モードへの復帰・通常クイズの制約を確認。
3. `debug-layout.js`：320px/390pxで36個の直接移動ボタンの幅と44px以上の高さを検査。読み込みと画面のフェード完了後に撮影。

出力は `window.__debugQA`、`window.__debugMobileQA`、`window.__debugLayoutQA`。結果は `output/debug-verification.md` に記載。
