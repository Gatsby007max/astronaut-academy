import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Vector3, type Group } from 'three'
import { MODULE_BY_ID } from '../../content/modules'
import { audio } from '../../engine/audio'
import { CameraRig } from '../../engine/CameraRig'
import { Cinematic } from '../../engine/Cinematic'
import { SunFlare } from '../../engine/SunFlare'
import { useSceneSetup } from '../../engine/useSceneSetup'
import { useGame } from '../../game/store'
import { useUi } from '../../ui/uiStore'
import { Earth } from '../../world/Earth'
import { useIss, useIssHighlight } from '../../world/IssModel'
import { StationCloud } from '../../world/station/StationCloud'
import { Moon } from '../../world/Moon'
import { SpaceLighting } from '../../world/SpaceLighting'
import { Starfield } from '../../world/Starfield'
import { HubMarkers } from './HubMarkers'
import { ScanTargets } from './ScanTargets'
import type { ModuleId } from '../../content/types'
import { EARTH_CENTER, EARTH_RADIUS, EARTH_SPHERE, HUB_SHOTS, INTRO_SHOTS, MODULE_ANCHORS, MOON_POS, MOON_RADIUS, ORIENTATION_SHOTS, SUN_DIR, SUN_POS, TITLE_ORBIT } from './layout'

function TitleCamera() {
  const angle = useRef(-0.6)
  const target = useMemo(() => new Vector3(0, -0.4, 0), [])
  useFrame(({ camera }, delta) => {
    angle.current += delta * TITLE_ORBIT.speed
    const a = angle.current
    camera.position.set(Math.cos(a) * TITLE_ORBIT.radius, TITLE_ORBIT.height + Math.sin(a * 0.7) * 0.3, Math.sin(a) * TITLE_ORBIT.radius)
    camera.lookAt(target)
  })
  return null
}

function Station({ scanning }: { scanning: boolean }) {
  const iss = useIss(false)
  const screen = useGame((s) => s.screen)
  const focus = useGame((s) => s.focus)
  const group = useRef<Group>(null)
  const anchor = screen.name === 'hub' && focus in MODULE_BY_ID ? MODULE_ANCHORS[focus as ModuleId] : undefined
  useIssHighlight(iss, typeof anchor === 'string' ? anchor : null)
  useFrame(({ clock }) => {
    if (group.current) group.current.rotation.z = Math.sin(clock.elapsedTime * 0.05) * 0.015
  })
  return (
    <group ref={group}>
      <StationCloud iss={iss} />
      {screen.name === 'hub' && <HubMarkers parts={iss.parts} />}
      {scanning && <ScanTargets parts={iss.parts} />}
    </group>
  )
}

export default function OrbitScene() {
  const size = useThree(s => s.size)
  const hubShots = useMemo(() => {
    const scale = size.width < 900 ? Math.max(1, size.height / size.width * 1.25) : 1
    const overview = { ...HUB_SHOTS.overview, position: new Vector3(...HUB_SHOTS.overview.position).multiplyScalar(scale).toArray() as [number, number, number] }
    return { ...HUB_SHOTS, overview }
  }, [size.width, size.height])
  const screen = useGame((s) => s.screen)
  const finishIntro = useGame((s) => s.finishIntro)
  const phase = screen.name === 'module' ? screen.phase : undefined
  const mode = screen.name === 'intro' ? 'intro' : screen.name === 'title' || screen.name === 'credits' ? 'title' : screen.name === 'module' ? 'orientation' : 'hub'

  useSceneSetup({ near: 0.02, far: 20000, fov: 40, ambient: 'orbit', fx: { bloomThreshold: 0.8, bloomIntensity: 1.0, dofEnabled: mode === 'intro' } })

  return (
    <>
      <SpaceLighting sunDir={SUN_DIR} shadowExtent={2} />
      <Starfield />
      <Earth position={EARTH_CENTER} radius={EARTH_RADIUS} sunDir={SUN_DIR} />
      <Moon position={MOON_POS} radius={MOON_RADIUS} />
      <SunFlare position={SUN_POS} occluders={[EARTH_SPHERE]} />
      <Station scanning={mode === 'orientation' && phase === 'mini'} />
      {mode === 'title' && <TitleCamera />}
      {mode === 'intro' && (
        <Cinematic
          shots={INTRO_SHOTS}
          playing
          onShot={(i, shot) => {
            useUi.getState().setCaption(shot.caption)
            if (i === 0) audio.sfx('whoosh')
          }}
          onDone={() => {
            useUi.getState().setCaption(undefined)
            finishIntro()
          }}
        />
      )}
      {mode === 'hub' && <CameraRig shots={hubShots} drift={0.004} parallax={0.12} />}
      {mode === 'orientation' && <CameraRig shots={ORIENTATION_SHOTS} drift={phase === 'mini' ? 0 : 0.008} parallax={phase === 'mini' ? 0 : 0.2} />}
    </>
  )
}
