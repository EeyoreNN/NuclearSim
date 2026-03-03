import{Group as x,Vector3 as m,SphereGeometry as h,MeshPhongMaterial as p,Mesh as c,TextureLoader as v,ShaderMaterial as g,AdditiveBlending as b,FrontSide as D,Color as P,NormalBlending as _,BufferGeometry as M,BufferAttribute as d,PointsMaterial as f,Points as y,Matrix4 as A}from"./three-CpB-wl7P.js";const z=`
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPos;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,T=`
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
`,N=`
  varying vec3 vNormal;
  varying vec3 vWorldPos;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,W=`
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
`;function w(l,t,e=1){const o=(90-l)*(Math.PI/180),s=(t+180)*(Math.PI/180);return new m(-e*Math.sin(o)*Math.cos(s),e*Math.cos(o),e*Math.sin(o)*Math.sin(s))}function S(l){const t=l.clone().normalize(),e=90-Math.acos(t.y)*(180/Math.PI),o=(Math.atan2(t.z,-t.x)*(180/Math.PI)+180+180)%360-180;return{lat:e,lng:o}}class C{constructor(t,e=new m(5,3,5).normalize()){this.scene=t,this.sunDirection=e.normalize(),this.group=new x,t.add(this.group),this.earthMesh=null,this.cloudsMesh=null,this.atmosphereMesh=null,this.starsMesh=null,this.cityDots=null,this._texturesLoaded=!1,this._buildFallback(),this._loadTextures(),this._buildAtmosphere(),this._buildClouds(),this._buildStars()}_buildFallback(){const t=new h(1,64,64),e=new p({color:1718876,shininess:10});this.earthMesh=new c(t,e),this.earthMesh.name="earth",this.group.add(this.earthMesh)}_loadTextures(){const t=new v;t.crossOrigin="anonymous";const e={day:"https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg",night:"https://unpkg.com/three-globe/example/img/earth-night.jpg",spec:"https://unpkg.com/three-globe/example/img/earth-water.png"},o=Object.keys(e).length;let s=0;const a={};for(const[i,r]of Object.entries(e))t.load(r,n=>{a[i]=n,s++,s===o&&this._applyTextures(a)},void 0,()=>{s++,s===o&&this._applyTextures(a)})}_applyTextures({day:t,night:e,spec:o}){const s=new h(1,128,128),a=new g({uniforms:{dayMap:{value:t||null},nightMap:{value:e||null},specMap:{value:o||null},sunDirection:{value:this.sunDirection},camPos:{value:new m}},vertexShader:z,fragmentShader:T});this.group.remove(this.earthMesh),this.earthMesh=new c(s,a),this.earthMesh.name="earth",this.group.add(this.earthMesh),this._texturesLoaded=!0}_buildAtmosphere(){const t=new h(1.045,64,64),e=new g({uniforms:{glowColor:{value:new P(3381759)},intensity:{value:1.4},power:{value:4.5},camPos:{value:new m}},vertexShader:N,fragmentShader:W,side:D,blending:b,transparent:!0,depthWrite:!1});this.atmosphereMesh=new c(t,e),this.atmosphereMesh.name="atmosphere",this.group.add(this.atmosphereMesh)}_buildClouds(){const t=new v;t.crossOrigin="anonymous",t.load("https://unpkg.com/three-globe/example/img/earth-clouds.png",e=>{const o=new h(1.008,64,64),s=new p({map:e,transparent:!0,opacity:.45,depthWrite:!1,blending:_});this.cloudsMesh=new c(o,s),this.cloudsMesh.name="clouds",this.group.add(this.cloudsMesh)})}_buildStars(){const e=new Float32Array(24e3),o=new Float32Array(8e3);for(let i=0;i<8e3;i++){const r=Math.random()*Math.PI*2,n=Math.acos(2*Math.random()-1),u=400+Math.random()*200;e[i*3]=u*Math.sin(n)*Math.cos(r),e[i*3+1]=u*Math.cos(n),e[i*3+2]=u*Math.sin(n)*Math.sin(r),o[i]=.5+Math.random()*1.5}const s=new M;s.setAttribute("position",new d(e,3)),s.setAttribute("size",new d(o,1));const a=new f({color:16777215,size:.8,sizeAttenuation:!0,transparent:!0,opacity:.9});this.starsMesh=new y(s,a),this.starsMesh.name="stars",this.scene.add(this.starsMesh)}buildCityDots(t){this.cityDots&&(this.group.remove(this.cityDots),this.cityDots.geometry.dispose(),this.cityDots.material.dispose());const e=t.length,o=new Float32Array(e*3);for(let i=0;i<e;i++){const r=w(t[i].lat,t[i].lng,1.002);o[i*3]=r.x,o[i*3+1]=r.y,o[i*3+2]=r.z}const s=new M;s.setAttribute("position",new d(o,3));const a=new f({color:65345,size:1.5,sizeAttenuation:!1,transparent:!0,opacity:.6});this.cityDots=new y(s,a),this.cityDots.name="cityDots",this.group.add(this.cityDots)}update(t,e){this.group.rotation.y+=t*.02,this.cloudsMesh&&(this.cloudsMesh.rotation.y+=t*.025);const o=e.position.clone();this._texturesLoaded&&this.earthMesh.material.uniforms&&this.earthMesh.material.uniforms.camPos.value.copy(o),this.atmosphereMesh&&this.atmosphereMesh.material.uniforms.camPos.value.copy(o)}setAutoRotate(t){this._autoRotate=t}setAtmosphereVisible(t){this.atmosphereMesh&&(this.atmosphereMesh.visible=t)}setCloudsVisible(t){this.cloudsMesh&&(this.cloudsMesh.visible=t)}setStarsVisible(t){this.starsMesh&&(this.starsMesh.visible=t)}setCityDotsVisible(t){this.cityDots&&(this.cityDots.visible=t)}worldToLatLng(t){const e=new A().copy(this.group.matrixWorld).invert(),o=t.clone().applyMatrix4(e);return S(o)}latLngToWorld(t,e,o=1){return w(t,e,o).applyMatrix4(this.group.matrixWorld)}get earthMeshForRaycast(){return this.earthMesh}}export{C as Globe,w as latLngToVector3,S as vector3ToLatLng};
