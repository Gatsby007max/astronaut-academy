import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { AdditiveBlending, Color, DoubleSide, FogExp2, Group, RepeatWrapping, ShaderMaterial, UniformsLib, UniformsUtils, Vector3 } from 'three'
import { panelTexture } from '../../engine/textures'
import { POOL, WATER_COLOR } from './layout'

const causticChunk = /* glsl */ `
  float caustic(vec2 uv, float t) {
    vec2 p = mod(uv * 6.28318, 6.28318) - 250.0;
    vec2 i = p;
    float c = 1.0;
    float inten = 0.005;
    for (int n = 0; n < 4; n++) {
      float tt = t * (1.0 - (3.5 / float(n + 1)));
      i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
      c += 1.0 / max(0.0001, length(vec2(p.x / (sin(i.x + tt) / inten), p.y / (cos(i.y + tt) / inten))));
    }
    c /= 4.0;
    c = 1.17 - pow(clamp(c, 0.0, 100.0), 1.4);
    // Bound HDR highlights before bloom downsamples the half-float buffer.
    return pow(clamp(abs(c), 0.0, 1.0), 7.0);
  }
`

const tiledVertex = /* glsl */ `
  #include <fog_pars_vertex>
  varying vec2 vUv;
  varying vec3 vWorld;
  varying vec3 vNormalW;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vec4 mvPosition = viewMatrix * world;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`

const tiledFragment = /* glsl */ `
  #include <fog_pars_fragment>
  uniform sampler2D tiles;
  uniform float time;
  uniform float causticStrength;
  uniform vec2 tileScale;
  uniform vec3 tint;
  varying vec2 vUv;
  varying vec3 vWorld;
  varying vec3 vNormalW;
  ${causticChunk}
  void main() {
    vec3 base = texture2D(tiles, vUv * tileScale).rgb * tint;
    float up = clamp(vNormalW.y, 0.0, 1.0);
    float depthFade = clamp(1.0 + vWorld.y / 14.0, 0.25, 1.0);
    vec2 cuv = vWorld.xz * 0.11;
    float c = caustic(cuv, time * 0.55) * 0.7 + caustic(cuv * 1.7 + 3.1, time * 0.4) * 0.45;
    vec3 color = base * (0.34 + up * 0.2) + vec3(0.55, 0.9, 1.0) * c * causticStrength * mix(0.35, 1.0, up) * depthFade;
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`

const surfaceFragment = /* glsl */ `
  #include <fog_pars_fragment>
  uniform float time;
  varying vec2 vUv;
  varying vec3 vWorld;
  ${causticChunk}
  void main() {
    vec2 p = vWorld.xz * 0.07;
    float c = caustic(p, time * 0.35);
    float glow = 0.55 + 0.45 * sin(vWorld.x * 0.3 + time * 0.8) * sin(vWorld.z * 0.25 - time * 0.6);
    vec3 color = mix(vec3(0.12, 0.42, 0.55), vec3(0.75, 0.95, 1.0), c * 0.8) * (0.8 + glow * 0.5) * 1.6;
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`

const rayVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const rayFragment = /* glsl */ `
  uniform float time;
  uniform float seed;
  uniform float intensity;
  varying vec2 vUv;
  void main() {
    float edge = smoothstep(0.0, 0.35, vUv.x) * smoothstep(1.0, 0.65, vUv.x);
    float fall = pow(vUv.y, 1.6);
    float flicker = 0.6 + 0.4 * sin(time * 0.7 + seed * 6.0 + vUv.x * 3.0);
    float a = edge * fall * flicker * intensity;
    gl_FragColor = vec4(vec3(0.55, 0.88, 1.0) * a, 1.0);
  }
`

function tileTexture() {
  const tex = panelTexture('pool-tiles', (ctx, s) => {
    ctx.fillStyle = '#b9d6de'
    ctx.fillRect(0, 0, s, s)
    ctx.strokeStyle = '#6f97a3'
    ctx.lineWidth = 3
    const n = 8
    for (let i = 0; i <= n; i++) {
      const p = (i / n) * s
      ctx.beginPath()
      ctx.moveTo(p, 0)
      ctx.lineTo(p, s)
      ctx.moveTo(0, p)
      ctx.lineTo(s, p)
      ctx.stroke()
    }
    ctx.fillStyle = 'rgba(30,60,80,0.5)'
    ctx.fillRect(0, s * 0.47, s, s * 0.06)
  }, 256)
  tex.wrapS = tex.wrapT = RepeatWrapping
  tex.anisotropy = 8
  return tex
}

