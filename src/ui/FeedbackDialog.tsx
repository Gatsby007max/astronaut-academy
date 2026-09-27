import { tr } from '../i18n/tr'
import { communityLinks } from '../community/links'
import { Modal } from './kit'

export function FeedbackDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { discussions, playFeedback, contentSources, ideas, translations, issues, pulls } = communityLinks
  return (
    <Modal open={open} onClose={onClose} title={tr("参加・フィードバック")}>
      <p className="text-sm leading-6 text-white/70">{tr("感想や教材の訂正を歓迎します。プレイや参加に支援は必要ありません。")}</p>
      {discussions ? (
        <div className="mt-4 space-y-3 text-sm">
          <a className="block text-hud hover:underline" href={playFeedback} target="_blank" rel="noreferrer">{tr("プレイ感想・操作感 → GitHub Discussions")}</a>
          <a className="block text-hud hover:underline" href={contentSources} target="_blank" rel="noreferrer">{tr("教材・出典の訂正 → GitHub Discussions")}</a>
          <a className="block text-hud hover:underline" href={ideas} target="_blank" rel="noreferrer">{tr("新しいアイデア → GitHub Discussions")}</a>
          <a className="block text-hud hover:underline" href={translations} target="_blank" rel="noreferrer">{tr("日英の翻訳改善 → GitHub Discussions")}</a>
          <a className="block text-hud hover:underline" href={issues} target="_blank" rel="noreferrer">{tr("再現できる不具合 → GitHub Issue")}</a>
          <a className="block text-hud hover:underline" href={pulls} target="_blank" rel="noreferrer">{tr("修正や翻訳の提案 → Pull Request")}</a>
        </div>
      ) : <p className="mt-4 text-sm text-white/55">{tr("公開リポジトリの準備中です。")}</p>}
      <p className="mt-5 text-xs leading-5 text-white/50">{tr("個人情報や実際の緊急・医療相談は投稿しないでください。NASA公式の訓練や資格には関係しません。")}</p>
    </Modal>
  )
}
