import { createLight, createScrollVelocity } from "./sceneLight";

/**
 * A fixed WebGL canvas under the whole Story page: fine plaster grain that scrolls with the page,
 * catches the shared light, dents softly under the mouse and ripples with scroll speed.
 * The reliefs draw on their own transparent canvas above it.
 */
const VERT = `attribute vec2 p;varying vec2 vPx;uniform vec2 uRes;
void main(){vPx=p*uRes;gl_Position=vec4(p.x*2.-1.,1.-p.y*2.,0.,1.);}`;

const FRAG = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 vPx;uniform sampler2D uPlaster;
uniform float uVel,uTime,uDark,uScroll,uPress,uVw;uniform vec3 uPaper;uniform vec2 uLight;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float H(vec2 w,vec2 px){
  float d=length(px-uLight);
  return texture2D(uPlaster,w/512.).r*.75+texture2D(uPlaster,w/1400.+.37).r*.25-uPress*exp(-d*d/2600.)*.9;
}
void main(){
  vec2 px=vPx;
  vec2 w=vec2(px.x,px.y+uScroll);
  w.x+=uVel*14.*sin(w.y*.018-uTime*2.2);
  w.y+=uVel*22.*sin(w.x*.006+uTime*.7);
  float c=H(w,px),gx=H(w+vec2(2.,0.),px+vec2(2.,0.))-c,gy=H(w+vec2(0.,2.),px+vec2(0.,2.))-c;
  vec2 L=uLight-px;float fall=exp(-dot(L,L)/(uVw*uVw*.12));
  float shade=clamp(dot(-vec2(gx,gy),normalize(L+1e-4))*40.,-1.,1.)*(.35+.65*fall)+dot(-vec2(gx,gy),vec2(.6,.8))*12.;
  float grain=h(floor(w/1.25))-.5;
  float fleck=step(.992,h(floor(w/3.)+11.))*(.5+.5*h(floor(w/3.)+3.));
  vec3 col=uDark>.5
    ?uPaper*(1.+(shade*.03+grain*.03-fleck*.04)*.6)+vec3(shade*.014+grain*.016)
    :uPaper*(1.+shade*.04+grain*.04-fleck*.07-(1.-fall)*.012);
  gl_FragColor=vec4(col,1.);
}`;

const PLASTER = 512;

/** A tileable plaster height map (periodic value noise), baked once so each pixel costs a few texture reads. */
function plasterMap(): Uint8Array {
  const out = new Float32Array(PLASTER * PLASTER);
  const hash = (x: number, y: number) => {
    const v = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return v - Math.floor(v);
  };
  for (const [cells, weight] of [
    [2, 0.4],
    [4, 0.28],
    [8, 0.17],
    [32, 0.1],
    [64, 0.05],
  ]) {
    const size = PLASTER / cells;
    for (let y = 0; y < PLASTER; y++)
      for (let x = 0; x < PLASTER; x++) {
        const fx = x / size,
          fy = y / size;
        const ix = Math.floor(fx),
          iy = Math.floor(fy);
        let tx = fx - ix,
          ty = fy - iy;
        tx = tx * tx * (3 - 2 * tx);
        ty = ty * ty * (3 - 2 * ty);
        const g = (a: number, b: number) =>
          hash((ix + a) % cells, ((iy + b) % cells) + cells * 7);
        const top = g(0, 0) + (g(1, 0) - g(0, 0)) * tx;
        const bot = g(0, 1) + (g(1, 1) - g(0, 1)) * tx;
        out[y * PLASTER + x] += (top + (bot - top) * ty) * weight;
      }
  }
  return Uint8Array.from(out, (v) => Math.min(255, v * 255));
}

export function mountPageSurface(): (() => void) | undefined {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.setAttribute("data-md-skip", "");
  canvas.style.cssText =
    "position:fixed;inset:0;width:100%;height:100%;z-index:-2;pointer-events:none";
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
    res: U("uRes"),
    vel: U("uVel"),
    time: U("uTime"),
    dark: U("uDark"),
    scroll: U("uScroll"),
    press: U("uPress"),
    vw: U("uVw"),
    paper: U("uPaper"),
    light: U("uLight"),
  };
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.LUMINANCE,
    PLASTER,
    PLASTER,
    0,
    gl.LUMINANCE,
    gl.UNSIGNED_BYTE,
    plasterMap(),
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.uniform1i(U("uPlaster"), 0);

  const root = document.documentElement;
  let paper = [1, 1, 1];
  let dark = 0;
  const readTheme = () => {
    const m = getComputedStyle(root)
      .getPropertyValue("--paper")
      .trim()
      .match(/^#([0-9a-f]{6})$/i);
    if (m)
      paper = [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16) / 255);
    dark = root.dataset.theme === "dark" ? 1 : 0;
  };
  readTheme();
  const themeObs = new MutationObserver(readTheme);
  themeObs.observe(root, { attributes: true, attributeFilter: ["data-theme"] });

  // The grain is drawn in CSS pixels (it's finer than the eye resolves at 2x anyway); slow GPUs step down further.
  let scale = 1;
  const resize = () => {
    canvas.width = Math.round(innerWidth * scale);
    canvas.height = Math.round(innerHeight * scale);
  };
  resize();
  addEventListener("resize", resize);

  const { light, step, dispose } = createLight();
  const velocity = createScrollVelocity();
  let press = 0;
  let slow = 0;
  let prevT = 0;
  let checkedAt = 0;
  let raf = 0;
  const frame = (t: number) => {
    raf = requestAnimationFrame(frame);
    if (prevT) slow += (t - prevT - slow) * 0.05;
    prevT = t;
    if (t - checkedAt > 2500 && slow > 26 && scale > 0.5) {
      scale = Math.max(0.5, scale - 0.25);
      checkedAt = t;
      resize();
    }
    step(t);
    const vel = velocity();
    press += ((t - light.lastPointer < 1500 ? 1 : 0) - press) * 0.06;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(u.res, innerWidth, innerHeight);
    gl.uniform1f(u.vel, vel);
    gl.uniform1f(u.time, t / 1000);
    gl.uniform1f(u.dark, dark);
    gl.uniform1f(u.scroll, scrollY);
    gl.uniform1f(u.press, press);
    gl.uniform1f(u.vw, innerWidth);
    gl.uniform3f(u.paper, paper[0], paper[1], paper[2]);
    gl.uniform2f(u.light, light.x, light.y);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    root.style.setProperty("--sv", vel.toFixed(3));
    root.style.setProperty(
      "--lx",
      ((light.x / innerWidth - 0.5) * 2).toFixed(2),
    );
    root.style.setProperty(
      "--ly",
      ((light.y / innerHeight - 0.5) * 2).toFixed(2),
    );
  };
  document.body.prepend(canvas);
  root.classList.add("fx-texture");
  raf = requestAnimationFrame(frame);

  return () => {
    cancelAnimationFrame(raf);
    removeEventListener("resize", resize);
    dispose();
    themeObs.disconnect();
    canvas.remove();
    root.classList.remove("fx-texture");
    for (const v of ["--sv", "--lx", "--ly"]) root.style.removeProperty(v);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  };
}
