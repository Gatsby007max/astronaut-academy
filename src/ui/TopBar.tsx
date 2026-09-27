import { tr, trt } from '../i18n/tr'
import { useState } from 'react'
import { MODULES } from '../content/modules'
import { completedCount, nextRank, rankFor, rankProgress } from '../game/progress'
import { useGame } from '../game/store'
import { BadgeShelf } from './BadgeShelf'
import { DebugMenu } from './DebugMenu'
import { HudButton, Meter } from './kit'
import { SettingsDialog } from './Settings'
import { FeedbackDialog } from './FeedbackDialog'
import { LanguageSwitch } from './LanguageSwitch'

export function TopBar() {
  const xp = useGame((s) => s.xp)
  const graduated = useGame((s) => s.graduated)
  const modules = useGame((s) => s.modules)
  const review = useGame((s) => s.review)
  const screen = useGame((s) => s.screen)
  const go = useGame((s) => s.go)
  const debugMode = useGame((s) => s.debugMode)
  const [debugMenu, setDebugMenu] = useState(false)
  const [settings, setSettings] = useState(false)
  const [badges, setBadges] = useState(false)
  const [feedback, setFeedback] = useState(false)
  const rank = rankFor(xp, graduated)
  const next = nextRank(xp, graduated)
  const done = completedCount(modules)

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-start justify-between gap-3 p-3 md:p-4">
        <div className="glass pointer-events-auto flex min-w-0 items-center gap-3 rounded-xl px-3 py-2 md:gap-4 md:px-4">
          <button type="button" onClick={() => go({ name: 'hub' })} className="min-w-0 text-left" aria-label={tr("ハブへ戻る")}>
            <div className="truncate font-mono text-[9px] tracking-[0.35em] text-hud-dim">ASTRONAUT ACADEMY</div>
            <div className={`truncate text-sm font-semibold leading-tight ${debugMode ? 'text-amber' : ''}`}>{debugMode ? tr("デバッグモード") : rank.title}</div>
          </button>
          <div className="hidden w-40 sm:block">
            <div className="flex justify-between font-mono text-[10px] text-white/50">
              <span>{xp.toLocaleString()} XP</span>
              <span>{next ? trt`次: ${next.title}` : 'MAX'}</span>
            </div>
            <Meter value={rankProgress(xp, graduated)} className="mt-1" />
          </div>
          <button type="button" onClick={() => setBadges(true)} className="pointer-events-auto hidden font-mono text-[11px] text-white/70 hover:text-white md:block">
            BADGES <span className="text-amber">{done}</span>/{MODULES.length}
          </button>
        </div>
        <div className="flex shrink-0 gap-2">
          <LanguageSwitch />
          {debugMode && <HudButton onClick={() => setDebugMenu(true)} className="glass border-amber/50 px-2 font-mono text-amber" aria-label={tr("デバッグメニューを開く")}>DEBUG</HudButton>}
          {screen.name !== 'hub' && (
            <HudButton sound="back" onClick={() => go({ name: 'hub' })} className={`glass px-3 ${debugMode ? 'max-sm:!hidden' : ''}`}>
              {tr("ハブ")}</HudButton>
          )}
          <HudButton onClick={() => go({ name: 'review' })} className={`glass px-2 ${debugMode ? 'max-sm:!hidden' : ''}`} disabled={review.length === 0}>
            <span className="hidden sm:inline">{tr("復習")}</span><span className="sm:hidden">{tr("復習")}</span>{review.length > 0 && <span className="rounded bg-amber/20 px-1.5 font-mono text-[11px] text-amber">{review.length}</span>}
          </HudButton>
          <HudButton onClick={() => go({ name: 'credits' })} className="glass px-3 max-md:!hidden">
            {tr("出典")}</HudButton>
          <HudButton onClick={() => setFeedback(true)} className="glass px-3">{tr("感想")}</HudButton>
          <HudButton onClick={() => setSettings(true)} className="glass px-3" aria-label={tr("設定")}>
            {tr("設定")}</HudButton>
        </div>
      </header>
      <SettingsDialog open={settings} onClose={() => setSettings(false)} />
      <BadgeShelf open={badges} onClose={() => setBadges(false)} />
      <DebugMenu open={debugMenu} onClose={() => setDebugMenu(false)} onShowBadges={() => setBadges(true)} />
      <FeedbackDialog open={feedback} onClose={() => setFeedback(false)} />
    </>
  )
}
