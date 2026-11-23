/**
 * One fixed WebGL canvas behind the Story page that draws every chapter's relief where its <img> sits.
 * Scrolling feeds a smoothed velocity into the shader, which bends, ripples and smears the plaster,
 * the way Immersive Garden's reliefs react to the scroll. Each relief rises out of the wall as it enters,
 * and the pointer (or a slow drift on touch screens) rakes a light across it.
 */
const VERT = `attribute vec2 p;varying vec2 vUv;varying vec2 vPx;varying float vW;uniform vec4 uRect;uniform vec2 uRes;
void main(){vUv=p;vec2 px=uRect.xy+p*uRect.zw;vPx=px;vW=uRect.z;vec2 c=px/uRes*2.-1.;gl_Position=vec4(c.x,-c.y,0.,1.);}`;

const FRAG = `precision mediump float;varying vec2 vUv;varying vec2 vPx;varying float vW;uniform sampler2D uTex;
uniform float uVel,uTime,uReveal,uDark;uniform vec3 uPaper;uniform vec2 uLight;
float S(vec2 uv){return texture2D(uTex,uv).r/.8;}
void main(){
  vec2 uv=vUv;float v=uVel;
  float bend=(uv.x-.5)*(uv.x-.5)*4.;
  uv.y+=v*.07*bend;
  uv.x+=v*.035*(sin(uv.y*9.+uTime*1.7)*.6+sin(uv.y*23.-uTime*2.3)*.4);
  float s=0.;for(int i=0;i<7;i++){s+=S(uv+vec2(0.,(float(i)/6.-.5)*v*.09));}s/=7.;
  vec2 q=min(vUv,1.-vUv);float edge=smoothstep(0.,.09,min(q.x,q.y));
  float r=1.+(s-1.)*uReveal*edge;
  vec2 e=vec2(1.5/1024.,0.);
  vec2 g=vec2(S(uv+e.xy)-S(uv-e.xy),S(uv+e.yx)-S(uv-e.yx));
  vec2 L=uLight-vPx;float fall=exp(-dot(L,L)/(vW*vW*.5));
  float spec=clamp(dot(-g,normalize(L+1e-4))*6.,-.25,.35)*fall*uReveal*edge;
  vec3 col=uDark>.5?uPaper+vec3(r-1.)*1.15+spec*.35:uPaper*(r+spec*.22);
  gl_FragColor=vec4(col,1.);
}`;

type Relief = { el: HTMLElement; img: HTMLImageElement; tex: WebGLTexture | null };

export function mountReliefs(root: HTMLElement): (() => void) | undefined {
  const els = [...root.querySelectorAll<HTMLElement>("[data-relief]")];
  if (!els.length || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = "position:fixed;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none";
  const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
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
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = (n: string) => gl.getUniformLocation(prog, n);
  const u = { rect: U("uRect"), res: U("uRes"), vel: U("uVel"), time: U("uTime"), reveal: U("uReveal"), dark: U("uDark"), paper: U("uPaper"), light: U("uLight") };

  const reliefs: Relief[] = els.map((el) => ({ el, img: el.querySelector("img")!, tex: null }));
  const upload = (r: Relief) => {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, gl.LUMINANCE, gl.UNSIGNED_BYTE, r.img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    r.tex = t;
  };
  Promise.all(reliefs.map((r) => r.img.decode().then(() => upload(r), () => {}))).then(() => {
    if (!alive) return;
    document.body.prepend(canvas);
    document.documentElement.classList.add("relief-gl");
  });

  let paper = [1, 1, 1];
  let dark = 0;
  const readTheme = () => {
    const c = getComputedStyle(document.documentElement).getPropertyValue("--paper").trim();
    const m = c.match(/^#([0-9a-f]{6})$/i);
    if (m) paper = [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16) / 255);
    dark = document.documentElement.dataset.theme === "dark" ? 1 : 0;
  };
  readTheme();
  const themeObs = new MutationObserver(readTheme);
  themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  const dpr = Math.min(devicePixelRatio || 1, innerWidth < 768 ? 1.5 : 2);
  const resize = () => {
    canvas.width = Math.round(innerWidth * dpr);
    canvas.height = Math.round(innerHeight * dpr);
  };
  resize();
  addEventListener("resize", resize);

  const light = { x: innerWidth * 0.3, y: innerHeight * 0.2, tx: innerWidth * 0.3, ty: innerHeight * 0.2 };
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
      const p = Math.min(1, Math.max(0, (vh - b.top) / (b.height * 0.9 + vh * 0.25)));
      gl.uniform1f(u.reveal, p * p * (3 - 2 * p));
      // Draw a margin around the box so bent edges never clip; the wall there is flat paper anyway.
      const m = b.width * 0.08;
      gl.uniform4f(u.rect, b.left - m, b.top - m, b.width + 2 * m, b.height + 2 * m);
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
