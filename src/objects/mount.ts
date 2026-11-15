// Mounts one 3D object scene on a canvas: loads Three.js and the subject lazily, draws it in ink line
// art (ink.ts) in the page's own paper, ink and accent, frames it (look.ts), runs the playback loop,
// and tears all of it down again. No React: ObjectStage calls it from an effect and drives it
// through the returned handle, and the loop reads the stage's live flags (active, paused, reduced…)
// from the object it is given, each frame.
import type { ObjectKind } from "./scenes";
import { REDUCED_MOTION_QUERY } from "../env";

const REST_START_MS = 5400;
/** Desktop paints at most 60 frames a second, whatever the display's rate (a 120 Hz panel halves the work). */
const DESKTOP_FRAME_MS = 1000 / 60;
/** A phone-width stage paints at most 30. */
const MOBILE_FRAME_MS = 1000 / 30;
const PHONE_QUERY = "(max-width: 767px)";
/** A display's frame can land a little early; within this a frame still counts as due. */
const FRAME_SLACK_MS = 2;

/**
 * Frame pacing: when the last paint was at `last` and a frame arrives at `time`, the new `last` if
 * this frame should paint, or null to skip it. Paints stay on an even grid of `interval` (a 120 Hz
 * display paints every other frame, never two then one).
 */
export function paceFrame(last: number, time: number, interval: number): number | null {
  if (!interval) return time;
  const since = time - last;
  if (since < interval - FRAME_SLACK_MS) return null;
  return since < 2 * interval ? last + interval : time;
}

/** The stage's state, owned by the component and read by the scene on every frame. */
export interface ObjectStageFlags {
  active: boolean;
  paused: boolean;
  completed: boolean;
  reduced: boolean;
  zoom: number;
}

export interface ObjectSceneOptions {
  kind: ObjectKind;
  flags: ObjectStageFlags;
  /** The stage's root: the scene reads its colours there and mirrors the scene's phase on it. */
  host: () => HTMLElement | null;
  /** The WebGL scene drew its first frame (true), or was lost or never started (false). */
  onReady: (ready: boolean) => void;
  /** A play-once scene reached its rest pose. */
  onCompleted: () => void;
  /** Replay reset the paused and completed flags; mirror them in the UI. */
  onReplayed: () => void;
  /**
   * The loop saw reduced motion turn on before the stage did, and settled. The query's change
   * event can arrive seconds later on a busy main thread, so the stage re-reads the setting now
   * and hides its motion control with the motion.
   */
  onReducedMotion?: () => void;
}

/** Drives a mounted scene. Every method is a no-op until the scene has loaded, and after dispose. */
export interface ObjectSceneHandle {
  /** Request the next frame, if none is pending. */
  draw: () => void;
  /** Continue from where the clock stopped (after a pause, a hidden tab or leaving the viewport). */
  resume: () => void;
  /** Start the scene's motion again from the beginning. */
  replay: () => void;
  /** Paint the rest pose now (reduced motion). */
  settle: () => void;
  /** Re-fit the camera to the canvas and the stage's zoom. */
  resize: () => void;
  /** Re-read the page's colours and repaint (a theme change). */
  recolor: () => void;
  /** Cancel the pending frame. */
  stop: () => void;
  dispose: () => void;
}

/**
 * One scene builds at a time, and a scene that is to play goes ahead of the ones only being held
 * ready (`preload`). Building is main-thread work (geometry, the ink redraw), so three scenes
 * mounted together would otherwise share it and the one on screen would wait for its neighbours.
 */
