import { chooseObjectVariant, normalizeObjectVariant, objectVariants, objectEditions, hasObjectLook, objectDirections, directionSymbols, objectLooks, objectDirectionIndex, transferObjectVariant } from './chunk-NARSUG2R.js';
export { chooseObjectVariant, directionSymbols, hasObjectLook, normalizeObjectVariant, objectDirectionIndex, objectDirections, objectEditions, objectLooks, objectVariants, parseObjectVariant, transferObjectVariant } from './chunk-NARSUG2R.js';
import { studioObjectPalettes } from './chunk-VNW5HB27.js';
import { CanvasView } from './chunk-MKST5NJE.js';
import { keepFocusedInView, usePrefersReducedMotion, REDUCED_MOTION_QUERY } from './chunk-LWCZ6GEJ.js';
import { useState, useRef, useEffect, useReducer } from 'react';
import { jsxs, jsx, Fragment } from 'react/jsx-runtime';

// src/objects/mount.ts
var REST_START_MS = 5400;
var MOBILE_FRAME_MS = 1e3 / 30;
var PHONE_QUERY = "(max-width: 767px)";
function disposeScene(scene, textures) {
  scene.traverse((item) => {
    item.userData.dispose?.();
    item.shadow?.dispose();
    const drawable = item;
    drawable.geometry?.dispose();
    const materials = Array.isArray(drawable.material) ? drawable.material : drawable.material ? [drawable.material] : [];
    materials.forEach((entry) => {
      textures(entry).forEach((texture) => texture.dispose());
      entry.dispose();
    });
  });
}
function mountObjectScene(canvas, options) {
  const { kind, colors, variant, edition, modelUrl, theme, flags, host, onReady, onCompleted, onReplayed, onReducedMotion } = options;
  let disposed = false;
  let contextLost = false;
  let frame = null;
  let renderer;
  let environment;
  let materialTextures;
  let scene;
  let resizeObserver;
  let viewportObserver;
  let inViewport = true;
  const reducedQuery = typeof window.matchMedia === "function" ? window.matchMedia(REDUCED_MOTION_QUERY) : null;
  const loaded = {};
  const stop = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = null;
  };
  const handleContextLost = (event) => {
    event.preventDefault();
    contextLost = true;
    stop();
    canvas.dataset.renderer = "fallback";
    onReady(false);
  };
  canvas.addEventListener("webglcontextlost", handleContextLost);
  Promise.all([import('three'), import('./scenes-7BNUFFEW.js'), import('./look-M65Y46VE.js')]).then(async ([THREE, { createObject, disposeObject }, look]) => {
    if (disposed) return;
    materialTextures = look.materialTextures;
    try {
      const object = await createObject(kind, colors, variant, edition, modelUrl);
      if (disposed) {
        disposeObject(object);
        return;
      }
      canvas.dataset.source = object.userData.source ?? "procedural";
      canvas.dataset.artDirection = object.userData.style;
      const {
        rig,
        framing,
        camera: lens,
        contactShadow,
        castShadows,
        transmissionBackdrop,
        phoneMultisample
      } = look.resolveLook(object.userData.look, theme);
      const phone = window.matchMedia(PHONE_QUERY).matches;
      const gl = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: !phone || phoneMultisample,
        powerPreference: "default"
      });
      renderer = gl;
      gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      gl.outputColorSpace = THREE.SRGBColorSpace;
      const world = new THREE.Scene();
      scene = world;
      if (contextLost) {
        disposeObject(object);
        return;
      }
      environment = await look.buildEnvironment(gl, rig) ?? void 0;
      if (disposed || contextLost) {
        disposeObject(object);
        return;
      }
      world.environment = environment?.texture ?? null;
      world.environmentIntensity = rig.environment.intensity;
      world.environmentRotation.y = rig.environment.rotation;
      look.applyMaterials(object, environment?.texture ?? null, rig, theme);
      gl.toneMapping = look.toneMappingFor(rig);
      gl.toneMappingExposure = rig.exposure;
      if (castShadows)
        object.traverse((item) => {
          if (item instanceof THREE.Mesh && !item.userData.frameIgnore) {
            item.castShadow = true;
            item.receiveShadow = true;
          }
        });
      if (rig.key.shadow) {
        gl.shadowMap.enabled = true;
        gl.shadowMap.type = THREE.PCFShadowMap;
      }
      const restTime = object.userData.restTime ?? REST_START_MS;
      if (contactShadow) {
        object.userData.animate?.(restTime);
        look.addContactShadow(object, contactShadow);
      }
      world.add(object);
      look.addRigLights(world, rig, phone);
      const camera = lens.projection === "perspective" ? new THREE.PerspectiveCamera(lens.fov, 1, 0.1, 100) : new THREE.OrthographicCamera(-3, 3, 3, -3, 0.1, 100);
      const rotation = look.cameraRotation(lens);
      const subject = framing ? look.measureSubject(object, rotation, look.framingTimes(object, framing, restTime)) : null;
      object.userData.animate?.(0);
      const backdrop = look.usesTransmission(object) ? look.addTransmissionBackdrop(camera, transmissionBackdrop) : null;
      if (backdrop) world.add(camera);
      canvas.dataset.envKind = rig.environment.kind;
      const loopDuration = object.userData.loopDuration;
      canvas.dataset.playback = loopDuration ? "loop" : "once";
      let frames = 0;
      let elapsed = 0;
      let lastTickAt;
      let lastPaintAt = -Infinity;
      let restPainted = false;
      const frameInterval = phone ? MOBILE_FRAME_MS : 0;
      const paint = (sceneTime, time) => {
        object.userData.animate?.(sceneTime);
        gl.render(world, camera);
        canvas.dataset.drawCalls = String(gl.info.render.calls);
        canvas.dataset.triangles = String(gl.info.render.triangles);
        lastPaintAt = frameInterval ? time - (Number.isFinite(lastPaintAt) ? (time - lastPaintAt) % frameInterval : 0) : time;
        frames += 1;
        canvas.dataset.frames = String(frames);
        restPainted = flags.reduced;
        const phase = flags.reduced ? "rest" : object.userData.phase;
        canvas.dataset.phase = phase;
        canvas.dataset.pose = object.userData.pose.toFixed(3);
        const root = host();
        if (root) root.dataset.phase = phase;
      };
      const render = (time = 0) => {
        frame = null;
        if (disposed || contextLost) return;
        if (!flags.reduced && reducedQuery?.matches) {
          flags.reduced = true;
          onReducedMotion?.();
        }
        if (document.hidden || !inViewport) {
          lastTickAt = void 0;
          return;
        }
        if (lastTickAt !== void 0) elapsed += Math.min(time - lastTickAt, 50);
        lastTickAt = time;
        const completing = !loopDuration && !flags.reduced && elapsed >= REST_START_MS && !flags.completed;
        const shouldPaint = completing || time - lastPaintAt >= frameInterval;
        if (shouldPaint) {
          paint(flags.reduced ? restTime : completing ? REST_START_MS : elapsed, time);
        }
        if (completing) {
          flags.completed = true;
          onCompleted();
        }
        if (flags.active && !flags.paused && !flags.reduced && !flags.completed) {
          frame = requestAnimationFrame(render);
        }
      };
      loaded.settle = () => {
        if (!restPainted) paint(restTime, performance.now());
      };
      loaded.draw = () => {
        if (!frame && !disposed) frame = requestAnimationFrame(render);
      };
      loaded.resume = () => {
        lastTickAt = void 0;
        loaded.draw?.();
      };
      loaded.replay = () => {
        elapsed = 0;
        lastTickAt = void 0;
        lastPaintAt = -Infinity;
        flags.completed = false;
        flags.paused = false;
        onReplayed();
        loaded.draw?.();
      };
      const resize = () => {
        const width = canvas.clientWidth || 1;
        const height = canvas.clientHeight || 1;
        gl.setSize(width, height, false);
        const aspect = width / height;
        const fit = framing && subject ? look.fitCamera(camera, subject, aspect, framing, rotation) : null;
        if (fit) canvas.dataset.fill = fit.fillHeight.toFixed(2);
        else if (camera instanceof THREE.OrthographicCamera) {
          const halfHeight = Math.max(2.2, 2.65 / aspect);
          Object.assign(camera, {
            left: -halfHeight * aspect,
            right: halfHeight * aspect,
            top: halfHeight,
            bottom: -halfHeight
          });
          camera.position.set(0, 0, 10);
        } else {
          camera.aspect = aspect;
          camera.position.set(0, 0, 10);
        }
        camera.zoom = flags.zoom;
        camera.updateProjectionMatrix();
        backdrop?.fit();
        gl.render(world, camera);
      };
      loaded.resize = resize;
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(canvas);
      viewportObserver = new IntersectionObserver(([entry]) => {
        inViewport = entry.isIntersecting;
        if (!inViewport) {
          stop();
          lastTickAt = void 0;
        } else if (flags.active && !flags.paused && !flags.completed && !flags.reduced) {
          loaded.resume?.();
        }
      });
      viewportObserver.observe(canvas);
      resize();
      canvas.dataset.renderer = "webgl";
      onReady(true);
      if (flags.reduced) render();
      else if (flags.active) loaded.draw();
    } catch {
      canvas.dataset.renderer = "fallback";
    }
  }).catch(() => {
    if (!disposed) {
      canvas.dataset.renderer = "fallback";
      onReady(false);
    }
  });
  const visibility = () => {
    if (!document.hidden && !flags.paused && !flags.completed && !flags.reduced) loaded.resume?.();
  };
  document.addEventListener("visibilitychange", visibility);
  return {
    draw: () => loaded.draw?.(),
    resume: () => loaded.resume?.(),
    replay: () => loaded.replay?.(),
    settle: () => loaded.settle?.(),
    resize: () => loaded.resize?.(),
    stop,
    dispose: () => {
      document.removeEventListener("visibilitychange", visibility);
      disposed = true;
      for (const name of Object.keys(loaded)) delete loaded[name];
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      stop();
      resizeObserver?.disconnect();
      viewportObserver?.disconnect();
      if (scene && materialTextures) disposeScene(scene, materialTextures);
      environment?.dispose();
      renderer?.dispose();
      renderer?.forceContextLoss();
    }
  };
}
var objectPalettes = studioObjectPalettes;
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
      /* @__PURE__ */ jsx("path", { className: "soft", d: "M104 62h88m-88 22h143m-126 22h92m-109 22h120" }),
      /* @__PURE__ */ jsx("rect", { x: "20", y: "56", width: "42", height: "48", rx: "5" }),
      /* @__PURE__ */ jsx("path", { d: "M32 72l-6 8 6 8m16-16l6 8-6 8M62 102l32 43" }),
      /* @__PURE__ */ jsx("rect", { x: "298", y: "56", width: "42", height: "48", rx: "5" }),
      /* @__PURE__ */ jsx("path", { d: "M306 80l8 8 16-19M298 104l-32 40" })
    ] }),
    contact: /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("rect", { x: "28", y: "28", width: "76", height: "42", rx: "6" }),
      /* @__PURE__ */ jsx("rect", { x: "28", y: "86", width: "76", height: "42", rx: "6" }),
      /* @__PURE__ */ jsx("rect", { x: "28", y: "144", width: "76", height: "42", rx: "6" }),
      /* @__PURE__ */ jsx("path", { className: "soft", d: "M104 49c62 0 76 50 126 58M104 107h126M104 165c62 0 76-50 126-58" }),
      /* @__PURE__ */ jsx("circle", { cx: "142", cy: "58", r: "6", fill: "currentColor" }),
      /* @__PURE__ */ jsx("path", { d: "M48 42l18 13 18-13M48 42v17h36V42M49 101h34v17H61l-8 7 2-7h-6z" }),
      /* @__PURE__ */ jsx("circle", { cx: "66", cy: "165", r: "12" }),
      /* @__PURE__ */ jsx("path", { d: "M54 165h24m-12-12v24" }),
      /* @__PURE__ */ jsx("rect", { x: "230", y: "52", width: "102", height: "110", rx: "8" }),
      /* @__PURE__ */ jsx("path", { d: "M246 116h70v29h-70zM254 108h54m-54-12h54m-54-12h54" }),
      /* @__PURE__ */ jsx("text", { x: "281", y: "72", children: "INBOX" })
    ] }),
    tennis: /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("path", { className: "soft", d: "M45 187l55-162h160l55 162zM69 113h222M86 64h187M180 64v94M62 158h238" }),
      /* @__PURE__ */ jsx("path", { d: "M70 106h220m-220 0v23m220-23v23" }),
      /* @__PURE__ */ jsx("circle", { cx: "151", cy: "125", r: "8" }),
      /* @__PURE__ */ jsx("path", { d: "M140 137h22l5 25h-30zM142 163l-8 19m23-19l10 19M160 141l17 9 12-9" }),
      /* @__PURE__ */ jsx("ellipse", { cx: "199", cy: "133", rx: "10", ry: "14", transform: "rotate(40 199 133)" }),
      /* @__PURE__ */ jsx("circle", { cx: "213", cy: "42", r: "7" }),
      /* @__PURE__ */ jsx("path", { d: "M202 53h21l4 23h-29zM202 77l-9 17m27-17l8 17M202 57l-18 9-10-8" }),
      /* @__PURE__ */ jsx("ellipse", { cx: "165", cy: "50", rx: "8", ry: "12", transform: "rotate(-40 165 50)" }),
      /* @__PURE__ */ jsx("circle", { cx: "190", cy: "90", r: "5" })
    ] }),
    trading: /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("rect", { x: "26", y: "24", width: "308", height: "152", rx: "8" }),
      /* @__PURE__ */ jsx("path", { d: "M161 176v18h38v-18m-60 22h82" }),
      /* @__PURE__ */ jsx("path", { className: "soft", d: "M43 70h268M43 100h268M43 130h268M43 151h268" }),
      /* @__PURE__ */ jsx(
        "path",
        {
          stroke: "#269764",
          d: "M62 98V131M55 108h14v16h-14zM109 89V130M102 102h14v20h-14zM170 86V108M163 95h14v22h-14zM218 80V102M211 86h14v11h-14zM55 163v-8h14v8m33 0v-11h14v11m54 0v-14h14v14m41 0v-18h14v18"
        }
      ),
      /* @__PURE__ */ jsx(
        "path",
        {
          stroke: "#d85b65",
          d: "M85 109V140M78 116h14v16h-14zM135 93V125M128 102h14v15h-14zM193 70V100M186 79h14v13h-14zM243 44V78M236 54h14v16h-14zM78 163v-6h14v6m36 0v-9h14v9m51 0v-11h14v11m43 0v-8h14v8"
        }
      )
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
      /* @__PURE__ */ jsx("path", { className: "soft", d: "M58 84h88m-88 24h96m-96 24h78m166-48h-88m88 24h-96m96 24h-78" }),
      /* @__PURE__ */ jsx("path", { d: "M180 60v132" })
    ] })
  };
  const captions = {
    trading: "DEMO / USD \xB7 SIMULATED"
  };
  return /* @__PURE__ */ jsxs("div", { className: styles.fallback, role: "img", "aria-label": `${label} illustration`, children: [
    /* @__PURE__ */ jsx(
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
    ),
    captions[kind] && /* @__PURE__ */ jsx("span", { className: "uipack-object__fallback-caption", "aria-hidden": "true", children: captions[kind] })
  ] });
};
var ControlIcon = ({ name }) => /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 16 16", width: "16", height: "16", "aria-hidden": "true", focusable: "false", children: [
  name === "pause" && /* @__PURE__ */ jsx("path", { d: "M5.5 3.5v9M10.5 3.5v9" }),
  name === "play" && /* @__PURE__ */ jsx("path", { d: "M5 3.2v9.6L12.5 8z", fill: "currentColor" }),
  name === "replay" && /* @__PURE__ */ jsx("path", { d: "M3.5 8a4.5 4.5 0 1 0 1.4-3.3M3.5 2.8v2.4h2.4" }),
  name === "expand" && /* @__PURE__ */ jsx("path", { d: "M9.5 2.5h4v4M13.5 2.5 9 7M6.5 13.5h-4v-4M2.5 13.5 7 9" })
] });
function ObjectStage({
  kind,
  label,
  active = true,
  theme = "light",
  palette,
  zoom = 1,
  variant = 0,
  edition = 0,
  controls = "full",
  surface = "styled",
  modelUrl
}) {
  const hostRef = useRef(null);
  const canvasRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const [completed, setCompleted] = useState(false);
  const reduced = usePrefersReducedMotion();
  const [, recheckReduced] = useReducer((n) => n + 1, 0);
  const flagsRef = useRef({ active, paused: false, completed: false, reduced: false, zoom });
  const sceneRef = useRef(null);
  const paletteKey = palette ? JSON.stringify(palette) : "";
  const resolvedVariant = normalizeObjectVariant(kind, variant === "random" ? objectLooks[kind][0] : variant);
  useEffect(() => {
    flagsRef.current.zoom = zoom;
    sceneRef.current?.resize();
  }, [zoom]);
  useEffect(() => {
    const flags = flagsRef.current;
    flags.reduced = reduced;
    if (reduced) {
      sceneRef.current?.settle();
      sceneRef.current?.stop();
    } else if (flags.active && !flags.paused && !flags.completed) sceneRef.current?.resume();
  }, [reduced]);
  useEffect(() => {
    const flags = flagsRef.current;
    flags.active = active;
    if (active && !flags.paused && !flags.reduced) sceneRef.current?.draw();
  }, [active]);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!active || !canvas) {
      setReady(false);
      return void 0;
    }
    setReady(false);
    flagsRef.current.paused = false;
    flagsRef.current.completed = false;
    setPaused(false);
    setCompleted(false);
    const scene = mountObjectScene(canvas, {
      kind,
      colors: paletteKey ? JSON.parse(paletteKey) : objectPalettes[theme],
      variant: resolvedVariant,
      edition,
      modelUrl,
      theme,
      flags: flagsRef.current,
      host: () => hostRef.current,
      onReady: setReady,
      onCompleted: () => setCompleted(true),
      onReplayed: () => {
        setCompleted(false);
        setPaused(false);
      },
      onReducedMotion: recheckReduced
    });
    sceneRef.current = scene;
    return () => {
      sceneRef.current = null;
      scene.dispose();
    };
  }, [active, kind, theme, paletteKey, resolvedVariant, edition, modelUrl]);
  const togglePaused = () => {
    const flags = flagsRef.current;
    const next = !flags.paused;
    flags.paused = next;
    setPaused(next);
    if (next) sceneRef.current?.stop();
    else sceneRef.current?.resume();
  };
  const replay = () => sceneRef.current?.replay();
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ref: hostRef,
      "data-theme": theme,
      "data-surface": surface,
      className: styles.scene,
      "data-active": active ? "true" : "false",
      "data-kind": kind,
      "data-variant": resolvedVariant,
      "data-edition": edition,
      "data-art-direction": objectDirections[objectDirectionIndex(kind, resolvedVariant)].id,
      "data-controls": controls,
      "data-variant-label": objectVariants[kind][resolvedVariant],
      children: [
        /* @__PURE__ */ jsx(Fallback, { kind, label }),
        active && /* @__PURE__ */ jsx("canvas", { ref: canvasRef, className: styles.canvas, "data-ready": ready ? "true" : "false", "aria-hidden": "true" }),
        ready && !reduced && /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            className: styles.pause,
            onClick: completed ? replay : togglePaused,
            "aria-pressed": completed ? void 0 : paused,
            title: completed ? "Replay" : paused ? "Resume" : "Pause",
            children: [
              /* @__PURE__ */ jsx(ControlIcon, { name: completed ? "replay" : paused ? "play" : "pause" }),
              /* @__PURE__ */ jsx("span", { className: "uipack-object__sr", children: completed ? "Replay motion" : paused ? "Resume motion" : "Pause motion" })
            ]
          }
        )
      ]
    }
  );
}
function ObjectScene(props) {
  const [open, setOpen] = useState(false), [zoom, setZoom] = useState(1);
  const opener = useRef(null);
  const [pick, setPick] = useState(null);
  useEffect(() => {
    setPick({ roll: Math.random(), turns: 0 });
  }, []);
  const randomVariant = pick === null ? null : chooseObjectVariant(props.kind, () => pick.roll, pick.turns);
  const canVary = props.variant === void 0 || props.variant === "random";
  const controls = props.controls ?? "full";
  const chosenVariant = canVary ? randomVariant : props.variant;
  const variant = chosenVariant === null ? null : normalizeObjectVariant(props.kind, chosenVariant);
  const anotherLook = () => setPick((current) => current && { ...current, turns: current.turns + 1 });
  return /* @__PURE__ */ jsxs("div", { className: "uipack-object-frame", "data-theme": props.theme ?? "light", "data-controls": controls, children: [
    controls === "full" && variant !== null && /* @__PURE__ */ jsxs("div", { className: "uipack-object-edition", children: [
      /* @__PURE__ */ jsxs("span", { children: [
        objectVariants[props.kind][variant],
        variant === 0 && props.kind !== "contact" && props.edition && hasObjectLook(props.kind, 0) ? ` \xB7 ${objectEditions[props.kind][props.edition]}` : ""
      ] }),
      canVary && /* @__PURE__ */ jsx("button", { type: "button", onClick: anotherLook, "aria-label": "Another look", children: "\u21BB" })
    ] }),
    controls === "full" && /* @__PURE__ */ jsxs("button", { ref: opener, type: "button", className: "uipack-object-open", onClick: () => setOpen(true), title: "Open canvas", children: [
      /* @__PURE__ */ jsx(ControlIcon, { name: "expand" }),
      /* @__PURE__ */ jsx("span", { className: "uipack-object__sr", children: "Open canvas" })
    ] }),
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
          `${props.kind}-${props.theme ?? "light"}-${variant ?? "pending"}-${props.edition ?? 0}`
        )
      }
    )
  ] });
}
function ObjectDirectionPicker({
  value,
  onChange,
  kind
}) {
  return /* @__PURE__ */ jsx("div", { className: "uipack-object-directions", role: "group", "aria-label": "3D art direction", children: objectDirections.map(
    (direction, index) => kind && !hasObjectLook(kind, index) ? null : /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        "aria-pressed": value === index,
        onClick: () => onChange(index),
        children: [
          /* @__PURE__ */ jsx("span", { "aria-hidden": "true", children: directionSymbols[index] }),
          direction.name
        ]
      },
      direction.id
    )
  ) });
}

