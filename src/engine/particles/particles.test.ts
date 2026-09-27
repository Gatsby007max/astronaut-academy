import { describe, expect, it } from 'vitest'
import { BoxGeometry, BufferGeometry, Float32BufferAttribute, Group, InstancedMesh, Matrix4, Mesh, MeshBasicMaterial, Vector3 } from 'three'
import { buildCloud } from './buildCloud'
import { allocateParticles, chooseTriangle, examParticles, FLOW_FRACTION, randomSequence, surfaceTable } from './surface'

describe('particle sampling and exam mode', () => {
  it('weights real transformed surface area instead of triangle or vertex counts', () => {
    const geometry = new BufferGeometry().setAttribute('position', new Float32BufferAttribute([
      0,0,0, 1,0,0, 0,1,0,
      0,0,0, 1,0,0, 0,0,1,
      0,0,0, 0,0,0, 0,0,0,
    ],3))
    const table = surfaceTable(geometry,new Matrix4().makeScale(2,3,1))
    expect(table.area).toBe(4)
    expect(chooseTriangle(table,.74)).toBe(0)
    expect(chooseTriangle(table,.76)).toBe(3)
    expect(table.triangles).toHaveLength(2)
  })

  it('stays within the total budget even with thousands of small parts', () => {
    const allocation = allocateParticles(Array.from({length:2000},(_,i)=>i%9),70000)
    expect(allocation.reduce((a,b)=>a+b,0)).toBe(70000)
    expect(allocation.every(n=>Number.isInteger(n)&&n>=0)).toBe(true)
    expect(allocateParticles([0,0],20)).toEqual([0,0])
  })

  it('keeps a deterministic nested subset and densifies both types of assessment', () => {
    const a = randomSequence(42), b = randomSequence(42)
    const seeds = Array.from({length:10000},()=>a())
    expect(seeds).toEqual(Array.from({length:10000},()=>b()))
    const flow = seeds.filter(seed=>(seed*73.173)%1<FLOW_FRACTION).length
    expect(flow).toBeGreaterThan(3600)
    expect(flow).toBeLessThan(4000)
    expect(examParticles({name:'module',phase:'quiz'})).toBe(true)
    expect(examParticles({name:'module',phase:'mini'})).toBe(true)
    expect(examParticles({name:'module',phase:'brief'})).toBe(false)
    expect(examParticles({name:'hub'})).toBe(false)
  })

  it('samples the source surfaces, preserves interaction objects, and restores materials', () => {
    const root = new Group(), mesh = new Mesh(new BoxGeometry(2,2,2),new MeshBasicMaterial())
    root.add(mesh)
    const cloud = buildCloud(root,1000)
    const positions = cloud.points.geometry.getAttribute('position')
    for(let i=0;i<positions.count;i++) {
      const p = new Vector3().fromBufferAttribute(positions,i)
      expect(Math.max(Math.abs(p.x),Math.abs(p.y),Math.abs(p.z))).toBeCloseTo(1,5)
    }
    expect(mesh.visible).toBe(true)
    expect(mesh.material.visible).toBe(false)
    expect(root.children).toContain(mesh)
    cloud.dispose()
    expect(mesh.material.visible).toBe(true)
  })

  it('tracks separate animated instance transforms without duplicating scene models', () => {
    const root = new Group(), mesh = new InstancedMesh(new BoxGeometry(),new MeshBasicMaterial(),2)
    mesh.setMatrixAt(0,new Matrix4().makeTranslation(-2,0,0))
    mesh.setMatrixAt(1,new Matrix4().makeTranslation(2,0,0))
    root.add(mesh)
    const cloud = buildCloud(root,500)
    expect(cloud.sources).toHaveLength(2)
    expect(cloud.sources.map(s=>s.matrix.elements[12])).toEqual([-2,2])
    expect(cloud.points.geometry.getAttribute('objectId').count).toBe(500)
    expect(cloud.contours.geometry.getAttribute('position').count).toBe(48)
    expect(new Set(cloud.contours.geometry.getAttribute('objectId').array)).toEqual(new Set([0,1]))
    expect(cloud.contours.material.uniforms).toBe(cloud.material.uniforms)
    cloud.dispose()
  })
})
