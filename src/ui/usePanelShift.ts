import { useEffect } from 'react'
import { useUi } from './uiStore'

export type PanelSide = 'right' | 'left' | 'none'

export function usePanelShift(side: PanelSide, amount = 0.17, reservedWidth?: number, portraitShift = .2) {
  useEffect(() => {
    const apply = () => {
      const narrow = window.innerWidth < 900
      const { setViewShift } = useUi.getState()
      if (side === 'none') return setViewShift(0, 0)
      if (narrow) return setViewShift(0, portraitShift)
      const shift = reservedWidth ? reservedWidth / (2 * window.innerWidth) : amount
      setViewShift(side === 'right' ? shift : -shift, 0)
    }
    apply()
    window.addEventListener('resize', apply)
    return () => {
      window.removeEventListener('resize', apply)
      useUi.getState().setViewShift(0, 0)
    }
  }, [side, amount, reservedWidth, portraitShift])
}
