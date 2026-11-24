/**
 * Light-blue jolts along the circuit board behind Work's card sequence. Clicks and taps send a few
 * from the traces nearest the pointer, card changes and scrolling send one at random, and an
 * occasional faint one runs on its own while the board is on screen.
 */
type Pt = [number, number];
type Path = { pts: Pt[]; cum: number[]; len: number; pads: number[] };
type Jolt = { path: Path; s: number; dir: 1 | -1; a: number; speed: number; tail: number };
type Flash = { p: Pt; t: number; a: number };

// The board's 220px tile, traced exactly as the .backdrop mask in work.astro draws it.
const TILE = 220;
const ROUTES: Pt[][] = [
  [[0, 40], [60, 40], [80, 60], [150, 60], [150, 120], [170, 140], [220, 140]],
  [[40, 220], [40, 170], [60, 150], [110, 150], [110, 100]],
  [[190, 0], [190, 30], [210, 50], [210, 90]],
  [[0, 120], [30, 120], [50, 100]],
];
const PADS: Pt[] = [[150, 60], [110, 100], [30, 120], [210, 90], [60, 150]];
const FLASH_MS = 420;

function toPath(pts: Pt[]): Path {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const pads = PADS.flatMap(([px, py]) => {
    const i = pts.findIndex(([x, y]) => x === px && y === py);
    return i < 0 ? [] : [cum[i]];
  });
  return { pts, cum, len: cum[cum.length - 1], pads };
}
const PATHS = ROUTES.map(toPath);

function at(path: Path, s: number): Pt {
  const { pts, cum } = path;
  let i = 1;
  while (i < pts.length - 1 && cum[i] < s) i++;
  const t = (s - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
  return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t];
}

// Nearest point on a path to (x, y), as distance along the path and distance away from it.
function project(path: Path, x: number, y: number) {
  let best = { s: 0, d: Infinity };
  for (let i = 1; i < path.pts.length; i++) {
    const [ax, ay] = path.pts[i - 1];
    const [bx, by] = path.pts[i];
    const L = path.cum[i] - path.cum[i - 1];
    const t = Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / (L * L)));
    const d = Math.hypot(ax + (bx - ax) * t - x, ay + (by - ay) * t - y);
    if (d < best.d) best = { s: path.cum[i - 1] + L * t, d };
  }
  return best;
}

const offset = (path: Path, ox: number, oy: number): Path => ({
  ...path,
  pts: path.pts.map(([x, y]) => [x + ox, y + oy] as Pt),
});