const buildQueue: { flags: ObjectStageFlags; start: () => void }[] = [];
let building = false;
function nextBuild() {
  if (building || !buildQueue.length) return;
  const index = Math.max(
    0,
    buildQueue.findIndex((entry) => entry.flags.active),
  );
  const [entry] = buildQueue.splice(index, 1);
  building = true;
  entry.start();
}
/** Wait for this scene's turn to build. Returns a `release` to call once, when it has painted or given up. */
function buildTurn(flags: ObjectStageFlags): { ready: Promise<void>; release: () => void } {
  let entry: (typeof buildQueue)[number] | undefined;
  let started = false;
  let released = false;
  const ready = new Promise<void>((resolve) => {
    entry = {
      flags,
      start: () => {
        started = true;
        resolve();
      },
    };
    buildQueue.push(entry);
  });
  // A microtask later: scenes mounted in one commit are all queued before the first is chosen, so
  // the playing one goes first even when a neighbour mounted before it.
  queueMicrotask(nextBuild);
  return {
    ready,
    release: () => {
      if (released) return;
      released = true;
      const index = entry ? buildQueue.indexOf(entry) : -1;
      if (index >= 0) buildQueue.splice(index, 1);
      if (!started) return;
      building = false;
      // The next build waits until the page is idle, so the stage can show the scene that just
      // finished (its ready state, its fade-in) and frames can paint. A zero-delay timer could run
      // before React committed that state, and the next build then held it back by its own length:
      // seconds on software WebGL.
      if (typeof requestIdleCallback === "function") requestIdleCallback(nextBuild, { timeout: 500 });
      else setTimeout(nextBuild, 100);
    },
  };
}

