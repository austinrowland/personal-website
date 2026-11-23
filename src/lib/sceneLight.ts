/**
 * The light shared by the Story's WebGL layers: it follows a mouse, and after 3s without one
 * (or on touch screens) drifts on its own. Every instance computes the same path, so layers stay in step.
 */
export function createLight() {
  const light = {
    x: innerWidth * 0.3,
    y: innerHeight * 0.2,
    tx: innerWidth * 0.3,
    ty: innerHeight * 0.2,
    lastPointer: -1e9,
  };
  const onPointer = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    light.tx = e.clientX;
    light.ty = e.clientY;
    light.lastPointer = performance.now();
  };
  addEventListener("pointermove", onPointer, { passive: true });
  return {
    light,
    step(t: number) {
      if (t - light.lastPointer > 3000) {
        const s = t / 1000;
        light.tx = innerWidth * (0.5 + 0.35 * Math.sin(s * 0.4));
        light.ty = innerHeight * (0.35 + 0.25 * Math.sin(s * 0.27 + 1));
      }
      light.x += (light.tx - light.x) * 0.08;
      light.y += (light.ty - light.y) * 0.08;
    },
    dispose: () => removeEventListener("pointermove", onPointer),
  };
}

/** Smoothed scroll speed in viewport heights per frame, scaled to roughly -1.5…1.5. */
export function createScrollVelocity() {
  let lastY = scrollY;
  let vel = 0;
  return () => {
    const dy = (scrollY - lastY) / innerHeight;
    lastY = scrollY;
    vel += (Math.max(-0.25, Math.min(0.25, dy)) * 6 - vel) * 0.12;
    return vel;
  };
}
