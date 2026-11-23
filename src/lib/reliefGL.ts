/**
 * One fixed WebGL canvas behind the Story page that draws every chapter's relief where its <img> sits.
 * Each relief gathers out of scattered brush dabs as its chapter scrolls in, holds solid beside the text,
 * and scatters as the chapter leaves; scroll velocity also bends and smears the plaster,
 * and the pointer (or a slow drift on touch screens) rakes a light across it.
 */
const VERT = `attribute vec2 p;varying vec2 vUv;varying vec2 vPx;varying float vW;uniform vec4 uRect;uniform vec2 uRes;
void main(){vUv=p;vec2 px=uRect.xy+p*uRect.zw;vPx=px;vW=uRect.z;vec2 c=px/uRes*2.-1.;gl_Position=vec4(c.x,-c.y,0.,1.);}`;

const FRAG = `precision mediump float;varying vec2 vUv;varying vec2 vPx;varying float vW;uniform sampler2D uTex,uMask;
uniform float uVel,uTime,uSolid,uDark;uniform vec3 uPaper;uniform vec2 uLight;
float S(vec2 uv){return texture2D(uTex,uv).r/.8;}
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+1.),f.x),f.y);}
void main(){
  vec2 uv=vUv;float v=uVel;
  float bend=(uv.x-.5)*(uv.x-.5)*4.;
  uv.y+=v*.07*bend;
  uv.x+=v*.035*(sin(uv.y*9.+uTime*1.7)*.6+sin(uv.y*23.-uTime*2.3)*.4);
  float a=clamp(1.-uSolid+abs(v)*.35,0.,1.);
  float ang=n(uv*2.3+3.)*4.;float c=cos(ang),sn=sin(ang);mat2 m=mat2(c,-sn,sn,c);
  vec2 sc=vec2(1.,2.8);float cs=mix(1./70.,1./16.,a);
  vec2 dp=(m*uv)*sc/cs;vec2 di=floor(dp),df=fract(dp);
  float best=9.;vec2 bc=vec2(0.);float bh=0.;
  for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec2 g=vec2(float(x),float(y));vec2 o=vec2(h(di+g),h(di+g+19.));float d=length(g+o-df);if(d<best){best=d;bc=di+g+o;bh=h(di+g+5.);}}
  vec2 cuv=(bc*cs/sc)*m+(vec2(h(bc),h(bc+3.))-.5)*a*.05;
  vec2 base=mix(uv,cuv,smoothstep(.02,.55,a));
  float s=0.;for(int i=0;i<5;i++){s+=S(base+vec2(0.,(float(i)/4.-.5)*v*.09));}s/=5.;
  float th=.45*bh+.3*n(uv*5.)+.25*min(1.,length(uv-.5)*1.6);
  float vis=smoothstep(0.,.22,uSolid*1.3-th)*(1.-smoothstep(.45,1.,best)*a*.8);
  vec2 q=min(vUv,1.-vUv);float edge=smoothstep(0.,.09,min(q.x,q.y));
  float r=1.+(s-1.)*vis*edge;
  vec2 e=vec2(1.5/1024.,0.);
  vec2 gr=vec2(S(base+e.xy)-S(base-e.xy),S(base+e.yx)-S(base-e.yx));
  vec2 L=uLight-vPx;float fall=exp(-dot(L,L)/(vW*vW*.5));
  float spec=clamp(dot(-gr,normalize(L+1e-4))*6.,-.25,.35)*fall*vis*edge;
  vec3 col=uPaper*(r+spec*.22);
  if(uDark>.5){float obj=texture2D(uMask,base).r*vis*edge;float key=clamp(dot(-gr,vec2(.7,.7))*3.5,-.05,.07);col=mix(uPaper,vec3(clamp(.2+(s-1.)*.45+key,0.,1.)),obj)+spec*.22*obj;}
  gl_FragColor=vec4(col,1.);
}`;

type Relief = {
  el: HTMLElement;
  chapter: HTMLElement;
  img: HTMLImageElement;
  tex: WebGLTexture | null;
  mask: WebGLTexture | null;
};

