import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { TIMELINE, clamp01, easeInOut, easeOut, flashAt, span } from "./cameraTimeline";

/** Where the face-down print should end up, in CSS pixels of the viewport. */
export type Landing = {
  x: number;
  y: number;
  width: number;
  height: number;
  tilt: number;
};

type Hooks = {
  /** Smoothed scroll progress through the intro, 0 at the top of the page and 1 once the print is on the desk. */
  progress: () => number;
  /** Live position of the face-down print on the page; measured every frame because the desk scrolls. */
  landing: () => Landing | null;
  /** The desk on the page (with `data-wood` and the other prints on it), drawn in 3D until the print lands. */
  desk?: () => HTMLElement | null;
  /** Called once the first frame is on screen. */
  onReady: () => void;
  onError: () => void;
};

// Positions on the model, in its normalized frame (centered, longest side = 2).
const SLOT = new THREE.Vector3(0.076, -0.8, 0.9);
const FLASH_AT = new THREE.Vector3(0.45, 0.73, 0.9);
const BASE = 0.948;

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
  const edge = new THREE.MeshStandardMaterial({
    color: 0xefe9dd,
    roughness: 0.8,
  });
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

/** A print already lying on the desk, drawn from its card on the page: frame, photo (cropped like the page) and caption. */
async function laidPrint(card: HTMLElement) {
  const w = card.offsetWidth;
  const h = card.offsetHeight;
  const s = 512 / w;
  const img = card.querySelector<HTMLImageElement>(".front img");
  if (img) {
    img.loading = "eager";
    await Promise.race([img.decode().catch(() => {}), new Promise((r) => setTimeout(r, 4000))]);
  }
  const cs = img ? getComputedStyle(img) : null;
  const tex = canvasTexture(512, Math.round(h * s), (g) => {
    g.fillStyle = "#f7f3ea";
    g.fillRect(0, 0, 512, h * s);
    const pad = 12.8 * s;
    const side = 512 - 2 * pad;
    g.fillStyle = "#3a342e";
    g.fillRect(pad, pad, side, side);
    if (img?.naturalWidth) {
      const [px, py] = (cs!.objectPosition || "50% 50%").split(" ").map((v) => (parseFloat(v) || 50) / 100);
      const k = Math.max(side / img.naturalWidth, side / img.naturalHeight);
      const sw = side / k;
      const sh = side / k;
      g.filter = "sepia(0.14) saturate(0.9) contrast(1.04)";
      g.drawImage(
        img,
        (img.naturalWidth - sw) * px,
        (img.naturalHeight - sh) * (py ?? 0.5),
        sw,
        sh,
        pad,
        pad,
        side,
        side,
      );
      g.filter = "none";
    }
    const cap = card.querySelector(".front .caption");
    const ccs = cap ? getComputedStyle(cap) : null;
    const size = (ccs ? parseFloat(ccs.fontSize) : 16.8) * s;
    g.font = `${size}px "Permanent Marker", "Marker Felt", cursive`;
    g.fillStyle = "#24211e";
    g.textAlign = "center";
    g.textBaseline = "top";
    const words = (cap?.textContent ?? "").trim().split(/\s+/);
    const lines: string[] = [];
    for (const word of words) {
      const line = lines.length ? `${lines[lines.length - 1]} ${word}` : word;
      if (lines.length && g.measureText(line).width <= side) lines[lines.length - 1] = line;
      else lines.push(word);
    }
    g.save();
    g.translate(256, pad + side + 14.4 * s);
    g.rotate(THREE.MathUtils.degToRad(-1.2));
    lines.forEach((l, i) => g.fillText(l, 0, i * size * 1.25));
    g.restore();
  });
  const edge = new THREE.MeshStandardMaterial({
    color: 0xefe9dd,
    roughness: 0.8,
  });
  const face = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
  return new THREE.Mesh(new THREE.BoxGeometry(1, 0.01, 1), [edge, edge, face, edge, edge, edge]);
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
export function mountPolaroid600(canvas: HTMLCanvasElement, glb: Promise<ArrayBuffer>, hooks: Hooks) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
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
  // A GPU reset or a backgrounded mobile tab can drop the context; the page falls back to the still camera.
  const onLost = () => {
    if (stopped) return;
    cancelAnimationFrame(raf);
    hooks.onError();
  };
  canvas.addEventListener("webglcontextlost", onLost);

  (async () => {
    const fonts = Promise.all([
      document.fonts?.load('64px "Permanent Marker"'),
      document.fonts?.load('500 32px "Caveat"'),
    ]).catch(() => {});
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    const deskEl = hooks.desk?.() ?? null;
    const [gltf, wood] = await Promise.all([
      glb.then((data) => loader.parseAsync(data, "")),
      deskEl?.dataset.wood ? new THREE.TextureLoader().loadAsync(deskEl.dataset.wood).catch(() => null) : null,
      fonts,
    ]);
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

    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTexture(),
      transparent: true,
      depthWrite: false,
    });
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.001;
    scene.add(shadow);

    // The desk: a wooden slab with edges, the same tile as the page's desk on top, the other prints already on it.
    const fadeIns: THREE.Material[] = [];
    const deskGroup = new THREE.Group();
    deskGroup.visible = false;
    scene.add(deskGroup);
    let deskTop: THREE.MeshBasicMaterial | undefined;
    let deskSlab: THREE.Mesh | undefined;
    let deskShadow: THREE.Mesh | undefined;
    const laid: { card: HTMLElement; mesh: THREE.Mesh; shade: THREE.Mesh }[] = [];
    const shadowMats = new Set<THREE.Material>();
    const blobMat = () => {
      const m = new THREE.MeshBasicMaterial({
        map: shadowTexture(),
        transparent: true,
        depthWrite: false,
      });
      shadowMats.add(m);
      return m;
    };
    const blob = (mat: THREE.Material) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
      m.rotation.x = -Math.PI / 2;
      return m;
    };
    if (deskEl && wood) {
      wood.colorSpace = THREE.SRGBColorSpace;
      wood.wrapS = wood.wrapT = THREE.RepeatWrapping;
      wood.anisotropy = 8;
      deskTop = new THREE.MeshBasicMaterial({ map: wood, toneMapped: false });
      const side = new THREE.MeshStandardMaterial({
        color: 0x4f3119,
        roughness: 0.65,
      });
      deskSlab = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), [side, side, deskTop, side, side, side]);
      const ds = blobMat();
      deskShadow = blob(ds);
      deskGroup.add(deskShadow, deskSlab);
      fadeIns.push(deskTop, side, ds);
      for (const card of deskEl.querySelectorAll<HTMLElement>("li:not(.soon-slot) .polaroid")) {
        const mesh = await laidPrint(card);
        if (stopped) return;
        const sm = blobMat();
        const shade = blob(sm);
        deskGroup.add(shade, mesh);
        fadeIns.push(...(mesh.material as THREE.Material[]), sm);
        laid.push({ card, mesh, shade });
      }
    }
    const printShadowMat = blobMat();
    const printShadow = blob(printShadowMat);
    printShadow.visible = false;
    scene.add(printShadow);

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

      // Lay the desk and its prints under where they sit on the page, at this final view's scale.
      if (!deskSlab || !deskEl || !deskTop) return;
      const k = (2 * halfW) / vw;
      const at = (x: number, y: number, out: THREE.Vector3) => {
        const n = ndc(x, y);
        return out.set(viewX + n.x * halfW, 0, viewZ - n.y * halfH);
      };
      const r = deskEl.getBoundingClientRect();
      const T = 26 * k;
      at(r.left + r.width / 2, r.top + r.height / 2, deskSlab.position).setY(-T / 2);
      deskSlab.scale.set(r.width * k, T, r.height * k);
      deskShadow!.position.copy(deskSlab.position).setY(-T - 0.002);
      deskShadow!.position.z += 24 * k;
      deskShadow!.scale.set(r.width * k * 1.25, r.height * k * 1.2, 1);
      const rx = r.width / 512;
      const ry = r.height / 512;
      wood!.repeat.set(rx, ry);
      wood!.offset.set(0, Math.ceil(ry) - ry);
      for (const { card, mesh, shade } of laid) {
        const b = card.getBoundingClientRect();
        at(b.left + b.width / 2, b.top + b.height / 2, mesh.position).setY(0.006);
        mesh.scale.set(card.offsetWidth * k, 1, card.offsetHeight * k);
        const tilt = parseFloat(getComputedStyle(card).getPropertyValue("--tilt")) || 0;
        mesh.rotation.y = -THREE.MathUtils.degToRad(tilt);
        shade.position.set(mesh.position.x, 0.003, mesh.position.z + 8 * k);
        shade.scale.set(card.offsetWidth * k * 1.3, card.offsetHeight * k * 1.25, 1);
      }
    };
    const land = new THREE.Vector3();
    const fromNow = new THREE.Vector3();
    const dir = new THREE.Vector3();
    const qLand = new THREE.Quaternion();
    const qTmp = new THREE.Quaternion();
    const xAxis = new THREE.Vector3(1, 0, 0);
    const restY = (size.y / Math.max(size.x, size.y, size.z)) * 1 + 0.004;

    const tmpV = new THREE.Vector3();
    let last = performance.now();
    let lastDrawn = -1;
    // Compile every shader off the main thread where supported, so the first frame doesn't stall.
    await renderer.compileAsync(scene, view);
    if (stopped) return;

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const p = hooks.progress();
      pointer.sx += (pointer.x - pointer.sx) * (1 - Math.exp(-dt * 4));
      pointer.sy += (pointer.y - pointer.sy) * (1 - Math.exp(-dt * 4));

      const T = TIMELINE;
      const hover = 1 - span(p, T.hover);
      const approach = easeInOut(span(p, T.approach));
      const flash = flashAt(p);

      // 1. At rest the camera floats and follows the cursor; scrolling turns it to face the visitor and moves in.
      // Once the view starts pulling back, the camera settles onto the desk.
      const settle = easeInOut(span(p, [T.zoom[0], T.zoom[0] + 0.1]));
      camera.position.set(0, BASE + Math.sin(now / 900) * 0.05 * hover + (restY - BASE) * settle, 0);
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
        // The print pops out of the slot, arcs over with a flutter, touches down short of its spot and slides in.
        const pk = span(p, [T.zoom[0] + 0.02, T.zoom[1]]);
        camera.updateMatrixWorld(true);
        fromNow.copy(ejectEnd).applyMatrix4(camera.matrixWorld);
        dir.subVectors(printTo, fromNow).setY(0);
        const dist = dir.length();
        dir.normalize();
        land
          .copy(printTo)
          .addScaledVector(dir, -Math.min(0.45 * W, dist * 0.2))
          .setY(printTo.y);
        qLand.setFromAxisAngle(yAxis, 0.45).multiply(quatTo);
        const FLY = 0.78;
        if (pk < FLY) {
          const u = easeOut(pk / FLY) * 0.35 + (pk / FLY) * 0.65;
          print.position.lerpVectors(fromNow, land, u);
          print.position.y += 4 * (0.75 + dist * 0.08) * u * (1 - u);
          print.quaternion.slerpQuaternions(camera.quaternion, qLand, easeInOut(clamp01(u * 1.15)));
          print.quaternion.multiply(qTmp.setFromAxisAngle(xAxis, 0.32 * Math.sin(u * Math.PI * 3) * (1 - u)));
        } else {
          const v = (pk - FLY) / (1 - FLY);
          const e = easeOut(v);
          print.position.lerpVectors(land, printTo, e);
          print.position.y += 0.03 * Math.sin(clamp01(v * 3) * Math.PI) * (1 - v);
          print.quaternion.slerpQuaternions(qLand, quatTo, e);
        }
        const lift = Math.max(print.position.y, 0);
        printShadow.visible = true;
        printShadow.position.set(print.position.x, 0.004, print.position.z + lift * 0.25);
        printShadow.scale.set(W * (1.25 + lift * 0.8), L * (1.2 + lift * 0.8), 1);
        printShadowMat.opacity = clamp01(0.85 - lift * 0.35);
      } else printShadow.visible = false;

      // The desk fades in as the view starts pulling back; dark mode dims its top like the page's desk.
      deskGroup.visible = z > 0;
      if (z > 0 && deskTop) {
        const a = clamp01(z / 0.12);
        fadeIns.forEach((m) => {
          m.transparent = a < 1 || shadowMats.has(m);
          m.opacity = a;
        });
        deskTop.color.setScalar(document.documentElement.dataset.theme === "dark" ? 0.55 : 1);
      }
      const fade = 1 - span(p, T.fadeCamera);
      materials.forEach((m) => {
        m.transparent = fade < 1;
        m.opacity = fade;
      });
      shadowMat.opacity = fade;
      camera.visible = shadow.visible = fade > 0.01;

      // Once the print has landed and nothing is moving, stop drawing.
      const settled = p >= 1;
      if (!settled || lastDrawn !== 1) renderer.render(scene, view);
      if (lastDrawn === -1) hooks.onReady();
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
    canvas.removeEventListener("webglcontextlost", onLost);
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
