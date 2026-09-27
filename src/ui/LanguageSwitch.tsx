import { tr } from '../i18n/tr'
import { useGame } from '../game/store'

export function LanguageSwitch() {
  const locale = useGame((s) => s.settings.locale)
  const update = useGame((s) => s.updateSettings)
  const choose = (next: 'ja' | 'en') => {
    if (next === locale) return
    update({ locale: next })
    window.location.reload()
  }
  return (
    <div className="glass pointer-events-auto flex shrink-0 rounded-md p-1 text-xs" role="group" aria-label={tr("Language / 言語")}>
      <button type="button" lang="ja" aria-pressed={locale === 'ja'} onClick={() => choose('ja')} className={`rounded px-2 py-1 ${locale === 'ja' ? 'bg-hud/20 text-white' : 'text-white/55'}`}>{tr("日本語")}</button>
      <button type="button" lang="en" aria-pressed={locale === 'en'} onClick={() => choose('en')} className={`rounded px-2 py-1 ${locale === 'en' ? 'bg-hud/20 text-white' : 'text-white/55'}`}>EN</button>
    </div>
  )
}