export function mountObjectScene(canvas: HTMLCanvasElement, options: ObjectSceneOptions): ObjectSceneHandle {
  const { kind, flags, host, onReady, onCompleted, onReplayed, onReducedMotion } = options;
  const startedAt = performance.now();
  let disposed = false;
  let contextLost = false;
  let frame: number | null = null;
  let renderer: import("three").WebGLRenderer | undefined;
  let scene: import("three").Scene | undefined;
  let freeScene: ((root: import("three").Object3D) => void) | undefined;
  let resizeObserver: ResizeObserver | undefined;
  let viewportObserver: IntersectionObserver | undefined;
  let themeObserver: MutationObserver | undefined;
  let recolorFrame: number | null = null;
  let inViewport = true;
  // Read live by the loop, below. A MediaQueryList's `matches` is current whenever it is read.
  const reducedQuery = typeof window.matchMedia === "function" ? window.matchMedia(REDUCED_MOTION_QUERY) : null;
  // Filled in once the scene has loaded.
  const loaded: Partial<Pick<ObjectSceneHandle, "draw" | "resume" | "replay" | "settle" | "resize" | "recolor">> = {};

  const stop = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = null;
  };
  const fallback = () => {
    canvas.dataset.renderer = "fallback";
    onReady(false);
  };
  const handleContextLost = (event: Event) => {
    event.preventDefault();
    contextLost = true;
    stop();
    fallback();
  };
  canvas.addEventListener("webglcontextlost", handleContextLost);

  const turn = buildTurn(flags);
  Promise.all([import("three"), import("./scenes"), import("./look"), import("./ink"), turn.ready])
    .then(async ([THREE, { createObject, disposeObject }, look, ink]) => {
      if (disposed) return;
      freeScene = disposeObject;
      const object = createObject(kind);
      // A kind with no subject yet keeps its labelled fallback drawing and never opens a context.
      if (!object) {
        canvas.dataset.subject = "none";
        fallback();
        return;
      }
      if (disposed || contextLost) {
        disposeObject(object);
        return;
      }
      const restTime = object.userData.restTime ?? REST_START_MS;
      const { framing, camera: lens, contactShadow } = look.resolveLook(object.userData.look);
      if (contactShadow) {
        object.userData.animate?.(restTime);
        look.addContactShadow(object, contactShadow);
      }
      const root = host();
      // The colours the scene is drawn in, mirrored on the canvas for tests and reviews.
      const showColors = (colors: import("./ink").InkColors) => {
        canvas.dataset.colors = [colors.paper, colors.ink, colors.accent]
          .map((c) => `#${c.toString(16).padStart(6, "0")}`)
          .join(" ");
        return colors;
      };
      const drawing = ink.inkify(object, root ? showColors(ink.readInkColors(root)) : undefined);
      canvas.dataset.source = object.userData.source ?? "procedural";
      canvas.dataset.artDirection = "ink";
      const phone = window.matchMedia(PHONE_QUERY).matches;
      const gl = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "default" });
      renderer = gl;
      gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      gl.outputColorSpace = THREE.SRGBColorSpace;
      const world = new THREE.Scene();
      scene = world;
      world.add(object);
      if (contextLost) return;

      // Framing: measure the subject once (over its loop when it loops), then fit on every resize.
      const camera =
        lens.projection === "perspective"
          ? new THREE.PerspectiveCamera(lens.fov, 1, 0.1, 100)
          : new THREE.OrthographicCamera(-3, 3, 3, -3, 0.1, 100);
      const rotation = look.cameraRotation(lens);
      const subject = framing ? look.measureSubject(object, rotation, look.framingTimes(object, framing, restTime)) : null;
      object.userData.animate?.(0);
      const loopDuration = object.userData.loopDuration as number | undefined;
      canvas.dataset.playback = loopDuration ? "loop" : "once";
      let frames = 0;
      let elapsed = 0;
      let lastTickAt: number | undefined;
      let lastPaintAt = -Infinity;
      // The last paint was the reduced-motion rest pose: settling again would paint the same frame.
      let restPainted = false;
      const frameInterval = phone ? MOBILE_FRAME_MS : DESKTOP_FRAME_MS;
      const paint = (sceneTime: number) => {
        object.userData.animate?.(sceneTime);
        gl.render(world, camera);
        canvas.dataset.drawCalls = String(gl.info.render.calls);
        canvas.dataset.triangles = String(gl.info.render.triangles);
        frames += 1;
        canvas.dataset.frames = String(frames);
        restPainted = flags.reduced;
        const phase = flags.reduced ? "rest" : object.userData.phase;
        canvas.dataset.phase = phase;
        canvas.dataset.pose = object.userData.pose.toFixed(3);
        const stage = host();
        if (stage) stage.dataset.phase = phase;
      };
      const render = (time = 0) => {
        frame = null;
        if (disposed || contextLost) return;
        // The stage sets `flags.reduced` from React when the setting changes, but a loaded main
        // thread can keep painting long before that effect runs. So a playing loop also checks the
        // query itself and settles on its next frame; the stage's effect then agrees (and, the rest
        // pose already painted, paints nothing more). It tells the stage too, which would otherwise
        // keep showing Pause until that change event arrives.
        if (!flags.reduced && reducedQuery?.matches) {
          flags.reduced = true;
          onReducedMotion?.();
        }
        if (document.hidden || !inViewport) {
          lastTickAt = undefined;
          return;
        }
        if (lastTickAt !== undefined) elapsed += Math.min(time - lastTickAt, 50);
        lastTickAt = time;
        const completing = !loopDuration && !flags.reduced && elapsed >= REST_START_MS && !flags.completed;
        const paced = completing ? time : paceFrame(lastPaintAt, time, frameInterval);
        if (paced !== null) {
          lastPaintAt = paced;
          paint(flags.reduced ? restTime : completing ? REST_START_MS : elapsed);
        }
        if (completing) {
          flags.completed = true;
          onCompleted();
        }
        if (flags.active && !flags.paused && !flags.reduced && !flags.completed) {
          frame = requestAnimationFrame(render);
        }
      };
      // Handed to the stage only after the shaders are compiled (below), so nothing paints before.
      const controls: typeof loaded = {};
      controls.settle = () => {
        if (!restPainted) paint(restTime);
      };
      controls.draw = () => {
        if (!frame && !disposed) frame = requestAnimationFrame(render);
      };
      controls.resume = () => {
        lastTickAt = undefined;
        loaded.draw?.();
      };
      controls.replay = () => {
        elapsed = 0;
        lastTickAt = undefined;
        lastPaintAt = -Infinity;
        flags.completed = false;
        flags.paused = false;
        onReplayed();
        loaded.draw?.();
      };
      // A theme change restyles the scene in place: new uniform colours, the same pose, no rebuild.
      controls.recolor = () => {
        const stage = host();
        if (!stage || disposed || contextLost) return;
        drawing.setColors(showColors(ink.readInkColors(stage)));
        if (!frame && frames > 0) gl.render(world, camera);
      };
      const frameCamera = () => {
        const width = canvas.clientWidth || 1;
        const height = canvas.clientHeight || 1;
        gl.setSize(width, height, false);
        drawing.setSize(width, height);
        const aspect = width / height;
        const fit = framing && subject ? look.fitCamera(camera, subject, aspect, framing, rotation) : null;
        if (fit) canvas.dataset.fill = fit.fillHeight.toFixed(2);
        else if (camera instanceof THREE.OrthographicCamera) {
          const halfHeight = Math.max(2.2, 2.65 / aspect);
          Object.assign(camera, { left: -halfHeight * aspect, right: halfHeight * aspect, top: halfHeight, bottom: -halfHeight });
          camera.position.set(0, 0, 10);
        } else {
          camera.aspect = aspect;
          camera.position.set(0, 0, 10);
        }
        camera.zoom = flags.zoom;
        camera.updateProjectionMatrix();
      };
      const resize = () => {
        frameCamera();
        gl.render(world, camera);
      };
      // Compile every shader before the first paint, off the main thread where the browser can
      // (KHR_parallel_shader_compile), so mounting a scene never stalls scrolling.
      frameCamera();
      await gl.compileAsync(world, camera);
      if (disposed || contextLost) return;
      Object.assign(loaded, controls, { resize });
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(canvas);
      viewportObserver = new IntersectionObserver(([entry]) => {
        inViewport = entry.isIntersecting;
        if (!inViewport) {
          stop();
          lastTickAt = undefined;
        } else if (flags.active && !flags.paused && !flags.completed && !flags.reduced) {
          loaded.resume?.();
        }
      });
      viewportObserver.observe(canvas);
      // The page's colours change with its theme: the stage's data-theme, or the site's own switch on
      // <html> or <body>. Re-read them on the next frame, once the new styles apply.
      themeObserver = new MutationObserver(() => {
        if (recolorFrame === null)
          recolorFrame = requestAnimationFrame(() => {
            recolorFrame = null;
            loaded.recolor?.();
          });
      });
      const watched = { attributes: true, attributeFilter: ["class", "style", "data-theme", "data-ui-theme", "data-ui-style"] };
      themeObserver.observe(document.documentElement, watched);
      if (document.body) themeObserver.observe(document.body, watched);
      if (root) themeObserver.observe(root, watched);
      resize();
      canvas.dataset.programs = String(gl.info.programs?.length ?? 0);
      canvas.dataset.firstPaintMs = String(Math.round(performance.now() - startedAt));
      canvas.dataset.renderer = "webgl";
      onReady(true);
      if (flags.reduced) render();
      else if (flags.active) loaded.draw?.();
    })
    .catch(() => {
      if (!disposed) fallback();
    })
    .finally(turn.release);

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
    recolor: () => loaded.recolor?.(),
    stop,
    dispose: () => {
      document.removeEventListener("visibilitychange", visibility);
      disposed = true;
      turn.release();
      for (const name of Object.keys(loaded) as (keyof typeof loaded)[]) delete loaded[name];
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      stop();
      if (recolorFrame !== null) cancelAnimationFrame(recolorFrame);
      resizeObserver?.disconnect();
      viewportObserver?.disconnect();
      themeObserver?.disconnect();
      if (scene && freeScene) freeScene(scene);
      renderer?.dispose();
      renderer?.forceContextLoss();
    },
  };
}
