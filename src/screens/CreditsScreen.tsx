import { tr } from '../i18n/tr'
import { Suspense, use, useState } from 'react'
import { loadModuleContent } from '../content/loader'
import { MODULES } from '../content/modules'
import type { ModuleContent } from '../content/types'
import { ASSET_SOURCES } from '../engine/assets'
import { useGame } from '../game/store'
import { Disclaimer } from '../ui/Disclaimer'
import { HudButton, Label, Panel } from '../ui/kit'
import { usePanelShift } from '../ui/usePanelShift'
import { SourceList } from './module/SourceList'
import { ISS_MODEL_NOTE, ISS_MODEL_SOURCE } from '../world/issParts'
import { communityLinks } from '../community/links'
import { SupportDialog } from '../ui/SupportDialog'

let sourceBundle: Promise<(ModuleContent | null)[]> | undefined
function ModuleSources() {
  const loading = sourceBundle ??= Promise.all(MODULES.map((m) => loadModuleContent(m.id).catch(() => null)))
  const contents = use(loading)
  return (
    <div className="space-y-5">
      {MODULES.map((m, i) => {
        const c = contents[i] as ModuleContent | null
        if (!c) return null
        return (
          <section key={m.id}>
            <div className="mb-1 text-sm font-semibold" style={{ color: m.color }}>
              {String(m.index).padStart(2, '0')} {m.title}
            </div>
            <SourceList sources={c.sources} />
          </section>
        )
      })}
    </div>
  )
}

export function CreditsScreen() {
  const introSeen = useGame((s) => s.introSeen)
  const go = useGame((s) => s.go)
  const [support, setSupport] = useState(false)
  usePanelShift('right')
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 flex h-[76vh] justify-end p-3 md:inset-y-0 md:h-auto md:p-4 md:pt-24">
      <Panel className="flex w-full flex-col md:w-[600px]">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <div>
            <Label>SOURCES & CREDITS</Label>
            <div className="text-base font-semibold">{tr("出典とクレジット")}</div>
          </div>
          <HudButton sound="back" onClick={() => go(introSeen ? { name: 'hub' } : { name: 'title' })}>
            {tr("戻る")}</HudButton>
        </div>
        <div className="scroll-thin flex-1 space-y-6 overflow-y-auto px-5 py-4">
          <Disclaimer />
          <section className="rounded-lg border border-hud/20 bg-hud/5 p-4 text-xs leading-6 text-white/70">
            <Label className="mb-2">{tr("ISSモデルの正確性")}</Label>
            <p>{ISS_MODEL_NOTE}</p>
            <p className="mt-2">{tr("NASAのモデルに含まれる主要区画・トラス・8枚の主太陽電池翼・S1/P1放熱器の配置を利用しています。軽量化と点群化により細部は省略しています。")}</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-hud">
              <a href={ISS_MODEL_SOURCE} target="_blank" rel="noreferrer">{tr("NASA VTAD 3Dモデル ↗")}</a>
              <a href="https://www.nasa.gov/blogs/spacestation/2021/11/26/russias-new-docking-module-arrives-at-station/" target="_blank" rel="noreferrer">{tr("Nauka・Prichalの追加 ↗")}</a>
              <a href="https://www.nasa.gov/missions/station/new-solar-arrays-to-power-nasas-international-space-station-research/" target="_blank" rel="noreferrer">{tr("iROSAの追加 ↗")}</a>
            </div>
          </section>
          <section>
            <Label className="mb-2">{tr("3Dモデル・テクスチャ・データ")}</Label>
            <ul className="space-y-2 text-xs leading-5">
              {ASSET_SOURCES.map((s) => (
                <li key={s.id}>
                  <a href={s.page} target="_blank" rel="noreferrer" className="pointer-events-auto text-hud hover:underline">
                    {s.title}
                  </a>
                  <div className="text-white/45">{s.credit}</div>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-white/45">
              {tr("タイトル写真はNASA Image and Video Library（images.nasa.gov）に出典を示しています。講義ではNASAの画像検索結果を埋め込まず、アーカイブへのリンクを案内します。3Dモデルとテクスチャは軽量化のため圧縮・縮小・再投影しています。")}</p>
          </section>
          <section>
            <Label className="mb-2">{tr("学習コンテンツの出典")}</Label>
            <Suspense fallback={<div className="text-xs text-white/40">{tr("読み込み中…")}</div>}>
              <ModuleSources />
            </Suspense>
          </section>
          <section className="text-xs leading-5 text-white/45">
            <Label className="mb-2">{tr("利用ガイドライン")}</Label>
            {tr("NASAの画像・メディアは")}<a href="https://www.nasa.gov/nasa-brand-center/images-and-media/" target="_blank" rel="noreferrer" className="pointer-events-auto text-hud hover:underline">
              NASA Images and Media Guidelines
            </a>
            {tr("に従って教育・情報目的で使用しています。NASAのロゴ・記章・紋章は使用していません。")}</section>
          {communityLinks.support && <section className="rounded-lg border border-white/15 bg-[#030812] p-4 text-xs leading-6 text-white/70">
            <Label className="mb-2">GATSBYZERO / CREATOR SUPPORT</Label>
            <p>{tr("GatsbyZero個人の創作活動への支援は任意です。このゲームと教材、参加権は無料で、支援の有無によって変わりません。NASAは支援募集を制作・承認・推奨していません。")}</p>
            <HudButton onClick={() => setSupport(true)} className="mt-3">{tr("Ko-fiでの任意支援について")}</HudButton>
          </section>}
        </div>
      </Panel>
      <SupportDialog open={support} onClose={() => setSupport(false)} />
    </div>
  )
}
