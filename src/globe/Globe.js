/**
 * Globe.js — 3D Earth with day/night shader, atmosphere glow, clouds, and starfield
 */
import * as THREE from 'three';

// ---- Shaders ----

const EARTH_VERT = /* glsl */`
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPos;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const EARTH_FRAG = /* glsl */`
  uniform sampler2D dayMap;
  uniform sampler2D nightMap;
  uniform sampler2D specMap;
  uniform vec3 sunDirection;
  uniform vec3 camPos;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPos;

  void main() {
    vec3 sun = normalize(sunDirection);
    float cosAngle = dot(vNormal, sun);

    // Smooth day/night blend
    float blend = smoothstep(-0.15, 0.25, cosAngle);

    vec4 day   = texture2D(dayMap,   vUv);
    vec4 night = texture2D(nightMap, vUv);
    vec3 color = mix(night.rgb * 0.8, day.rgb, blend);

    // Specular highlight on ocean
    float spec = texture2D(specMap, vUv).r;
    vec3 viewDir = normalize(camPos - vWorldPos);
    vec3 halfVec = normalize(sun + viewDir);
    float s = pow(max(dot(vNormal, halfVec), 0.0), 48.0) * spec * max(cosAngle, 0.0);
    color += vec3(s * 0.4);

    // Limb darkening
    float limb = dot(normalize(vWorldPos - camPos), -vNormal);
    color *= 0.5 + 0.5 * pow(max(limb, 0.0), 0.3);

    gl_FragColor = vec4(color, 1.0);
  }
`;

const ATMO_VERT = /* glsl */`
  varying vec3 vNormal;
  varying vec3 vWorldPos;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ATMO_FRAG = /* glsl */`
  uniform vec3 glowColor;
  uniform float intensity;
  uniform float power;
  uniform vec3 camPos;

  varying vec3 vNormal;
  varying vec3 vWorldPos;

  void main() {
    vec3 viewDir = normalize(camPos - vWorldPos);
    float rim = 1.0 - abs(dot(viewDir, vNormal));
    rim = pow(rim, power) * intensity;
    gl_FragColor = vec4(glowColor, rim);
  }
`;

// ---- Helper ----
export function latLngToVector3(lat, lng, r = 1.0) {
  const phi   = (90.0 - lat)  * (Math.PI / 180.0);
  const theta = (lng  + 180.0) * (Math.PI / 180.0);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta)
  );
}

export function vector3ToLatLng(v) {
  const n = v.clone().normalize();
  const lat = 90.0 - Math.acos(n.y) * (180.0 / Math.PI);
  const lng = (Math.atan2(n.z, -n.x) * (180.0 / Math.PI) + 180.0 + 180.0) % 360.0 - 180.0;
  return { lat, lng };
}

// ---- Globe class ----
export class Globe {
  constructor(scene, sunDirection = new THREE.Vector3(5, 3, 5).normalize()) {
    this.scene = scene;
    this.sunDirection = sunDirection.normalize();
    this.group = new THREE.Group();
    scene.add(this.group);

    this.earthMesh    = null;
    this.cloudsMesh   = null;
    this.atmosphereMesh = null;
    this.starsMesh    = null;
    this.cityDots     = null;

    this._texturesLoaded = false;
    this._buildFallback();
    this._loadTextures();
    this._buildAtmosphere();
    this._buildClouds();
    this._buildStars();
  }

  // --- Fallback: solid sphere while textures load ---
  _buildFallback() {
    const geo = new THREE.SphereGeometry(1, 64, 64);
    const mat = new THREE.MeshPhongMaterial({ color: 0x1a3a5c, shininess: 10 });
    this.earthMesh = new THREE.Mesh(geo, mat);
    this.earthMesh.name = 'earth';
    this.group.add(this.earthMesh);
  }

  _loadTextures() {
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = 'anonymous';

    const TEXTURES = {
      day:   'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
      night: 'https://unpkg.com/three-globe/example/img/earth-night.jpg',
      spec:  'https://unpkg.com/three-globe/example/img/earth-water.png',
    };

    const pending = Object.keys(TEXTURES).length;
    let loaded = 0;
    const results = {};

    for (const [key, url] of Object.entries(TEXTURES)) {
      loader.load(url,
        (tex) => {
          results[key] = tex;
          loaded++;
          if (loaded === pending) this._applyTextures(results);
        },
        undefined,
        () => {
          // Fallback: just count it done
          loaded++;
          if (loaded === pending) this._applyTextures(results);
        }
      );
    }
  }

