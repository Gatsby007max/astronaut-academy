import type { Locale, ModuleContent, ModuleId } from './types'

const files = import.meta.glob<{ default: ModuleContent }>('./modules/*.ts')
const english = import.meta.glob<{ default: Record<string, string> }>('./translations/en/*.json')

const cache = new Map<string, Promise<ModuleContent>>()

function applyTranslation(content: ModuleContent, values: Record<string, string>): ModuleContent {
  const copy = structuredClone(content)
  for (const [path, value] of Object.entries(values)) {
    const segments = path.split('.')
    let target: Record<string, unknown> | unknown[] = copy as unknown as Record<string, unknown>
    for (const segment of segments.slice(0, -1)) {
      target = (target as Record<string, unknown>)[segment] as Record<string, unknown>
    }
    ;(target as Record<string, unknown>)[segments.at(-1)!] = value
  }
  return copy
}

export function loadModuleContent(id: ModuleId, locale: Locale = 'ja'): Promise<ModuleContent> {
  const key = `${locale}:${id}`
  let pending = cache.get(key)
  if (!pending) {
    const load = files[`./modules/${id}.ts`]
    pending = load ? load().then(async (module) => {
      if (locale === 'ja') return module.default
      const translate = english[`./translations/en/${id}.json`]
      if (!translate) throw new Error(`English content for ${id} is missing`)
      return applyTranslation(module.default, (await translate()).default)
    }) : Promise.reject(new Error(`content for ${id} is missing`))
    cache.set(key, pending)
  }
  return pending
}
