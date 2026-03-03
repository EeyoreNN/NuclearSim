import * as THREE from 'three';

const vertexShader = /* glsl */`
varying vec3 vNormal;
varying vec3 eyeVector;

void main() {
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  eyeVector = normalize(worldPos.xyz - cameraPosition);
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = /* glsl */`
varying vec3 vNormal;
varying vec3 eyeVector;

uniform vec3 atmColor;   // default: vec3(0.2, 0.6, 1.0)
uniform float atmPower;  // default: 3.0

void main() {
  float intensity = pow(1.0 + dot(vNormal, eyeVector), atmPower);
  gl_FragColor = vec4(atmColor, intensity * 0.8);
}
`;

/**
 * Creates the Fresnel-glow atmosphere mesh.
 * Sphere radius 1.08, rendered additive over the globe.
 * @returns {THREE.Mesh}
 */
export function createAtmosphereMesh() {
  const geo = new THREE.SphereGeometry(1.08, 64, 64);
  const mat = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      atmColor: { value: new THREE.Vector3(0.2, 0.6, 1.0) },
      atmPower: { value: 3.0 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.FrontSide,
  });
  return new THREE.Mesh(geo, mat);
}
