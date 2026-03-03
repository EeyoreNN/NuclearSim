import * as THREE from 'three';
import { createDayNightMaterial } from './DayNightShader.js';
import { createAtmosphereMesh } from './AtmosphereShader.js';

/**
 * Builds the Earth + clouds + atmosphere meshes and adds them to the scene.
 *
 * Globe radius = 1.0 Three.js unit = 6371 km.
 * ALL other modules that place objects on the globe must use radius 1.0.
 *
 * @param {THREE.Scene}         scene
 * @param {THREE.TextureLoader} textureLoader
 * @returns {{ earthMesh: THREE.Mesh, cloudMesh: THREE.Mesh, atmosphereMesh: THREE.Mesh }}
 */
export function buildGlobe(scene, textureLoader) {
  // ── Earth mesh ──────────────────────────────────────────────────
  const earthGeo = new THREE.SphereGeometry(1.0, 64, 64);

  const dayMap   = textureLoader.load('textures/earth_daymap.jpg');
  const nightMap = textureLoader.load('textures/earth_nightmap.jpg');
  const specMap  = textureLoader.load('textures/earth_specular.jpg');

  const earthMat  = createDayNightMaterial({ dayMap, nightMap, specMap });
  const earthMesh = new THREE.Mesh(earthGeo, earthMat);
  scene.add(earthMesh);

  // ── Cloud layer ─────────────────────────────────────────────────
  const cloudGeo = new THREE.SphereGeometry(1.01, 32, 32);
  const cloudTex = textureLoader.load('textures/earth_clouds.png');
  const cloudMat = new THREE.MeshBasicMaterial({
    map: cloudTex,
    transparent: true,
    opacity: 0.35,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
  scene.add(cloudMesh);

  // ── Atmosphere glow ─────────────────────────────────────────────
  const atmosphereMesh = createAtmosphereMesh();
  scene.add(atmosphereMesh);

  return { earthMesh, cloudMesh, atmosphereMesh };
}

/**
 * Call once per frame to rotate clouds.
 * @param {THREE.Mesh} cloudMesh
 */
export function updateGlobe(cloudMesh) {
  cloudMesh.rotation.y += 0.0005;
}
