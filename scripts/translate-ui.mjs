import fs from 'node:fs/promises'

const strings = JSON.parse(await fs.readFile('scripts/ui-strings-ja.json', 'utf8'))
const file = 'src/i18n/ui-en.json'
const translated = JSON.parse(await fs.readFile(file, 'utf8'))
const japanese = /[\u3040-\u30ff\u3400-\u9fff]/u

async function translate(values) {
  const indexed = Object.fromEntries(values.map((value, index) => [String(index), value]))
  const prompt = `/no_think\nTranslate every Japanese UI phrase to natural concise English for an independent educational spaceflight game. Some are fragments of dynamic messages. Return ONLY a JSON object with exactly the numeric keys and translated English string values. Preserve NASA names, numbers and factual qualifications. Input:\n${JSON.stringify(indexed)}`
  const response = await fetch('http://127.0.0.1:11434/api/generate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model: process.env.TRANSLATION_MODEL || 'qwen3.8:27b-mlx', prompt, stream: false, think: false, format: 'json', options: { temperature: 0, num_predict: 8000 } }),
  })
  if (!response.ok) throw new Error(`Ollama ${response.status}`)
  const payload = await response.json()
  let result
  try { result = JSON.parse(payload.response) }
  catch (error) { console.error('Model output:', payload.response.slice(0, 200), '…', payload.response.slice(-200)); throw error }
  for (const [key, value] of Object.entries(indexed)) {
    if (typeof result[key] !== 'string' || !result[key].trim() || japanese.test(result[key])) throw new Error(`Incomplete UI translation: ${value}`)
  }
  return Object.fromEntries(Object.entries(indexed).map(([key, value]) => [value, result[key]]))
}

let batch = []
let size = 0
async function flush() {
  if (!batch.length) return
  let error
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      Object.assign(translated, await translate(batch))
      await fs.writeFile(file, `${JSON.stringify(translated, null, 2)}\n`)
      console.log(`UI: ${Object.keys(translated).length}/${strings.length}`)
      batch = []
      size = 0
      return
    } catch (e) { error = e; console.error(`UI retry ${attempt + 1}: ${e.message}`) }
  }
  throw error
}
for (const value of strings) {
  if (value in translated) continue
  if (size + value.length > 1700 && size) await flush()
  batch.push(value)
  size += value.length
}
await flush()
