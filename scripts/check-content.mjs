import fs from 'node:fs/promises'

const ids = ['orientation', 'iss', 'medicine', 'eva', 'robotics', 't38', 'emergency', 'lunar', 'mcc']
const jp = /[\u3040-\u30ff\u3400-\u9fff]/u
let lessons = 0
let quizzes = 0
function translatedContent(content, values) {
  const copy = structuredClone(content)
  for (const [path, value] of Object.entries(values)) {
    const segments = path.split('.')
    let target = copy
    for (const segment of segments.slice(0, -1)) {
      if (target == null || !(segment in target)) throw new Error(`Unknown translation path: ${path}`)
      target = target[segment]
    }
    const leaf = segments.at(-1)
    if (typeof target?.[leaf] !== 'string' || !jp.test(target[leaf])) throw new Error(`Translation has no Japanese source: ${path}`)
    target[leaf] = value
  }
  return copy
}
function assertNoJapanese(value, path) {
  if (typeof value === 'string') {
    if (jp.test(value)) throw new Error(`Untranslated content: ${path}`)
  } else if (Array.isArray(value)) {
    value.forEach((part, i) => assertNoJapanese(part, `${path}.${i}`))
  } else if (value && typeof value === 'object') {
    for (const [key, part] of Object.entries(value)) assertNoJapanese(part, `${path}.${key}`)
  }
}
for (const id of ids) {
  const content = (await import(`../src/content/modules/${id}.ts`)).default
  const translated = JSON.parse(await fs.readFile(`src/content/translations/en/${id}.json`, 'utf8'))
  if (content.id !== id || content.lessons.length !== 10 || content.quiz.length !== 16) throw new Error(`${id}: content count`)
  const sourceIds = new Set(content.sources.map((source) => source.id))
  for (const source of content.sources) if (!/^https:\/\//.test(source.url)) throw new Error(`${id}: source URL ${source.id}`)
  for (const lesson of content.lessons) {
    if (!lesson.sources.length || lesson.sources.some((ref) => !sourceIds.has(ref))) throw new Error(`${id}: lesson sources ${lesson.id}`)
  }
  for (const question of content.quiz) {
    if (question.answer < 0 || question.answer > 3 || question.choices.length !== 4 || !question.sources.length || question.sources.some((ref) => !sourceIds.has(ref))) throw new Error(`${id}: quiz ${question.id}`)
  }
  const translatedKeys = Object.keys(translated)
  if (!translatedKeys.length || translatedKeys.some((key) => !translated[key] || jp.test(translated[key]))) throw new Error(`${id}: incomplete English translation`)
  assertNoJapanese(translatedContent(content, translated), id)
  lessons += content.lessons.length
  quizzes += content.quiz.length
}
const uiStrings = JSON.parse(await fs.readFile('scripts/ui-strings-ja.json', 'utf8'))
const uiEnglish = JSON.parse(await fs.readFile('src/i18n/ui-en.json', 'utf8'))
for (const value of uiStrings) if (!uiEnglish[value] || jp.test(uiEnglish[value])) throw new Error(`Untranslated UI: ${value}`)
console.log(`Validated ${ids.length} modules, ${lessons} lessons, ${quizzes} quiz questions, ${uiStrings.length} UI strings`)
