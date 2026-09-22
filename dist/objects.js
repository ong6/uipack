import {
  CanvasView
} from "./chunk-GP5TROIA.js";

// src/objects/index.tsx
import { useEffect, useRef, useState } from "react";

// src/objects/variants.ts
var objectDirections = [
  { id: "studio", name: "Studio objects", description: "Physical details, soft light, close-up choreography." },
  { id: "paper-theatre", name: "Paper worlds", description: "Cut-paper stages, layered landscapes and pop-up architecture." },
  { id: "kinetic", name: "Kinetic sculptures", description: "Brass mechanisms, ceramic forms and suspended motion." },
  { id: "cartoon", name: "Cartoon worlds", description: "Rounded little places, toy-like details and playful motion." },
  { id: "realistic", name: "Realistic close-ups", description: "Tactile materials, precision details and intimate camera angles." },
  { id: "abstract", name: "Abstract forms", description: "Optical glass, sculptural rhythms and unexpected silhouettes." }
];
var objectVariants = {
  ai: ["Studio \xB7 Agent laptop", "Paper \xB7 Thinking machine", "Kinetic \xB7 Neural orrery", "Cartoon \xB7 Night workshop", "Realistic \xB7 Key travel", "Abstract \xB7 Thought lattice"],
  contact: ["Signature inbox", "Blue inbox", "Terracotta inbox", "Cartoon \xB7 Little post office", "Kinetic \xB7 Correspondence mobile"],
  tennis: ["Studio \xB7 Club rally", "Paper \xB7 Centre court", "Kinetic \xB7 Racket study", "Cartoon \xB7 Courtside club", "Realistic \xB7 Match point", "Abstract \xB7 Elastic exchange"],
  trading: ["Studio \xB7 Market terminal", "Paper \xB7 Market accordion", "Kinetic \xB7 Market balance", "Cartoon \xB7 Exchange avenue", "Realistic \xB7 Ticker study", "Abstract \xB7 Risk rhythm"],
  server: ["Studio \xB7 Inference hardware", "Paper \xB7 Server architecture", "Kinetic \xB7 Floating compute", "Cartoon \xB7 Cloud factory", "Realistic \xB7 Silicon detail", "Abstract \xB7 Signal stack"],
  travel: ["Studio \xB7 Folded atlas", "Paper \xB7 Alpine passage", "Kinetic \xB7 Armillary globe", "Cartoon \xB7 Island express", "Realistic \xB7 Field compass", "Abstract \xB7 Passage"],
  reading: ["Studio \xB7 Turning pages", "Paper \xB7 A world inside", "Kinetic \xB7 Suspended folio", "Cartoon \xB7 Reading nook", "Realistic \xB7 Quiet chapter", "Abstract \xB7 Unwritten"]
};
function chooseObjectVariant(random = Math.random, count = objectDirections.length) {
  return Math.min(count - 1, Math.max(0, Math.floor(random() * count)));
}
var objectEditions = {
  ai: ["Signature terminal", "Midnight terminal", "Warm graphite"],
  contact: ["Signature inbox", "Blue inbox", "Terracotta inbox"],
  tennis: ["Grass club", "Clay club", "Blue hardcourt"],
  trading: ["Breakout", "Pullback", "Range reversal"],
  server: ["Signature hardware", "Blue hardware", "Copper hardware"],
  travel: ["Woodland atlas", "Coastal atlas", "Desert atlas"],
  reading: ["Signature cloth", "Oxblood cloth", "Midnight cloth"]
};
var directionSymbols = ["\u25D2", "\u25B1", "\u25CE", "\u25A7", "\u25C9", "\u25C7"];
function parseObjectVariant(value) {
  const index = Number(value);
  return value != null && value !== "" && Number.isInteger(index) && index >= 0 && index < objectDirections.length ? index : 0;
}
function objectDirectionIndex(kind, variant) {
  return kind === "contact" ? variant === 3 ? 3 : variant === 4 ? 2 : 0 : variant;
}
function normalizeObjectVariant(kind, variant) {
  return kind === "contact" && variant > 4 ? 0 : variant;
}
function transferObjectVariant(from, to, variant) {
  if (from === to) return normalizeObjectVariant(to, variant);
  const direction = objectDirectionIndex(from, variant);
  return to === "contact" ? direction === 2 ? 4 : direction === 3 ? 3 : 0 : direction;
}