const ramp = (v: number) => {
  const t = Math.min(1, Math.max(0, v));
  return t * t * (3 - 2 * t);
};

/**
 * How finished a chapter's relief is: it gathers from loose dabs while the chapter scrolls in,
 * holds solid while its text is beside it, and scatters again as the chapter leaves.
 */
const solidity = (c: DOMRect, vh: number) =>
  Math.min(
    ramp((vh * 0.95 - c.top) / (vh * 0.55)),
    ramp((c.bottom - vh * 0.3) / (vh * 0.4)),
  );

const MASK = 128;

/**
 * Where the sculpture is, as opposed to the flat wall behind it (which the assets normalize to 80% grey).
 * Dark mode needs it to lift the carving off the page; a blurred 128px map is plenty.
 */
function sculptureMask(img: HTMLImageElement): Uint8Array {
  const n = MASK * 4;
  const c = document.createElement("canvas");
  c.width = c.height = n;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, n, n);
  const px = ctx.getImageData(0, 0, n, n).data;
  let m = new Float32Array(MASK * MASK);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++)
      if (Math.abs(px[(y * n + x) * 4] - 204) > 10)
        m[(y >> 2) * MASK + (x >> 2)] += 1 / 16;
  m = m.map((v) => Math.min(1, Math.max(0, (v - 0.1) / 0.3)));
  const pass = (
    f: (acc: number, v: number, centre: boolean) => number,
    init: number,
    done = (v: number) => v,
  ) => {
    const out = new Float32Array(m.length);
    for (let y = 0; y < MASK; y++)
      for (let x = 0; x < MASK; x++) {
        let acc = init;
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            const yy = Math.min(MASK - 1, Math.max(0, y + dy));
            const xx = Math.min(MASK - 1, Math.max(0, x + dx));
            acc = f(acc, m[yy * MASK + xx], !dx && !dy);
          }
        out[y * MASK + x] = done(acc);
      }
    m = out;
  };
  // Close gaps (flat panels inside a carving, like the stage disc), keep a little growth, then soften the edge.
  for (let i = 0; i < 6; i++) pass((a, v) => Math.max(a, v), 0);
  for (let i = 0; i < 4; i++) pass((a, v) => Math.min(a, v), 1);
  for (let i = 0; i < 3; i++)
    pass(
      (a, v) => a + v,
      0,
      (v) => v / 9,
    );
  return Uint8Array.from(m, (v) => Math.min(255, v * 255));
}

