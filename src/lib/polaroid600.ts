import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/** Where the face-down print should end up, in CSS pixels of the viewport. */
export type Landing = { x: number; y: number; width: number; height: number; tilt: number };

type Hooks = {
  /** Scroll progress through the intro, 0 at the top of the page and 1 once the print is on the desk. */
  progress: () => number;
  /** Live position of the face-down print on the page; measured every frame because the desk scrolls. */
  landing: () => Landing | null;
  /** Called every frame with the smoothed progress and the flash strength (0–1). */
  onFrame: (p: number, flash: number) => void;
  onReady: () => void;
  onError: () => void;
};

// Positions on the model, in its normalized frame (centered, longest side = 2).
const SLOT = new THREE.Vector3(0.076, -0.8, 0.9);
const FLASH_AT = new THREE.Vector3(0.45, 0.73, 0.9);
const BASE = 0.948;

// Timeline, as fractions of the intro's scroll length. Every frame is a pure function of progress, so scrolling back up rewinds it.
export const TIMELINE = {
  hover: [0.04, 0.24],
  approach: [0.22, 0.38],
  flash: [0.4, 0.47],
  eject: [0.44, 0.6],
  zoom: [0.62, 0.98],
  fadeCamera: [0.7, 0.86],
} as const;

const clamp01 = (t: number) => Math.min(Math.max(t, 0), 1);
export const span = (t: number, [a, b]: readonly [number, number]) => clamp01((t - a) / (b - a));
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
 * Mounts the scroll-driven Photos intro on `canvas`. At the top of the page the Polaroid 600 floats and follows the
 * cursor; scrolling turns it toward the visitor, fires the flash, ejects a print, then pulls back to a top-down desk
 * where the print lands face down over `landing()`. Returns a cleanup function.
 */
