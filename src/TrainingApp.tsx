import { tr } from './i18n/tr'
import { Suspense } from 'react'
import { Stage } from './engine/Stage'
import { useGame } from './game/store'
import { CreditsScreen } from './screens/CreditsScreen'
import { GraduationScreen } from './screens/GraduationScreen'
import { HubScreen } from './screens/HubScreen'
import { IntroScreen } from './screens/IntroScreen'
import { ModuleScreen } from './screens/module/ModuleScreen'
import { ReviewScreen } from './screens/ReviewScreen'
import { Captions } from './ui/Captions'
import { LoadingOverlay } from './ui/LoadingOverlay'
import { Toasts } from './ui/Toasts'
import { TopBar } from './ui/TopBar'

function ScreenRouter() {
  const screen = useGame((s) => s.screen)
  switch (screen.name) {
    case 'title':
      return null
    case 'intro':
      return <IntroScreen />
    case 'hub':
      return <HubScreen />
    case 'module':
      return <ModuleScreen key={screen.id} id={screen.id} phase={screen.phase} />
    case 'review':
      return <ReviewScreen />
    case 'credits':
      return <CreditsScreen />
    case 'graduation':
      return <GraduationScreen />
  }
}

export default function TrainingApp() {
 const screen = useGame(s => s.screen.name)
 const showTopBar = screen !== 'intro' && screen !== 'graduation'
 return <><Stage /><div className="training-ui pointer-events-none fixed inset-0 z-10"><Suspense fallback={<div className="fixed inset-0 grid place-items-center">{tr("訓練データを読み込み中…")}</div>}><ScreenRouter /></Suspense></div>{showTopBar && <TopBar />}<Captions /><Toasts /><LoadingOverlay /></>
}
