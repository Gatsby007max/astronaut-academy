import fs from 'node:fs/promises'
import path from 'node:path'

// One-time authoring helper. The game ships the reviewed JSON, never a model call.
const ids = ['orientation', 'iss', 'medicine', 'eva', 'robotics', 't38', 'emergency', 'lunar', 'mcc']
const dir = path.resolve('src/content/translations/en')
await fs.mkdir(dir, { recursive: true })

function entries(content) {
  const out = {}
  const put = (key, value) => {
    if (typeof value === 'string' && /[\u3040-\u30ff\u3400-\u9fff]/u.test(value)) out[key] = value
  }
  put('intro', content.intro)
  content.lessons.forEach((lesson, i) => {
    for (const key of ['title', 'kicker', 'summary']) put(`lessons.${i}.${key}`, lesson[key])
    lesson.body.forEach((value, j) => put(`lessons.${i}.body.${j}`, value))
    lesson.facts?.forEach((fact, j) => {
      put(`lessons.${i}.facts.${j}.label`, fact.label)
      put(`lessons.${i}.facts.${j}.value`, fact.value)
    })
    if (lesson.deepDive) {
      put(`lessons.${i}.deepDive.title`, lesson.deepDive.title)
      lesson.deepDive.body.forEach((value, j) => put(`lessons.${i}.deepDive.body.${j}`, value))
    }
  })
  content.quiz.forEach((question, i) => {
    put(`quiz.${i}.prompt`, question.prompt)
    question.choices.forEach((value, j) => put(`quiz.${i}.choices.${j}`, value))
    put(`quiz.${i}.explanation`, question.explanation)
  })
  content.glossary.forEach((term, i) => {
    put(`glossary.${i}.term`, term.term)
    put(`glossary.${i}.description`, term.description)
  })
  content.sources.forEach((source, i) => {
    put(`sources.${i}.title`, source.title)
    put(`sources.${i}.publisher`, source.publisher)
  })
  return out
}

async function translate(batch) {
  const prompt = `/no_think\nTranslate these Japanese strings into accurate, natural English for a free educational spaceflight game. Return ONLY a JSON object with the exact same keys and English string values. Preserve meaning, scientific qualifications, numbers, citations, NASA program names, and cautious language. Do not add unsupported claims. Keep each key separate. Input:\n${JSON.stringify(batch)}`
  const response = await fetch('http://127.0.0.1:11434/api/generate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model: process.env.TRANSLATION_MODEL || 'qwen3.8:27b-mlx', prompt, stream: false, think: false, format: 'json', options: { temperature: 0, num_predict: 8000 } }),
  })
  if (!response.ok) throw new Error(`Ollama ${response.status}: ${await response.text()}`)
  const payload = await response.json()
  let result
  try { result = JSON.parse(payload.response) }
  catch (error) { console.error('Model output:', payload.response.slice(0, 200), '…', payload.response.slice(-200)); throw error }
  for (const key of Object.keys(batch)) {
    if (typeof result[key] !== 'string' || !result[key].trim() || /[\u3040-\u30ff\u3400-\u9fff]/u.test(result[key])) {
      throw new Error(`Incomplete translation: ${key}`)
    }
  }
  return Object.fromEntries(Object.keys(batch).map((key) => [key, result[key]]))
}

for (const id of ids) {
  const content = (await import(`../src/content/modules/${id}.ts`)).default
  const all = entries(content)
  const file = path.join(dir, `${id}.json`)
  let done = {}
  try { done = JSON.parse(await fs.readFile(file, 'utf8')) } catch { /* first run */ }
  const pending = Object.entries(all).filter(([key]) => !(key in done))
  let batch = {}
  let size = 0
  const flush = async () => {
    if (!Object.keys(batch).length) return
    let lastError
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        done = { ...done, ...await translate(batch) }
        await fs.writeFile(file, `${JSON.stringify(done, null, 2)}\n`)
        console.log(`${id}: ${Object.keys(done).length}/${Object.keys(all).length}`)
        batch = {}
        size = 0
        return
      } catch (error) { lastError = error; console.error(`${id}: retry ${attempt + 1}: ${error.message}`) }
    }
    throw lastError
  }
  for (const [key, value] of pending) {
    if (size + value.length > 1700 && size > 0) await flush()
    batch[key] = value
    size += value.length
  }
  await flush()
}
