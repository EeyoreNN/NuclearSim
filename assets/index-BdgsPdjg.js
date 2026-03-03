import{WebGLRenderer as w,SRGBColorSpace as y,ACESFilmicToneMapping as M,Scene as x,Clock as P,PerspectiveCamera as S,AmbientLight as b,DirectionalLight as D,Vector3 as l,ShaderMaterial as p,SphereGeometry as s,FrontSide as z,AdditiveBlending as _,Mesh as c,MeshBasicMaterial as h,TextureLoader as C,BackSide as T,Raycaster as R,Vector2 as k}from"./three-CpB-wl7P.js";import{OrbitControls as F}from"./OrbitControls-QgdTlOZf.js";class U{constructor(e){this._renderer=new w({canvas:e,antialias:!0,logarithmicDepthBuffer:!0}),this._renderer.setPixelRatio(Math.min(window.devicePixelRatio,2)),this._renderer.setSize(window.innerWidth,window.innerHeight),this._renderer.outputColorSpace=y,this._renderer.toneMapping=M,this._renderer.toneMappingExposure=.6,this._scene=new x,this._clock=new P,this._camera=new S(45,window.innerWidth/window.innerHeight,.1,1e3),this._camera.position.set(0,0,3.5);const t=new b(16777215,.1);this._scene.add(t),this._sun=new D(16777215,1),this._sunDir=new l(1,.2,.5).normalize(),this._sun.position.copy(this._sunDir),this._scene.add(this._sun),window.addEventListener("resize",()=>this.onResize())}get scene(){return this._scene}get camera(){return this._camera}get renderer(){return this._renderer}get clock(){return this._clock}get sunDir(){return this._sunDir}onResize(){this._camera.aspect=window.innerWidth/window.innerHeight,this._camera.updateProjectionMatrix(),this._renderer.setSize(window.innerWidth,window.innerHeight)}startRenderLoop(e){const t=()=>{requestAnimationFrame(t);const o=Math.min(this._clock.getDelta(),.1);e&&e(o),this._renderer.render(this._scene,this._camera)};t()}}const A=`
varying vec2 vUv;
varying vec3 vNormal;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,N=`
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
`;function V({dayMap:r,nightMap:e,specMap:t}){return new p({vertexShader:A,fragmentShader:N,uniforms:{dayMap:{value:r},nightMap:{value:e},specularMap:{value:t},sunDir:{value:new l(1,.2,.5).normalize()}}})}const j=`
varying vec3 vNormal;
varying vec3 eyeVector;

void main() {
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  eyeVector = normalize(worldPos.xyz - cameraPosition);
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,G=`
varying vec3 vNormal;
varying vec3 eyeVector;

uniform vec3 atmColor;   // default: vec3(0.2, 0.6, 1.0)
uniform float atmPower;  // default: 3.0

void main() {
  float intensity = pow(1.0 + dot(vNormal, eyeVector), atmPower);
  gl_FragColor = vec4(atmColor, intensity * 0.8);
}
`;function L(){const r=new s(1.08,64,64),e=new p({vertexShader:j,fragmentShader:G,uniforms:{atmColor:{value:new l(.2,.6,1)},atmPower:{value:3}},transparent:!0,depthWrite:!1,blending:_,side:z});return new c(r,e)}function E(r,e){const t=new s(1,64,64),o=e.load("textures/earth_daymap.jpg"),n=e.load("textures/earth_nightmap.jpg"),i=e.load("textures/earth_specular.jpg"),a=V({dayMap:o,nightMap:n,specMap:i}),d=new c(t,a);r.add(d);const g=new s(1.01,32,32),v=e.load("textures/earth_clouds.png"),f=new h({map:v,transparent:!0,opacity:.35,blending:_,depthWrite:!1}),m=new c(g,f);r.add(m);const u=L();return r.add(u),{earthMesh:d,cloudMesh:m,atmosphereMesh:u}}function H(r){r.rotation.y+=5e-4}function I(r){const t=new C().load("textures/stars_milkyway.jpg"),o=new s(500,64,64),n=new h({map:t,side:T}),i=new c(o,n);return r.add(i),i}class O{constructor(e,t){this._camera=e,this._domElement=t,this._raycaster=new R,this._mouse=new k,this._globeSphere=new c(new s(1,32,32),new h({visible:!1})),this._controls=new F(e,t),this._controls.enableDamping=!0,this._controls.dampingFactor=.08,this._controls.minDistance=1.3,this._controls.maxDistance=12,this._controls.enablePan=!1,this._controls.autoRotate=!1,this._controls.rotateSpeed=.5,this._controls.zoomSpeed=.8,this._flyTo=null,this._flyProgress=0}update(e){this._controls.update(),this._tickFlyTo(e)}flyTo(e,t,o=2.5){const n=(90-e)*Math.PI/180,i=(t+180)*Math.PI/180,a=new l(-o*Math.sin(n)*Math.cos(i),o*Math.cos(n),o*Math.sin(n)*Math.sin(i));this._flyTo={startPos:this._camera.position.clone(),endPos:a,totalFrames:60},this._flyProgress=0}getPickedLatLon(e){const t=this._domElement.getBoundingClientRect();this._mouse.set((e.clientX-t.left)/t.width*2-1,(e.clientY-t.top)/t.height*-2+1),this._raycaster.setFromCamera(this._mouse,this._camera);const o=this._raycaster.intersectObject(this._globeSphere,!1);if(o.length===0)return null;const n=o[0].point.normalize(),i=Math.asin(n.y)*180/Math.PI,a=Math.atan2(-n.z,n.x)*180/Math.PI;return{lat:i,lon:a}}setAutoRotate(e,t=.3){this._controls.autoRotate=e,this._controls.autoRotateSpeed=t}_tickFlyTo(e){if(!this._flyTo)return;this._flyProgress++;const t=this._flyProgress/this._flyTo.totalFrames,o=this._smoothstep(t);this._camera.position.lerpVectors(this._flyTo.startPos,this._flyTo.endPos,o),this._camera.lookAt(0,0,0),this._flyProgress>=this._flyTo.totalFrames&&(this._flyTo=null)}_smoothstep(e){const t=Math.max(0,Math.min(1,e));return t*t*(3-2*t)}}export{O as CameraController,U as SceneManager,E as buildGlobe,I as buildStarfield,L as createAtmosphereMesh,V as createDayNightMaterial,H as updateGlobe};
