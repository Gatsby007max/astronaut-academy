import { Html } from '@react-three/drei'
import { Vector3 } from 'three'
import { MODULES } from '../../content/modules'
import { audio } from '../../engine/audio'
import { isUnlocked } from '../../game/progress'
import { useGame } from '../../game/store'
import type { IssPart, IssPartKey } from '../../world/IssModel'
import { MODULE_ANCHORS } from './layout'

export function HubMarkers({ parts }: { parts: Record<IssPartKey, IssPart> }) {
  const progress = useGame((s) => s.modules)
  const debugMode = useGame((s) => s.debugMode)
  const focus = useGame((s) => s.focus)
  const setFocus = useGame((s) => s.setFocus)
  const openModule = useGame((s) => s.openModule)

  return (
    <>
      {MODULES.map((m) => {
        const anchor = MODULE_ANCHORS[m.id]
        const position = typeof anchor === 'string' ? parts[anchor].center.clone().add(new Vector3(0, 0.12, 0)) : new Vector3(...anchor)
        const unlocked = isUnlocked(m.id, progress, debugMode)
        const done = progress[m.id]?.completed
        const active = focus === m.id
        return (
          <Html key={m.id} position={position} center zIndexRange={[20, 10]} style={{ pointerEvents: 'auto' }}>
            <button
              type="button"
              aria-label={m.title}
              onPointerEnter={() => {
                setFocus(m.id)
                audio.sfx('hover')
              }}
              onPointerLeave={() => setFocus('overview')}
              onClick={() => {
                if (!unlocked) return audio.sfx('wrong')
                audio.sfx('confirm')
                openModule(m.id)
              }}
              className={`group relative flex -translate-y-1/2 items-center whitespace-nowrap transition-all duration-300 ${active ? 'scale-110' : 'scale-100'} ${unlocked ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
            >
              <span className="relative grid size-6 place-items-center">
                <span
                  className="absolute inset-0 rounded-full border animate-ping"
                  style={{ borderColor: m.color, animationDuration: '2.4s', opacity: unlocked && !done ? 0.6 : 0 }}
                />
                <span className="size-3 rounded-full border-2 bg-black/40" style={{ borderColor: m.color, boxShadow: `0 0 12px ${m.color}` }} />
              </span>
              <span
                className={`glass pointer-events-none absolute left-full ml-2 rounded-md px-2 py-1 text-left font-mono text-[10px] leading-tight transition-opacity ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'}`}
              >
                <span className="block tracking-widest" style={{ color: m.color }}>
                  {String(m.index).padStart(2, '0')} {m.en.toUpperCase()}
                </span>
                <span className="block text-xs text-white/90">
                  {m.title}
                  {done ? <span className="ml-1 text-ok">CLEAR</span> : unlocked ? null : <span className="ml-1 text-white/40">LOCKED</span>}
                </span>
              </span>
            </button>
          </Html>
        )
      })}
    </>
  )
}
