import { tr } from '../i18n/tr'
export function Disclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <p className={`pointer-events-auto text-white/40 ${compact ? 'text-[10px]' : 'text-[11px]'} leading-relaxed`}>
      {tr("本作はNASAの公開資料・画像・3Dモデル・データをもとに制作した非公式の学習コンテンツです。NASAが制作・推奨・提携しているものではありません。\n      画像・データの出典: NASA（各レッスンと「出典とクレジット」に記載）。")}</p>
  )
}
