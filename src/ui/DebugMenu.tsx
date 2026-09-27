import { tr, trt } from '../i18n/tr'
import { MODULES } from '../content/modules'
import { useGame } from '../game/store'
import { HudButton, Label, Modal } from './kit'

export function DebugMenu({ open, onClose, onShowBadges }: { open: boolean; onClose: () => void; onShowBadges: () => void }) {
  const debugMode = useGame((s) => s.debugMode)
  const openModule = useGame((s) => s.openModule)
  const previewResult = useGame((s) => s.previewResult)
  const go = useGame((s) => s.go)
  const graduate = useGame((s) => s.graduate)
  const setDebugMode = useGame((s) => s.setDebugMode)
  const navigate = (action: () => void) => { action(); onClose() }

  return (
    <Modal open={open && debugMode} onClose={onClose} title={tr("デバッグ · 全コンテンツ")}>
      <p className="mb-5 text-sm leading-6 text-white/65">{tr("全9コース・90レッスン・144問・9実技に直接アクセスできます。デバッグ中の進捗・成績・XPは保存されません。")}</p>
      <div className="space-y-3">
        {MODULES.map((m) => (
          <section key={m.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <h3 className="mb-2 text-sm font-semibold"><span className="mr-2 font-mono" style={{ color: m.color }}>{String(m.index).padStart(2, '0')}</span>{m.title}</h3>
            <div className="grid grid-cols-2 gap-1.5 min-[380px]:grid-cols-4">
              {([{ phase: 'brief', label: tr("レッスン") }, { phase: 'quiz', label: tr("知識確認") }, { phase: 'mini', label: tr("実技") }] as const).map(({ phase, label }) => (
                <HudButton key={phase} className="min-h-11 whitespace-nowrap !px-1 !text-xs" aria-label={`${m.title}：${label}`} onClick={() => navigate(() => openModule(m.id, phase))}>{label}</HudButton>
              ))}
              <HudButton className="min-h-11 whitespace-nowrap !px-1 !text-xs" aria-label={trt`${m.title}：結果サンプル`} onClick={() => navigate(() => previewResult(m.id))}>{tr("結果")}</HudButton>
            </div>
          </section>
        ))}
      </div>
      <section className="mt-6 space-y-3">
        <Label>{tr("その他の画面")}</Label>
        <div className="grid grid-cols-2 gap-2">
          <HudButton onClick={() => navigate(() => go({ name: 'hub' }))}>{tr("訓練ハブ")}</HudButton>
          <HudButton onClick={() => navigate(() => go({ name: 'intro' }))}>{tr("導入ムービー")}</HudButton>
          <HudButton onClick={() => navigate(graduate)}>{tr("修了証サンプル")}</HudButton>
          <HudButton onClick={() => navigate(onShowBadges)}>{tr("バッジサンプル")}</HudButton>
          <HudButton onClick={() => navigate(() => go({ name: 'review' }))}>{tr("復習")}</HudButton>
          <HudButton onClick={() => navigate(() => go({ name: 'credits' }))}>{tr("出典とクレジット")}</HudButton>
          <HudButton onClick={() => navigate(() => go({ name: 'title' }))}>{tr("タイトル")}</HudButton>
        </div>
      </section>
      <HudButton className="mt-6 w-full" variant="primary" onClick={() => navigate(() => setDebugMode(false))}>{tr("デバッグを終了して通常モードへ")}</HudButton>
    </Modal>
  )
}
