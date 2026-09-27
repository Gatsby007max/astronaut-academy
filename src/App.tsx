import { tr } from './i18n/tr'
import { lazy, Suspense, useEffect } from 'react'
import { audio } from './engine/audio'
import { useGame } from './game/store'
import { TitleScreen } from './screens/TitleScreen'
import { ErrorBoundary } from './ui/ErrorBoundary'
const TrainingApp = lazy(() => import('./TrainingApp'))
export default function App() {
 const screen = useGame(s => s.screen.name)
 const audioOn = useGame(s => s.settings.audio)
 const volume = useGame(s => s.settings.volume)
 const locale = useGame(s => s.settings.locale)
 useEffect(() => { document.documentElement.lang = locale }, [locale])
 useEffect(() => audio.configure(audioOn, volume), [audioOn, volume])
 useEffect(() => {
  const unlock = () => audio.unlock()
  window.addEventListener('pointerdown', unlock, {once:true})
  window.addEventListener('keydown', unlock, {once:true})
  return () => {window.removeEventListener('pointerdown',unlock);window.removeEventListener('keydown',unlock)}
 }, [])
 return screen === 'title' ? <TitleScreen /> : <ErrorBoundary resetKey={screen} fallback={()=><div className="fixed inset-0 grid place-items-center text-center p-8"><div><h1>{tr("訓練画面を読み込めませんでした")}</h1><p className="my-4">{tr("WebGL 2 対応のブラウザで、再読み込みをお試しください。")}</p><button onClick={()=>useGame.getState().go({name:'title'})}>{tr("タイトルへ戻る")}</button></div></div>}><Suspense fallback={<div className="fixed inset-0 grid place-items-center bg-[#02040a]"><div className="font-mono tracking-widest text-hud animate-pulse">INITIALIZING TRAINING SYSTEMS…</div></div>}><TrainingApp /></Suspense></ErrorBoundary>
}
