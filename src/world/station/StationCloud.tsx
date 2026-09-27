import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { DataTexture, DoubleSide, FloatType, MeshBasicMaterial, NearestFilter, NormalBlending, RGBAFormat, ShaderMaterial } from 'three'
import { attractorPath, FLOW_SAMPLES } from '../../engine/particles/attractor'
import { examParticles, PARTICLE_BUDGET } from '../../engine/particles/surface'
import { useGame } from '../../game/store'
import type { useIss } from '../IssModel'
import { buildStationGeometry, STATION_FRACTION, STATION_PARTS } from './stationGeometry'
import { stationFragment, stationVertex } from './stationShaders'

export function StationCloud({ iss }: { iss: ReturnType<typeof useIss> }) {
  const tier = useGame(s => s.tier)
  const gl = useThree(s => s.gl)
  const elapsed = useRef(0)
  const reduced = useRef(false)
  const drawing = useMemo(() => {
    iss.scene.updateWorldMatrix(true, true)
    const model = buildStationGeometry(iss.meshes, Math.round(PARTICLE_BUDGET[tier] * STATION_FRACTION), iss.scene.matrixWorld.clone().invert())
    const path = new DataTexture(attractorPath(), FLOW_SAMPLES, 1, RGBAFormat, FloatType)
    path.minFilter = path.magFilter = NearestFilter; path.needsUpdate = true
    const material = new ShaderMaterial({
      uniforms: { flowPath: { value: path }, flowSteps: { value: FLOW_SAMPLES }, time: { value: 0 }, focus: { value: 0 }, motion: { value: 1 }, pixelRatio: { value: 1 }, selectedPart: { value: -2 } },
      vertexShader: stationVertex, fragmentShader: stationFragment, vertexColors: true,
      transparent: true, depthWrite: false, blending: NormalBlending,
    })
    const depth = new MeshBasicMaterial({ colorWrite: false, depthWrite: true, side: DoubleSide, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2 })
    return { ...model, material, depth, release: () => { model.dispose(); material.dispose(); depth.dispose(); path.dispose() } }
  }, [iss, tier])

  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => { reduced.current = media.matches }
    update(); media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  useEffect(() => {
    gl.domElement.dataset.stationDesign = 'surface-and-dotted-edge-v2'
    gl.domElement.dataset.stationPoints = String(drawing.count)
    gl.domElement.dataset.stationCategories = drawing.categoryCounts.join(',')
    return () => {
      drawing.release()
      for (const key of ['stationDesign', 'stationPoints', 'stationCategories', 'stationFocus', 'stationMotion']) delete gl.domElement.dataset[key]
    }
  }, [drawing, gl])
  useFrame((_, delta) => {
    const state = useGame.getState(), u = drawing.material.uniforms
    const motion = !reduced.current && state.settings.particleMotion
    if (motion) elapsed.current += Math.min(delta, .05)
    u.time.value = elapsed.current; u.motion.value = motion ? 1 : 0
    u.focus.value += ((examParticles(state.screen) ? 1 : 0) - u.focus.value) * (1 - Math.exp(-Math.min(delta, .05) * 4.5))
    u.pixelRatio.value = Math.min(gl.getPixelRatio(), 1.75)
    u.selectedPart.value = iss.scene.userData.stationFocus ? STATION_PARTS.indexOf(iss.scene.userData.stationFocus) : -2
    gl.domElement.dataset.stationFocus = u.focus.value.toFixed(3)
    gl.domElement.dataset.stationMotion = String(u.motion.value)
  })

  return <group userData={{ particleMode: 'background', particleBudgetFraction: STATION_FRACTION }}>
    <primitive object={iss.scene} />
    <mesh geometry={drawing.depthGeometry} material={drawing.depth} renderOrder={-2} raycast={() => {}} />
    <points geometry={drawing.geometry} material={drawing.material} renderOrder={7} frustumCulled={false} raycast={() => {}} />
  </group>
}
