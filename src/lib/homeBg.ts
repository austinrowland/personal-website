/**
 * Lab backgrounds for the homepage, picked with ?bg=tide|field|grain (default tide).
 * All three sit on one fixed canvas behind the intro, follow the theme's paper/ink colors,
 * lean toward the pointer, drift on their own on touch screens, and stay off for reduced motion.
 */
export type HomeBg = "tide" | "field" | "grain";
export const homeBgs: HomeBg[] = ["tide", "field", "grain"];

const hex = (v: string) => {
  const m = v.trim().match(/^#([0-9a-f]{6})$/i);
  return m ? [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16) / 255) : [1, 1, 1];
};

const TIDE_VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
const TIDE_FRAG = `precision mediump float;uniform vec2 R;uniform vec2 M;uniform float T;uniform vec3 P;uniform vec3 I;
float h(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+1.),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*n(p);p=p*2.02+vec2(3.1,1.7);a*=.5;}return v;}
void main(){
  vec2 uv=gl_FragCoord.xy/R.y;vec2 m=M/R.y;float t=T*.05;
  vec2 d=uv-m;float r=length(d);
  vec2 q=uv+d*exp(-r*r*5.)*.25;
  vec2 w=vec2(fbm(q*1.4+t),fbm(q*1.4-t+4.));
  float f=fbm(q*1.1+w*1.6+vec2(t*.6,-t*.4));
  float band=sin(f*10.+uv.x*1.5-t*4.);
  float silk=smoothstep(.15,1.,band)*.5+smoothstep(-.2,-1.,band)*.2;
  float glow=exp(-r*r*3.)*.35;
  float fade=smoothstep(-.1,.9,gl_FragCoord.x/R.x);
  float k=clamp((silk*.3+f*.1)*fade+glow*.12,0.,.36);
  vec3 col=mix(P,I,k);
  col+=(h(gl_FragCoord.xy+T)-.5)*.012;
  gl_FragColor=vec4(col,1.);
}`;

