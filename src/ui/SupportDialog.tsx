import { tr } from '../i18n/tr'
import { communityLinks } from '../community/links'
import { Modal } from './kit'

export function SupportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title={tr("GatsbyZeroの創作を支援")}>
      <div className="space-y-4 text-sm leading-6 text-white/70">
        <p>{tr("このゲームと教材は無料です。任意の支援はGatsbyZero個人の創作活動に向けたもので、ゲームの内容、参加権、返答の優先度は変わりません。")}</p>
        <p>{tr("支援先はKo-fi Standardです。NASAはこの作品と支援募集を制作・承認・推奨していません。")}</p>
        {communityLinks.support && <a href={communityLinks.support} target="_blank" rel="noreferrer" className="inline-block rounded-md border border-hud/50 px-4 py-2 text-hud hover:bg-hud/10">{tr("Ko-fiで任意支援 ↗")}</a>}
      </div>
    </Modal>
  )
}