export function startJolts(stage: HTMLElement, canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return { near() {}, random() {}, stop() {} };
  const clear = () => {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  };
  let jolts: Jolt[] = [];
  let flashes: Flash[] = [];
  let raf = 0;
  let last = 0;
  let visible = false;
  let color = "56 189 248";

  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(stage.clientWidth * dpr);
    canvas.height = Math.round(stage.clientHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  const ro = new ResizeObserver(resize);
  ro.observe(stage);
  resize();

  const spawn = (path: Path, s: number, dir: 1 | -1, a: number) => {
    if (jolts.length > 24) return;
    color = getComputedStyle(canvas).getPropertyValue("--jolt").trim() || color;
    jolts.push({ path, s, dir, a, speed: 380 + Math.random() * 360, tail: 70 + Math.random() * 80 });
    if (!raf) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  };

  // Head of the jolt runs to the end of its trace; the tail keeps going until it has drained in.
  const draw = (j: Jolt) => {
    const end = j.dir > 0 ? j.path.len : 0;
    const head = j.dir > 0 ? Math.min(j.s, end) : Math.max(j.s, end);
    const tail = Math.max(0, Math.min(j.path.len, j.s - j.dir * j.tail));
    const N = 10;
    ctx.lineCap = "round";
    ctx.shadowColor = `rgb(${color} / ${0.9 * j.a})`;
    ctx.shadowBlur = 14;
    for (let k = 0; k < N; k++) {
      const s0 = tail + ((head - tail) * k) / N;
      const s1 = tail + ((head - tail) * (k + 1)) / N;
      const [x0, y0] = at(j.path, s0);
      const [x1, y1] = at(j.path, s1);
      ctx.strokeStyle = `rgb(${color} / ${j.a * ((k + 1) / N) ** 1.6})`;
      ctx.lineWidth = 1.2 + (k / N) * 1.6;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }
    if (head === j.s) {
      const [hx, hy] = at(j.path, head);
      ctx.fillStyle = `rgb(255 255 255 / ${j.a * 0.9})`;
      ctx.beginPath();
      ctx.arc(hx, hy, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    clear();
    jolts = jolts.filter((j) => {
      const prev = j.s;
      j.s += j.dir * j.speed * dt;
      for (const pad of j.path.pads)
        if ((pad - prev) * (pad - j.s) <= 0 && pad !== prev) flashes.push({ p: at(j.path, pad), t: now, a: j.a });
      draw(j);
      return j.dir > 0 ? j.s - j.tail < j.path.len : j.s + j.tail > 0;
    });
    flashes = flashes.filter((f) => {
      const t = (now - f.t) / FLASH_MS;
      if (t >= 1) return false;
      const a = f.a * (1 - t) ** 2;
      ctx.shadowColor = `rgb(${color} / ${a})`;
      ctx.shadowBlur = 12;
      ctx.fillStyle = `rgb(${color} / ${a})`;
      ctx.beginPath();
      ctx.arc(f.p[0], f.p[1], 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgb(${color} / ${a * 0.8})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(f.p[0], f.p[1], 3.5 + t * 12, 0, Math.PI * 2);
      ctx.stroke();
      return true;
    });
    ctx.shadowBlur = 0;
    raf = jolts.length || flashes.length ? requestAnimationFrame(frame) : 0;
  };

  const rand = <T>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];

  // One to three jolts start on random traces near a point (client coordinates) and run away from it.
  const near = (cx: number, cy: number) => {
    const r = stage.getBoundingClientRect();
    const x = cx - r.left;
    const y = cy - r.top;
    if (x < 0 || y < 0 || x > r.width || y > r.height) return;
    const tx = Math.floor(x / TILE);
    const ty = Math.floor(y / TILE);
    const hits: { path: Path; s: number; d: number }[] = [];
    for (let dy = -2; dy <= 2; dy++)
      for (let dx = -2; dx <= 2; dx++)
        for (const p of PATHS) {
          const path = offset(p, (tx + dx) * TILE, (ty + dy) * TILE);
          hits.push({ path, ...project(path, x, y) });
        }
    const pool = hits.filter((h) => h.d < 180).sort(() => Math.random() - 0.5);
    for (const h of pool.slice(0, 1 + Math.floor(Math.random() * 3))) {
      const toEnd = h.path.len - h.s;
      const dir = toEnd < 40 ? -1 : h.s < 40 ? 1 : Math.random() < 0.5 ? 1 : -1;
      spawn(h.path, h.s, dir, 1);
    }
  };

  // One jolt from a random point on a random trace somewhere on screen.
  const random = (a = 0.85) => {
    if (!visible) return;
    const tx = Math.floor(Math.random() * Math.ceil(stage.clientWidth / TILE));
    const ty = Math.floor(Math.random() * Math.ceil(stage.clientHeight / TILE));
    const path = offset(rand(PATHS), tx * TILE, ty * TILE);
    const dir = Math.random() < 0.5 ? 1 : -1;
    spawn(path, Math.random() * path.len * 0.6 * (dir > 0 ? 1 : -1) + (dir > 0 ? 0 : path.len), dir, a);
  };

  let idle = 0;
  const tick = () => {
    if (!document.hidden) random(0.5);
    idle = window.setTimeout(tick, 3500 + Math.random() * 3500);
  };
  idle = window.setTimeout(tick, 2000);

  let scrolled = 0;
  let y0 = scrollY;
  const onScroll = () => {
    scrolled += Math.abs(scrollY - y0);
    y0 = scrollY;
    if (scrolled > 420) {
      scrolled = 0;
      random(0.75);
    }
  };
  addEventListener("scroll", onScroll, { passive: true });

  const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
  io.observe(stage);

  return {
    near,
    random,
    stop() {
      cancelAnimationFrame(raf);
      clearTimeout(idle);
      removeEventListener("scroll", onScroll);
      ro.disconnect();
      io.disconnect();
      clear();
    },
  };
}
