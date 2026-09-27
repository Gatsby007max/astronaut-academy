import { tr, trt } from '../i18n/tr'
import { motion } from 'motion/react'
import { MODULES } from '../content/modules'
import { audio } from '../engine/audio'
import { isUnlocked, MINI_MAX } from '../game/progress'
import { useGame } from '../game/store'
import { Disclaimer } from '../ui/Disclaimer'
import { HudButton, Label, Meter, Panel } from '../ui/kit'
import { usePanelShift } from '../ui/usePanelShift'

export function HubScreen() {
  const progress = useGame((s) => s.modules)
  const focus = useGame((s) => s.focus)
  const setFocus = useGame((s) => s.setFocus)
  const openModule = useGame((s) => s.openModule)
  const graduate = useGame((s) => s.graduate)
  const debugMode = useGame((s) => s.debugMode)
  const locale = useGame((s) => s.settings.locale)
  const allComplete = MODULES.every(m => progress[m.id]?.completed)
  usePanelShift('left', 0.14)
  const recommended = MODULES.find((m) => isUnlocked(m.id, progress) && !progress[m.id]?.completed)

  return (
    <div className="pointer-events-none fixed inset-0 flex flex-col justify-end p-3 pt-20 md:justify-start md:p-4 md:pt-24">
      <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="w-full md:w-[380px]">
        <Panel className="flex max-h-[46vh] flex-col md:max-h-[calc(100vh-8rem)]">
          <div className="border-b border-white/10 px-4 py-3">
            <Label>ASCAN TRAINING CURRICULUM</Label>
            <div className="mt-1 text-base font-semibold">{tr("訓練カリキュラム")}</div>
            {debugMode && <p className="mt-1 text-xs text-amber">{tr("全9コース開放中 · 成績は保存されません")}</p>}
            {!debugMode && recommended && (
              <div className="mt-1 text-xs text-white/55">
                {tr("次のおすすめ:")}<span style={{ color: recommended.color }}>{recommended.title}</span>
              </div>
            )}
          </div>
          <ul className="scroll-thin flex-1 overflow-y-auto p-2">
            {MODULES.map((m) => {
              const p = progress[m.id]
              const unlocked = isUnlocked(m.id, progress, debugMode)
              const lessons = p?.lessonsRead.length ?? 0
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    disabled={!unlocked}
                    onPointerEnter={() => {
                      setFocus(m.id)
                      audio.sfx('hover')
                    }}
                    onPointerLeave={() => setFocus('overview')}
                    onClick={() => {
                      audio.unlock()
                      audio.sfx('confirm')
                      openModule(m.id)
                    }}
                    className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${focus === m.id ? 'bg-white/10' : 'hover:bg-white/5'} disabled:cursor-not-allowed disabled:opacity-40`}
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-md border font-mono text-xs" style={{ borderColor: `${m.color}88`, color: m.color, boxShadow: p?.completed ? `0 0 14px -2px ${m.color}` : undefined }}>
                      {String(m.index).padStart(2, '0')}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">{m.title}</span>
                        {p?.completed && <span className="font-mono text-[10px] text-ok">CLEAR</span>}
                        {!unlocked && <span className="font-mono text-[10px] text-white/40">LOCKED</span>}
                      </span>
                      <span className="block truncate text-[11px] text-white/50">{unlocked ? m.tagline : trt`解放条件: ${m.requires.map((r) => MODULES.find((x) => x.id === r)!.title).join(locale === 'en' ? ', ' : '・')}`}</span>
                      {unlocked && p && (
                        <span className="mt-1.5 grid grid-cols-3 gap-1.5">
                          <Meter value={lessons / 10} color={m.color} />
                          <Meter value={p.quizBest} color={m.color} />
                          <Meter value={p.miniBest / MINI_MAX} color={m.color} />
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          <div className="border-t border-white/10 px-4 py-2 font-mono text-[10px] text-white/35">{tr("バー: レッスン / クイズ最高 / 実技最高")}</div>
          {(allComplete || debugMode) && <HudButton variant="primary" className="mx-3 mb-3" onClick={graduate}>{debugMode ? tr("修了証サンプルを開く") : tr("修了証を開く")}</HudButton>}
        </Panel>
      </motion.div>
      <div className="pointer-events-none fixed bottom-3 right-4 hidden max-w-md text-right md:block">
        <Disclaimer compact />
      </div>
    </div>
  )
}
