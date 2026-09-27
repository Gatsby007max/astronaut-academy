import { describe, expect, it } from 'vitest'
import { BoxGeometry, Matrix4, Mesh, MeshBasicMaterial, PlaneGeometry, SphereGeometry, Vector3 } from 'three'
import { buildContourGeometry } from './contours'

function source(geometry: BoxGeometry | PlaneGeometry | SphereGeometry, extra = {}) {
  return { mesh: new Mesh(geometry, new MeshBasicMaterial()), matrix: new Matrix4(), radius: 1, importance: 1, planet: false, ...extra }
}

describe('model contour geometry', () => {
  it('retains the panel perimeter without adding triangulation diagonals', () => {
    const panel = source(new PlaneGeometry(2, 2, 2, 2))
    const geometry = buildContourGeometry([panel], 100)
    const position = geometry.getAttribute('position')
    let perimeter = 0
    for (let i = 0; i < position.count; i += 2) {
      const a = new Vector3().fromBufferAttribute(position, i)
      const b = new Vector3().fromBufferAttribute(position, i + 1)
      const onBoundary = (a.x === b.x && Math.abs(a.x) === 1) || (a.y === b.y && Math.abs(a.y) === 1)
      expect(onBoundary).toBe(true)
      perimeter += a.distanceTo(b)
    }
    expect(perimeter).toBe(8)
    geometry.dispose()
  })

  it('preserves source IDs and local coordinates while enforcing the frame budget', () => {
    const objects = [
      source(new SphereGeometry(), { planet: true }),
      source(new BoxGeometry(), { matrix: new Matrix4().makeTranslation(10, 20, 30) }),
      source(new BoxGeometry(), { importance: .025 }),
    ]
    const geometry = buildContourGeometry(objects, 5)
    expect(geometry.getAttribute('position').count).toBe(10)
    expect([...geometry.getAttribute('objectId').array]).toEqual(Array(10).fill(1))
    const position = geometry.getAttribute('position')
    for (let i = 0; i < position.count; i++) {
      expect(Math.max(Math.abs(position.getX(i)), Math.abs(position.getY(i)), Math.abs(position.getZ(i)))).toBe(.5)
    }
    geometry.dispose()
  })
})
