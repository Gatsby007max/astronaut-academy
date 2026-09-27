import { useGLTF } from '@react-three/drei'
import { useFrame, type ThreeElements } from '@react-three/fiber'
import { useMemo } from 'react'
import { Box3, Color, Mesh, MeshStandardMaterial, Object3D, Vector3, type Group } from 'three'
import { assetUrl } from '../engine/assets'
import { ISS_PARTS, ISS_SIZE, normalizeIssName, type IssPart, type IssPartKey } from './issParts'
import { StationCloud } from './station/StationCloud'

export type { IssPart, IssPartKey } from './issParts'

function namedAncestor(object: Object3D): string {
  let current: Object3D | null = object
  while (current) {
    const name = normalizeIssName(current.name)
    if (Object.values(ISS_PARTS).some(part => part.match.test(name))) return name
    current = current.parent
  }
  return ''
}

export function useIss(detail = false) {
  const gltf = useGLTF(assetUrl(detail ? 'issHd' : 'iss'))
  return useMemo(() => {
    const root = gltf.scene.clone(true) as Group
    const box = new Box3().setFromObject(root)
    const size = box.getSize(new Vector3())
    const scale = ISS_SIZE / Math.max(size.x, size.y, size.z)
    const center = box.getCenter(new Vector3())
    root.position.copy(center).multiplyScalar(-scale)
    root.scale.setScalar(scale)
    const holder = new Object3D() as Group
    holder.userData.particleImportance = 3
    holder.add(root)
    holder.updateMatrixWorld(true)

    const parts = {} as Record<IssPartKey, IssPart>
    const meshes: Mesh[] = []
    root.traverse((o) => {
      const mesh = o as Mesh
      if (!mesh.isMesh) return
      mesh.castShadow = true
      mesh.receiveShadow = true
      const source = mesh.material as MeshStandardMaterial
      const material = source.clone()
      // Original geometry remains available for picking. StationCloud owns all
      // visible rendering and a merged, colorless depth pass.
      material.visible = false
      material.envMapIntensity = 1.2
      mesh.userData.part = namedAncestor(mesh)
      if (ISS_PARTS.solar.match.test(mesh.userData.part)) {
        material.metalness = 0.6
        material.roughness = 0.55
        material.envMapIntensity = 0.65
        material.emissive = new Color('#0a1330')
        material.emissiveIntensity = 1
      }
      material.userData.baseEmissive = material.emissive.clone()
      material.userData.baseIntensity = material.emissiveIntensity
      mesh.material = material
      meshes.push(mesh)
    })

    for (const [key, def] of Object.entries(ISS_PARTS) as [IssPartKey, (typeof ISS_PARTS)[IssPartKey]][]) {
      const matched = meshes.filter((m) => def.match.test(m.userData.part))
      if (key === 'solar') matched.sort((a,b) => Number(/^panel/.test(a.userData.part))-Number(/^panel/.test(b.userData.part)))
      const b = new Box3()
      for (const m of matched) b.expandByObject(m)
      const marker = (key === 'solar' || key === 'radiators') && matched[0] ? new Box3().setFromObject(matched[0]) : b
      const c = marker.isEmpty() ? new Vector3() : marker.getCenter(new Vector3())
      const r = b.isEmpty() ? 0.2 : b.getSize(new Vector3()).length() / 2
      parts[key] = { key, center: c, radius: r, meshes: matched }
    }
    return { scene: holder, parts, meshes }
  }, [gltf])
}

const HIGHLIGHT = new Color('#56d8ff')

export function useIssHighlight(iss: ReturnType<typeof useIss>, active: IssPartKey | undefined | null, color = HIGHLIGHT) {
  const activeMeshes = useMemo(() => new Set(active ? iss.parts[active]?.meshes : []), [iss, active])
  useFrame(({ clock }) => {
    iss.scene.userData.stationFocus = active
    const pulse = 0.55 + Math.sin(clock.elapsedTime * 4) * 0.25
    for (const mesh of iss.meshes) {
      const m = mesh.material as MeshStandardMaterial
      if (activeMeshes.has(mesh)) {
        mesh.userData.particleHighlight = color
        m.emissive.copy(color)
        m.emissiveIntensity = pulse
      } else if (m.emissiveIntensity !== m.userData.baseIntensity || !m.emissive.equals(m.userData.baseEmissive)) {
        delete mesh.userData.particleHighlight
        m.emissive.copy(m.userData.baseEmissive)
        m.emissiveIntensity = m.userData.baseIntensity
      }
    }
  })
}

export function IssModel({ detail = false, ...props }: { detail?: boolean } & ThreeElements['group']) {
  const iss = useIss(detail)
  return (
    <group {...props}>
      <StationCloud iss={iss} />
    </group>
  )
}

useGLTF.preload(assetUrl('iss'))