export function mountReliefs(root: HTMLElement): (() => void) | undefined {
  const els = [...root.querySelectorAll<HTMLElement>("[data-relief]")];
  if (!els.length || matchMedia("(prefers-reduced-motion: reduce)").matches)
    return;
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText =
    "position:fixed;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none";
  const gl = canvas.getContext("webgl", {
    antialias: false,
    alpha: false,
    powerPreference: "low-power",
  });
  if (!gl) return;

  const sh = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);
  gl.uniform1i(gl.getUniformLocation(prog, "uTex"), 0);
  gl.uniform1i(gl.getUniformLocation(prog, "uMask"), 1);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]),
    gl.STATIC_DRAW,
  );
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = (n: string) => gl.getUniformLocation(prog, n);
  const u = {
    rect: U("uRect"),
    res: U("uRes"),
    vel: U("uVel"),
    time: U("uTime"),
    solid: U("uSolid"),
    dark: U("uDark"),
    paper: U("uPaper"),
    light: U("uLight"),
  };

  const reliefs: Relief[] = els.map((el) => ({
    el,
    chapter: el.closest<HTMLElement>("[data-chapter]") ?? el,
    img: el.querySelector("img")!,
    tex: null,
    mask: null,
  }));
  const texture = (
    unit: number,
    w: number,
    h: number,
    data: HTMLImageElement | Uint8Array,
  ) => {
    const t = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    if (data instanceof Uint8Array)
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.LUMINANCE,
        w,
        h,
        0,
        gl.LUMINANCE,
        gl.UNSIGNED_BYTE,
        data,
      );
    else
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.LUMINANCE,
        gl.LUMINANCE,
        gl.UNSIGNED_BYTE,
        data,
      );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return t;
  };
  const upload = (r: Relief) => {
    r.tex = texture(0, 0, 0, r.img);
    r.mask = texture(1, MASK, MASK, sculptureMask(r.img));
  };
  Promise.all(
    reliefs.map((r) =>
      r.img.decode().then(
        () => upload(r),
        () => {},
      ),
    ),
  ).then(() => {
    if (!alive) return;
    document.body.prepend(canvas);
    document.documentElement.classList.add("relief-gl");
  });

  let paper = [1, 1, 1];
  let dark = 0;
  const readTheme = () => {
    const c = getComputedStyle(document.documentElement)
      .getPropertyValue("--paper")
      .trim();
    const m = c.match(/^#([0-9a-f]{6})$/i);
    if (m)
      paper = [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16) / 255);
    dark = document.documentElement.dataset.theme === "dark" ? 1 : 0;
  };
  readTheme();
  const themeObs = new MutationObserver(readTheme);
  themeObs.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  const dpr = Math.min(devicePixelRatio || 1, innerWidth < 768 ? 1.5 : 2);
  const resize = () => {
    canvas.width = Math.round(innerWidth * dpr);
    canvas.height = Math.round(innerHeight * dpr);
  };
  resize();
  addEventListener("resize", resize);

  const light = {
    x: innerWidth * 0.3,
    y: innerHeight * 0.2,
    tx: innerWidth * 0.3,
    ty: innerHeight * 0.2,
  };
  let lastPointer = -1e9;
  const onPointer = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    light.tx = e.clientX;
    light.ty = e.clientY;
    lastPointer = performance.now();
  };
  addEventListener("pointermove", onPointer, { passive: true });

  let lastY = scrollY;
  let vel = 0;
  let alive = true;
  let raf = 0;
  const frame = (t: number) => {
    raf = requestAnimationFrame(frame);
    const dy = (scrollY - lastY) / innerHeight;
    lastY = scrollY;
    vel += (Math.max(-0.25, Math.min(0.25, dy)) * 6 - vel) * 0.12;
    if (t - lastPointer > 3000) {
      const s = t / 1000;
      light.tx = innerWidth * (0.5 + 0.35 * Math.sin(s * 0.4));
      light.ty = innerHeight * (0.35 + 0.25 * Math.sin(s * 0.27 + 1));
    }
    light.x += (light.tx - light.x) * 0.08;
    light.y += (light.ty - light.y) * 0.08;

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(paper[0], paper[1], paper[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(u.res, innerWidth, innerHeight);
    gl.uniform1f(u.vel, vel);
    gl.uniform1f(u.time, t / 1000);
    gl.uniform1f(u.dark, dark);
    gl.uniform3f(u.paper, paper[0], paper[1], paper[2]);
    gl.uniform2f(u.light, light.x, light.y);
    const vh = innerHeight;
    for (const r of reliefs) {
      if (!r.tex) continue;
      const b = r.el.getBoundingClientRect();
      if (b.bottom < -vh * 0.2 || b.top > vh * 1.2) continue;
      const solid = solidity(r.chapter.getBoundingClientRect(), vh);
      if (solid < 0.003) continue;
      gl.uniform1f(u.solid, solid);
      // Draw a margin around the box so bent edges never clip; the wall there is flat paper anyway.
      const m = b.width * 0.08;
      gl.uniform4f(
        u.rect,
        b.left - m,
        b.top - m,
        b.width + 2 * m,
        b.height + 2 * m,
      );
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, r.mask);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, r.tex);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
  };
  raf = requestAnimationFrame(frame);

  return () => {
    alive = false;
    cancelAnimationFrame(raf);
    removeEventListener("resize", resize);
    removeEventListener("pointermove", onPointer);
    themeObs.disconnect();
    canvas.remove();
    document.documentElement.classList.remove("relief-gl");
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  };
}
