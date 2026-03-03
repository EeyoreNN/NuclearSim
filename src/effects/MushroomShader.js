/**
 * MushroomShader.js — GLSL shaders for nuclear mushroom cloud particle system.
 *
 * Vertex shader:   positions each particle, sizes by distance, animates rise
 * Fragment shader: applies heat-glow gradient (orange→grey by height), soft round discs
 */
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Vertex shader
// Attributes per particle:
//   age  (float) — seconds since detonation; all particles share the same age
//   size (float) — base point size (randomised at spawn time)
// Uniforms:
//   maxAge        — duration before full fade-out (seconds)
//   uRiseProgress — 0→1 over first 3 seconds; scales cloud up from nothing
// ---------------------------------------------------------------------------
export const mushroomVertexShader = /* glsl */`
  attribute float age;
  attribute float size;

  uniform float maxAge;
  uniform float uRiseProgress;

  varying float vAge;
  varying float vNormHeight;   // 0 = ground, 1 = top of cap

  void main() {
    vAge = age;

    // Animate rise: scale local position by rise progress
    // Y (height) grows faster than X/Z so the stem rises before cap billows
    vec3 pos = position;
    float xzScale = 0.15 + uRiseProgress * 0.85;
    float yScale  = uRiseProgress;
    pos.xz *= xzScale;
    pos.y  *= yScale;

    // Normalised height used for colour gradient
    // Local cap peak is at y ≈ 0.55 (see MushroomCloud spawn geometry)
    vNormHeight = clamp(pos.y / 0.55, 0.0, 1.0);

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = size * (300.0 / -mvPos.z);
    gl_Position  = projectionMatrix * mvPos;
  }
`;

// ---------------------------------------------------------------------------
// Fragment shader
// Draws a soft circular disc per particle.
// Colour: orange-red at base → grey smoke at top, fades with age.
// ---------------------------------------------------------------------------
export const mushroomFragmentShader = /* glsl */`
  varying float vAge;
  varying float vNormHeight;

  uniform float maxAge;

  void main() {
    // Fade to transparent as age approaches maxAge
    float alpha = clamp(1.0 - (vAge / maxAge), 0.0, 1.0);

    // Heat gradient: bright orange/red at base, grey smoke at top
    float t = smoothstep(0.0, 1.0, vNormHeight);
    vec3 hotColour  = vec3(1.0, 0.3, 0.0);   // orange-red
    vec3 coldColour = vec3(0.55, 0.5, 0.45);  // grey smoke

    // Inner core is brighter/yellower
    vec3 innerCol = mix(vec3(1.0, 0.85, 0.6), hotColour, t);
    vec3 col      = mix(innerCol, coldColour, t);

    // Soft circular point — discard corners
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;

    float softEdge = 1.0 - smoothstep(0.3, 0.5, d);
    gl_FragColor = vec4(col, alpha * softEdge * 0.9);
  }
`;

// ---------------------------------------------------------------------------
// Factory — returns a ready-to-use ShaderMaterial
// ---------------------------------------------------------------------------
export function createMushroomMaterial(maxAge = 30.0) {
  return new THREE.ShaderMaterial({
    uniforms: {
      maxAge:        { value: maxAge },
      uRiseProgress: { value: 0.0 },
    },
    vertexShader:   mushroomVertexShader,
    fragmentShader: mushroomFragmentShader,
    transparent:    true,
    depthWrite:     false,
    blending:       THREE.AdditiveBlending,
  });
}