export function WaterFog({ density = 0.045 }: { density?: number }) {
  const scene = useThree((s) => s.scene)
  useEffect(() => {
    const previous = scene.fog
    const previousBackground = scene.background
    scene.fog = new FogExp2(WATER_COLOR, density)
    scene.background = WATER_COLOR.clone().multiplyScalar(0.55)
    return () => {
      scene.fog = previous
      scene.background = previousBackground
    }
  }, [scene, density])
  return null
}

export function PoolShell() {
  const tiles = useMemo(() => tileTexture(), [])
  const materials = useMemo(() => {
    const make = (scale: [number, number], strength: number, tint: string) =>
      new ShaderMaterial({
        uniforms: UniformsUtils.merge([UniformsLib.fog, { tiles: { value: tiles }, time: { value: 0 }, causticStrength: { value: strength }, tileScale: { value: scale }, tint: { value: new Color(tint) } }]),
        vertexShader: tiledVertex,
        fragmentShader: tiledFragment,
        fog: true,
        side: DoubleSide,
      })
    return {
      floor: make([POOL.length / 2, POOL.width / 2], 2.6, '#ffffff'),
      wallLong: make([POOL.length / 2, POOL.depth / 2], 0.9, '#d9ecf2'),
      wallShort: make([POOL.width / 2, POOL.depth / 2], 0.9, '#d9ecf2'),
      surface: new ShaderMaterial({
        uniforms: UniformsUtils.merge([UniformsLib.fog, { time: { value: 0 } }]),
        vertexShader: tiledVertex,
        fragmentShader: surfaceFragment,
        fog: true,
        side: DoubleSide,
      }),
    }
  }, [tiles])

  useFrame(({ clock }) => {
    for (const m of Object.values(materials)) m.uniforms.time.value = clock.elapsedTime
  })

  const { length: L, width: W, depth: D } = POOL
  return (
    <group userData={{ particleImportance: 0.1 }}>
      <mesh rotation-x={-Math.PI / 2} position={[0, -D, 0]} material={materials.floor} receiveShadow>
        <planeGeometry args={[L, W]} />
      </mesh>
      <mesh rotation-x={Math.PI / 2} position={[0, 0, 0]} material={materials.surface}>
        <planeGeometry args={[L, W]} />
      </mesh>
      <mesh position={[0, -D / 2, -W / 2]} material={materials.wallLong}>
        <planeGeometry args={[L, D]} />
      </mesh>
      <mesh position={[0, -D / 2, W / 2]} rotation-y={Math.PI} material={materials.wallLong}>
        <planeGeometry args={[L, D]} />
      </mesh>
      <mesh position={[-L / 2, -D / 2, 0]} rotation-y={Math.PI / 2} material={materials.wallShort}>
        <planeGeometry args={[W, D]} />
      </mesh>
      <mesh position={[L / 2, -D / 2, 0]} rotation-y={-Math.PI / 2} material={materials.wallShort}>
        <planeGeometry args={[W, D]} />
      </mesh>
    </group>
  )
}

export function GodRays({ count = 9 }: { count?: number }) {
  const group = useRef<Group>(null)
  const rays = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const seed = i * 1.37
        return {
          position: new Vector3(((i * 7.3) % 22) - 11, -5.5, ((i * 4.1) % 14) - 9),
          width: 2 + ((i * 1.7) % 3),
          tilt: 0.08 + ((i * 0.13) % 0.12),
          material: new ShaderMaterial({
            uniforms: { time: { value: 0 }, seed: { value: seed }, intensity: { value: 0.28 + ((i * 0.07) % 0.12) } },
            vertexShader: rayVertex,
            fragmentShader: rayFragment,
            transparent: true,
            depthWrite: false,
            blending: AdditiveBlending,
            side: DoubleSide,
          }),
        }
      }),
    [count],
  )
  useFrame(({ clock, camera }) => {
    group.current?.children.forEach((child, i) => {
      const ray = rays[i]
      ray.material.uniforms.time.value = clock.elapsedTime
      child.rotation.set(0, Math.atan2(camera.position.x - child.position.x, camera.position.z - child.position.z), ray.tilt + Math.sin(clock.elapsedTime * 0.2 + i) * 0.03)
    })
  })
  return (
    <group ref={group} userData={{ particleMode: 'hidden' }}>
      {rays.map((r, i) => (
        <mesh key={i} position={r.position} material={r.material} renderOrder={3}>
          <planeGeometry args={[r.width, 11]} />
        </mesh>
      ))}
    </group>
  )
}
