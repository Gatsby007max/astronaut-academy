import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises'
import { SOURCES } from './asset-sources.mjs'

const urls = new Set(SOURCES.map(source => source.page))
async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = `${directory}/${entry.name}`
    if (entry.isDirectory()) await collect(path)
    else if (/\.tsx?$/.test(entry.name) && !entry.name.includes('.test.')) {
      const source = await readFile(path, 'utf8')
      for (const match of source.matchAll(/https:\/\/[^\s'"<>`]+/g)) {
        const url = match[0]
        if (new URL(url).hostname.endsWith('nasa.gov')) urls.add(url)
      }
    }
  }
}
await collect('src/content/modules')
await collect('src/minigames')
const results = []
const queue = [...urls]
await Promise.all(Array.from({ length: 5 }, async () => {
  while (queue.length) {
    const url = queue.shift()
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(25000) })
      let title = ''
      if (response.headers.get('content-type')?.includes('text/html')) {
        const body = await response.text()
        title = body.match(/<title>(.*?)<\/title>/s)?.[1]?.trim() ?? ''
      } else await response.body?.cancel()
      results.push({ url, status: response.status, finalUrl: response.url, title })
    } catch (error) {
      results.push({ url, status: 0, error: error.message })
    }
  }
}))
results.sort((a, b) => a.url.localeCompare(b.url))
await mkdir('output', { recursive: true })
await writeFile('output/source-audit.json', JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2))
const failed = results.filter(result => result.status !== 200)
console.log(JSON.stringify({ total: results.length, failed }, null, 2))
if (failed.length) process.exitCode = 1
