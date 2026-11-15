// PROTOTYPE harness for the Studio style exploration: paints one still of one Studio subject in one
// treatment, on a transparent canvas over the page colour, and reports first-paint time and shader
// programs in `window.__studioStyle`. URL: /studio-style/index.html?kind=server&t=1&theme=light&w=573&h=558
// t=0 is the current photographic Studio, built exactly as src/objects/mount.ts builds it.
import { SITE, BUILD_PALETTE, treatment, type Theme } from "./treatments";

const params = new URLSearchParams(location.search);
const kind = (params.get("kind") ?? "server") as "server" | "travel" | "trading";
const t = Number(params.get("t") ?? 1);
const theme: Theme = params.get("theme") === "dark" ? "dark" : "light";
const width = Number(params.get("w") ?? 573);
const height = Number(params.get("h") ?? 558);
const timeParam = params.get("time");

/** The palettes junxiong.dev passes to Studio today (junxiong-homepage lib/theme.js). */
const HOBBY_PALETTES = {
  light: { accent: 0x234ea2, ink: 0x29231f, muted: 0x85776e, paper: 0xfbf8f2 },
  dark: { accent: 0x9ab6ff, ink: 0x353c49, muted: 0x919aab, paper: 0xe4e7ed },
};

const hex = (n: number) => `#${n.toString(16).padStart(6, "0")}`;
const colours = SITE[theme];
document.body.style.background = hex(colours.page);
document.body.style.color = hex(colours.ink);
const stage = document.getElementById("stage")!;
Object.assign(stage.style, { width: `${width}px`, height: `${height}px` });
const canvas = document.createElement("canvas");

declare global {
  interface Window {
    __studioStyle?: Record<string, unknown>;
  }
}

async function run() {
  const [THREE, scenes, look, T] = await Promise.all([
    import("three"),
    import("../../src/objects/scenes"),
    import("../../src/objects/look"),
    import("./treatments"),
  ]);
  const spec = t > 0 ? treatment(t, theme) : null;
  if (spec?.grid) {
    const grid = document.createElement("div");
    grid.className = "grid";
    grid.style.setProperty("--dot", theme === "dark" ? "rgba(154,182,255,.22)" : "rgba(35,78,162,.2)");
    stage.append(grid);
  }
  stage.append(canvas);
  await new Promise((r) => requestAnimationFrame(() => r(null)));

  // ---- mount → first paint (timed): build, renderer, look, compile, render, GPU sync.
  const t0 = performance.now();
  const object = await scenes.createObject(kind, spec ? BUILD_PALETTE : HOBBY_PALETTES[theme], 0, 0);
  const built = performance.now();
  const { rig, framing, camera: lens, contactShadow } = look.resolveLook(object.userData.look, theme);
  const gl = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "default" });
  const pixelRatio = Math.min(window.devicePixelRatio, 1.5);
  gl.setPixelRatio(pixelRatio);
  gl.outputColorSpace = THREE.SRGBColorSpace;
  const world = new THREE.Scene();
  const restTime = timeParam ? Number(timeParam) : ((object.userData.restTime as number | undefined) ?? 5400);
  let styled: ReturnType<typeof T.restyle> | null = null;
  let envTarget: import("three").WebGLRenderTarget | null = null;
  if (!spec) {
    envTarget = await look.buildEnvironment(gl, rig);
    world.environment = envTarget?.texture ?? null;
    world.environmentIntensity = rig.environment.intensity;
    world.environmentRotation.y = rig.environment.rotation;
    look.applyMaterials(object, envTarget?.texture ?? null, rig, theme);
    gl.toneMapping = look.toneMappingFor(rig);
    gl.toneMappingExposure = rig.exposure;
    if (rig.key.shadow) {
      gl.shadowMap.enabled = true;
      gl.shadowMap.type = THREE.PCFShadowMap;
    }
    if (contactShadow) {
      object.userData.animate?.(restTime);
      look.addContactShadow(object, contactShadow);
    }
    world.add(object);
    look.addRigLights(world, rig, false);
  } else {
    if (contactShadow) {
      object.userData.animate?.(restTime);
      look.addContactShadow(object, contactShadow);
    }
    styled = T.restyle(object, spec, restTime);
    world.add(object);
  }
  const camera =
    lens.projection === "perspective"
      ? new THREE.PerspectiveCamera(lens.fov, 1, 0.1, 100)
      : new THREE.OrthographicCamera(-3, 3, 3, -3, 0.1, 100);
  const rotation = look.cameraRotation(lens);
  const subject = framing ? look.measureSubject(object, rotation, look.framingTimes(object, framing, restTime)) : null;
  gl.setSize(width, height, false);
  if (framing && subject) look.fitCamera(camera, subject, width / height, framing, rotation);
  styled?.setSize(width, height, pixelRatio);
  object.userData.animate?.(restTime);
  // ?cold=<n>: make every program's source unique so no shader cache (ANGLE, Chrome's GPU cache,
  // the OS Metal cache) can serve it, and the compile below is a real cold compile. Not covered:
  // three's internal PMREM and shadow-depth programs (Studio row 0 only), so row 0 is under-counted.
  const nonce = params.get("cold");
  if (nonce) {
    const line = `if ( gl_FragCoord.x < -${nonce}.0 ) discard;`;
    world.traverse((item) => {
      const mesh = item as import("three").Mesh;
      for (const m of Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : []) {
        if (m.userData.nonce) continue;
        m.userData.nonce = true;
        const shader = m as import("three").ShaderMaterial;
        if (shader.isShaderMaterial) {
          shader.fragmentShader = shader.fragmentShader.replace("void main() {", `void main() {\n${line}`);
        } else {
          const before = m.onBeforeCompile.bind(m);
          const key = m.customProgramCacheKey.bind(m);
          m.onBeforeCompile = (s, r) => {
            before(s, r);
            s.fragmentShader = s.fragmentShader.replace("void main() {", `void main() {\n${line}`);
          };
          m.customProgramCacheKey = () => `${key()}-${nonce}`;
        }
        m.needsUpdate = true;
      }
    });
  }
  const beforeCompile = performance.now();
  await gl.compileAsync(world, camera);
  const compiled = performance.now();
  gl.render(world, camera);
  const pixel = new Uint8Array(4);
  const ctx = gl.getContext();
  ctx.readPixels(0, 0, 1, 1, ctx.RGBA, ctx.UNSIGNED_BYTE, pixel);
  const painted = performance.now();

  // ---- overlay (not timed: HTML/SVG over the scene)
  if (spec?.overlay === "blueprint") drawBlueprint(object, T.anchors(object, kind), camera, THREE);

  window.__studioStyle = {
    kind,
    treatment: t,
    name: spec?.name ?? "Current Studio",
    theme,
    width,
    height,
    pixelRatio,
    firstPaintMs: Math.round(painted - t0),
    buildMs: Math.round(built - t0),
    setupMs: Math.round(beforeCompile - built),
    compileMs: Math.round(compiled - beforeCompile),
    renderMs: Math.round(painted - compiled),
    programs: gl.info.programs?.length ?? -1,
    drawCalls: gl.info.render.calls,
    triangles: gl.info.render.triangles,
    environment: Boolean(envTarget),
    shadowMap: gl.shadowMap.enabled,
  };
  document.title = "ready";
}

