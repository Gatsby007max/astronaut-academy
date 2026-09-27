import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { ModuleId } from '../content/types'

export interface MiniGameProps {
  onFinish: (score: number) => void
  onExit: () => void
  color: string
}

const panels = import.meta.glob<{ default: ComponentType<MiniGameProps> }>('./panels/*.tsx')

const cache = new Map<ModuleId, LazyExoticComponent<ComponentType<MiniGameProps>>>()

export function miniGameFor(id: ModuleId): LazyExoticComponent<ComponentType<MiniGameProps>> | undefined {
  const load = panels[`./panels/${id}.tsx`]
  if (!load) return undefined
  let component = cache.get(id)
  if (!component) {
    component = lazy(load)
    cache.set(id, component)
  }
  return component
}
