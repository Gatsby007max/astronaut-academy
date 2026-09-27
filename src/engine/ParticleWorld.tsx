import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef, type ReactNode } from 'react'
import { Color, Group, type Mesh, type MeshStandardMaterial, type ShaderMaterial } from 'three'
import { useGame } from '../game/store'
import { buildCloud } from './particles/buildCloud'
import { examParticles, PARTICLE_BUDGET } from './particles/surface'

export function ParticleWorld({ children }: { children: ReactNode }) {
  const root = useRef<Group>(null)
  const cloud = useRef<ReturnType<typeof buildCloud> | null>(null)
  const tier = useGame(s => s.tier)
  const { scene, gl, invalidate } = useThree()
  const elapsed = useRef(0)
  const lastSignature = useRef('')
  const reduced = useRef(false)
  const rebuild = useRef(true)

  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => { reduced.current = media.matches }
    update(); media.addEventListener('change',update)
    return () => media.removeEventListener('change',update)
  },[])
  useEffect(() => { rebuild.current = true; invalidate() },[tier,invalidate])
  useEffect(() => () => {
    if (cloud.current) { scene.remove(cloud.current.points,cloud.current.contours); cloud.current.dispose(); cloud.current = null }
    delete gl.domElement.dataset.particleMode
    delete gl.domElement.dataset.particleCount
    delete gl.domElement.dataset.particleFocus
    delete gl.domElement.dataset.particleSources
    delete gl.domElement.dataset.particleBuildMs
    delete gl.domElement.dataset.particleMotion
    delete gl.domElement.dataset.contourSegments
    delete gl.domElement.dataset.particleFlow
  },[scene,gl])

  useFrame((_, delta) => {
    if (!root.current) return
    if (!reduced.current && useGame.getState().settings.particleMotion) elapsed.current += Math.min(delta,.05)
    // Catch focus-dependent models, lazy assets, and geometry quality changes.
    {
      const entries: string[] = []
      root.current.traverse(object => {
        const mesh = object as Mesh
        if (mesh.isMesh) {
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
          entries.push(`${mesh.uuid}:${mesh.geometry?.uuid}:${materials.map(m => `${m.uuid}:${(m as MeshStandardMaterial).map?.uuid ?? (m as ShaderMaterial).uniforms?.dayMap?.value?.uuid ?? ''}`).join(',')}`)
        }
      })
      const signature = entries.join('|')
      if (signature !== lastSignature.current || rebuild.current) {
        if (cloud.current) { scene.remove(cloud.current.points,cloud.current.contours); cloud.current.dispose() }
        const started = performance.now()
        let reserved = 0
        root.current.traverse(object => { reserved += Number(object.userData.particleBudgetFraction ?? 0) })
        cloud.current = buildCloud(root.current,Math.round(PARTICLE_BUDGET[tier] * Math.max(0, 1 - reserved)))
        scene.add(cloud.current.points,cloud.current.contours)
        lastSignature.current = signature
        rebuild.current = false
        gl.domElement.dataset.particleCount = String(cloud.current.count)
        gl.domElement.dataset.particleSources = String(cloud.current.sources.length)
        gl.domElement.dataset.particleBuildMs = (performance.now()-started).toFixed(1)
        gl.domElement.dataset.contourSegments = String(cloud.current.contours.geometry.getAttribute('position').count/2)
      }
    }
    // A unified dark field keeps luminous grains visible in every environment.
    if (scene.background instanceof Color) scene.background.set('#03050b')
    const current = cloud.current
    if (!current) return
    const exam = examParticles(useGame.getState().screen)
    const uniforms = current.material.uniforms
    uniforms.time.value = elapsed.current
    uniforms.motion.value = reduced.current || !useGame.getState().settings.particleMotion ? 0 : 1
    gl.domElement.dataset.particleMotion = String(uniforms.motion.value)
    gl.domElement.dataset.particleFlow = 'double-vortex'
    uniforms.focus.value += ((exam ? 1 : 0)-uniforms.focus.value)*(1-Math.exp(-Math.min(delta,.05)*4.5))
    gl.domElement.dataset.particleMode = exam ? 'focus' : 'flow'
    gl.domElement.dataset.particleFocus = uniforms.focus.value.toFixed(3)
  },-0.5)
  return <group ref={root}>{children}</group>
}
