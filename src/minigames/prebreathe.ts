import { tr } from '../i18n/tr'
export interface PrebreatheOption {
  id: string
  label: string
  detail: string
}

export interface PrebreatheScenario {
  id: string
  situation: string
  options: PrebreatheOption[]
  answer: string
  explanation: string
}

export const PROTOCOLS: PrebreatheOption[] = [
  { id: 'insuit', label: tr("In-Suitプロトコル"), detail: tr("14.7psiのまま宇宙服内で4時間純酸素を吸う") },
  { id: 'campout', label: tr("キャンプアウト"), detail: tr("前夜からエアロックを10.2psi・酸素26.5%にして過ごす") },
  { id: 'exercise', label: tr("エクササイズ"), detail: tr("14.7psiで純酸素を吸いながら短時間の激しい運動、その後10.2psiで宇宙服内プレブリーズ") },
  { id: 'isle', label: tr("ISLE（宇宙服内軽運動）"), detail: tr("マスクで40分純酸素、20分かけて10.2psiへ減圧、宇宙服内で軽い運動") },
]

export const PREBREATHE_SOURCE = {
  title: 'NASA OCHMO Technical Brief: Decompression Sickness (OCHMO-TB-037)',
  url: 'https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-037-decompression-sickness.pdf',
}

export const SCENARIOS: PrebreatheScenario[] = [
  {
    id: 'campout',
    situation: tr("翌日の船外活動に向けて、2人のクルーは前夜からエアロックで眠ることができます。EVA当日の宇宙服内プレブリーズ時間をできるだけ短くしたい。"),
    options: PROTOCOLS,
    answer: 'campout',
    explanation: tr("キャンプアウトでは前夜をエアロック内の10.2psi・酸素26.5%の環境で過ごし、当日の宇宙服内プレブリーズを大幅に短縮します。運用上の理由から10.2psiでの滞在は8時間40分までに制限されています。"),
  },
  {
    id: 'insuit',
    situation: tr("運動器具もエアロックの一晩滞在も使えません。時間はかかっても、キャビンを14.7psiのまま保てる最も単純な方式を選びます。"),
    options: PROTOCOLS,
    answer: 'insuit',
    explanation: tr("In-Suitプロトコルは14.7psiのまま宇宙服内で4時間純酸素を吸い、体内の窒素を洗い出します。手順は単純ですが最も時間がかかります。"),
  },
  {
    id: 'isle',
    situation: tr("手順書には「マスクで40分間純酸素を吸い、その後20分かけて10.2psiへ減圧。宇宙服を着たまま軽い運動を長めに行う」とあります。これはどの方式？"),
    options: PROTOCOLS,
    answer: 'isle',
    explanation: tr("ISLE（In-Suit Light Exercise）はエクササイズ方式と多くの手順を共有しつつ、マスクで40分の純酸素呼吸と20分の10.2psiへの減圧を経て、宇宙服内で軽い運動を長めに行います。"),
  },
  {
    id: 'exercise',
    situation: tr("14.7psiのまま純酸素を吸いながら、短時間の激しい運動で窒素の排出を早め、その後10.2psiで宇宙服内プレブリーズを行います。これはどの方式？"),
    options: PROTOCOLS,
    answer: 'exercise',
    explanation: tr("エクササイズ方式は14.7psiで純酸素を吸いながら短く激しい運動を行い、その後10.2psiでの宇宙服内プレブリーズと組み合わせます。"),
  },
  {
    id: 'planetary',
    situation: tr("月面での船外活動を計画しています。ISSの微小重力環境で使っているプレブリーズ手順は、そのまま月面でも有効でしょうか？"),
    options: [
      { id: 'as-is', label: tr("そのまま有効"), detail: tr("重力の有無は減圧症リスクに影響しない") },
      { id: 'not-effective', label: tr("そのままでは有効でない"), detail: tr("歩行や下半身の活動で減圧症リスクが大きく上がる") },
      { id: 'shorter', label: tr("短縮してよい"), detail: tr("月面では宇宙服の圧力が高くなるため") },
      { id: 'no-need', label: tr("不要"), detail: tr("月面では減圧症は起きない") },
    ],
    answer: 'not-effective',
    explanation: tr("減圧症のリスクは歩行や身体活動で大きく高まるため、ISSの微小重力用プレブリーズ手順は惑星表面での船外活動には有効ではないとNASAの技術資料は指摘しています。"),
  },
]

export const PREBREATHE_ROUNDS = 4
export const PREBREATHE_POINTS = 100

export function pickScenarios(random = Math.random): PrebreatheScenario[] {
  const pool = [...SCENARIOS]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, PREBREATHE_ROUNDS)
}

export function prebreatheScore(firstTryCorrect: number, secondTryCorrect: number): number {
  return firstTryCorrect * PREBREATHE_POINTS + secondTryCorrect * 40
}
