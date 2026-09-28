# 公開・参加・改善の実行台帳

## 公開ゲート

- [x] `npm test`, `npm run check:content`, `npm run check:build`, `npm run build:pages`, `npm run pack:itch` が通る（11ファイル98テスト、9コース・90レッスン・144問・671 UI文字列を検査）。
- [ ] 9コースの日英でレッスン、クイズ、実技、進捗が操作できる。言語を切り替えても同じIDと採点・進捗を使う。
- [ ] GitHub Pagesとitch.ioの実URLで、横長・縦長PC、スマートフォン、リロード後の進捗、出典、感想導線を確認。
- [ ] NASA素材と第三者素材の個別クレジットを確認。広報用のPV・画像・音楽・人物の権利を別途確認。
- [x] GitHub Discussionsを有効化し、**Play feedback / プレイ感想**, **Content & sources / 教材・出典**, **Ideas / アイデア**, **Translation / 翻訳**を作る。バグ報告はIssues、修正はPR。[歓迎スレッド](https://github.com/Gatsby007max/astronaut-academy/discussions/1)を固定済み。
- [ ] itch.ioに無料HTML5 ZIPを登録し、決済を **No payments** にする。公開ページ内に非公認表示・クレジット・GitHubへのリンク。
- [x] Ko-fi StandardをGatsbyZero名義、JPY、一回限りの任意支援に設定。公開ページでNASA非公認・支援とゲームアクセスの分離を明記。公開URLを`.env.production`に設定。ゲームからの実際の遷移は公開後に確認。
- [ ] 管理できる既存アーティスト発信先を確認してから相互リンク。

## 4週間の進め方

| 時期 | 行動 | 判断材料 |
| --- | --- | --- |
| 公開週 | itch.io Get Feedbackで具体的な2問を聞く。公開告知はRelease Announcementsで別投稿。GitHub Discussionsで歓迎スレッド。 | 投稿URL、itch.ioページ閲覧、具体的な感想、初回の問題。 |
| 2週目 | 回答と修正結果をスレッドへ返す。r/playmygameでは他作品への感想を先に返し、無料版と具体的な依頼を投稿。投稿文を反応に応じて調整。 | 実際に遊んだ人の理解しにくい点、再現できた不具合、離脱箇所。 |
| 3週目 | 権利確認済みのゲーム映像を使いr/indiegamesに公開紹介。Zennは技術的な実体験の記事だけ。既存アーティスト発信先で制作記録。 | 各投稿の閲覧・反応、GitHubの実質的な意見とPR。 |
| 4週目 | 継続する参加先を選び、Discordを求める継続的交流と管理担当を確認。 | 有用な感想の数、返信負荷、修正への参加、継続的な会話。 |

最初の4週間は有料広告を使わない。Discordを開設しても、開発の決定・不具合の記録はGitHubに残す。

## 確認済み・保留中の証跡（2026-09-27）

- 出典監査: `npm run audit:sources` は49件、失敗0件。
- `launch/assets/cover.png`はGatsbyZero提供の実ゲーム画面に文字を組んだ630×500の表紙。NASA VTADのISSモデルとNASA SVSの星図を含むため、出典・非公認表示を付け、Ko-fiの支援訴求には使わない。T-38実プレイ版は`cover-t38-gameplay-630x500.png`、以前の抽象表紙は`cover-abstract-630x500.png`として保存。
- `launch/assets/robotics-gameplay.png`は実プレイ画像。背景のNASA SVS星図を明示して使い、Ko-fiの支援訴求には転用しない。
- 既存の15秒PVはNASAのISS・EMUモデルを含む。広報への使用前に全カットと音楽の確認が必要。
- タイトル写真にはNASA宇宙飛行士Tracy C. Dysonが写る。ゲーム内の教育的な表示に限り、外部広報と支援募集には使わない。
- [GitHubリポジトリ](https://github.com/Gatsby007max/astronaut-academy)と[GitHub Pages](https://gatsby007max.github.io/astronaut-academy/)は公開済み。ActionsのCI・Pagesビルドは成功。実URLで日英切替、教材出典、感想・Ko-fiリンク、390×844のスマートフォンと1440×900・900×1440のPC画面を確認。900px幅で窮屈だった上部の名前表示は修正中。
- itch.ioのGatsbyZeroアカウントで作品ページの非公開Draftを保存済み。HTML5・No payments・モバイル対応・全画面起動・AI使用開示（Graphics / Text & Dialog / Code）を設定。ZIP、表紙、実プレイ画像のアップロードと公開は未完了。ChromeのChatGPT拡張にローカルファイルアクセス権限がなく、ファイル選択で停止中。
- [GatsbyZeroのKo-fi](https://ko-fi.com/gatsbyzero)は開設済み。Standard、JPY、月額支援オフ、一回限り最低100円の表示を確認。個人支援とゲーム参加を分離したプロフィール・お礼文・公開制作記録を設定し、GitHub Pagesと相互リンク。実公開ゲームの支援リンク先も確認済み。

## 週次記録

`metrics.csv` に1投稿または1週単位で記録する。投稿閲覧、反応、itch.ioページ閲覧、GitHubの具体的な感想・Issue・PR、Ko-fiの支援件数をそれぞれ**別の観測値**として扱う。参照元別の寄付率は帰属を直接確認できた場合だけ算出する。未取得は空欄で残し、推定値で埋めない。
