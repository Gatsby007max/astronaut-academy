import { tr } from '../i18n/tr'
import type { Mesh, Vector3 } from 'three'

export const ISS_SIZE = 2.4

export const ISS_PARTS = {
  zarya: { match: /^01 Zarya/, label: tr("ザーリャ"), en: 'Zarya (FGB)' },
  unity: { match: /^02 Unity/, label: tr("ユニティ（ノード1）"), en: 'Unity Node 1' },
  zvezda: { match: /^05 Zvezda/, label: tr("ズヴェズダ"), en: 'Zvezda Service Module' },
  destiny: { match: /^09 Destiny/, label: tr("デスティニー"), en: 'Destiny Laboratory' },
  quest: { match: /^12 Quest/, label: tr("クエスト・エアロック"), en: 'Quest Joint Airlock' },
  harmony: { match: /^26 Harmony/, label: tr("ハーモニー（ノード2）"), en: 'Harmony Node 2' },
  tranquility: { match: /^37 Tranquility/, label: tr("トランクウィリティー（ノード3）"), en: 'Tranquility Node 3' },
  columbus: { match: /^27 Columbus/, label: tr("コロンバス"), en: 'Columbus Laboratory' },
  kibo: { match: /^(30|28|33) Kibo/, label: tr("きぼう"), en: 'Kibo (JEM)' },
  cupola: { match: /^38 Cupola/, label: tr("キューポラ"), en: 'Cupola' },
  pmm: { match: /^40 Leonardo/, label: tr("PMM（レオナルド）"), en: 'Permanent Multipurpose Module' },
  truss: { match: /^(06 Z1|08 P6|14 S0|16 S1|17 P1|19 P3|20 P4|21 P5|22 S3|23 S4|24 S5|32 S6) Truss$/, label: tr("統合トラス"), en: 'Integrated Truss' },
  solar: { match: /^(?:(08 P6|20 P4|23 S4|32 S6) Truss (01|02)|panel 0\d [ps](?:\.001)?)$/, label: tr("太陽電池翼"), en: 'Solar Array Wings' },
  radiators: { match: /^(16 S1|17 P1) Truss 02$/, label: tr("放熱ラジエーター"), en: 'Radiators (S1/P1)' },
  canadarm2: { match: /^11 Canadarm2/, label: tr("カナダアーム2"), en: 'Canadarm2 (SSRMS)' },
  dextre: { match: /^29 DEXTRE/, label: tr("デクスター"), en: 'Dextre (SPDM)' },
  mbs: { match: /^15 \(MBS\)/, label: tr("モービルベース"), en: 'Mobile Base System' },
} as const

// GLTFLoader replaces spaces with underscores. Preserve the numeric suffixes
// that distinguish wings/radiators from their parent trusses in NASA's asset.
export function normalizeIssName(name: string) { return name.replaceAll('_', ' ') }

export const ISS_MODEL_SOURCE = 'https://science.nasa.gov/resource/international-space-station-3d-model/'
export const ISS_MODEL_NOTE = tr("NASA VTADの公開3Dモデルを点群化した旧構成の学習模型です。Pirsを含み、2021年以降のNauka・Prichal・増設太陽電池iROSAは反映していません。現在のISSを完全再現したものではありません。")

export type IssPartKey = keyof typeof ISS_PARTS

export interface IssPart {
  key: IssPartKey
  center: Vector3
  radius: number
  meshes: Mesh[]
}