// src/objects/gallery.tsx
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function AnimationWorkspace({ library, children, theme = "light" }) {
  return /* @__PURE__ */ jsxs("div", { className: "uipack-animation-workspace", "data-theme": theme, children: [
    /* @__PURE__ */ jsx("aside", { className: "uipack-animation-library", children: library }),
    /* @__PURE__ */ jsx("div", { className: "uipack-animation-detail", children })
  ] });
}
function ObjectInspector({ kind, variant, edition = 0, onVariantChange, onEditionChange }) {
  variant = normalizeObjectVariant(kind, variant);
  const contact = kind === "contact";
  return /* @__PURE__ */ jsxs("aside", { className: "uipack-object-inspector", children: [
    /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("h3", { children: "Art direction" }),
      /* @__PURE__ */ jsx("div", { role: "group", "aria-label": "3D art direction", className: "uipack-direction-list", children: objectDirections.map((direction, index) => ({ direction, index })).filter(({ index }) => !contact || [0, 2, 3].includes(index)).map(({ direction, index }) => /* @__PURE__ */ jsxs("button", { type: "button", "aria-label": direction.name, "aria-pressed": objectDirectionIndex(kind, variant) === index, onClick: () => onVariantChange(contact && index === 2 ? 4 : index), children: [
        /* @__PURE__ */ jsx("span", { className: "uipack-direction-symbol", "aria-hidden": "true", children: directionSymbols[index] }),
        /* @__PURE__ */ jsxs("span", { children: [
          /* @__PURE__ */ jsx("strong", { children: direction.name }),
          /* @__PURE__ */ jsx("small", { children: direction.description })
        ] })
      ] }, direction.id)) })
    ] }),
    (contact ? variant < 3 : variant === 0) && /* @__PURE__ */ jsxs("label", { className: "uipack-edition-select", children: [
      contact ? "Inbox edition" : "Studio edition",
      /* @__PURE__ */ jsx("select", { value: contact ? variant % 3 : edition, onChange: (e) => (contact ? onVariantChange : onEditionChange)(Number(e.target.value)), children: objectEditions[kind].map((name, index) => /* @__PURE__ */ jsx("option", { value: index, children: name }, name)) }),
      /* @__PURE__ */ jsx("small", { children: contact ? "Three original inbox finishes." : "The original looks, kept together in Studio." })
    ] })
  ] });
}
function ObjectGallery({ kind, variant = 0, edition = 0, theme = "light", palette, onChange }) {
  variant = normalizeObjectVariant(kind, variant);
  const scene = objectScenes.find((item) => item.id === kind);
  return /* @__PURE__ */ jsxs(AnimationWorkspace, { theme, library: /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("h3", { children: "Object library" }),
    /* @__PURE__ */ jsx("nav", { "aria-label": "Choose an object", className: "uipack-scene-list", children: objectScenes.map((item) => /* @__PURE__ */ jsxs("button", { type: "button", "aria-pressed": kind === item.id, onClick: () => onChange(item.id, transferObjectVariant(kind, item.id, variant), edition), children: [
      item.title,
      /* @__PURE__ */ jsx("span", { "aria-hidden": "true", children: "\u2197" })
    ] }, item.id)) })
  ] }), children: [
    /* @__PURE__ */ jsxs("header", { className: "uipack-animation-heading", children: [
      /* @__PURE__ */ jsx("h3", { children: scene.title }),
      /* @__PURE__ */ jsx("span", { children: "Live 3D preview" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "uipack-object-review", children: [
      /* @__PURE__ */ jsx("div", { className: "uipack-gallery-stage", children: /* @__PURE__ */ jsx(ObjectScene, { kind, label: scene.title, variant, edition, theme, palette }, kind) }),
      /* @__PURE__ */ jsx(ObjectInspector, { kind, variant, edition, onVariantChange: (value) => onChange(kind, value, edition), onEditionChange: (value) => onChange(kind, variant, value) })
    ] }),
    /* @__PURE__ */ jsx("p", { className: "uipack-gallery-description", children: objectDirectionIndex(kind, variant) === 0 ? scene.description : objectDirections[objectDirectionIndex(kind, variant)].description })
  ] });
}

