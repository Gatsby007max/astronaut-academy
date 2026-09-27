import { describe, expect, it } from 'vitest'
import { BoxGeometry, Group, Mesh, MeshBasicMaterial, Vector3 } from 'three'
import { buildStationGeometry, stationCategory } from './stationGeometry'

describe('ISS drawing', () => {
  it('separates solar wings and radiators from the parent truss', () => {
    expect(stationCategory('23 S4 Truss_01')).toBe(0)
    expect(stationCategory('32 S6 Truss_02')).toBe(0)
    expect(stationCategory('16 S1 Truss_02')).toBe(3)
    expect(stationCategory('16 S1 Truss')).toBe(2)
    expect(stationCategory('26 Harmony Node 2')).toBe(1)
    expect(stationCategory('11 Canadarm2_08')).toBe(4)
  })
  it('keeps the exact point budget, NASA local positions, and source geometry intact across a rotated parent', () => {
    const holder = new Group(), parent = new Group()
    parent.position.set(4, 2, -3); parent.rotation.y = .4; parent.add(holder)
    const solar = new Mesh(new BoxGeometry(2, .03, .8), new MeshBasicMaterial())
    solar.userData.part = '23 S4 Truss 01'; solar.position.x = 1
    const module = new Mesh(new BoxGeometry(.3, .3, .8).toNonIndexed(), new MeshBasicMaterial())
    module.userData.part = '09 Destiny Space Laboratory'; module.position.x = -.5
    holder.add(solar, module); parent.updateMatrixWorld(true)
    const original = Array.from(solar.geometry.getAttribute('position').array)
    const result = buildStationGeometry([solar, module], 2400, holder.matrixWorld.clone().invert())
    expect(result.count).toBe(2400)
    expect(result.categoryCounts.reduce((s, n) => s + n, 0)).toBe(2400)
    // Thin solar blankets must never become solid occluders.
    expect(result.depthGeometry.index?.count).toBe(36)
    const position = result.geometry.getAttribute('position'), data = result.geometry.getAttribute('stationData')
    const point = new Vector3()
    let edges = 0
    for (let i = 0; i < position.count; i++) {
      point.fromBufferAttribute(position, i)
      expect(Number.isFinite(point.length())).toBe(true)
      expect(point.x).toBeGreaterThanOrEqual(-.651)
      expect(point.x).toBeLessThanOrEqual(2.001)
      expect(Math.abs(point.y)).toBeLessThanOrEqual(.151)
      edges += data.getY(i)
    }
    expect(edges).toBeGreaterThan(450)
    expect(Array.from(solar.geometry.getAttribute('position').array)).toEqual(original)
    result.dispose(); solar.geometry.dispose(); module.geometry.dispose()
    solar.material.dispose(); module.material.dispose()
  })
})