  _applyTextures({ day, night, spec }) {
    const geo = new THREE.SphereGeometry(1, 128, 128);
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        dayMap:       { value: day   || null },
        nightMap:     { value: night || null },
        specMap:      { value: spec  || null },
        sunDirection: { value: this.sunDirection },
        camPos:       { value: new THREE.Vector3() },
      },
      vertexShader:   EARTH_VERT,
      fragmentShader: EARTH_FRAG,
    });

    // Replace fallback mesh in place so references still work
    this.group.remove(this.earthMesh);
    this.earthMesh = new THREE.Mesh(geo, mat);
    this.earthMesh.name = 'earth';
    this.group.add(this.earthMesh);
    this._texturesLoaded = true;
  }

  _buildAtmosphere() {
    const geo = new THREE.SphereGeometry(1.045, 64, 64);
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(0x3399ff) },
        intensity:  { value: 1.4 },
        power:      { value: 4.5 },
        camPos:     { value: new THREE.Vector3() },
      },
      vertexShader:   ATMO_VERT,
      fragmentShader: ATMO_FRAG,
      side:        THREE.FrontSide,
      blending:    THREE.AdditiveBlending,
      transparent: true,
      depthWrite:  false,
    });
    this.atmosphereMesh = new THREE.Mesh(geo, mat);
    this.atmosphereMesh.name = 'atmosphere';
    this.group.add(this.atmosphereMesh);
  }

  _buildClouds() {
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = 'anonymous';
    loader.load(
      'https://unpkg.com/three-globe/example/img/earth-clouds.png',
      (tex) => {
        const geo = new THREE.SphereGeometry(1.008, 64, 64);
        const mat = new THREE.MeshPhongMaterial({
          map: tex, transparent: true, opacity: 0.45,
          depthWrite: false, blending: THREE.NormalBlending,
        });
        this.cloudsMesh = new THREE.Mesh(geo, mat);
        this.cloudsMesh.name = 'clouds';
        this.group.add(this.cloudsMesh);
      }
    );
  }

  _buildStars() {
    const N = 8000;
    const positions = new Float32Array(N * 3);
    const sizes     = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      // Random unit vector, scaled to large sphere
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const r     = 400 + Math.random() * 200;
      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      sizes[i] = 0.5 + Math.random() * 1.5;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const mat = new THREE.PointsMaterial({
      color: 0xffffff, size: 0.8, sizeAttenuation: true,
      transparent: true, opacity: 0.9,
    });
    this.starsMesh = new THREE.Points(geo, mat);
    this.starsMesh.name = 'stars';
    this.scene.add(this.starsMesh); // Add to scene not group (shouldn't rotate)
  }

  // ---- City markers ----
  buildCityDots(cities) {
    if (this.cityDots) {
      this.group.remove(this.cityDots);
      this.cityDots.geometry.dispose();
      this.cityDots.material.dispose();
    }
    const N = cities.length;
    const positions = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const v = latLngToVector3(cities[i].lat, cities[i].lng, 1.002);
      positions[i * 3]     = v.x;
      positions[i * 3 + 1] = v.y;
      positions[i * 3 + 2] = v.z;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0x00ff41, size: 1.5, sizeAttenuation: false,
      transparent: true, opacity: 0.6,
    });
    this.cityDots = new THREE.Points(geo, mat);
    this.cityDots.name = 'cityDots';
    this.group.add(this.cityDots);
  }

  // ---- Per-frame update ----
  update(delta, camera) {
    // Slow rotation
    this.group.rotation.y += delta * 0.02;
    if (this.cloudsMesh) this.cloudsMesh.rotation.y += delta * 0.025;

    // Keep camera pos in shader uniforms fresh
    const camWorld = camera.position.clone();
    if (this._texturesLoaded && this.earthMesh.material.uniforms) {
      this.earthMesh.material.uniforms.camPos.value.copy(camWorld);
    }
    if (this.atmosphereMesh) {
      this.atmosphereMesh.material.uniforms.camPos.value.copy(camWorld);
    }
  }

  setAutoRotate(enable) {
    this._autoRotate = enable;
  }

  setAtmosphereVisible(v) {
    if (this.atmosphereMesh) this.atmosphereMesh.visible = v;
  }
  setCloudsVisible(v) {
    if (this.cloudsMesh) this.cloudsMesh.visible = v;
  }
  setStarsVisible(v) {
    if (this.starsMesh) this.starsMesh.visible = v;
  }
  setCityDotsVisible(v) {
    if (this.cityDots) this.cityDots.visible = v;
  }

  /** Convert a THREE.Vector3 world pos to lat/lng, accounting for globe group rotation */
  worldToLatLng(worldPos) {
    // Transform from world space to group local space
    const inv = new THREE.Matrix4().copy(this.group.matrixWorld).invert();
    const local = worldPos.clone().applyMatrix4(inv);
    return vector3ToLatLng(local);
  }

  /** Get local position on globe surface for given lat/lng */
  latLngToWorld(lat, lng, r = 1.0) {
    const local = latLngToVector3(lat, lng, r);
    return local.applyMatrix4(this.group.matrixWorld);
  }

  get earthMeshForRaycast() {
    return this.earthMesh;
  }
}