// src/objects/scene-list.ts
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
function AnimationWorkspace({
  library,
  children,
  theme = "light"
}) {
  return /* @__PURE__ */ jsxs("div", { className: "uipack-animation-workspace", "data-theme": theme, children: [
    /* @__PURE__ */ jsx("div", { className: "uipack-animation-library", children: library }),
    /* @__PURE__ */ jsx("div", { className: "uipack-animation-detail", children })
  ] });
}
function ObjectInspector({
  kind,
  variant: requested,
  edition = 0,
  onVariantChange,
  onEditionChange
}) {
  const variant = normalizeObjectVariant(kind, requested);
  const contact = kind === "contact";
  const directions = objectDirections.map((direction, index) => ({
    direction,
    index,
    look: objectLooks[kind].find((look) => objectDirectionIndex(kind, look) === index)
  })).filter((entry) => entry.look !== void 0);
  return /* @__PURE__ */ jsxs("div", { className: "uipack-object-inspector", children: [
    /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("h3", { children: "Art direction" }),
      /* @__PURE__ */ jsx("div", { role: "group", "aria-label": "3D art direction", className: "uipack-direction-list", children: directions.map(({ direction, index, look }) => (
        // Named by what it shows, the name then the line under it, so a voice user can say
        // the text they see (WCAG 2.5.3).
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            "aria-pressed": objectDirectionIndex(kind, variant) === index,
            onClick: () => onVariantChange(look),
            children: [
              /* @__PURE__ */ jsx("span", { className: "uipack-direction-symbol", "aria-hidden": "true", children: directionSymbols[index] }),
              /* @__PURE__ */ jsxs("span", { children: [
                /* @__PURE__ */ jsx("strong", { children: direction.name }),
                " ",
                /* @__PURE__ */ jsx("small", { children: direction.description })
              ] })
            ]
          },
          direction.id
        )
      )) })
    ] }),
    hasObjectLook(kind, 0) && objectDirectionIndex(kind, variant) === 0 && /* @__PURE__ */ jsxs("label", { className: "uipack-edition-select", children: [
      contact ? "Inbox edition" : "Studio edition",
      /* @__PURE__ */ jsx(
        "select",
        {
          value: contact ? variant % 3 : edition,
          onChange: (e) => (contact ? onVariantChange : onEditionChange)(Number(e.target.value)),
          children: objectEditions[kind].map((name, index) => /* @__PURE__ */ jsx("option", { value: index, children: name }, name))
        }
      ),
      /* @__PURE__ */ jsx("small", { children: contact ? "Three original inbox finishes." : "The original looks, kept together in Studio." })
    ] })
  ] });
}
function ObjectGallery({
  kind,
  variant: requested = 0,
  edition = 0,
  theme = "light",
  palette,
  modelUrl,
  onChange
}) {
  const variant = normalizeObjectVariant(kind, requested);
  const scene = objectScenes.find((item) => item.id === kind);
  return /* @__PURE__ */ jsxs(
    AnimationWorkspace,
    {
      theme,
      library: /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("h3", { children: "Object library" }),
        /* @__PURE__ */ jsx("nav", { "aria-label": "Choose an object", className: "uipack-scene-list", onFocus: keepFocusedInView, children: objectScenes.map((item) => /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            "aria-pressed": kind === item.id,
            onClick: () => onChange(item.id, transferObjectVariant(kind, item.id, variant), edition),
            children: [
              item.title,
              /* @__PURE__ */ jsx("span", { "aria-hidden": "true", children: "\u2197" })
            ]
          },
          item.id
        )) })
      ] }),
      children: [
        /* @__PURE__ */ jsxs("header", { className: "uipack-animation-heading", children: [
          /* @__PURE__ */ jsx("h3", { children: scene.title }),
          /* @__PURE__ */ jsx("span", { children: "Live 3D preview" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "uipack-object-review", children: [
          /* @__PURE__ */ jsx("div", { className: "uipack-gallery-stage", children: /* @__PURE__ */ jsx(
            ObjectScene,
            {
              kind,
              label: scene.title,
              variant,
              edition,
              theme,
              palette,
              modelUrl
            },
            kind
          ) }),
          /* @__PURE__ */ jsx(
            ObjectInspector,
            {
              kind,
              variant,
              edition,
              onVariantChange: (value) => onChange(kind, value, edition),
              onEditionChange: (value) => onChange(kind, variant, value)
            }
          )
        ] }),
        /* @__PURE__ */ jsx("p", { className: "uipack-gallery-description", children: objectDirectionIndex(kind, variant) === 0 ? scene.description : objectDirections[objectDirectionIndex(kind, variant)].description })
      ]
    }
  );
}

export { AnimationWorkspace, ObjectDirectionPicker, ObjectGallery, ObjectInspector, ObjectScene, objectPalettes, objectScenes };
