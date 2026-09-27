import { tr } from '../i18n/tr'
import { useState } from 'react'
import { TIER_ORDER, TIERS, type QualitySetting } from '../engine/quality'
import { useGame } from '../game/store'
import { HudButton, Label, Modal } from './kit'

export function SettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const settings = useGame((s) => s.settings)
  const tier = useGame((s) => s.tier)
  const update = useGame((s) => s.updateSettings)
  const reset = useGame((s) => s.resetProgress)
  const debugMode = useGame((s) => s.debugMode)
  const setDebugMode = useGame((s) => s.setDebugMode)
  const [confirmReset, setConfirmReset] = useState(false)
  const options: QualitySetting[] = ['auto', ...TIER_ORDER]

  return (
    <Modal open={open} onClose={onClose} title={tr("設定")}>
      <div className="space-y-6">
        <section className="space-y-2 rounded-lg border border-amber/25 bg-amber/5 p-3">
          <Label>{tr("デバッグモード")}</Label>
          <p className="text-xs leading-5 text-white/65">{tr("全コース・全問題・実技・修了証を自由に確認できます。デバッグ中の進捗・成績・XPは保存されません。")}</p>
          <HudButton variant={debugMode ? 'ghost' : 'primary'} onClick={() => {
            setDebugMode(!debugMode)
            setConfirmReset(false)
            onClose()
          }}>{debugMode ? tr("デバッグを終了") : tr("デバッグで全て見る")}</HudButton>
        </section>
        <section className="space-y-2">
          <Label>{tr("グラフィック品質")}</Label>
          <div className="grid grid-cols-5 gap-2">
            {options.map((o) => (
              <HudButton key={o} variant={settings.quality === o ? 'primary' : 'ghost'} onClick={() => update({ quality: o })} className="px-2">
                {o === 'auto' ? tr("自動") : TIERS[o].label}
              </HudButton>
            ))}
          </div>
          <p className="text-xs text-white/50">
            {tr("現在の描画品質:")}<span className="text-hud">{TIERS[tier].label}</span>
            {settings.quality === 'auto' && tr("（フレームレートに合わせて自動調整中）")}
          </p>
        </section>
        <section className="space-y-2">
          <Label>{tr("粒子の動き")}</Label>
          <div className="flex gap-2">
            <HudButton variant={settings.particleMotion ? 'primary' : 'ghost'} onClick={() => update({ particleMotion: true })}>{tr("流動")}</HudButton>
            <HudButton variant={!settings.particleMotion ? 'primary' : 'ghost'} onClick={() => update({ particleMotion: false })}>{tr("静止")}</HudButton>
          </div>
          <p className="text-xs leading-5 text-white/50">{tr("知識確認・実技訓練では、自動で粒子が集まり形状を見やすくします。端末の「視差効果を減らす」設定にも対応します。")}</p>
        </section>
        <section className="space-y-2">
          <Label>{tr("サウンド")}</Label>
          <div className="flex items-center gap-3">
            <HudButton variant={settings.audio ? 'primary' : 'ghost'} onClick={() => update({ audio: !settings.audio })}>
              {settings.audio ? tr("オン") : tr("オフ")}
            </HudButton>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.volume}
              onChange={(e) => update({ volume: Number(e.target.value) })}
              className="pointer-events-auto w-full accent-[#7fe3ff]"
              aria-label={tr("音量")}
            />
          </div>
        </section>
        <section className="space-y-2">
          <Label>{tr("進捗データ")}</Label>
          {debugMode ? <p className="text-xs text-white/55">{tr("進捗のリセットは通常モードで行えます。")}</p> : confirmReset ? (
            <div className="flex gap-2">
              <HudButton
                variant="danger"
                onClick={() => {
                  reset()
                  setConfirmReset(false)
                  onClose()
                }}
              >
                {tr("本当にリセットする")}</HudButton>
              <HudButton onClick={() => setConfirmReset(false)}>{tr("やめる")}</HudButton>
            </div>
          ) : (
            <HudButton variant="ghost" onClick={() => setConfirmReset(true)}>
              {tr("進捗をリセット")}</HudButton>
          )}
          <p className="text-xs text-white/40">{tr("進捗はこのブラウザ内（localStorage）にのみ保存されます。")}</p>
        </section>
      </div>
    </Modal>
  )
}
