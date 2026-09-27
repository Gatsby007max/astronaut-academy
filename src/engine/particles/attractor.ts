/** A bounded double-vortex flow, generated once and sampled on the GPU. */
export const FLOW_SAMPLES = 2048
export const FLOW_STEP = 0.012

type Point = [number, number, number]
const derivative = ([x, y, z]: Point): Point => [10 * (y - x), x * (28 - z) - y, x * y - (8 / 3) * z]
const offset = (p: Point, v: Point, dt: number): Point => [p[0] + v[0] * dt, p[1] + v[1] * dt, p[2] + v[2] * dt]

export function advanceAttractor(p: Point, dt = FLOW_STEP): Point {
  const a = derivative(p), b = derivative(offset(p, a, dt / 2))
  const c = derivative(offset(p, b, dt / 2)), d = derivative(offset(p, c, dt))
  return p.map((value, axis) => value + dt * (a[axis] + 2 * b[axis] + 2 * c[axis] + d[axis]) / 6) as Point
}

export function createAttractorPath(samples = FLOW_SAMPLES): Float32Array {
  const path = new Float32Array(samples * 4)
  let p: Point = [0.1, 0, 0.1]
  for (let i = 0; i < 1600 + samples; i++) {
    p = advanceAttractor(p)
    if (i < 1600) continue
    const k = (i - 1600) * 4
    // Flatten the viewing angle into two broad wings with a crossing in depth.
    path[k] = p[0] * 0.062
    path[k + 1] = (p[2] - 26) * 0.028
    path[k + 2] = p[1] * 0.024
    path[k + 3] = 1
  }
  return path
}

let cached: Float32Array | undefined
export const attractorPath = () => cached ??= createAttractorPath()

export const ATTRACTOR_GLSL = /* glsl */ `
  uniform sampler2D flowPath;
  uniform float flowSteps;
  vec3 attractor(float phase) {
    float index = fract(phase) * flowSteps;
    float a = floor(index);
    vec3 p = texture2D(flowPath, vec2((a + 0.5) / flowSteps, 0.5)).xyz;
    vec3 q = texture2D(flowPath, vec2((mod(a + 1.0, flowSteps) + 0.5) / flowSteps, 0.5)).xyz;
    return mix(p, q, fract(index));
  }
  // The finite trajectory is not a closed spline. Hide its wrap instead of
  // drawing an artificial line across the two lobes.
  float flowEnvelope(float phase) {
    float f = fract(phase);
    return smoothstep(0.004, 0.022, f) * (1.0 - smoothstep(0.978, 0.996, f));
  }
`
