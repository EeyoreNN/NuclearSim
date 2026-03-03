import{BufferGeometry as S,BufferAttribute as v,LineBasicMaterial as T,AdditiveBlending as A,Line as G,SphereGeometry as L,MeshBasicMaterial as W,Mesh as q,CatmullRomCurve3 as O,Vector3 as f,ShaderMaterial as X,Points as $,Group as D,Quaternion as Y}from"./three-CpB-wl7P.js";function x(h,e,s=1){const t=(90-h)*(Math.PI/180),o=(e+180)*(Math.PI/180);return new f(-s*Math.sin(t)*Math.cos(o),s*Math.cos(t),s*Math.sin(t)*Math.sin(o))}function Z(h,e,s){const t=Math.max(-1,Math.min(1,h.dot(e))),o=Math.acos(t);if(o<1e-6)return h.clone().lerp(e,s).normalize();const a=Math.sin(o),n=Math.sin((1-s)*o)/a,r=Math.sin(s*o)/a;return new f(n*h.x+r*e.x,n*h.y+r*e.y,n*h.z+r*e.z)}function Q(h,e,s){const o=[];for(let a=0;a<=64;a++){const n=a/64,r=Z(h,e,n),c=1+s*Math.sin(n*Math.PI);o.push(r.multiplyScalar(c))}return o}class ct{constructor(e){this._scene=e,this._flights=new Map,this._nextId=0}addFlight(e,s,t,o,a={}){const{color:n=65345,arcHeight:r=null,duration_ms:c=8e3,warheadId:l=null}=a,i=this._nextId++,d=x(e,s,1).normalize(),m=x(t,o,1).normalize(),u=Math.acos(Math.max(-1,Math.min(1,d.dot(m)))),p=r!==null?r:.4*u/Math.PI,g=Q(d,m,p),y=g.length-1,_=new Float32Array(g.length*3);g.forEach((b,z)=>{_[z*3]=b.x,_[z*3+1]=b.y,_[z*3+2]=b.z});const M=new S;M.setAttribute("position",new v(_,3)),M.setDrawRange(0,0);const F=new T({color:n,transparent:!0,opacity:.95,depthWrite:!1,blending:A}),k=new G(M,F);this._scene.add(k);const N=new L(.006,6,6),H=new W({color:n,transparent:!0,opacity:1,depthWrite:!1,blending:A}),R=new q(N,H);R.position.copy(g[0]),this._scene.add(R);const B=new O(g);return this._flights.set(i,{trail:k,trailGeo:M,trailMat:F,warhead:R,wGeo:N,wMat:H,curve:B,points:g,segments:y,elapsed:0,duration:c/1e3,endLat:t,endLon:o,warheadId:l,completed:!1,fadeTimer:null}),i}removeFlight(e){const s=this._flights.get(e);s&&(s.fadeTimer&&clearTimeout(s.fadeTimer),this._scene.remove(s.trail),this._scene.remove(s.warhead),s.trailGeo.dispose(),s.trailMat.dispose(),s.wGeo.dispose(),s.wMat.dispose(),this._flights.delete(e))}update(e){for(const[s,t]of this._flights){if(t.completed)continue;t.elapsed+=e;const o=Math.min(1,t.elapsed/t.duration),a=Math.round(o*(t.segments+1));if(t.trailGeo.setDrawRange(0,a),o<1){const n=t.curve.getPointAt(Math.min(o+.01,1));t.warhead.position.copy(n)}if(o>=1&&!t.completed){t.completed=!0,t.warhead.visible=!1,window.dispatchEvent(new CustomEvent("missile:detonated",{detail:{lat:t.endLat,lon:t.endLon,warheadId:t.warheadId,flightId:s}}));const n=5;t.fadeTimer=setTimeout(()=>this.removeFlight(s),n*1e3),(()=>{const c=.016666666666666666,l=()=>{if(!this._flights.has(s))return;const i=this._flights.get(s);!i||!i.trailMat||(i.trailMat.opacity=Math.max(0,i.trailMat.opacity-c/n),i.trailMat.opacity>0&&requestAnimationFrame(l))};requestAnimationFrame(l)})()}}}clearAll(){for(const[e]of[...this._flights])this.removeFlight(e)}}const j=`
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
`,J=`
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
`;function K(h=30){return new X({uniforms:{maxAge:{value:h},uRiseProgress:{value:0}},vertexShader:j,fragmentShader:J,transparent:!0,depthWrite:!1,blending:A})}const U=30,tt=3,w=2e3;function et(){const h=new Float32Array(w*3),e=new Float32Array(w),s=new Float32Array(w);for(let o=0;o<w;o++){const a=o/w,n=.55;let r,c,l;if(a<n){const i=a/n,d=(.03+Math.random()*.03)*(1+i*.35),m=Math.random()*Math.PI*2;r=d*Math.cos(m),l=d*Math.sin(m),c=i*.45+Math.random()*.03}else{const d=.12+(a-n)/(1-n)*.06,m=.04+Math.random()*.04,u=Math.random()*Math.PI*2,p=Math.random()*Math.PI*2;r=(d+m*Math.cos(p))*Math.cos(u),l=(d+m*Math.cos(p))*Math.sin(u),c=.5+m*Math.sin(p)*.5}h[o*3]=r,h[o*3+1]=c,h[o*3+2]=l,e[o]=0,s[o]=2.5+Math.random()*5}const t=new S;return t.setAttribute("position",new v(h,3)),t.setAttribute("age",new v(e,1)),t.setAttribute("size",new v(s,1)),t}class lt{constructor(e){this._scene=e,this._clouds=new Map,this._nextId=0}detonate(e,s,t){const o=this._nextId++,a=x(e,s,1),n=Math.pow(Math.max(1,t),.4)*.01,r=et(),c=K(U),l=new $(r,c),i=new D;i.add(l);const d=a.clone().normalize();i.position.copy(d.clone().multiplyScalar(1.001));const m=new f(0,1,0),u=new Y().setFromUnitVectors(m,d);return i.setRotationFromQuaternion(u),i.scale.setScalar(n*.05),this._scene.add(i),this._clouds.set(o,{group:i,geo:r,mat:c,elapsed:0,scale:n}),o}update(e){for(const[s,t]of this._clouds){t.elapsed+=e;const{elapsed:o,geo:a,mat:n,scale:r}=t,c=Math.min(1,o/tt),l=c*c*(3-2*c),i=r*(.15+l*.85),d=r*l;t.group.scale.set(i,d,i),n.uniforms.uRiseProgress.value=l;const m=a.attributes.age,u=o;for(let p=0;p<m.count;p++)m.array[p]=u;m.needsUpdate=!0,o>=U+2&&this.remove(s)}}remove(e){const s=this._clouds.get(e);s&&(this._scene.remove(s.group),s.geo.dispose(),s.mat.dispose(),this._clouds.delete(e))}clearAll(){for(const[e]of this._clouds)this.remove(e)}}const I=128,P=1.003;class ht{constructor(e){this._scene=e,this._rings=new Map,this._nextId=0}spawn(e,s,t,o=3e3){const a=this._nextId++,n=x(e,s,1).normalize(),r=Math.abs(n.y)<.99?new f(0,1,0):new f(1,0,0),c=new f().crossVectors(r,n).normalize(),l=new f().crossVectors(n,c).normalize(),i=new Float32Array((I+1)*3),d=new S;d.setAttribute("position",new v(i,3));const m=new T({color:16737792,transparent:!0,opacity:.95,depthWrite:!1,blending:A}),u=new G(d,m);return this._scene.add(u),this._rings.set(a,{ring:u,geo:d,mat:m,norm:n,t1:c,t2:l,maxRadius:t,duration:o/1e3,elapsed:0}),a}update(e){for(const[s,t]of this._rings){t.elapsed+=e;const o=Math.min(1,t.elapsed/t.duration),a=t.maxRadius*o,n=Math.max(0,.95*(1-o)),{norm:r,t1:c,t2:l}=t,i=Math.sin(a),d=Math.cos(a),m=t.geo.attributes.position;for(let u=0;u<=I;u++){const p=u/I*Math.PI*2,g=Math.cos(p),y=Math.sin(p),_=d*r.x+i*(g*c.x+y*l.x),M=d*r.y+i*(g*c.y+y*l.y),F=d*r.z+i*(g*c.z+y*l.z);m.setXYZ(u,_*P,M*P,F*P)}m.needsUpdate=!0,t.mat.opacity=n,t.elapsed>=t.duration&&(this._scene.remove(t.ring),t.geo.dispose(),t.mat.dispose(),this._rings.delete(s))}}clearAll(){for(const[e,s]of this._rings)this._scene.remove(s.ring),s.geo.dispose(),s.mat.dispose();this._rings.clear()}}class dt{constructor(){let e=document.getElementById("thermal-flash");e||(e=document.createElement("div"),e.id="thermal-flash",document.body.appendChild(e)),Object.assign(e.style,{position:"fixed",top:"0",left:"0",width:"100vw",height:"100vh",background:"white",opacity:"0",pointerEvents:"none",zIndex:"9999",transition:"none"}),this._el=e,this._timer=null}trigger(e=1,s=400){const t=this._el,o=Math.max(0,Math.min(1,e));this._timer&&(clearTimeout(this._timer),this._timer=null),t.style.transition="none",t.style.opacity=String(o),t.offsetHeight,t.style.transition=`opacity ${s}ms ease-out`,t.style.opacity="0",this._timer=setTimeout(()=>{t.style.transition="none",t.style.opacity="0",this._timer=null},s+50)}}const st=6371,V=128,E=1.003,ot=[{key:"psi_20",source:"blast",color:16711680,opacity:.9},{key:"psi_5",source:"blast",color:16737792,opacity:.85},{key:"psi_2",source:"blast",color:16755200,opacity:.8},{key:"psi_1",source:"blast",color:16776960,opacity:.75},{key:"psi_0_5",source:"blast",color:65535,opacity:.7},{key:"cal_8",source:"thermal",color:16711935,opacity:.7}];function nt(h,e,s,t){if(e<=0)return null;const o=e/st,a=h.clone().normalize(),n=Math.abs(a.y)<.99?new f(0,1,0):new f(1,0,0),r=new f().crossVectors(n,a).normalize(),c=new f().crossVectors(a,r).normalize(),l=Math.sin(o),i=Math.cos(o),d=[];for(let p=0;p<=V;p++){const g=p/V*Math.PI*2,y=Math.cos(g),_=Math.sin(g);d.push(new f((i*a.x+l*(y*r.x+_*c.x))*E,(i*a.y+l*(y*r.y+_*c.y))*E,(i*a.z+l*(y*r.z+_*c.z))*E))}const m=new S().setFromPoints(d),u=new T({color:s,transparent:!0,opacity:t,depthWrite:!1});return new G(m,u)}class mt{constructor(e){this._scene=e,this._overlays=new Map,this._nextId=0}addRings(e,s,t,o){const a=this._nextId++,n=x(e,s,1),r=new D;for(const c of ot){const l=c.source==="blast"?t:o;if(!l)continue;const i=l[c.key];if(!i||i<=0)continue;const d=nt(n,i,c.color,c.opacity);d&&r.add(d)}return this._scene.add(r),this._overlays.set(a,r),a}removeRings(e){const s=this._overlays.get(e);s&&(s.traverse(t=>{t.geometry&&t.geometry.dispose(),t.material&&t.material.dispose()}),this._scene.remove(s),this._overlays.delete(e))}clearAll(){for(const[e]of this._overlays)this.removeRings(e)}}const at=6371,C=h=>new Promise(e=>setTimeout(e,h));function it(){try{const e=(typeof import.meta<"u"&&"/NuclearSim/"||"/").replace(/\/$/,"")+"/sounds/detonation.mp3",s=new Audio(e);s.volume=.65,s.play().catch(()=>{})}catch{}}class ut{constructor(e,s,t,o){this._flash=e,this._shockwave=s,this._cloud=t,this._overlay=o}async detonate(e,s,t,o,a){const n=Math.min(1,Math.log10(Math.max(1,t))/4);this._flash.trigger(n,400);const c=(o?.psi_0_5??1)/at;this._shockwave.spawn(e,s,c,3e3),await C(200),this._cloud.detonate(e,s,t),await C(300);const l=this._overlay.addRings(e,s,o,a);return await C(100),it(),l}}export{mt as BlastRingOverlay,ut as DetonationSequence,ct as MissileTrajectory,lt as MushroomCloud,ht as ShockwaveRing,dt as ThermalFlash,K as createMushroomMaterial,x as latLonToVector3,J as mushroomFragmentShader,j as mushroomVertexShader};
