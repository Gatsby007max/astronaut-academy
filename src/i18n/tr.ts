import english from './ui-en.json'

function currentLocale(): 'ja' | 'en' {
  try {
    const stored = JSON.parse(localStorage.getItem('astronaut-academy-v1') ?? '{}')
    return stored?.state?.settings?.locale === 'en' ? 'en' : 'ja'
  } catch { return 'ja' }
}

export const tr = (japanese: string): string => currentLocale() === 'en' ? (english as Record<string, string>)[japanese] ?? japanese : japanese

export function trt(parts: TemplateStringsArray, ...values: unknown[]): string {
  return parts.reduce((text, part, index) => {
    let translated = tr(part)
    const leading = part.match(/^\s+/)?.[0]
    const trailing = part.match(/\s+$/)?.[0]
    if (leading && !/^\s/.test(translated)) translated = leading + translated
    if (trailing && !/\s$/.test(translated)) translated += trailing
    return text + (index ? String(values[index - 1]) : '') + translated
  }, '')
}
