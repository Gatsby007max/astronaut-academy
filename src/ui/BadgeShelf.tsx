import { tr } from '../i18n/tr'
import { MODULES } from '../content/modules'
import { useGame } from '../game/store'
import { Modal } from './kit'

export function BadgeEmblem({ color, index, earned, perfect, size = 64 }: { color: string; index: number; earned: boolean; perfect?: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={earned ? '' : 'opacity-25 grayscale'} aria-hidden>
      <defs>
        <radialGradient id={`bg${index}`} cx="50%" cy="35%" r="70%">
          <stop offset="0" stopColor={color} stopOpacity="0.55" />
          <stop offset="1" stopColor="#050b16" stopOpacity="1" />
        </radialGradient>
      </defs>
      <path d="M32 3 L57 17 L57 47 L32 61 L7 47 L7 17 Z" fill={`url(#bg${index})`} stroke={color} strokeWidth="2" />
      <path d="M32 10 L51 21 L51 43 L32 54 L13 43 L13 21 Z" fill="none" stroke={color} strokeOpacity="0.35" strokeWidth="1" />
      <ellipse cx="32" cy="32" rx="19" ry="6" fill="none" stroke={perfect ? '#ffd166' : color} strokeWidth="1.5" transform="rotate(-25 32 32)" />
      <text x="32" y="38" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="16" fontWeight="700" fill="#fff">
        {String(index).padStart(2, '0')}
      </text>
    </svg>
  )
}

export function BadgeShelf({ open, onClose }: { open: boolean; onClose: () => void }) {
  const progress = useGame((s) => s.modules)
  const debugMode = useGame((s) => s.debugMode)
  return (
    <Modal open={open} onClose={onClose} title={tr("バッジコレクション")} wide>
      {debugMode && <p className="mb-4 text-xs text-amber">{tr("全バッジの表示サンプル · 獲得状況は変更されません")}</p>}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {MODULES.map((m) => {
          const p = progress[m.id]
          return (
            <div key={m.id} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
              <BadgeEmblem color={m.color} index={m.index} earned={debugMode || !!p?.completed} perfect={p?.perfect} />
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{m.badge.name}</div>
                <div className="text-xs text-white/55">{m.badge.description}</div>
                {p?.perfect && <div className="mt-1 font-mono text-[10px] text-amber">PERFECT</div>}
              </div>
            </div>
          )
        })}
      </div>
    </Modal>
  )
}