/** Numbered callouts with leaders to projected anchors, plus a `fig.` caption. Real text, 12px. */
function drawBlueprint(
  objectRoot: import("three").Object3D,
  points: { label: string; point: import("three").Vector3 }[],
  camera: import("three").Camera,
  THREE: typeof import("three"),
) {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("width", String(width));
  svg.setAttribute("height", String(height));
  const ink = hex(colours.ink);
  const projected = points.map(({ label, point }) => {
    const p = point.clone().project(camera);
    return { label, x: ((p.x + 1) / 2) * width, y: ((1 - p.y) / 2) * height };
  });
  // The object's screen bounds, from its box corners: callout numbers sit in a column just outside
  // them, on the side of their anchor, with level leaders (nudged apart, never crossing).
  const box = new THREE.Box3();
  objectRoot.traverse((item) => {
    const mesh = item as import("three").Mesh;
    if (mesh.isMesh && !item.userData.frameIgnore && mesh.name !== "contact-shadow") box.expandByObject(mesh);
  });
  let minX = Infinity,
    maxX = -Infinity;
  for (let i = 0; i < 8; i++) {
    const c = new THREE.Vector3(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z).project(camera);
    const x = ((c.x + 1) / 2) * width;
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
  }
  const centre = (minX + maxX) / 2;
  const columns = { right: Math.min(width - 26, maxX + 14), left: Math.max(26, minX - 14) };
  for (const side of ["left", "right"] as const) {
    const items = projected.filter((p) => (p.x >= centre) === (side === "right")).sort((a, b) => a.y - b.y);
    let lastY = -Infinity;
    for (const item of items) {
      const n = projected.indexOf(item) + 1;
      const x = columns[side];
      const y = Math.max(item.y, lastY + 20);
      lastY = y;
      const line = document.createElementNS(ns, "polyline");
      const end = side === "right" ? x - 4 : x + 4;
      const knee = side === "right" ? end - 10 : end + 10;
      line.setAttribute("points", `${item.x},${item.y} ${knee},${y} ${end},${y}`);
      line.setAttribute("fill", "none");
      line.setAttribute("stroke", ink);
      line.setAttribute("stroke-width", "1");
      svg.append(line);
      const dot = document.createElementNS(ns, "circle");
      dot.setAttribute("cx", String(item.x));
      dot.setAttribute("cy", String(item.y));
      dot.setAttribute("r", "2.5");
      dot.setAttribute("fill", ink);
      svg.append(dot);
      const text = document.createElementNS(ns, "text");
      text.setAttribute("class", "label");
      text.setAttribute("x", String(side === "right" ? x + 2 : x - 2));
      text.setAttribute("y", String(y + 4));
      text.setAttribute("text-anchor", side === "right" ? "start" : "end");
      text.setAttribute("fill", ink);
      text.textContent = String(n).padStart(2, "0");
      svg.append(text);
    }
  }
  stage.append(svg);
  const caption = document.createElement("div");
  caption.className = "caption";
  caption.style.color = ink;
  const title = kind === "server" ? "Inference node" : kind === "travel" ? "Folded atlas" : "Market abacus";
  caption.textContent = `fig. 1 — ${title}: ${projected.map((p, i) => `${String(i + 1).padStart(2, "0")} ${p.label}`).join(", ")}.`;
  stage.append(caption);
}

run().catch((error) => {
  window.__studioStyle = { error: String(error?.stack ?? error) };
  document.title = "error";
});
