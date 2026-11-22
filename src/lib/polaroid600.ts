import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/** Where the face-down print should end up, in CSS pixels of the viewport. */
export type Landing = { x: number; y: number; width: number; height: number; tilt: number };

type Hooks = {
  /** Fires when the flash goes off. */
  onFlash: () => void;
  /** Fires as the view starts pulling back to the desk. */
  onReveal: () => void;
  /** Fires when the print touches down on the desk. */
  onLand: () => void;
  onError: () => void;
  /** Measured once the zoom-out begins, after the page has settled. */
  landing: () => Landing | null;
};

// Positions on the model, in its normalized frame (centered, longest side = 2).
const SLOT = new THREE.Vector3(0.076, -0.8, 0.9);
const FLASH_AT = new THREE.Vector3(0.45, 0.73, 0.9);
const BASE = 0.948;

// Timeline, in seconds after the model has loaded.
const FLASH = 1.5;
const EJECT = [1.75, 3.0] as const;
const ZOOM = [3.2, 5.3] as const;
const FADE_CAMERA = [4.3, 5.1] as const;

const clamp01 = (t: number) => Math.min(Math.max(t, 0), 1);
const span = (t: number, [a, b]: readonly [number, number]) => clamp01((t - a) / (b - a));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

function canvasTexture(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** A Polaroid 600 print: white frame with an undeveloped image on the front, "developing now…" in marker on the back. */
function buildPrint(aspect: number) {
  const W = 1.15;
  const L = W * aspect;
  const px = 512;
  const front = canvasTexture(px, Math.round(px * aspect), (g) => {
    const h = px * aspect;
    g.fillStyle = "#f7f3ea";
    g.fillRect(0, 0, px, h);
    const pad = px * 0.06;
    const img = g.createLinearGradient(0, pad, 0, pad + px - 2 * pad);
    img.addColorStop(0, "#2b2723");
    img.addColorStop(1, "#3d3630");
    g.fillStyle = img;
    g.fillRect(pad, pad, px - 2 * pad, px - 2 * pad);
  });
  const back = canvasTexture(px, Math.round(px * aspect), (g) => {
    const h = px * aspect;
    const bg = g.createLinearGradient(0, 0, px, h);
    bg.addColorStop(0, "#252321");
    bg.addColorStop(1, "#171615");
    g.fillStyle = bg;
    g.fillRect(0, 0, px, h);
    g.save();
    g.translate(px / 2, h * 0.47);
    g.rotate(THREE.MathUtils.degToRad(-4));
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillStyle = "#f2eee6";
    g.font = `${px * 0.11}px "Permanent Marker", "Marker Felt", cursive`;
    g.fillText("developing now…", 0, 0);
    g.fillStyle = "rgba(242,238,230,0.7)";
    g.font = `500 ${px * 0.085}px Caveat, "Bradley Hand", cursive`;
    g.fillText("more memories on the way", 0, px * 0.13);
    g.restore();
  });
  // The back faces the desk until the print flips, so its texture is drawn upside down.
  back.center.set(0.5, 0.5);
  back.rotation = Math.PI;
  const edge = new THREE.MeshStandardMaterial({ color: 0xefe9dd, roughness: 0.8 });
  const print = new THREE.Mesh(new THREE.BoxGeometry(W, 0.012, L), [
    edge,
    edge,
    new THREE.MeshStandardMaterial({ map: front, roughness: 0.55 }),
    // Unlit, so it hands off to the matching print on the page without a change in tone.
    new THREE.MeshBasicMaterial({ map: back, toneMapped: false }),
    edge,
    edge,
  ]);
  return { print, W, L };
}

function shadowTexture() {
  return canvasTexture(128, 128, (g) => {
    const grad = g.createRadialGradient(64, 64, 4, 64, 64, 64);
    grad.addColorStop(0, "rgba(28,25,23,0.5)");
    grad.addColorStop(1, "rgba(28,25,23,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
  });
}

/**
 * Plays the Photos intro on `canvas`: the Polaroid 600 fires its flash, ejects a print, and the view pulls back
 * to a top-down desk where the print lands face down over `landing()`. Returns a cleanup function.
 */
export function playPolaroid600(canvas: HTMLCanvasElement, modelUrl: string, hooks: Hooks) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.6;
  scene.add(new THREE.HemisphereLight(0xfff4e6, 0x3a2f25, 0.7));
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(3, 6, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffe2c4, 1.4);
  rim.position.set(-4, 3, -3);
  scene.add(rim);

  const view = new THREE.PerspectiveCamera(30, 1, 0.05, 100);
  const frontPos = new THREE.Vector3();
  const frontQuat = new THREE.Quaternion();
  const resize = () => {
    const { clientWidth: w, clientHeight: h } = canvas;
    renderer.setSize(w, h, false);
    view.aspect = w / h;
    view.updateProjectionMatrix();
    // Close enough to fill the frame, far enough that the whole camera fits on narrow screens.
    const dist = Math.max(6, 1.25 / (Math.tan(THREE.MathUtils.degToRad(view.fov / 2)) * view.aspect));
    frontPos.set(0, BASE + 0.9, dist);
    const m = new THREE.Matrix4().lookAt(frontPos, new THREE.Vector3(0, BASE - 0.05, 0), new THREE.Vector3(0, 1, 0));
    frontQuat.setFromRotationMatrix(m);
  };
  resize();
  addEventListener("resize", resize);

  let raf = 0;
  let stopped = false;
  const disposables: { dispose: () => void }[] = [];

  (async () => {
    await Promise.all([
      document.fonts?.load('64px "Permanent Marker"'),
      document.fonts?.load('500 32px "Caveat"'),
    ]).catch(() => {});
    const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(modelUrl);
    if (stopped) return;

    // Normalize the model: centered, longest side 2, resting on the desk at y = 0.
    const model = gltf.scene;
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    model.position.sub(box.getCenter(new THREE.Vector3()));
    const body = new THREE.Group();
    body.add(model);
    body.scale.setScalar(2 / Math.max(size.x, size.y, size.z));
    const camera = new THREE.Group();
    camera.add(body);
    camera.position.y = BASE;
    scene.add(camera);

    const materials = new Set<THREE.MeshStandardMaterial>();
    let flashGlass: THREE.MeshStandardMaterial | undefined;
    model.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((m) => materials.add(m));
      if (/GLASS_PINK/.test(o.name)) {
        flashGlass = (o.material as THREE.MeshStandardMaterial).clone();
        flashGlass.emissive = new THREE.Color(0xffffff);
        flashGlass.emissiveIntensity = 0;
        o.material = flashGlass;
        materials.add(flashGlass);
      }
    });
    const flashLight = new THREE.PointLight(0xfff8f0, 0, 10, 1.5);
    flashLight.position.copy(FLASH_AT).add(new THREE.Vector3(0, 0, 0.4));
    camera.add(flashLight);

    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(2.6, 2.6),
      new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.001;
    scene.add(shadow);

    const spot = hooks.landing();
    const aspect = spot ? spot.height / spot.width : 1.2;
    const { print, W, L } = buildPrint(aspect);
    print.visible = false;
    scene.add(print);
    disposables.push(pmrem, renderer);

    // Model-space ejection path: starts inside the slot, ends sticking out the front.
    const ejectStart = new THREE.Vector3(SLOT.x, SLOT.y, SLOT.z - L / 2 - 0.05);
    const ejectEnd = new THREE.Vector3(SLOT.x, SLOT.y - 0.02, SLOT.z + L / 2 - 0.12);

    const TURN_FROM = -0.6;
    const TURN_TO = -0.22;
    let flashed = false;
    let revealed = false;
    let landed = false;
    let zoom: {
      fromPos: THREE.Vector3;
      toPos: THREE.Vector3;
      toQuat: THREE.Quaternion;
      printFrom: THREE.Vector3;
      printTo: THREE.Vector3;
      quatFrom: THREE.Quaternion;
      quatTo: THREE.Quaternion;
    } | null = null;

    const planZoom = () => {
      camera.updateMatrixWorld(true);
      const printFrom = ejectEnd.clone().applyMatrix4(camera.matrixWorld);
      const quatFrom = camera.quaternion.clone();
      const target = hooks.landing();
      const vw = canvas.clientWidth;
      const vh = canvas.clientHeight;
      const tan = Math.tan(THREE.MathUtils.degToRad(view.fov / 2));
      const pw = target?.width ?? Math.min(vw * 0.6, 280);
      // Height above the desk at which the 3D print is exactly as wide as the real one on the page.
      const H = W / ((pw / vw) * 2 * tan * view.aspect);
      const halfW = H * tan * view.aspect;
      const halfH = H * tan;
      const tx = target ? target.x : vw / 2;
      const ty = target ? target.y : vh / 2;
      // Keep the camera on the opposite side of the screen from the print.
      const camScreenX = tx < vw / 2 ? vw * 0.72 : vw * 0.28;
      const ndc = (x: number, y: number) => new THREE.Vector2((x / vw) * 2 - 1, -((y / vh) * 2 - 1));
      const camNdc = ndc(camScreenX, vh * 0.42);
      const printNdc = ndc(tx, ty);
      // Top-down view, screen-up = -z. Choose the view so the camera model lands at camNdc.
      const viewX = -camNdc.x * halfW;
      const viewZ = camNdc.y * halfH;
      const printTo = new THREE.Vector3(viewX + printNdc.x * halfW, 0.008, viewZ - printNdc.y * halfH);
      const toPos = new THREE.Vector3(viewX, H, viewZ);
      const toQuat = new THREE.Quaternion().setFromRotationMatrix(
        new THREE.Matrix4().lookAt(toPos, new THREE.Vector3(viewX, 0, viewZ), new THREE.Vector3(0, 0, -1)),
      );
      const tilt = THREE.MathUtils.degToRad(target?.tilt ?? -3);
      const quatTo = new THREE.Quaternion()
        .setFromAxisAngle(new THREE.Vector3(0, 1, 0), -tilt)
        .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI));
      zoom = { fromPos: view.position.clone(), toPos, toQuat, printFrom, printTo, quatFrom, quatTo };
    };

    const t0 = performance.now();
    const tmpQ = new THREE.Quaternion();
    const frame = (now: number) => {
      const t = (now - t0) / 1000;

      // 1. The camera turns toward the visitor and settles.
      const turn = easeInOut(clamp01(t / FLASH));
      camera.rotation.y = TURN_FROM + (TURN_TO - TURN_FROM) * turn;
      if (!zoom) {
        view.position.copy(frontPos);
        view.quaternion.copy(frontQuat);
      }

      // 2. Flash.
      if (t >= FLASH && !flashed) {
        flashed = true;
        hooks.onFlash();
      }
      const f = flashed ? Math.max(0, 1 - (t - FLASH) / 0.4) : 0;
      if (flashGlass) flashGlass.emissiveIntensity = 12 * f;
      flashLight.intensity = 40 * f;

      // 3. The print slides out of the slot.
      const e = span(t, EJECT);
      if (e > 0 && !zoom) {
        print.visible = true;
        const local = ejectStart.clone().lerp(ejectEnd, easeOut(e));
        // A slight motor stutter as the rollers grab the print.
        local.z += Math.sin(e * Math.PI * 6) * 0.006 * (1 - e);
        camera.updateMatrixWorld(true);
        print.position.copy(local.applyMatrix4(camera.matrixWorld));
        print.quaternion.copy(camera.quaternion);
      }

      // 4. Pull back to a top-down view of the desk; the print flips and lands face down.
      if (t >= ZOOM[0]) {
        if (!zoom) planZoom();
        if (!revealed) {
          revealed = true;
          hooks.onReveal();
        }
        const z = zoom!;
        const k = easeInOut(span(t, ZOOM));
        view.position.lerpVectors(z.fromPos, z.toPos, k);
        view.position.y += Math.sin(k * Math.PI) * 1.2;
        view.quaternion.slerpQuaternions(frontQuat, z.toQuat, k);

        const p = easeInOut(span(t, [ZOOM[0] + 0.1, ZOOM[1]]));
        print.position.lerpVectors(z.printFrom, z.printTo, p);
        print.position.y += Math.sin(p * Math.PI) * 1.1;
        tmpQ.slerpQuaternions(z.quatFrom, z.quatTo, easeInOut(clamp01(p * 1.25)));
        print.quaternion.copy(tmpQ);

        const fade = 1 - span(t, FADE_CAMERA);
        materials.forEach((m) => {
          m.transparent = true;
          m.opacity = fade;
        });
        (shadow.material as THREE.MeshBasicMaterial).opacity = fade;
        camera.visible = fade > 0.01;
        shadow.visible = camera.visible;

        if (t >= ZOOM[1] && !landed) {
          landed = true;
          hooks.onLand();
        }
      }

      renderer.render(scene, view);
      if (!stopped) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
  })().catch(() => {
    if (!stopped) hooks.onError();
  });

  return () => {
    stopped = true;
    cancelAnimationFrame(raf);
    removeEventListener("resize", resize);
    scene.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => {
          m.map?.dispose();
          m.dispose();
        });
      }
    });
    disposables.forEach((d) => d.dispose());
    pmrem.dispose();
    renderer.dispose();
  };
}