// src/objects/index.tsx
import { Fragment as Fragment2, jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
var objectPalettes = {
  light: { paper: 15986663, ink: 2698802, muted: 10136485, accent: 2121545 },
  dark: { paper: 14212825, ink: 3755080, muted: 8492426, accent: 7454115 }
};
var objectScenes = [
  {
    id: "ai",
    title: "Agent session",
    description: "Code streams into a laptop while tool calls return a completed result."
  },
  {
    id: "contact",
    title: "Contact inbox",
    description: "Email, chat and web signals converge into one inbox."
  },
  {
    id: "tennis",
    title: "Tennis practice",
    description: "Two players trade returns across the net in a continuous rally."
  },
  {
    id: "trading",
    title: "Trading journal",
    description: "A continuously panning candlestick chart with consistent OHLC prices and volume. Simulation; no live data."
  },
  {
    id: "server",
    title: "Inference study",
    description: "An exploded hardware study assembles inside a chassis outline."
  },
  {
    id: "travel",
    title: "Local map",
    description: "A paper map opens and a route traces continuously to its destination."
  },
  {
    id: "reading",
    title: "Open book",
    description: "Layered paper, a cloth spine and a thin page curling across an open book."
  }
];
var REST_START_MS = 5400;
var MOBILE_FRAME_MS = 1e3 / 30;
var styles = {
  scene: "uipack-object",
  canvas: "uipack-object__canvas",
  fallback: "uipack-object__fallback",
  fallbackSvg: "uipack-object__illustration",
  pause: "uipack-object__motion"
};
var Fallback = ({ kind, label }) => {
  const scenes = {
    ai: /* @__PURE__ */ jsxs2(Fragment2, { children: [
      /* @__PURE__ */ jsx2("rect", { x: "83", y: "36", width: "194", height: "126", rx: "8" }),
      /* @__PURE__ */ jsx2("path", { d: "M83 162l-25 25h244l-25-25" }),
      /* @__PURE__ */ jsx2(
        "path",
        {
          className: "soft",
          d: "M104 62h88m-88 22h143m-126 22h92m-109 22h120"
        }
      ),
      /* @__PURE__ */ jsx2("rect", { x: "20", y: "56", width: "42", height: "48", rx: "5" }),
      /* @__PURE__ */ jsx2("path", { d: "M32 72l-6 8 6 8m16-16l6 8-6 8M62 102l32 43" }),
      /* @__PURE__ */ jsx2("rect", { x: "298", y: "56", width: "42", height: "48", rx: "5" }),
      /* @__PURE__ */ jsx2("path", { d: "M306 80l8 8 16-19M298 104l-32 40" })
    ] }),
    contact: /* @__PURE__ */ jsxs2(Fragment2, { children: [
      /* @__PURE__ */ jsx2("rect", { x: "28", y: "28", width: "76", height: "42", rx: "6" }),
      /* @__PURE__ */ jsx2("rect", { x: "28", y: "86", width: "76", height: "42", rx: "6" }),
      /* @__PURE__ */ jsx2("rect", { x: "28", y: "144", width: "76", height: "42", rx: "6" }),
      /* @__PURE__ */ jsx2(
        "path",
        {
          className: "soft",
          d: "M104 49c62 0 76 50 126 58M104 107h126M104 165c62 0 76-50 126-58"
        }
      ),
      /* @__PURE__ */ jsx2("circle", { cx: "142", cy: "58", r: "6", fill: "currentColor" }),
      /* @__PURE__ */ jsx2("path", { d: "M48 42l18 13 18-13M48 42v17h36V42M49 101h34v17H61l-8 7 2-7h-6z" }),
      /* @__PURE__ */ jsx2("circle", { cx: "66", cy: "165", r: "12" }),
      /* @__PURE__ */ jsx2("path", { d: "M54 165h24m-12-12v24" }),
      /* @__PURE__ */ jsx2("rect", { x: "230", y: "52", width: "102", height: "110", rx: "8" }),
      /* @__PURE__ */ jsx2("path", { d: "M246 116h70v29h-70zM254 108h54m-54-12h54m-54-12h54" }),
      /* @__PURE__ */ jsx2("text", { x: "281", y: "72", children: "INBOX" })
    ] }),
    tennis: /* @__PURE__ */ jsxs2(Fragment2, { children: [
      /* @__PURE__ */ jsx2("path", { className: "soft", d: "M45 187l55-162h160l55 162zM69 113h222M86 64h187M180 64v94M62 158h238" }),
      /* @__PURE__ */ jsx2("path", { d: "M70 106h220m-220 0v23m220-23v23" }),
      /* @__PURE__ */ jsx2("circle", { cx: "151", cy: "125", r: "8" }),
      /* @__PURE__ */ jsx2("path", { d: "M140 137h22l5 25h-30zM142 163l-8 19m23-19l10 19M160 141l17 9 12-9" }),
      /* @__PURE__ */ jsx2("ellipse", { cx: "199", cy: "133", rx: "10", ry: "14", transform: "rotate(40 199 133)" }),
      /* @__PURE__ */ jsx2("circle", { cx: "213", cy: "42", r: "7" }),
      /* @__PURE__ */ jsx2("path", { d: "M202 53h21l4 23h-29zM202 77l-9 17m27-17l8 17M202 57l-18 9-10-8" }),
      /* @__PURE__ */ jsx2("ellipse", { cx: "165", cy: "50", rx: "8", ry: "12", transform: "rotate(-40 165 50)" }),
      /* @__PURE__ */ jsx2("circle", { cx: "190", cy: "90", r: "5" })
    ] }),
    trading: /* @__PURE__ */ jsxs2(Fragment2, { children: [
      /* @__PURE__ */ jsx2("rect", { x: "26", y: "24", width: "308", height: "152", rx: "8" }),
      /* @__PURE__ */ jsx2("path", { d: "M161 176v18h38v-18m-60 22h82" }),
      /* @__PURE__ */ jsx2("path", { className: "soft", d: "M43 70h268M43 100h268M43 130h268M43 151h268" }),
      /* @__PURE__ */ jsx2("path", { stroke: "#269764", d: "M62 122V73m-7 15h14v23H55zm54 35V63m-7 19h14v29h-14zm68 9V58m-7 14h14v32h-14zm55-20V49m-7 12h14v16h-14zM55 163v-8h14v8m33 0v-11h14v11m54 0v-14h14v14m41 0v-18h14v18" }),
      /* @__PURE__ */ jsx2("path", { stroke: "#d85b65", d: "M85 89v48m-7-35h14v23H78zm57-33v46m-7-33h14v22h-14zm65-47v44m-7-31h14v19h-14zm57-51v49m-7-35h14v24h-14zM78 163v-6h14v6m36 0v-9h14v9m51 0v-11h14v11m43 0v-8h14v8" }),
      /* @__PURE__ */ jsx2("text", { x: "180", y: "43", children: "DEMO / USD \xB7 SIMULATED" })
    ] }),
    server: /* @__PURE__ */ jsxs2(Fragment2, { children: [
      /* @__PURE__ */ jsx2("path", { d: "M78 38h204v142H78zM96 58h168v26H96zM96 96h168v26H96zM96 134h168v26H96z" }),
      /* @__PURE__ */ jsx2("path", { className: "soft", d: "M114 66h112m-112 38h112m-112 38h112" }),
      /* @__PURE__ */ jsx2("circle", { cx: "246", cy: "71", r: "5", fill: "currentColor" }),
      /* @__PURE__ */ jsx2("circle", { cx: "246", cy: "109", r: "5", fill: "currentColor" }),
      /* @__PURE__ */ jsx2("path", { d: "M58 28l20 10m204 0l20-10M58 190l20-10m204 0l20 10" })
    ] }),
    travel: /* @__PURE__ */ jsxs2(Fragment2, { children: [
      /* @__PURE__ */ jsx2("path", { d: "M34 46l96-24 100 28 96-24v142l-96 24-100-28-96 24zM130 22v142m100-114v142" }),
      /* @__PURE__ */ jsx2("path", { className: "soft", d: "M62 78l52 28m36 16l56-34m44 20l48 30" }),
      /* @__PURE__ */ jsx2("path", { d: "M62 78c36 30 68 18 88 44s70 18 100-14 48 30 48 30" }),
      /* @__PURE__ */ jsx2("circle", { cx: "62", cy: "78", r: "7", fill: "currentColor" }),
      /* @__PURE__ */ jsx2("circle", { cx: "298", cy: "138", r: "7", fill: "currentColor" })
    ] }),
    reading: /* @__PURE__ */ jsxs2(Fragment2, { children: [
      /* @__PURE__ */ jsx2("path", { d: "M34 52c54-20 102-16 146 8v132c-44-24-92-28-146-8zM326 52c-54-20-102-16-146 8v132c44-24 92-28 146-8z" }),
      /* @__PURE__ */ jsx2(
        "path",
        {
          className: "soft",
          d: "M58 84h88m-88 24h96m-96 24h78m166-48h-88m88 24h-96m96 24h-78"
        }
      ),
      /* @__PURE__ */ jsx2("path", { d: "M180 60v132" })
    ] })
  };
  return /* @__PURE__ */ jsx2(
    "div",
    {
      className: styles.fallback,
      role: "img",
      "aria-label": `${label} illustration`,
      children: /* @__PURE__ */ jsx2(
        "svg",
        {
          className: styles.fallbackSvg,
          viewBox: "0 0 360 214",
          "aria-hidden": "true",
          fill: "none",
          stroke: "currentColor",
          strokeWidth: "3",
          strokeLinecap: "round",
          strokeLinejoin: "round",
          children: scenes[kind]
        }
      )
    }
  );
};
function ObjectStage({
  kind,
  label,
  active = true,
  theme = "light",
  palette,
  zoom = 1,
  variant = 0,
  edition = 0,
  controls = "full"
}) {
  const hostRef = useRef(null);
  const canvasRef = useRef(null);
  const frameRef = useRef(null);
  const drawRef = useRef(null);
  const replayRef = useRef(null);
  const resumeRef = useRef(null);
  const activeRef = useRef(active);
  const pausedRef = useRef(false);
  const completedRef = useRef(false);
  const reducedRef = useRef(false);
  const settleRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [reduced, setReduced] = useState(false);
  const colorMode = theme;
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const resizeRef = useRef(null);
  useEffect(() => {
    resizeRef.current?.();
  }, [zoom]);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      reducedRef.current = media.matches;
      setReduced(media.matches);
      if (media.matches) settleRef.current?.();
      if (media.matches && frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      if (!media.matches && activeRef.current && !pausedRef.current && !completedRef.current)
        resumeRef.current?.();
    };
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    activeRef.current = active;
    if (active && !pausedRef.current && !reducedRef.current)
      drawRef.current?.();
  }, [active]);
  useEffect(() => {
    if (!active || !canvasRef.current) {
      setReady(false);
      return void 0;
    }
    setReady(false);
    pausedRef.current = false;
    completedRef.current = false;
    setPaused(false);
    setCompleted(false);
    let disposed = false;
    let contextLost = false;
    let renderer;
    let environment;
    let scene;
    let resizeObserver;
    let viewportObserver;
    let inViewport = true;
    const canvas = canvasRef.current;
    const handleContextLost = (event) => {
      event.preventDefault();
      contextLost = true;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      canvas.dataset.renderer = "fallback";
      setReady(false);
    };
    canvas.addEventListener("webglcontextlost", handleContextLost);
    Promise.all([import("three"), import("./scenes-NWREIWPC.js"), import("three/addons/environments/RoomEnvironment.js")]).then(async ([THREE, { createObject, disposeObject }, { RoomEnvironment }]) => {
      if (disposed) return;
      try {
        renderer = new THREE.WebGLRenderer({
          canvas,
          alpha: true,
          antialias: true,
          powerPreference: "default"
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        scene = new THREE.Scene();
        const room = new RoomEnvironment();
        const pmrem = new THREE.PMREMGenerator(renderer);
        environment = pmrem.fromScene(room, 0.04);
        scene.environment = environment.texture;
        scene.environmentIntensity = variant === 5 ? 0.85 : 0.35;
        room.dispose();
        pmrem.dispose();
        const camera = new THREE.OrthographicCamera(-3, 3, 3, -3, 0.1, 100);
        camera.position.set(0, variant === 4 && kind !== "contact" ? -0.15 : 0, 10);
        const colors = palette ?? objectPalettes[colorMode];
        const object = await createObject(kind, colors, variant === "random" ? 0 : variant, edition);
        if (disposed || contextLost) {
          disposeObject(object);
          return;
        }
        canvas.dataset.source = object.userData.source ?? "procedural";
        canvas.dataset.artDirection = object.userData.style;
        const shadows = kind === "tennis" || variant !== 0 && variant !== 5;
        if (variant !== 0 && variant !== 5) object.traverse((item) => {
          if (item instanceof THREE.Mesh) {
            item.castShadow = true;
            item.receiveShadow = true;
          }
        });
        if (shadows) {
          renderer.shadowMap.enabled = true;
          renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }
        scene.add(object, new THREE.HemisphereLight(16119019, 5859192, 2));
        const key = new THREE.DirectionalLight(16773852, 2.5);
        key.position.set(-3, 5, 7);
        key.castShadow = shadows;
        key.shadow.mapSize.set(1024, 1024);
        Object.assign(key.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4 });
        key.shadow.normalBias = 0.025;
        key.shadow.bias = -3e-4;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;
        scene.add(key);
        const rim = new THREE.DirectionalLight(13032959, 1.4);
        rim.position.set(4, 2, -3);
        scene.add(rim);
        const loopDuration = object.userData.loopDuration;
        const restTime = object.userData.restTime ?? REST_START_MS;
        canvas.dataset.playback = loopDuration ? "loop" : "once";
        let frames = 0;
        let elapsed = 0;
        let lastTickAt;
        let lastPaintAt = -Infinity;
        const frameInterval = window.matchMedia("(max-width: 767px)").matches ? MOBILE_FRAME_MS : 0;
        const paint = (sceneTime, time) => {
          object.userData.animate?.(sceneTime);
          renderer.render(scene, camera);
          canvas.dataset.drawCalls = String(renderer.info.render.calls);
          canvas.dataset.triangles = String(renderer.info.render.triangles);
          lastPaintAt = frameInterval ? time - (Number.isFinite(lastPaintAt) ? (time - lastPaintAt) % frameInterval : 0) : time;
          frames += 1;
          canvas.dataset.frames = String(frames);
          canvas.dataset.phase = reducedRef.current ? "rest" : object.userData.phase;
          canvas.dataset.pose = object.userData.pose.toFixed(3);
          if (hostRef.current)
            hostRef.current.dataset.phase = reducedRef.current ? "rest" : object.userData.phase;
        };
        settleRef.current = () => {
          paint(restTime, performance.now());
        };
        const render = (time = 0) => {
          frameRef.current = null;
          if (disposed || contextLost) return;
          if (document.hidden || !inViewport) {
            lastTickAt = void 0;
            return;
          }
          if (lastTickAt !== void 0)
            elapsed += Math.min(time - lastTickAt, 50);
          lastTickAt = time;
          const completing = !loopDuration && !reducedRef.current && elapsed >= REST_START_MS && !completedRef.current;
          const shouldPaint = completing || time - lastPaintAt >= frameInterval;
          if (shouldPaint) {
            paint(
              reducedRef.current ? restTime : completing ? REST_START_MS : elapsed,
              time
            );
          }
          if (completing) {
            completedRef.current = true;
            setCompleted(true);
          }
          if (activeRef.current && !pausedRef.current && !reducedRef.current && !completedRef.current) {
            frameRef.current = requestAnimationFrame(render);
          }
        };
        drawRef.current = () => {
          if (!frameRef.current && !disposed)
            frameRef.current = requestAnimationFrame(render);
        };
        resumeRef.current = () => {
          lastTickAt = void 0;
          drawRef.current?.();
        };
        replayRef.current = () => {
          elapsed = 0;
          lastTickAt = void 0;
          lastPaintAt = -Infinity;
          completedRef.current = false;
          pausedRef.current = false;
          setCompleted(false);
          setPaused(false);
          drawRef.current?.();
        };
        const resize = () => {
          const width = canvas.clientWidth || 1;
          const height = canvas.clientHeight || 1;
          renderer.setSize(width, height, false);
          const aspect = width / height;
          const halfWidth = variant === 4 && kind !== "contact" ? 2.15 : kind === "server" && variant === 0 ? 3.25 : 2.65;
          const halfHeight = Math.max(variant === 4 && kind !== "contact" ? 1.75 : 2.2, halfWidth / aspect);
          camera.left = -halfHeight * aspect;
          camera.right = halfHeight * aspect;
          camera.top = halfHeight;
          camera.bottom = -halfHeight;
          camera.zoom = zoomRef.current;
          camera.updateProjectionMatrix();
          renderer.render(scene, camera);
        };
        resizeRef.current = resize;
        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(canvas);
        viewportObserver = new IntersectionObserver(([entry]) => {
          inViewport = entry.isIntersecting;
          if (!inViewport) {
            if (frameRef.current) cancelAnimationFrame(frameRef.current);
            frameRef.current = null;
            lastTickAt = void 0;
          } else if (activeRef.current && !pausedRef.current && !completedRef.current && !reducedRef.current) {
            resumeRef.current?.();
          }
        });
        viewportObserver.observe(canvas);
        resize();
        canvas.dataset.renderer = "webgl";
        setReady(true);
        if (reducedRef.current) render();
        else if (activeRef.current) drawRef.current?.();
      } catch {
        canvas.dataset.renderer = "fallback";
      }
    }).catch(() => {
      if (!disposed) {
        canvas.dataset.renderer = "fallback";
        setReady(false);
      }
    });
    const visibility = () => {
      if (!document.hidden && !pausedRef.current && !completedRef.current && !reducedRef.current)
        resumeRef.current?.();
    };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      resizeRef.current = null;
      settleRef.current = null;
      disposed = true;
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      resizeObserver?.disconnect();
      viewportObserver?.disconnect();
      if (scene)
        scene.traverse((item) => {
          item.userData.dispose?.();
          item.shadow?.dispose();
          const drawable = item;
          drawable.geometry?.dispose();
          const materials = Array.isArray(drawable.material) ? drawable.material : drawable.material ? [drawable.material] : [];
          materials.forEach((entry) => {
            entry.map?.dispose();
            entry.dispose();
          });
        });
      environment?.dispose();
      renderer?.dispose();
      renderer?.forceContextLoss();
      drawRef.current = null;
      replayRef.current = null;
      resumeRef.current = null;
    };
  }, [active, kind, colorMode, palette, variant, edition]);
  const togglePaused = () => {
    const next = !pausedRef.current;
    pausedRef.current = next;
    setPaused(next);
    if (next && frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    if (!next) resumeRef.current?.();
  };
  const replay = () => replayRef.current?.();
  return /* @__PURE__ */ jsxs2(
    "div",
    {
      ref: hostRef,
      "data-theme": theme,
      className: styles.scene,
      "data-active": active ? "true" : "false",
      "data-kind": kind,
      "data-variant": variant,
      "data-edition": edition,
      "data-art-direction": objectDirections[objectDirectionIndex(kind, variant === "random" ? 0 : variant)].id,
      "data-controls": controls,
      "data-variant-label": objectVariants[kind][variant === "random" ? 0 : variant],
      children: [
        /* @__PURE__ */ jsx2(Fallback, { kind, label }),
        active && /* @__PURE__ */ jsx2(
          "canvas",
          {
            ref: canvasRef,
            className: styles.canvas,
            "data-ready": ready ? "true" : "false",
            "aria-hidden": "true"
          }
        ),
        ready && !reduced && /* @__PURE__ */ jsx2(
          "button",
          {
            type: "button",
            className: styles.pause,
            onClick: completed ? replay : togglePaused,
            "aria-pressed": completed ? void 0 : paused,
            "aria-label": completed ? "Replay motion" : paused ? "Resume motion" : "Pause motion",
            children: controls === "playback" ? completed ? "Replay" : paused ? "Resume" : "Pause" : completed ? "Replay motion" : paused ? "Resume motion" : "Pause motion"
          }
        )
      ]
    }
  );
}
function ObjectScene(props) {
  const [open, setOpen] = useState(false), [zoom, setZoom] = useState(1);
  const opener = useRef(null);
  const [randomVariant, setRandomVariant] = useState(null);
  useEffect(() => {
    setRandomVariant(chooseObjectVariant(Math.random, props.kind === "contact" ? 5 : objectDirections.length));
  }, []);
  const canVary = props.variant === void 0 || props.variant === "random";
  const controls = props.controls ?? "full";
  const chosenVariant = canVary ? randomVariant : props.variant;
  const variant = chosenVariant === null ? null : normalizeObjectVariant(props.kind, chosenVariant);
  const anotherLook = () => setRandomVariant((current) => ((current ?? 0) + 1) % (props.kind === "contact" ? 5 : objectDirections.length));
  return /* @__PURE__ */ jsxs2("div", { className: "uipack-object-frame", "data-theme": props.theme ?? "light", "data-controls": controls, children: [
    controls === "full" && variant !== null && /* @__PURE__ */ jsxs2("div", { className: "uipack-object-edition", children: [
      /* @__PURE__ */ jsx2("span", { children: variant === 0 && props.kind !== "contact" ? `Studio \xB7 ${objectEditions[props.kind][props.edition ?? 0]}` : objectVariants[props.kind][variant] }),
      canVary && /* @__PURE__ */ jsx2("button", { type: "button", onClick: anotherLook, "aria-label": "Another look", children: "\u21BB" })
    ] }),
    controls === "full" && /* @__PURE__ */ jsx2(
      "button",
      {
        ref: opener,
        type: "button",
        className: "uipack-object-open",
        onClick: () => setOpen(true),
        children: "Open canvas"
      }
    ),
    /* @__PURE__ */ jsx2(
      CanvasView,
      {
        open,
        onClose: () => setOpen(false),
        title: props.label,
        theme: props.theme,
        restoreFocus: () => opener.current?.focus(),
        zoom: { value: zoom, min: 0.75, max: 2, onChange: setZoom },
        children: /* @__PURE__ */ jsx2(
          ObjectStage,
          {
            ...props,
            active: (props.active ?? true) && variant !== null,
            variant: variant ?? 0,
            zoom
          },
          `${props.kind}-${props.theme ?? "light"}-${variant ?? "pending"}-${props.edition ?? 0}`
        )
      }
    )
  ] });
}
function ObjectDirectionPicker({ value, onChange }) {
  return /* @__PURE__ */ jsx2("div", { className: "uipack-object-directions", role: "group", "aria-label": "3D art direction", children: objectDirections.map((direction, index) => /* @__PURE__ */ jsxs2(
    "button",
    {
      type: "button",
      "aria-pressed": value === index,
      onClick: () => onChange(index),
      children: [
        /* @__PURE__ */ jsx2("span", { "aria-hidden": "true", children: directionSymbols[index] }),
        direction.name
      ]
    },
    direction.id
  )) });
}
export {
  AnimationWorkspace,
  ObjectDirectionPicker,
  ObjectGallery,
  ObjectInspector,
  ObjectScene,
  chooseObjectVariant,
  directionSymbols,
  normalizeObjectVariant,
  objectDirectionIndex,
  objectDirections,
  objectEditions,
  objectPalettes,
  objectScenes,
  objectVariants,
  parseObjectVariant,
  transferObjectVariant
};
//# sourceMappingURL=objects.js.map