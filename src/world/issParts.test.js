import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'
import { ISS_PARTS, normalizeIssName } from './issParts'

const binary = readFileSync('public/assets/iss.glb')
const gltf = JSON.parse(binary.subarray(20,20+binary.readUInt32LE(12)).toString())
const names = gltf.nodes.flatMap(n=>n.name?[normalizeIssName(n.name)]:[])

it('locates all learning targets in the actual distributed NASA asset', () => {
  for(const [key,part] of Object.entries(ISS_PARTS)) expect(names.some(name=>part.match.test(name)),key).toBe(true)
})

it('identifies all eight main wings and excludes them from the structural trusses', () => {
  const wings = names.filter(name=>/^(08 P6|20 P4|23 S4|32 S6) Truss 0[12]$/.test(name))
  expect(wings).toHaveLength(8)
  for(const name of wings) {
    expect(ISS_PARTS.solar.match.test(name),name).toBe(true)
    expect(ISS_PARTS.truss.match.test(name),name).toBe(false)
  }
})

it('highlights the two radiator assemblies without selecting their parent trusses', () => {
  expect(names.filter(name=>ISS_PARTS.radiators.match.test(name))).toHaveLength(2)
  expect(ISS_PARTS.radiators.match.test('16 S1 Truss')).toBe(false)
  expect(ISS_PARTS.radiators.match.test('17 P1 Truss')).toBe(false)
})
