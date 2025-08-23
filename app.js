
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import SimplexNoise from 'https://unpkg.com/simplex-noise@4.0.1/dist/esm/simplex-noise.js';

const container = document.getElementById('blob-canvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.1, 100);
camera.position.set(0, 0, 4);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);

// Lights
const pink = new THREE.PointLight(0xFF2EC4, 2, 10);
pink.position.set(2, 1, 2);
scene.add(pink);
const cyan = new THREE.PointLight(0x00E7FF, 2, 10);
cyan.position.set(-2, -1, 1);
scene.add(cyan);
scene.add(new THREE.AmbientLight(0x404040));

// Geometry & material
const radius = 1.2;
const geo = new THREE.SphereGeometry(radius, 160, 160);
const mat = new THREE.MeshStandardMaterial({
  color: 0x8A5DFF, metalness: 0.45, roughness: 0.2,
  emissive: 0x220033, emissiveIntensity: 0.9
});
const mesh = new THREE.Mesh(geo, mat);
scene.add(mesh);

// Displacement
const base = geo.attributes.position.array.slice();
const simplex = new SimplexNoise();
let t = 0;
function animate() {
  t += 0.003;
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const ix = i * 3;
    const x = base[ix], y = base[ix+1], z = base[ix+2];
    const nx = x / radius, ny = y / radius, nz = z / radius;
    const noise = simplex.noise4D(nx*1.1, ny*1.1, nz*1.1, t) * 0.2;
    const r = radius + noise;
    const len = Math.sqrt(nx*nx + ny*ny + nz*nz) || 1.0;
    pos.array[ix]   = (nx/len) * r;
    pos.array[ix+1] = (ny/len) * r;
    pos.array[ix+2] = (nz/len) * r;
  }
  pos.needsUpdate = true;
  mesh.rotation.y += 0.002;
  pink.position.x = Math.sin(t*1.6)*2.2;
  cyan.position.y = Math.cos(t*1.2)*1.8;
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();
function onResize(){
  const w = container.clientWidth, h = container.clientHeight;
  renderer.setSize(w, h); camera.aspect = w/h; camera.updateProjectionMatrix();
}
window.addEventListener('resize', onResize);


// --- Neon 3D Smoke / Wave shader ---
(function(){
  const mount = document.getElementById('wave3d');
  if(!mount) return;
  const W = mount.clientWidth || window.innerWidth;
  const H = mount.clientHeight || window.innerHeight;

  const renderer = new THREE.WebGLRenderer({antialias:true, alpha:true});
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
  renderer.setSize(W, H);
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1,1,1,-1,0,1);

  const uniforms = {
    u_time: { value: 0 },
    u_res: { value: new THREE.Vector2(W, H) },
    u_intensity: { value: 1.0 },
    u_col1: { value: new THREE.Color(0xff2ec4) },
    u_col2: { value: new THREE.Color(0x00e7ff) },
    u_col3: { value: new THREE.Color(0x8a5dff) }
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `
      void main(){
        gl_Position = vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;
      uniform vec2 u_res;
      uniform float u_time;
      uniform float u_intensity;
      uniform vec3 u_col1;
      uniform vec3 u_col2;
      uniform vec3 u_col3;

      // 2D random / noise helpers
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123); }

      float noise(vec2 p){
        vec2 i = floor(p); vec2 f = fract(p);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        vec2 u = f*f*(3.0-2.0*f);
        return mix(a, b, u.x) + (c - a)*u.y*(1.0 - u.x) + (d - b)*u.x*u.y;
      }

      float fbm(vec2 p){
        float v = 0.0;
        float a = 0.5;
        for(int i=0;i<6;i++){
          v += a * noise(p);
          p *= 2.0;
          a *= 0.5;
        }
        return v;
      }

      void main(){
        vec2 uv = gl_FragCoord.xy / u_res.xy;
        vec2 p = (uv - 0.5) * vec2(u_res.x/u_res.y, 1.0);

        float t = u_time * 0.08;

        // layered flow fields
        float n1 = fbm(p*1.6 + vec2(t, -t));
        float n2 = fbm(p*2.4 + vec2(-t*0.6, t*0.4));
        float n3 = fbm(p*3.0 + vec2(t*0.3, t*0.9));

        // soft masks for blobby shapes
        float mask1 = smoothstep(0.35, 0.75, n1);
        float mask2 = smoothstep(0.40, 0.80, n2);
        float mask3 = smoothstep(0.45, 0.85, n3);

        vec3 col = vec3(0.0);
        col += u_col1 * mask1;
        col += u_col2 * mask2;
        col += u_col3 * mask3;

        // glow + vignette
        float glow = pow(mask1+mask2+mask3, 2.2) * 0.9;
        col += glow * 0.15;

        float vign = smoothstep(1.2, 0.2, length(p));
        col *= vign;

        // overall intensity
        col *= (0.7 + 0.6*u_intensity);

        gl_FragColor = vec4(col, 0.90);
      }
    `,
    transparent: true
  });

  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2,2), material);
  scene.add(quad);

  function onResize(){
    const w = mount.clientWidth || window.innerWidth;
    const h = mount.clientHeight || window.innerHeight;
    renderer.setSize(w, h);
    uniforms.u_res.value.set(w, h);
  }
  window.addEventListener('resize', onResize);

  const clock = new THREE.Clock();
  function animate(){
    uniforms.u_time.value += clock.getDelta();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();
})();
