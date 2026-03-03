import * as THREE from 'three';

/**
 * Builds a starfield sphere (rendered from inside) and adds it to the scene.
 * The sphere is fixed (no rotation).
 *
 * @param {THREE.Scene} scene
 * @returns {THREE.Mesh}
 */
export function buildStarfield(scene) {
  const textureLoader = new THREE.TextureLoader();
  const starTex = textureLoader.load('textures/stars_milkyway.jpg');

  const geo  = new THREE.SphereGeometry(500, 64, 64);
  const mat  = new THREE.MeshBasicMaterial({
    map:  starTex,
    side: THREE.BackSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);
  return mesh;
}
