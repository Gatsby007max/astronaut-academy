import { tr } from '../i18n/tr'
import { create } from 'zustand'

export interface ScanTargetDef {
  id: string
  prompt: string
  fact: string
}

export const SCAN_TARGETS: ScanTargetDef[] = [
  { id: 'solar', prompt: tr("ISSの電力を生み出す太陽電池翼（ソーラーアレイ）"), fact: tr("太陽電池翼が集めた電力はバッテリーに蓄えられ、ISSが地球の影に入っている間も電力を供給します。") },
  { id: 'radiators', prompt: tr("船内で出た余分な熱を宇宙空間へ捨てる放熱ラジエーター"), fact: tr("船内の熱は水の冷却ループから熱交換器で船外のアンモニアへ移され、6基の大型ラジエーターから宇宙へ捨てられます。") },
  { id: 'cupola', prompt: tr("地球観測とロボットアーム操作に使われる、窓の多いキューポラ"), fact: tr("キューポラは側面6枚と地球向き1枚の窓を持ち、ロボットアームを操作するロボティクス・ワークステーションも置かれます。") },
  { id: 'destiny', prompt: tr("アメリカの主要な実験棟デスティニー"), fact: tr("デスティニーは米国のペイロードのための主要な研究室で、健康・安全・生活の質に関わる幅広い実験を支えています。") },
  { id: 'canadarm2', prompt: tr("補給船をつかむロボットアーム、カナダアーム2"), fact: tr("カナダアーム2は長さ約17m（56フィート）。ISSをモジュールごとに組み立て、自由飛行する宇宙機を捕まえて結合させます。") },
  { id: 'terminator', prompt: tr("地球の昼と夜の境界線（ターミネーター）"), fact: tr("ISSは約90分で地球を1周するため、クルーは1日に約16回の日の出と日の入りを迎えます。") },
  { id: 'night', prompt: tr("夜側に広がる都市の灯り"), fact: tr("夜側の都市の灯りは、NASAの衛星データ「ブラックマーブル」で再現しています。") },
  { id: 'limb', prompt: tr("地球の縁に見える薄い大気の層"), fact: tr("地球の半径に比べると大気の層はごく薄く、軌道上からは地球の縁に青い帯のように見えます。") },
  { id: 'ocean', prompt: tr("太陽光を反射して輝く海面（サングリント）"), fact: tr("海面で太陽光が鏡のように反射する現象はサングリントと呼ばれ、海面の状態の違いを浮かび上がらせます。") },
]

export type ScanStatus = 'ready' | 'arming' | 'running' | 'done'

interface ScanState {
  status: ScanStatus
  order: string[]
  visible: Record<string, [number, number, number]>
  index: number
  score: number
  mistakes: number
  promptStartedAt: number
  feedback?: { ok: boolean; text: string; at: number }
  arm: () => void
  begin: (visible: Record<string, [number, number, number]>) => void
  pick: (id: string) => boolean
  reset: () => void
}

export const PROMPTS_PER_RUN = 6
export const MAX_SCORE_PER_PROMPT = 170

export function scoreForPick(correct: boolean, seconds: number): number {
  if (!correct) return -40
  return 100 + Math.round(Math.max(0, Math.min(70, 70 * (1 - (seconds - 1.5) / 6))))
}

function shuffle<T>(items: T[]): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export const useOrbitScan = create<ScanState>()((set, get) => ({
  status: 'ready',
  order: [],
  visible: {},
  index: 0,
  score: 0,
  mistakes: 0,
  promptStartedAt: 0,
  arm: () => set({ status: 'arming', score: 0, mistakes: 0, index: 0, feedback: undefined }),
  begin: (visible) => {
    const ids = SCAN_TARGETS.map((t) => t.id).filter((id) => visible[id])
    set({ status: 'running', visible, order: shuffle(ids).slice(0, PROMPTS_PER_RUN), index: 0, promptStartedAt: performance.now() })
  },
  pick: (id) => {
    const s = get()
    if (s.status !== 'running') return false
    const wanted = s.order[s.index]
    const correct = id === wanted
    const seconds = (performance.now() - s.promptStartedAt) / 1000
    const delta = scoreForPick(correct, seconds)
    const def = SCAN_TARGETS.find((t) => t.id === wanted)!
    if (!correct) {
      set({ score: Math.max(0, s.score + delta), mistakes: s.mistakes + 1, feedback: { ok: false, text: tr("ターゲット不一致。もう一度スキャンしてください。"), at: performance.now() } })
      return false
    }
    const index = s.index + 1
    set({
      score: s.score + delta,
      index,
      promptStartedAt: performance.now(),
      status: index >= s.order.length ? 'done' : 'running',
      feedback: { ok: true, text: def.fact, at: performance.now() },
    })
    return true
  },
  reset: () => set({ status: 'ready', order: [], visible: {}, index: 0, score: 0, mistakes: 0, feedback: undefined }),
}))
