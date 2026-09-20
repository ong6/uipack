import {
  CanvasView
} from "./chunk-GP5TROIA.js";

// src/objects/index.tsx
import { useEffect, useRef, useState } from "react";

// src/objects/variants.ts
var objectVariants = {
  ai: ["Forest terminal", "Midnight terminal", "Warm graphite"],
  contact: ["Forest inbox", "Blue inbox", "Terracotta inbox"],
  tennis: ["Grass club", "Clay club", "Blue hardcourt"],
  trading: ["Breakout", "Pullback", "Range reversal"],
  server: ["Forest hardware", "Blue hardware", "Copper hardware"],
  travel: ["Forest route", "Coastal route", "Terracotta route"],
  reading: ["Forest cloth", "Oxblood cloth", "Midnight cloth"]
};
function chooseObjectVariant(random = Math.random) {
  return Math.min(2, Math.max(0, Math.floor(random() * 3)));
}

// src/objects/index.tsx
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
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
    description: "From behind the baseline: split step, incoming ball, forehand return and recovery."
  },
  {
    id: "trading",
    title: "Trading journal",
    description: "A fast market replay with red and green candles, order flow and a reversal. Simulation; no live data."
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
    ai: /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("rect", { x: "83", y: "36", width: "194", height: "126", rx: "8" }),
      /* @__PURE__ */ jsx("path", { d: "M83 162l-25 25h244l-25-25" }),
      /* @__PURE__ */ jsx(
        "path",
        {
          className: "soft",
          d: "M104 62h88m-88 22h143m-126 22h92m-109 22h120"
        }
      ),
      /* @__PURE__ */ jsx("rect", { x: "20", y: "56", width: "42", height: "48", rx: "5" }),
      /* @__PURE__ */ jsx("path", { d: "M32 72l-6 8 6 8m16-16l6 8-6 8M62 102l32 43" }),
      /* @__PURE__ */ jsx("rect", { x: "298", y: "56", width: "42", height: "48", rx: "5" }),
      /* @__PURE__ */ jsx("path", { d: "M306 80l8 8 16-19M298 104l-32 40" })
    ] }),
    contact: /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("rect", { x: "28", y: "28", width: "76", height: "42", rx: "6" }),
      /* @__PURE__ */ jsx("rect", { x: "28", y: "86", width: "76", height: "42", rx: "6" }),
      /* @__PURE__ */ jsx("rect", { x: "28", y: "144", width: "76", height: "42", rx: "6" }),
      /* @__PURE__ */ jsx(
        "path",
        {
          className: "soft",
          d: "M104 49c62 0 76 50 126 58M104 107h126M104 165c62 0 76-50 126-58"
        }
      ),
      /* @__PURE__ */ jsx("circle", { cx: "142", cy: "58", r: "6", fill: "currentColor" }),
      /* @__PURE__ */ jsx("path", { d: "M48 42l18 13 18-13M48 42v17h36V42M49 101h34v17H61l-8 7 2-7h-6z" }),
      /* @__PURE__ */ jsx("circle", { cx: "66", cy: "165", r: "12" }),
      /* @__PURE__ */ jsx("path", { d: "M54 165h24m-12-12v24" }),
      /* @__PURE__ */ jsx("rect", { x: "230", y: "52", width: "102", height: "110", rx: "8" }),
      /* @__PURE__ */ jsx("path", { d: "M246 116h70v29h-70zM254 108h54m-54-12h54m-54-12h54" }),
      /* @__PURE__ */ jsx("text", { x: "281", y: "72", children: "INBOX" })
    ] }),
    tennis: /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(
        "path",
        {
          className: "soft",
          d: "M30 187l58-108h184l58 108zM66 124h228M180 79v45"
        }
      ),
      /* @__PURE__ */ jsx("path", { d: "M52 113h256m-247 0v28m237-28v28" }),
      /* @__PURE__ */ jsx("circle", { cx: "166", cy: "51", r: "13" }),
      /* @__PURE__ */ jsx("path", { d: "M148 71h36l9 53h-54zM150 125l-15 42-12 21m52-63l22 39 9 22M146 79l-21 26m57-27l23 17 28-6" }),
      /* @__PURE__ */ jsx(
        "ellipse",
        {
          cx: "252",
          cy: "71",
          rx: "16",
          ry: "23",
          transform: "rotate(45 252 71)"
        }
      ),
      /* @__PURE__ */ jsx("path", { d: "M238 87l-13 12" }),
      /* @__PURE__ */ jsx("circle", { cx: "288", cy: "60", r: "6" })
    ] }),
    trading: /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("rect", { x: "26", y: "30", width: "308", height: "155", rx: "6" }),
      /* @__PURE__ */ jsx(
        "path",
        {
          className: "soft",
          d: "M42 151h190m-190-32h190m-190-32h190M251 63v103"
        }
      ),
      /* @__PURE__ */ jsx(
        "path",
        {
          stroke: "#269764",
          d: "M62 122v-39m-7 14h14v16H55zm54 19V76m-7 18h14v25h-14zm68 19V69m-7 13h14v39h-14zM270 132h40m-40 15h28m-28 15h36"
        }
      ),
      /* @__PURE__ */ jsx(
        "path",
        {
          stroke: "#d85b65",
          d: "M85 96v47m-7-32h14v17H78zm57-25v51m-7-36h14v20h-14zm70-38v42m-7-29h14v19h-14zM270 82h36m-36 15h24m-24 15h40"
        }
      ),
      /* @__PURE__ */ jsx("text", { x: "180", y: "49", children: "MARKET REPLAY / SIMULATION" })
    ] }),
    server: /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("path", { d: "M78 38h204v142H78zM96 58h168v26H96zM96 96h168v26H96zM96 134h168v26H96z" }),
      /* @__PURE__ */ jsx("path", { className: "soft", d: "M114 66h112m-112 38h112m-112 38h112" }),
      /* @__PURE__ */ jsx("circle", { cx: "246", cy: "71", r: "5", fill: "currentColor" }),
      /* @__PURE__ */ jsx("circle", { cx: "246", cy: "109", r: "5", fill: "currentColor" }),
      /* @__PURE__ */ jsx("path", { d: "M58 28l20 10m204 0l20-10M58 190l20-10m204 0l20 10" })
    ] }),
    travel: /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("path", { d: "M34 46l96-24 100 28 96-24v142l-96 24-100-28-96 24zM130 22v142m100-114v142" }),
      /* @__PURE__ */ jsx("path", { className: "soft", d: "M62 78l52 28m36 16l56-34m44 20l48 30" }),
      /* @__PURE__ */ jsx("path", { d: "M62 78c36 30 68 18 88 44s70 18 100-14 48 30 48 30" }),
      /* @__PURE__ */ jsx("circle", { cx: "62", cy: "78", r: "7", fill: "currentColor" }),
      /* @__PURE__ */ jsx("circle", { cx: "298", cy: "138", r: "7", fill: "currentColor" })
    ] }),
    reading: /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("path", { d: "M34 52c54-20 102-16 146 8v132c-44-24-92-28-146-8zM326 52c-54-20-102-16-146 8v132c44-24 92-28 146-8z" }),
      /* @__PURE__ */ jsx(
        "path",
        {
          className: "soft",
          d: "M58 84h88m-88 24h96m-96 24h78m166-48h-88m88 24h-96m96 24h-78"
        }
      ),
      /* @__PURE__ */ jsx("path", { d: "M180 60v132" })
    ] })
  };
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: styles.fallback,
      role: "img",
      "aria-label": `${label} illustration`,
      children: /* @__PURE__ */ jsx(
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
    let scene;
    let resizeObserver;
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
    Promise.all([import("three"), import("./scenes-L2CR7IKV.js")]).then(async ([THREE, { createObject, disposeObject }]) => {
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
        const camera = new THREE.OrthographicCamera(-3, 3, 3, -3, 0.1, 100);
        camera.position.set(0, 0, 10);
        const colors = palette ?? objectPalettes[colorMode];
        const object = await createObject(kind, colors, variant === "random" ? 0 : variant);
        if (disposed || contextLost) {
          disposeObject(object);
          return;
        }
        canvas.dataset.source = object.userData.source ?? "procedural";
        if (kind === "tennis") {
          renderer.shadowMap.enabled = true;
          renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }
        scene.add(object, new THREE.HemisphereLight(16777215, 6910080, 2.2));
        const key = new THREE.DirectionalLight(16777215, 2.2);
        key.position.set(-3, 5, 7);
        key.castShadow = kind === "tennis";
        key.shadow.mapSize.set(1024, 1024);
        Object.assign(key.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4 });
        key.shadow.normalBias = 0.035;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.15;
        scene.add(key);
        let frames = 0;
        let elapsed = 0;
        let lastTickAt;
        let lastPaintAt = -Infinity;
        const frameInterval = window.matchMedia("(max-width: 767px)").matches ? MOBILE_FRAME_MS : 0;
        const paint = (sceneTime, time) => {
          object.userData.animate?.(sceneTime);
          renderer.render(scene, camera);
          lastPaintAt = frameInterval ? time - (Number.isFinite(lastPaintAt) ? (time - lastPaintAt) % frameInterval : 0) : time;
          frames += 1;
          canvas.dataset.frames = String(frames);
          canvas.dataset.phase = object.userData.phase;
          canvas.dataset.pose = object.userData.pose.toFixed(3);
          if (hostRef.current)
            hostRef.current.dataset.phase = object.userData.phase;
        };
        settleRef.current = () => {
          paint(REST_START_MS, performance.now());
        };
        const render = (time = 0) => {
          frameRef.current = null;
          if (disposed || contextLost) return;
          if (document.hidden) {
            lastTickAt = void 0;
            return;
          }
          if (lastTickAt !== void 0)
            elapsed += Math.min(time - lastTickAt, 50);
          lastTickAt = time;
          const completing = !reducedRef.current && elapsed >= REST_START_MS && !completedRef.current;
          const shouldPaint = completing || time - lastPaintAt >= frameInterval;
          if (shouldPaint) {
            paint(
              reducedRef.current || completing ? REST_START_MS : elapsed,
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
          const halfWidth = kind === "server" ? 3.25 : 2.65;
          const halfHeight = Math.max(2.2, halfWidth / aspect);
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
      renderer?.dispose();
      renderer?.forceContextLoss();
      drawRef.current = null;
      replayRef.current = null;
      resumeRef.current = null;
    };
  }, [active, kind, colorMode, palette, variant]);
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
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ref: hostRef,
      "data-theme": theme,
      className: styles.scene,
      "data-active": active ? "true" : "false",
      "data-kind": kind,
      "data-variant": variant,
      "data-controls": controls,
      "data-variant-label": objectVariants[kind][variant === "random" ? 0 : variant],
      children: [
        /* @__PURE__ */ jsx(Fallback, { kind, label }),
        active && /* @__PURE__ */ jsx(
          "canvas",
          {
            ref: canvasRef,
            className: styles.canvas,
            "data-ready": ready ? "true" : "false",
            "aria-hidden": "true"
          }
        ),
        ready && !reduced && /* @__PURE__ */ jsx(
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
    setRandomVariant(chooseObjectVariant());
  }, []);
  const canVary = props.variant === void 0 || props.variant === "random";
  const controls = props.controls ?? "full";
  const variant = canVary ? randomVariant : props.variant;
  const anotherLook = () => setRandomVariant((current) => ((current ?? 0) + 1) % 3);
  return /* @__PURE__ */ jsxs("div", { className: "uipack-object-frame", "data-theme": props.theme ?? "light", "data-controls": controls, children: [
    controls === "full" && variant !== null && /* @__PURE__ */ jsxs("div", { className: "uipack-object-edition", children: [
      /* @__PURE__ */ jsx("span", { children: objectVariants[props.kind][variant] }),
      canVary && /* @__PURE__ */ jsx("button", { type: "button", onClick: anotherLook, "aria-label": "Another look", children: "\u21BB" })
    ] }),
    controls === "full" && /* @__PURE__ */ jsx(
      "button",
      {
        ref: opener,
        type: "button",
        className: "uipack-object-open",
        onClick: () => setOpen(true),
        children: "Open canvas"
      }
    ),
    /* @__PURE__ */ jsx(
      CanvasView,
      {
        open,
        onClose: () => setOpen(false),
        title: props.label,
        theme: props.theme,
        restoreFocus: () => opener.current?.focus(),
        zoom: { value: zoom, min: 0.75, max: 2, onChange: setZoom },
        children: /* @__PURE__ */ jsx(
          ObjectStage,
          {
            ...props,
            active: (props.active ?? true) && variant !== null,
            variant: variant ?? 0,
            zoom
          },
          `${props.kind}-${props.theme ?? "light"}-${variant ?? "pending"}`
        )
      }
    )
  ] });
}
export {
  ObjectScene,
  chooseObjectVariant,
  objectPalettes,
  objectScenes,
  objectVariants
};
//# sourceMappingURL=objects.js.map