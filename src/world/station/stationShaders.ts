import { ATTRACTOR_GLSL } from '../../engine/particles/attractor'

export const stationVertex = /* glsl */ `
  ${ATTRACTOR_GLSL}
  uniform float time;
  uniform float focus;
  uniform float motion;
  uniform float pixelRatio;
  uniform float selectedPart;
  attribute vec4 stationData;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float seed = stationData.x, edge = stationData.y;
    float selected = 1.0 - step(0.1, abs(stationData.z - selectedPart));
    float hasSelection = step(-0.5, selectedPart);
    vec3 p = position;
    vec3 flow = attractor(seed + time * .006) * flowEnvelope(seed + time * .006);
    vec3 tangent = flow - normal * dot(flow, normal);
    // Dotted edges stay pinned; only the surface grains breathe. Exam mode
    // gathers every grain and eliminates displacement.
    p += tangent * .0014 * (1.0 - edge) * (1.0 - focus) * motion;
    vec4 view = modelViewMatrix * vec4(p, 1.0);
    vec3 eyeNormal = normalize(normalMatrix * (normal + vec3(.000001)));
    float facing = abs(dot(eyeNormal, normalize(-view.xyz)));
    float lit = mix(.52, 1.02, pow(facing, .65));
    vColor = color * mix(lit, .94, edge);
    vColor = mix(vColor, vec3(.38, .85, 1.0), selected * hasSelection * .72);
    vColor *= mix(1.0, .36 + selected * .82, hasSelection);
    float density = mix(.60, 1.0, focus);
    float visible = 1.0 - smoothstep(density - .03, density, fract(seed * 71.37));
    float wave = .94 + .06 * sin(seed * 15.0 + time * .35 * motion);
    vAlpha = mix(.82 * visible * wave, .92, edge);
    gl_PointSize = pixelRatio * mix(1.55, 1.32, edge) * mix(1.0, 1.12, focus);
    gl_PointSize *= 1.0 + selected * hasSelection * .18;
    // Small camera-facing offset avoids depth fighting with the NASA silhouette.
    view.z += mix(.0006, .0012, edge);
    gl_Position = projectionMatrix * view;
  }
`

export const stationFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float r = length(gl_PointCoord - .5) * 2.0;
    if (r > 1.0 || vAlpha < .025) discard;
    gl_FragColor = vec4(vColor, vAlpha * (1.0 - smoothstep(.4, 1.0, r)));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`
