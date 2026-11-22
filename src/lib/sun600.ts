import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

const RAINBOW = [0xe4322b, 0xf08a24, 0xf6c623, 0x4cae4f, 0x1f7fc4];

function stripesTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 32;
  const g = c.getContext("2d")!;
  g.fillStyle = "#f4f7f8";
  g.fillRect(0, 0, 256, 32);
  g.fillStyle = "rgba(120,135,145,0.35)";
  for (let y = 2; y < 32; y += 4) g.fillRect(0, y, 256, 1);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function shadowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  grad.addColorStop(0, "rgba(28,25,23,0.55)");
  grad.addColorStop(1, "rgba(28,25,23,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

/** A Polaroid Sun 600 built from primitives: wedge body, rainbow stripe, lens, flash bar. */
function buildCamera() {
  const camera = new THREE.Group();
  const plastic = new THREE.MeshPhysicalMaterial({
    color: 0x161514,
    roughness: 0.5,
    clearcoat: 0.35,
    clearcoatRoughness: 0.55,
  });
  const black = new THREE.MeshStandardMaterial({ color: 0x0b0b0b, roughness: 0.7 });
  const chrome = new THREE.MeshStandardMaterial({ color: 0xd9d9d9, metalness: 1, roughness: 0.22 });

  // Side profile (x = depth toward viewer, y = height), extruded across the width.
  const W = 1.5;
  const profile = new THREE.Shape();
  profile.moveTo(-0.55, 0);
  profile.lineTo(0.5, 0);
  profile.lineTo(0.5, 0.62);
  profile.lineTo(0.28, 0.98);
  profile.lineTo(-0.55, 1.02);
  profile.closePath();
  const bodyGeo = new THREE.ExtrudeGeometry(profile, {
    depth: W,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.05,
    bevelSegments: 5,
  });
  bodyGeo.translate(0, -0.5, -W / 2);
  bodyGeo.rotateY(-Math.PI / 2);
  camera.add(new THREE.Mesh(bodyGeo, plastic));

  const front = 0.55;

  // Rainbow stripe down the sloped brow.
  const brow = new THREE.Group();
  const slope = Math.atan2(0.22, 0.36);
  brow.rotation.x = -slope;
  brow.position.set(0, 0.3 + 0.521 * 0.057, 0.39 + 0.853 * 0.057);
  RAINBOW.forEach((color, i) => {
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.44, 0.012),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.45, roughness: 0.45 }),
    );
    stripe.position.x = (i - 2) * 0.05;
    brow.add(stripe);
  });
  camera.add(brow);

  // Flash bar on top of the brow.
  const flashHousing = new THREE.Mesh(new RoundedBoxGeometry(1.25, 0.2, 0.24, 4, 0.04), plastic);
  flashHousing.position.set(0, 0.5, 0.22);
  camera.add(flashHousing);
  const flashMat = new THREE.MeshStandardMaterial({
    map: stripesTexture(),
    emissive: 0xffffff,
    emissiveIntensity: 0.04,
    roughness: 0.15,
  });
  const flashFace = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.13), flashMat);
  flashFace.position.set(0, 0.5, 0.341);
  camera.add(flashFace);

  // Lens: barrel, chrome ring, glass.
  const lensY = -0.17;
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.3, 0.14, 48), black);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, lensY, front + 0.07);
  camera.add(barrel);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.235, 0.02, 16, 64), chrome);
  ring.position.set(0, lensY, front + 0.145);
  camera.add(ring);
  const glass = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 48, 24, 0, Math.PI * 2, 0, Math.PI / 5),
    new THREE.MeshPhysicalMaterial({ color: 0x0d1c2b, roughness: 0.04, clearcoat: 1, metalness: 0.2 }),
  );
  glass.rotation.x = Math.PI / 2;
  glass.position.set(0, lensY, front + 0.0);
  glass.scale.set(1, 1, 1);
  camera.add(glass);

  // Electric eye, shutter button, film slot, viewfinder.
  const eye = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 32), glass.material);
  eye.rotation.x = Math.PI / 2;
  eye.position.set(0.5, -0.02, front + 0.015);
  camera.add(eye);
  const shutter = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.07, 0.05, 32),
    new THREE.MeshStandardMaterial({ color: 0xd1342c, roughness: 0.35 }),
  );
  shutter.rotation.x = Math.PI / 2;
  shutter.position.set(-0.52, -0.1, front + 0.025);
  camera.add(shutter);
  const slot = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.03, 0.02), black);
  slot.position.set(0, -0.47, front + 0.01);
  camera.add(slot);
  const finder = new THREE.Mesh(new RoundedBoxGeometry(0.32, 0.14, 0.3, 3, 0.03), plastic);
  finder.position.set(0.45, 0.58, -0.3);
  camera.add(finder);

  return { camera, flashMat };
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Plays the intro on `canvas`: the camera turns to face the viewer, then fires its flash. Returns a cleanup function. */
export function playSun600(
  canvas: HTMLCanvasElement,
  { onFlash, onDone }: { onFlash: () => void; onDone: () => void },
) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.45;

  const view = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  view.position.set(0, 0.15, 5.4);
  view.lookAt(0, 0, 0);

  scene.add(new THREE.HemisphereLight(0xfff4e6, 0x3a2f25, 0.6));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(3, 4, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffe2c4, 1.6);
  rim.position.set(-4, 2, -3);
  scene.add(rim);
  const flashLight = new THREE.PointLight(0xffffff, 0, 8);
  flashLight.position.set(0, 0.5, 1.2);
  scene.add(flashLight);

  const { camera, flashMat } = buildCamera();
  scene.add(camera);
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.8, 1.6),
    new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -0.58;
  scene.add(shadow);

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = canvas;
    renderer.setSize(w, h, false);
    view.aspect = w / h;
    // Pull back on narrow screens so the whole camera stays in frame.
    view.position.z = Math.max(5.4, 1.5 / (Math.tan(THREE.MathUtils.degToRad(view.fov / 2)) * view.aspect));
    view.updateProjectionMatrix();
  };
  resize();
  addEventListener("resize", resize);

  const TURN = 2.2;
  const FLASH = 2.6;
  let flashed = false;
  let done = false;
  let raf = 0;
  const t0 = performance.now();

  const frame = (now: number) => {
    const t = (now - t0) / 1000;
    const k = easeInOut(Math.min(t / TURN, 1));
    // Turns from a side view to a slight three-quarter view, aimed at the visitor.
    camera.rotation.y = -1.1 + 0.85 * k + Math.sin(t * 1.3) * 0.015;
    camera.rotation.x = 0.22 - 0.1 * k;
    camera.position.z = -0.8 + 1.0 * k;
    camera.position.y = Math.sin(t * 1.6) * 0.012;
    shadow.position.z = camera.position.z;

    if (t >= FLASH && !flashed) {
      flashed = true;
      onFlash();
    }
    if (flashed) {
      const f = Math.max(0, 1 - (t - FLASH) / 0.35);
      flashMat.emissiveIntensity = 0.04 + 30 * f;
      flashLight.intensity = 60 * f;
    }
    if (t >= FLASH + 0.12 && !done) {
      done = true;
      onDone();
    }
    renderer.render(scene, view);
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  return () => {
    cancelAnimationFrame(raf);
    removeEventListener("resize", resize);
    pmrem.dispose();
    scene.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => {
          m.map?.dispose();
          m.dispose();
        });
      }
    });
    renderer.dispose();
  };
}