export function mountPolaroid600(canvas: HTMLCanvasElement, modelUrl: string, hooks: Hooks) {
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
  const tan = Math.tan(THREE.MathUtils.degToRad(view.fov / 2));
  const nearPos = new THREE.Vector3();
  const nearQuat = new THREE.Quaternion();
  const farPos = new THREE.Vector3();
  const farQuat = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const resize = () => {
    const { clientWidth: w, clientHeight: h } = canvas;
    renderer.setSize(w, h, false);
    view.aspect = w / h;
    view.updateProjectionMatrix();
    // Close enough to fill the frame, far enough that the whole camera fits on narrow screens.
    const near = Math.max(6, 1.25 / (tan * view.aspect));
    nearPos.set(0, BASE + 0.9, near);
    nearQuat.setFromRotationMatrix(new THREE.Matrix4().lookAt(nearPos, new THREE.Vector3(0, BASE - 0.05, 0), up));
    // The resting hero view: small, and sitting above the headline (at ~36% of the screen height).
    const far = Math.max(near * 2.1, 2.3 / (tan * view.aspect));
    farPos.set(0, BASE + 1.2, far);
    const drop = 0.28 * far * tan;
    farQuat.setFromRotationMatrix(new THREE.Matrix4().lookAt(farPos, new THREE.Vector3(0, BASE - drop, 0), up));
  };
  resize();
  addEventListener("resize", resize);

  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  const onPointer = (e: PointerEvent) => {
    pointer.x = (e.clientX / innerWidth) * 2 - 1;
    pointer.y = (e.clientY / innerHeight) * 2 - 1;
  };
  addEventListener("pointermove", onPointer, { passive: true });

  let raf = 0;
  let stopped = false;

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

    const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false });
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.001;
    scene.add(shadow);

    const spot = hooks.landing();
    const { print, W, L } = buildPrint(spot ? spot.height / spot.width : 1.2);
    scene.add(print);

    // Model-space ejection path: starts inside the slot, ends sticking out the front.
    const ejectStart = new THREE.Vector3(SLOT.x, SLOT.y, SLOT.z - L / 2 - 0.05);
    const ejectEnd = new THREE.Vector3(SLOT.x, SLOT.y - 0.02, SLOT.z + L / 2 - 0.12);
    const TURN_FROM = -0.6;
    const TURN_TO = -0.22;

    const restPose = new THREE.Object3D();
    restPose.position.set(0, BASE, 0);
    restPose.rotation.y = TURN_TO;
    restPose.updateMatrixWorld(true);
    const printFrom = ejectEnd.clone().applyMatrix4(restPose.matrixWorld);
    const quatFrom = restPose.quaternion.clone();

    const v2 = (x: number, y: number) => new THREE.Vector2(x, y);
    const toPos = new THREE.Vector3();
    const toQuat = new THREE.Quaternion();
    const printTo = new THREE.Vector3();
    const quatTo = new THREE.Quaternion();
    const yAxis = new THREE.Vector3(0, 1, 0);
    const zAxis = new THREE.Vector3(0, 0, 1);
    const flip = new THREE.Quaternion().setFromAxisAngle(zAxis, Math.PI);
    /** Top-down view where the 3D print is exactly as wide as the real one, sitting right on top of it. */
    const planDesk = () => {
      const target = hooks.landing();
      const vw = canvas.clientWidth;
      const vh = canvas.clientHeight;
      const pw = target?.width ?? Math.min(vw * 0.6, 280);
      const H = W / ((pw / vw) * 2 * tan * view.aspect);
      const halfW = H * tan * view.aspect;
      const halfH = H * tan;
      const tx = target ? target.x : vw / 2;
      const ty = target ? target.y : vh / 2;
      // Keep the camera on the opposite side of the screen from the print.
      const camX = tx < vw / 2 ? vw * 0.72 : vw * 0.28;
      const ndc = (x: number, y: number) => v2((x / vw) * 2 - 1, -((y / vh) * 2 - 1));
      const camNdc = ndc(camX, vh * 0.42);
      const printNdc = ndc(tx, ty);
      // Screen-up is -z. Choose the view so the camera model lands at camNdc.
      const viewX = -camNdc.x * halfW;
      const viewZ = camNdc.y * halfH;
      printTo.set(viewX + printNdc.x * halfW, 0.008, viewZ - printNdc.y * halfH);
      toPos.set(viewX, H, viewZ);
      toQuat.setFromRotationMatrix(
        new THREE.Matrix4().lookAt(toPos, new THREE.Vector3(viewX, 0, viewZ), new THREE.Vector3(0, 0, -1)),
      );
      quatTo.setFromAxisAngle(yAxis, -THREE.MathUtils.degToRad(target?.tilt ?? -3)).multiply(flip);
    };

    const tmpV = new THREE.Vector3();
    let p = hooks.progress();
    let last = performance.now();
    let lastDrawn = -1;
    hooks.onReady();

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      // Ease toward the scroll position so scrubbing feels smooth without taking over the page's scrolling.
      const target = hooks.progress();
      p += (target - p) * (1 - Math.exp(-dt * 10));
      if (Math.abs(target - p) < 0.0005) p = target;
      pointer.sx += (pointer.x - pointer.sx) * (1 - Math.exp(-dt * 4));
      pointer.sy += (pointer.y - pointer.sy) * (1 - Math.exp(-dt * 4));

      const T = TIMELINE;
      const hover = 1 - span(p, T.hover);
      const approach = easeInOut(span(p, T.approach));
      const flash = p >= T.flash[0] ? 1 - span(p, T.flash) : 0;
      hooks.onFrame(p, flash);

      // 1. At rest the camera floats and follows the cursor; scrolling turns it to face the visitor and moves in.
      camera.position.set(0, BASE + Math.sin(now / 900) * 0.05 * hover, 0);
      camera.rotation.set(
        pointer.sy * 0.18 * hover,
        TURN_FROM + (TURN_TO - TURN_FROM) * approach + pointer.sx * 0.55 * hover,
        0,
      );
      view.position.lerpVectors(farPos, nearPos, approach);
      view.quaternion.slerpQuaternions(farQuat, nearQuat, approach);

      // 2. Flash.
      if (flashGlass) flashGlass.emissiveIntensity = 12 * flash;
      flashLight.intensity = 40 * flash;

      // 3. The print slides out of the slot.
      const e = span(p, T.eject);
      print.visible = e > 0;
      if (e > 0) {
        tmpV.copy(ejectStart).lerp(ejectEnd, easeOut(e));
        // A slight motor stutter as the rollers grab the print.
        tmpV.z += Math.sin(e * Math.PI * 6) * 0.006 * (1 - e);
        camera.updateMatrixWorld(true);
        print.position.copy(tmpV.applyMatrix4(camera.matrixWorld));
        print.quaternion.copy(camera.quaternion);
      }

      // 4. Pull back to a top-down view of the desk; the print flips and lands face down.
      const z = span(p, T.zoom);
      if (z > 0) {
        planDesk();
        const k = easeInOut(z);
        view.position.lerpVectors(nearPos, toPos, k);
        view.position.y += Math.sin(k * Math.PI) * 1.2;
        view.quaternion.slerpQuaternions(nearQuat, toQuat, k);
        const pk = easeInOut(span(p, [T.zoom[0] + 0.02, T.zoom[1]]));
        print.position.lerpVectors(printFrom, printTo, pk);
        print.position.y += Math.sin(pk * Math.PI) * 1.1;
        print.quaternion.slerpQuaternions(quatFrom, quatTo, easeInOut(clamp01(pk * 1.25)));
      }
      const fade = 1 - span(p, T.fadeCamera);
      materials.forEach((m) => {
        m.transparent = fade < 1;
        m.opacity = fade;
      });
      shadowMat.opacity = fade;
      camera.visible = shadow.visible = fade > 0.01;

      // Once the print has landed and nothing is moving, stop drawing.
      const settled = p >= 1 && target >= 1;
      if (!settled || lastDrawn !== 1) renderer.render(scene, view);
      lastDrawn = settled ? 1 : p;
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
    removeEventListener("pointermove", onPointer);
    scene.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => {
          m.map?.dispose();
          m.dispose();
        });
      }
    });
    pmrem.dispose();
    renderer.dispose();
  };
}
