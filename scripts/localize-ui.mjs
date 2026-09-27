import fs from 'node:fs/promises'
import path from 'node:path'
const ts = (await import(process.env.TS_PARSER_PATH || 'typescript')).default
if (!ts.createSourceFile) throw new Error('Use TypeScript 5 compiler API via TS_PARSER_PATH')

const roots = ['src/App.tsx', 'src/TrainingApp.tsx', 'src/content/modules.ts', 'src/engine', 'src/game', 'src/minigames', 'src/scenes', 'src/screens', 'src/ui', 'src/world']
const jp = /[\u3040-\u30ff\u3400-\u9fff]/u
const files = []
async function visitRoot(p) {
  const stat = await fs.stat(p)
  if (stat.isDirectory()) {
    for (const name of await fs.readdir(p)) await visitRoot(path.join(p, name))
  } else if (/\.tsx?$/.test(p) && !/\.test\./.test(p)) files.push(p)
}
for (const root of roots) await visitRoot(root)

const strings = new Set()
const changes = new Map()
for (const file of files) {
  const source = await fs.readFile(file, 'utf8')
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith('tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  const edits = []
  let useTr = false
  let useTrt = false
  const walk = (node) => {
    if (ts.isJsxText(node)) {
      const value = node.getText(ast).trim()
      if (jp.test(value)) {
        strings.add(value)
        edits.push({ start: node.getStart(ast), end: node.getEnd(), value: `{tr(${JSON.stringify(value)})}` })
        useTr = true
      }
    } else if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      const value = node.text
      const parent = node.parent
      const skip = ts.isImportDeclaration(parent) || ts.isExportDeclaration(parent) || ts.isPropertyAssignment(parent) && parent.name === node || ts.isLiteralTypeNode(parent) || ts.isCaseClause(parent)
      if (jp.test(value) && !skip) {
        strings.add(value)
        edits.push({ start: node.getStart(ast), end: node.getEnd(), value: ts.isJsxAttribute(parent) ? `{tr(${JSON.stringify(value)})}` : `tr(${JSON.stringify(value)})` })
        useTr = true
      }
    } else if (ts.isTemplateExpression(node)) {
      const parts = [node.head, ...node.templateSpans.map((span) => span.literal)]
      if (parts.some((part) => jp.test(part.text))) {
        for (const part of parts) if (jp.test(part.text)) strings.add(part.text)
        edits.push({ start: node.getStart(ast), end: node.getStart(ast), value: 'trt' })
        useTrt = true
        // Dynamic expressions can themselves contain Japanese UI strings.
        ts.forEachChild(node, walk)
        return
      }
    }
    ts.forEachChild(node, walk)
  }
  walk(ast)
  if (edits.length) changes.set(file, { source, edits, useTr, useTrt })
}

if (process.argv.includes('--extract')) {
  await fs.writeFile('scripts/ui-strings-ja.json', `${JSON.stringify([...strings].sort(), null, 2)}\n`)
  console.log(`${strings.size} unique Japanese UI strings in ${changes.size} files`)
} else if (process.argv.includes('--apply')) {
  for (const [file, { source, edits, useTr, useTrt }] of changes) {
    let output = source
    for (const edit of edits.sort((a, b) => b.start - a.start)) output = output.slice(0, edit.start) + edit.value + output.slice(edit.end)
    const relative = path.relative(path.dirname(file), 'src/i18n/tr').replaceAll(path.sep, '/')
    const importPath = relative.startsWith('.') ? relative : `./${relative}`
    output = `import { ${[useTr && 'tr', useTrt && 'trt'].filter(Boolean).join(', ')} } from '${importPath}'\n` + output
    await fs.writeFile(file, output)
  }
  console.log(`localized ${changes.size} files`)
} else {
  console.error('Use --extract or --apply')
  process.exitCode = 1
}
