import { ATTRACTOR_GLSL, attractorPath, FLOW_SAMPLES } from './attractor'

const vertex = /* glsl */ `#version 300 es
  precision highp float;
  #define texture2D texture
  ${ATTRACTOR_GLSL}
  uniform float time;
  uniform vec2 resolution;
  uniform float pixelRatio;
  uniform float count;
  uniform float density;
  out vec3 vColor;
  out float vAlpha;
  float hash(float n) { return fract(sin(n * 127.1 + 311.7) * 43758.5453); }
  void main() {
    float id = float(gl_VertexID);
    bool trail = id >= count;
    float seed = hash(id + 1.0);
    float phase = trail ? 0.23 + time * 0.018 - (id - count) * 0.000045 : seed + time * 0.018;
    vec3 p = attractor(phase);
    vec3 dust = vec3(hash(id + 19.0), hash(id + 37.0), hash(id + 81.0)) - 0.5;
    float fringe = pow(hash(id + 12.0), 5.0);
    float spread = mix(0.035 + fringe * 0.18, 0.016, density);
    p += dust * (trail ? 0.004 : spread);
    p += sin(vec3(phase * 123.0, phase * 74.0, phase * 89.0) + time * 0.32) * (trail ? 0.0 : spread * 0.12);
    float yaw = 0.12 + sin(time * 0.09) * 0.12;
    p.xz = mat2(cos(yaw), -sin(yaw), sin(yaw), cos(yaw)) * p.xz;
    float tilt = -0.28;
    p.yz = mat2(cos(tilt), -sin(tilt), sin(tilt), cos(tilt)) * p.yz;
    p.xy = mat2(0.996, -0.087, 0.087, 0.996) * p.xy;
    float perspective = 3.8 / (3.8 - p.z);
    float fit = min(resolution.x / 3.1, resolution.y / 1.8);
    gl_Position = vec4(p.xy * perspective * fit * 2.0 / resolution, 0.0, 1.0);
    float nearSide = clamp((p.z + 0.7) / 1.4, 0.0, 1.0);
    vColor = mix(vec3(0.59, 0.69, 0.78), vec3(1.0, 0.98, 0.94), nearSide);
    vAlpha = (0.24 + nearSide * 0.46) * (1.0 - fringe * 0.55) * flowEnvelope(phase);
    gl_PointSize = pixelRatio * (0.85 + hash(id + 22.0) * 0.9 + nearSide * 0.45);
    if (trail) {
      float tail = (id - count) / 384.0;
      vColor = mix(vec3(0.35, 0.78, 1.0), vec3(1.0, 0.71, 0.34), 1.0 - tail);
      vAlpha = pow(1.0 - tail, 1.25) * 0.78 * flowEnvelope(phase);
      gl_PointSize = pixelRatio * (1.1 + (1.0 - tail) * 1.4);
    } else {
      float visible = mix(0.65, 1.0, density);
      vAlpha *= 1.0 - smoothstep(visible - 0.03, visible, hash(id + 8.0));
    }
  }
`
const fragment = /* glsl */ `#version 300 es
  precision highp float;
  in vec3 vColor;
  in float vAlpha;
  out vec4 outColor;
  void main() {
    float r = length(gl_PointCoord - 0.5) * 2.0;
    if (r > 1.0) discard;
    outColor = vec4(vColor, exp(-r * r * 2.2) * vAlpha);
  }
`

/** Standalone WebGL: the title does not download Three.js or scene assets. */
export function createInfinityRenderer(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext('webgl2', { alpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'low-power', premultipliedAlpha: false })
  if (!gl) return null
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type)!
    gl.shaderSource(shader, source); gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const message = gl.getShaderInfoLog(shader)
      gl.deleteShader(shader)
      throw new Error(`Infinity shader: ${message}`)
    }
    return shader
  }
  const vs = compile(gl.VERTEX_SHADER, vertex), fs = compile(gl.FRAGMENT_SHADER, fragment)
  const program = gl.createProgram()!
  gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program)
  gl.deleteShader(vs); gl.deleteShader(fs)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program)
    gl.deleteProgram(program)
    throw new Error(`Infinity program: ${message}`)
  }
  const texture = gl.createTexture(), vao = gl.createVertexArray()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, FLOW_SAMPLES, 1, 0, gl.RGBA, gl.FLOAT, attractorPath())
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  const uniforms = Object.fromEntries(['time', 'resolution', 'pixelRatio', 'count', 'density', 'flowPath', 'flowSteps'].map(key => [key, gl.getUniformLocation(program, key)]))
  gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE)
  gl.clearColor(0, 0, 0, 0)
  return {
    render(time: number, density: number) {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(devicePixelRatio || 1, 1.5)
      const width = Math.max(1, Math.round(rect.width * dpr)), height = Math.max(1, Math.round(rect.height * dpr))
      if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height }
      const count = rect.width < 600 ? 10000 : 24000
      gl.viewport(0, 0, width, height); gl.clear(gl.COLOR_BUFFER_BIT)
      gl.useProgram(program); gl.bindVertexArray(vao)
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.uniform1i(uniforms.flowPath, 0); gl.uniform1f(uniforms.flowSteps, FLOW_SAMPLES)
      gl.uniform1f(uniforms.time, time); gl.uniform1f(uniforms.density, density)
      gl.uniform1f(uniforms.pixelRatio, dpr); gl.uniform1f(uniforms.count, count)
      gl.uniform2f(uniforms.resolution, width, height)
      gl.drawArrays(gl.POINTS, 0, count + 384)
      canvas.dataset.flowPoints = String(count + 384)
      canvas.dataset.flowTime = time.toFixed(3)
      canvas.dataset.flowDensity = density.toFixed(2)
    },
    dispose() { gl.deleteTexture(texture); gl.deleteVertexArray(vao); gl.deleteProgram(program) },
  }
}
