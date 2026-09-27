import { ATTRACTOR_GLSL } from './attractor'

export const particleVertex = /* glsl */ `
  ${ATTRACTOR_GLSL}
  uniform sampler2D transforms;
  uniform sampler2D styles;
  uniform float rows;
  uniform float time;
  uniform float focus;
  uniform float motion;
  uniform float pixelRatio;
  attribute float objectId;
  attribute float seed;
  attribute vec3 surfaceNormal;
  attribute vec3 tint;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float row = (objectId + 0.5) / rows;
    mat4 worldMatrix = mat4(
      texture2D(transforms, vec2(0.125, row)), texture2D(transforms, vec2(0.375, row)),
      texture2D(transforms, vec2(0.625, row)), texture2D(transforms, vec2(0.875, row))
    );
    vec4 style = texture2D(styles, vec2(0.25, row));
    vec4 accent = texture2D(styles, vec2(0.75, row));
    vec3 p = (worldMatrix * vec4(position, 1.0)).xyz;
    // Inverse transpose for non-uniformly scaled meshes (wings, terrain, body).
    vec3 x = worldMatrix[0].xyz, y = worldMatrix[1].xyz, z = worldMatrix[2].xyz;
    vec3 n = normalize(mat3(cross(y,z), cross(z,x), cross(x,y)) * surfaceNormal);
    float rim = 1.0 - smoothstep(0.05, 0.38, abs(dot(n, normalize(cameraPosition - p))));
    float phase = seed * 62.83185;
    // The same double-vortex trajectory as the loading scene, projected onto each
    // model's tangent plane. Pinned silhouette grains keep tiny parts legible.
    float cycle = seed + time * 0.018;
    vec3 flow = attractor(cycle) * vec3(1.0, 1.6, 1.0) * flowEnvelope(cycle);
    vec3 tangent = flow - n * dot(flow, n);
    float wisp = smoothstep(0.86, 1.0, seed) * (1.0 - focus) * (1.0 - rim);
    p += (tangent * (1.25 + wisp) + n * (flow.z * 0.26 + wisp * 1.6)) * style.x * mix(1.0, 0.018, focus) * mix(1.0, 0.035, rim) * motion;
    vec4 viewPosition = viewMatrix * vec4(p, 1.0);
    float signedFacing = dot(n, normalize(cameraPosition - p));
    float facing = abs(signedFacing);
    float shimmer = 0.91 + 0.09 * sin(phase + time * 0.65 * motion);
    vColor = mix(tint, accent.rgb, accent.a) * mix(0.62, 1.2, pow(facing, 0.45));
    vColor = mix(vColor, mix(vec3(0.32, 0.72, 0.9), accent.rgb, accent.a), rim * 0.48);
    vColor *= 1.0 + rim * 0.6;
    float star = smoothstep(0.993, 1.0, seed) * (1.0 - focus * 0.85) * (1.0 - rim * 0.85);
    vColor *= shimmer * (1.0 + star * 3.5);
    vAlpha = style.y * mix(0.83, 0.94, focus);
    if (style.z > 0.5) {
      vAlpha *= smoothstep(0.0, 0.025, signedFacing);
      vColor *= mix(1.35, 3.2, style.w);
    }
    // Stable nested subsets: new points fade in without resampling or popping.
    float density = mix(mix(0.38, 1.0, focus), 1.0, rim);
    vAlpha *= 1.0 - smoothstep(density - 0.035, density, fract(seed * 73.173));
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = pixelRatio * mix(1.7, 1.42, focus) * (0.8 + seed * 0.6 + star * 2.5);
    gl_PointSize *= mix(1.0, 1.7, style.w);
    gl_PointSize *= 1.0 + rim * 0.28;
    if (viewPosition.z >= 0.0 || style.y == 0.0) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
  }
`

export const contourVertex = /* glsl */ `
  uniform sampler2D transforms;
  uniform sampler2D styles;
  uniform float rows;
  uniform float focus;
  attribute float objectId;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float row = (objectId + 0.5) / rows;
    mat4 worldMatrix = mat4(
      texture2D(transforms, vec2(0.125, row)), texture2D(transforms, vec2(0.375, row)),
      texture2D(transforms, vec2(0.625, row)), texture2D(transforms, vec2(0.875, row))
    );
    vec4 style = texture2D(styles, vec2(0.25, row));
    vec4 accent = texture2D(styles, vec2(0.75, row));
    vec4 viewPosition = viewMatrix * worldMatrix * vec4(position, 1.0);
    vColor = mix(vec3(0.19, 0.54, 0.75), accent.rgb, accent.a);
    vAlpha = style.y * mix(0.42, 0.64, focus);
    gl_Position = projectionMatrix * viewPosition;
    gl_Position.z -= 0.00001 * gl_Position.w;
    // Keep both endpoints in clip space: the GPU clips lines crossing the near plane.
    if (style.y == 0.0) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
  }
`

export const contourFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    if (vAlpha < 0.01) discard;
    gl_FragColor = vec4(vColor, vAlpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

export const particleFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float r = length(gl_PointCoord - 0.5) * 2.0;
    if (r > 1.0 || vAlpha < 0.002) discard;
    float core = exp(-r * r * 2.6);
    if (core * vAlpha < 0.12) discard;
    gl_FragColor = vec4(vColor, core * vAlpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`
