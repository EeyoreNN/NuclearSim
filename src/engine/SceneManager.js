import * as THREE from 'three';

/**
 * SceneManager — Core Three.js scene, renderer, camera, and render loop.
 * Globe radius = 1.0 Three.js units = 6371 km.
 */
export class SceneManager {
  constructor(canvasEl) {
    // Renderer
    this._renderer = new THREE.WebGLRenderer({
      canvas: canvasEl,
      antialias: true,
      logarithmicDepthBuffer: true,
    });
    this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this._renderer.setSize(window.innerWidth, window.innerHeight);
    this._renderer.outputColorSpace = THREE.SRGBColorSpace;
    this._renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this._renderer.toneMappingExposure = 0.6;

    // Scene
    this._scene = new THREE.Scene();

    // Clock
    this._clock = new THREE.Clock();

    // Camera — 45° FOV, near=0.1, far=1000
    this._camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    this._camera.position.set(0, 0, 3.5);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.1);
    this._scene.add(ambient);

    this._sun = new THREE.DirectionalLight(0xffffff, 1.0);
    this._sunDir = new THREE.Vector3(1, 0.2, 0.5).normalize();
    this._sun.position.copy(this._sunDir);
    this._scene.add(this._sun);

    // Resize handler
    window.addEventListener('resize', () => this.onResize());
  }

  get scene()    { return this._scene;    }
  get camera()   { return this._camera;   }
  get renderer() { return this._renderer; }
  get clock()    { return this._clock;    }
  get sunDir()   { return this._sunDir;   }

  onResize() {
    this._camera.aspect = window.innerWidth / window.innerHeight;
    this._camera.updateProjectionMatrix();
    this._renderer.setSize(window.innerWidth, window.innerHeight);
  }

  /**
   * Start the RAF render loop.
   * @param {function(delta: number): void} updateFn  Called each frame with delta seconds.
   */
  startRenderLoop(updateFn) {
    const loop = () => {
      requestAnimationFrame(loop);
      const delta = Math.min(this._clock.getDelta(), 0.1);
      if (updateFn) updateFn(delta);
      this._renderer.render(this._scene, this._camera);
    };
    loop();
  }
}