export function mountHomeBg(kind: HomeBg): (() => void) | undefined {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const cv = document.createElement("canvas");
  cv.setAttribute("aria-hidden", "true");
  cv.dataset.mdSkip = "";
  cv.style.cssText = "position:fixed;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none";

  let paper = [1, 1, 1];
  let ink = [0, 0, 0];
  const readTheme = () => {
    const s = getComputedStyle(document.documentElement);
    paper = hex(s.getPropertyValue("--paper"));
    ink = hex(s.getPropertyValue("--ink"));
  };
  readTheme();
  const themeObs = new MutationObserver(readTheme);
  themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  const rgba = (c: number[], a: number) => `rgba(${c.map((v) => Math.round(v * 255)).join(",")},${a})`;

  const target = { x: innerWidth * 0.7, y: innerHeight * 0.45 };
  const cur = { ...target };
  let lastMove = -1e9;
  const onPointer = (e: PointerEvent) => {
    target.x = e.clientX;
    target.y = e.clientY;
    lastMove = performance.now();
  };
  addEventListener("pointermove", onPointer, { passive: true });
  const step = (t: number) => {
    if (t - lastMove > 2500) {
      const s = t / 1000;
      target.x = innerWidth * (0.62 + 0.25 * Math.sin(s * 0.3));
      target.y = innerHeight * (0.5 + 0.25 * Math.sin(s * 0.45 + 1));
    }
    cur.x += (target.x - cur.x) * 0.08;
    cur.y += (target.y - cur.y) * 0.08;
  };

  const dpr = Math.min(devicePixelRatio || 1, 2);
  let W = 0;
  let H = 0;
  let onResize = () => {};
  const resize = () => {
    W = innerWidth;
    H = innerHeight;
    onResize();
  };
  let draw: (t: number) => void;
  let gl: WebGLRenderingContext | null = null;

  if (kind === "tide") {
    gl = cv.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
    if (!gl) return;
    const g = gl;
    const sh = (type: number, src: string) => {
      const s = g.createShader(type)!;
      g.shaderSource(s, src);
      g.compileShader(s);
      return s;
    };
    const prog = g.createProgram()!;
    g.attachShader(prog, sh(g.VERTEX_SHADER, TIDE_VERT));
    g.attachShader(prog, sh(g.FRAGMENT_SHADER, TIDE_FRAG));
    g.linkProgram(prog);
    if (!g.getProgramParameter(prog, g.LINK_STATUS)) return;
    g.useProgram(prog);
    g.bindBuffer(g.ARRAY_BUFFER, g.createBuffer());
    g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), g.STATIC_DRAW);
    g.enableVertexAttribArray(0);
    g.vertexAttribPointer(0, 2, g.FLOAT, false, 0, 0);
    const U = (n: string) => g.getUniformLocation(prog, n);
    const u = { R: U("R"), M: U("M"), T: U("T"), P: U("P"), I: U("I") };
    // The pattern is soft, so half resolution looks the same and keeps phones cool.
    const scale = 0.5;
    onResize = () => {
      cv.width = Math.round(W * scale);
      cv.height = Math.round(H * scale);
      g.viewport(0, 0, cv.width, cv.height);
    };
    draw = (t) => {
      g.uniform2f(u.R, cv.width, cv.height);
      g.uniform2f(u.M, cur.x * scale, (H - cur.y) * scale);
      g.uniform1f(u.T, t / 1000);
      g.uniform3f(u.P, paper[0], paper[1], paper[2]);
      g.uniform3f(u.I, ink[0], ink[1], ink[2]);
      g.drawArrays(g.TRIANGLE_STRIP, 0, 4);
    };
  } else {
    const g = cv.getContext("2d")!;
    onResize = () => {
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    if (kind === "field") {
      let pts: { x: number; y: number; a: number }[] = [];
      const base = onResize;
      onResize = () => {
        base();
        pts = [];
        const s = W < 700 ? 26 : 32;
        for (let y = s / 2; y < H; y += s) for (let x = s / 2; x < W; x += s) pts.push({ x, y, a: 0 });
      };
      draw = () => {
        g.clearRect(0, 0, W, H);
        g.lineCap = "round";
        for (const p of pts) {
          const dx = cur.x - p.x;
          const dy = cur.y - p.y;
          const d = Math.hypot(dx, dy);
          const a = Math.atan2(dy, dx);
          p.a += (((a - p.a + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * 0.15;
          const k = Math.exp(-d / 380);
          const len = 5 + 9 * k;
          g.strokeStyle = rgba(ink, 0.08 + 0.35 * k);
          g.lineWidth = 0.9 + 0.8 * k;
          const cx = (Math.cos(p.a) * len) / 2;
          const cy = (Math.sin(p.a) * len) / 2;
          g.beginPath();
          g.moveTo(p.x - cx, p.y - cy);
          g.lineTo(p.x + cx, p.y + cy);
          g.stroke();
        }
      };
    } else {
      const N = innerWidth < 700 ? 1200 : 2800;
      const P = Array.from({ length: N }, () => ({
        x: Math.random() * innerWidth,
        y: Math.random() * innerHeight,
        vx: 0,
        vy: 0,
        s: Math.random(),
      }));
      draw = (t) => {
        g.fillStyle = rgba(paper, 0.22);
        g.fillRect(0, 0, W, H);
        const s = t / 1000;
        for (const p of P) {
          const dx = cur.x - p.x;
          const dy = cur.y - p.y;
          const d2 = dx * dx + dy * dy;
          const d = Math.sqrt(d2) + 1;
          const pull = Math.min(900 / d2, 0.08) * d;
          const k = Math.exp(-d / 260);
          // Swirl around the pointer, with a weak pull inward and a slow ambient current.
          p.vx += (-dy / d) * k * 0.9 + (dx / d) * pull * 0.02 + Math.sin(p.y * 0.006 + s * 0.3) * 0.02;
          p.vy += (dx / d) * k * 0.9 + (dy / d) * pull * 0.02 + Math.cos(p.x * 0.006 - s * 0.2) * 0.02;
          if (d < 26) {
            p.vx -= (dx / d) * 0.6;
            p.vy -= (dy / d) * 0.6;
          }
          p.vx *= 0.92;
          p.vy *= 0.92;
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < -5) p.x = W + 5;
          if (p.x > W + 5) p.x = -5;
          if (p.y < -5) p.y = H + 5;
          if (p.y > H + 5) p.y = -5;
          g.fillStyle = rgba(ink, 0.14 + 0.45 * k);
          const r = 0.6 + p.s * 0.9 + k * 0.6;
          g.fillRect(p.x, p.y, r, r);
        }
      };
    }
  }

  resize();
  addEventListener("resize", resize);
  document.body.prepend(cv);
  let raf = 0;
  const frame = (t: number) => {
    raf = requestAnimationFrame(frame);
    if (document.hidden) return;
    step(t);
    draw(t);
  };
  raf = requestAnimationFrame(frame);

  return () => {
    cancelAnimationFrame(raf);
    removeEventListener("resize", resize);
    removeEventListener("pointermove", onPointer);
    themeObs.disconnect();
    cv.remove();
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  };
}
