/**
 * One fixed WebGL canvas behind the Story page that draws every chapter's relief where its <img> sits.
 * Like a sculpted plaster wall: each relief swells up out of the flat wall as it scrolls in and sinks back
 * into it as it leaves, along a flowing front where the plaster softens and sags as it changes height.
 * Scroll velocity bends the plaster, and the pointer (or a slow drift on touch screens) rakes a light across it.
 */
const VERT = `attribute vec2 p;varying vec2 vUv;varying vec2 vPx;varying float vW;uniform vec4 uRect;uniform vec2 uRes;
void main(){vUv=p;vec2 px=uRect.xy+p*uRect.zw;vPx=px;vW=uRect.z;vec2 c=px/uRes*2.-1.;gl_Position=vec4(c.x,-c.y,0.,1.);}`;

const FRAG = `precision mediump float;varying vec2 vUv;varying vec2 vPx;varying float vW;uniform sampler2D uTex,uMask;
uniform float uVel,uIn,uOut,uDark,uScroll;uniform vec3 uPaper;uniform vec2 uLight;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+1.),f.x),f.y);}
float fbm(vec2 p){return .6*n(p)+.3*n(p*2.3+7.)+.1*n(p*5.1+3.);}
// How far the plaster stands out of the wall here: it rises from the bottom as the relief scrolls in and
// sinks from the top as it scrolls out, along a ragged front fixed to the wall so it flows past as you scroll.
float extrude(vec2 uv,vec2 wall){
  vec2 w=wall+vec2(fbm(wall*1.3),fbm(wall*1.3+9.))*.9;
  float rise=.55*fbm(w)+.45*(1.-uv.y);
  float sink=.55*fbm(w+21.)+.45*uv.y;
  return smoothstep(rise-.16,rise+.16,uIn*1.5-.25)*(1.-smoothstep(sink-.16,sink+.16,uOut*1.5-.25));
}
void main(){
  vec2 uv=vUv;float v=uVel;
  float bend=(uv.x-.5)*(uv.x-.5)*4.;
  uv.y+=v*.07*bend;
  vec2 wall=(vPx+vec2(0.,uScroll))/260.;
  float e=extrude(vUv,wall);
  // Where the height is changing the plaster is soft: it blurs, flows and sags a little.
  float m=4.*e*(1.-e);
  vec2 base=uv+(vec2(fbm(wall*2.+4.),fbm(wall*2.+13.))-.5)*m*.09+vec2(0.,m*.035);
  float b=m*2.5;
  float s=texture2D(uTex,base,b).r/.8;
  float lift=mix(.05,1.,e)*clamp(min(uIn,1.-uOut)*6.,0.,1.);
  vec2 q=min(vUv,1.-vUv);float edge=smoothstep(0.,.09,min(q.x,q.y));
  float vis=lift*edge;
  float r=1.+(s-1.)*vis;
  vec2 ex=vec2(1.5/1024.,0.);
  vec2 gr=vec2(texture2D(uTex,base+ex.xy,b).r-texture2D(uTex,base-ex.xy,b).r,texture2D(uTex,base+ex.yx,b).r-texture2D(uTex,base-ex.yx,b).r)/.8;
  vec2 L=uLight-vPx;float fall=exp(-dot(L,L)/(vW*vW*.5));
  float spec=clamp(dot(-gr,normalize(L+1e-4))*6.,-.25,.35)*fall*vis;
  vec3 col=uPaper*(r+spec*.22);
  if(uDark>.5){float obj=texture2D(uMask,base).r*vis;float key=clamp(dot(-gr,vec2(.7,.7))*3.5,-.05,.07);
    vec3 stone=mix(uPaper,vec3(clamp(.2+(s-1.)*.45+key,0.,1.)),obj)+spec*.22*obj;
    vec3 carved=uPaper+vec3(r-1.)*1.15+spec*.35;
    col=mix(carved,stone,.5)*(1.-.18*obj);}
  gl_FragColor=vec4(col,1.);
}`;

type Relief = {
  el: HTMLElement;
  img: HTMLImageElement;
  tex: WebGLTexture | null;
  mask: WebGLTexture | null;
};

const ramp = (v: number) => {
  const t = Math.min(1, Math.max(0, v));
  return t * t * (3 - 2 * t);
};

/** How far a relief has risen out of the wall as its box scrolls in from below, and sunk back as it leaves at the top. */
const rising = (b: DOMRect, vh: number) =>
  ramp((vh - b.top) / (vh * 0.45));
const sinking = (b: DOMRect, vh: number) =>
  ramp((vh * 0.35 - b.bottom) / (vh * 0.4));

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
    rise: U("uIn"),
    sink: U("uOut"),
    scroll: U("uScroll"),
    dark: U("uDark"),
    paper: U("uPaper"),
    light: U("uLight"),
  };

  const reliefs: Relief[] = els.map((el) => ({
    el,
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
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MIN_FILTER,
      data instanceof Uint8Array ? gl.LINEAR : gl.LINEAR_MIPMAP_LINEAR,
    );
    if (!(data instanceof Uint8Array)) gl.generateMipmap(gl.TEXTURE_2D);
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
    gl.uniform1f(u.dark, dark);
    gl.uniform3f(u.paper, paper[0], paper[1], paper[2]);
    gl.uniform2f(u.light, light.x, light.y);
    gl.uniform1f(u.scroll, scrollY);
    const vh = innerHeight;
    for (const r of reliefs) {
      if (!r.tex) continue;
      const b = r.el.getBoundingClientRect();
      const rise = rising(b, vh);
      const sink = sinking(b, vh);
      if (rise < 0.003 || sink > 0.997) continue;
      gl.uniform1f(u.rise, rise);
      gl.uniform1f(u.sink, sink);
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
