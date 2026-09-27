import { AnimatePresence, motion } from 'motion/react'
import { useUi } from './uiStore'

export function Captions() {
  const caption = useUi((s) => s.caption)
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[14vh] z-30 flex justify-center px-6">
      <AnimatePresence mode="wait">
        {caption && (
          <motion.div
            key={caption.title}
            initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, filter: 'blur(6px)' }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="text-center"
          >
            <div className="text-2xl font-light tracking-wide text-white text-glow md:text-4xl">{caption.title}</div>
            {caption.subtitle && <div className="mt-2 font-mono text-xs tracking-[0.5em] text-hud/80">{caption.subtitle}</div>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
