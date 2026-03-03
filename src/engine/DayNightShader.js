import * as THREE from 'three';

const vertexShader = /* glsl */`
varying vec2 vUv;
varying vec3 vNormal;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = /* glsl */`
uniform sampler2D dayMap;
uniform sampler2D nightMap;
uniform sampler2D specularMap;
uniform vec3 sunDir;   // normalized direction to sun in world space

varying vec2 vUv;
varying vec3 vNormal;

void main() {
  float cosA = dot(normalize(vNormal), normalize(sunDir));
  float blend = smoothstep(-0.15, 0.15, cosA);

  vec4 day   = texture2D(dayMap,   vUv);
  vec4 night = texture2D(nightMap, vUv);

  // Specular highlight on oceans
  float spec = texture2D(specularMap, vUv).r;
  vec3 col = mix(night.rgb, day.rgb, blend);
  col += spec * pow(max(cosA, 0.0), 32.0) * 0.3;

  gl_FragColor = vec4(col, 1.0);
}
`;

/**
 * Creates the day/night blend ShaderMaterial for the Earth mesh.
 * @param {{ dayMap, nightMap, specMap }} textures  THREE.Texture instances
 * @returns {THREE.ShaderMaterial}
 */
export function createDayNightMaterial({ dayMap, nightMap, specMap }) {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      dayMap:      { value: dayMap },
      nightMap:    { value: nightMap },
      specularMap: { value: specMap },
      // sunDir updated each frame by SceneManager
      sunDir:      { value: new THREE.Vector3(1, 0.2, 0.5).normalize() },
    },
  });
}
