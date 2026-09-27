import { motion } from 'motion/react'
import { useEffect } from 'react'
import { useGame } from '../game/store'
import { HudButton } from '../ui/kit'
import { useUi } from '../ui/uiStore'

export function IntroScreen() {
  const finishIntro = useGame((s) => s.finishIntro)
  useEffect(() => () => useUi.getState().setCaption(undefined), [])
  return (
    <div className="pointer-events-none fixed inset-0">
      <motion.div className="absolute inset-x-0 top-0 bg-black" initial={{ height: 0 }} animate={{ height: '9vh' }} transition={{ duration: 1.2, ease: 'easeOut' }} />
      <motion.div className="absolute inset-x-0 bottom-0 bg-black" initial={{ height: 0 }} animate={{ height: '9vh' }} transition={{ duration: 1.2, ease: 'easeOut' }} />
      <div className="absolute bottom-[2.5vh] right-6">
        <HudButton variant="subtle" sound="back" onClick={finishIntro} className="font-mono text-xs tracking-widest">
          SKIP ▸
        </HudButton>
      </div>
    </div>
  )
}
