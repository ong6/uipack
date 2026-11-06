// Mounts one 3D object scene on a canvas: loads Three.js and the scene lazily, builds the renderer,
// applies the scene's look (light rig per theme, environment, materials, contact shadow and framing,
// src/objects/look.ts), runs the playback loop, and tears all of it down again. No React: ObjectStage
// calls it from an effect and drives it through the returned handle, and the loop reads the
// stage's live flags (active, paused, reduced…) from the object it is given, each frame.
import type { ObjectKind, ObjectPalette } from "./scenes";
import type { ObjectEdition, ObjectVariant } from "./variants";
import { REDUCED_MOTION_QUERY } from "../env";

const REST_START_MS = 5400;
const MOBILE_FRAME_MS = 1000 / 30;
/** A phone-width stage: capped at 30 frames a second, with a lighter shadow map (look.ts). */
const PHONE_QUERY = "(max-width: 767px)";

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
  colors: ObjectPalette;
  variant: ObjectVariant;
  edition: ObjectEdition;
  modelUrl?: string;
  /** Picks the light rig (src/objects/look.ts): dark mode changes the lighting, not only the card. */
  theme: "light" | "dark";
  flags: ObjectStageFlags;
  /** The stage's root, which mirrors the scene's phase for styling. */
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
  /** Cancel the pending frame. */
  stop: () => void;
  dispose: () => void;
}

/** Free every GPU resource under a scene: geometries, materials, their textures and shadow maps. */
function disposeScene(scene: import("three").Scene, textures: (material: import("three").Material) => import("three").Texture[]) {
  scene.traverse((item) => {
    item.userData.dispose?.();
    (item as import("three").DirectionalLight).shadow?.dispose();
    const drawable = item as import("three").Mesh;
    drawable.geometry?.dispose();
    const materials = Array.isArray(drawable.material) ? drawable.material : drawable.material ? [drawable.material] : [];
    materials.forEach((entry) => {
      textures(entry).forEach((texture) => texture.dispose());
      entry.dispose();
    });
  });
}

export function mountObjectScene(canvas: HTMLCanvasElement, options: ObjectSceneOptions): ObjectSceneHandle {
  const { kind, colors, variant, edition, modelUrl, theme, flags, host, onReady, onCompleted, onReplayed, onReducedMotion } =
    options;
  let disposed = false;
  let contextLost = false;
  let frame: number | null = null;
  let renderer: import("three").WebGLRenderer | undefined;
  let environment: import("three").WebGLRenderTarget | undefined;
  let materialTextures: ((material: import("three").Material) => import("three").Texture[]) | undefined;
  let scene: import("three").Scene | undefined;
  let resizeObserver: ResizeObserver | undefined;
  let viewportObserver: IntersectionObserver | undefined;
  let inViewport = true;
  // Read live by the loop, below. A MediaQueryList's `matches` is current whenever it is read.
  const reducedQuery = typeof window.matchMedia === "function" ? window.matchMedia(REDUCED_MOTION_QUERY) : null;
  // Filled in once the scene has loaded.
  const loaded: Partial<Pick<ObjectSceneHandle, "draw" | "resume" | "replay" | "settle" | "resize">> = {};

  const stop = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = null;
  };
  const handleContextLost = (event: Event) => {
    event.preventDefault();
    contextLost = true;
    stop();
    canvas.dataset.renderer = "fallback";
    onReady(false);
  };
  canvas.addEventListener("webglcontextlost", handleContextLost);

  Promise.all([import("three"), import("./scenes"), import("./look")])
    .then(async ([THREE, { createObject, disposeObject }, look]) => {
      if (disposed) return;
      materialTextures = look.materialTextures;
      try {
        const gl = new THREE.WebGLRenderer({
          canvas,
          alpha: true,
          antialias: !(typeof localStorage!=="undefined"&&localStorage.getItem("aa0")),
          powerPreference: "default",
        });
        renderer = gl;
        gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        gl.outputColorSpace = THREE.SRGBColorSpace;
        const world = new THREE.Scene();
        scene = world;
        const object = await createObject(kind, colors, variant, edition, modelUrl);
        if (disposed || contextLost) {
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
        } = look.resolveLook(object.userData.look, theme);
        environment = (await look.buildEnvironment(gl, rig)) ?? undefined;
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
        if (rig.key.shadow && !(typeof localStorage!=="undefined"&&localStorage.getItem("nosh"))) {
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = (typeof localStorage!=="undefined"&&localStorage.getItem("basic")) ? THREE.BasicShadowMap : THREE.PCFShadowMap;
        }
        const restTime = object.userData.restTime ?? REST_START_MS;
        if (contactShadow) {
          object.userData.animate?.(restTime);
          look.addContactShadow(object, contactShadow);
        }
        world.add(object);
        const phone = window.matchMedia(PHONE_QUERY).matches;
        look.addRigLights(world, rig, phone);

        // Framing: measure the subject once (over its loop when it loops), then fit on every resize.
        const camera =
          lens.projection === "perspective"
            ? new THREE.PerspectiveCamera(lens.fov, 1, 0.1, 100)
            : new THREE.OrthographicCamera(-3, 3, 3, -3, 0.1, 100);
        const rotation = look.cameraRotation(lens);
        const subject = framing ? look.measureSubject(object, rotation, look.framingTimes(object, framing, restTime)) : null;
        object.userData.animate?.(0);
        const backdrop = look.usesTransmission(object) ? look.addTransmissionBackdrop(camera, transmissionBackdrop) : null;
        if (backdrop) world.add(camera);
        canvas.dataset.envKind = rig.environment.kind;
        const loopDuration = object.userData.loopDuration as number | undefined;
        canvas.dataset.playback = loopDuration ? "loop" : "once";
        let frames = 0;
        let elapsed = 0;
        let lastTickAt: number | undefined;
        let lastPaintAt = -Infinity;
        // The last paint was the reduced-motion rest pose: settling again would paint the same frame.
        let restPainted = false;
        const frameInterval = phone ? MOBILE_FRAME_MS : 0;
        const paint = (sceneTime: number, time: number) => {
          object.userData.animate?.(sceneTime);
          if ((typeof localStorage!=="undefined"&&localStorage.getItem("shfreeze"))) { gl.shadowMap.autoUpdate = false; if (frames === 0) gl.shadowMap.needsUpdate = true; }
          if ((typeof localStorage!=="undefined"&&localStorage.getItem("sh4"))) { gl.shadowMap.autoUpdate = false; if (frames % 4 === 0) gl.shadowMap.needsUpdate = true; }
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
          // The stage sets `flags.reduced` from React when the setting changes, but a loaded main
          // thread can keep painting long before that effect runs (on CI's software WebGL a
          // Realistic loop painted 190 more frames in 5 s). So a playing loop also checks the query
          // itself and settles on its next frame; the stage's effect then agrees (and, the rest pose
          // already painted, paints nothing more). It tells the stage too, which would otherwise
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
          lastTickAt = undefined;
          loaded.draw?.();
        };
        loaded.replay = () => {
          elapsed = 0;
          lastTickAt = undefined;
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
            // The legacy fixed frame, for a look that sets `framing: false`.
            const halfHeight = Math.max(2.2, 2.65 / aspect);
            Object.assign(camera, {
              left: -halfHeight * aspect,
              right: halfHeight * aspect,
              top: halfHeight,
              bottom: -halfHeight,
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
            lastTickAt = undefined;
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
    })
    .catch(() => {
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
      for (const name of Object.keys(loaded) as (keyof typeof loaded)[]) delete loaded[name];
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      stop();
      resizeObserver?.disconnect();
      viewportObserver?.disconnect();
      if (scene && materialTextures) disposeScene(scene, materialTextures);
      environment?.dispose();
      renderer?.dispose();
      renderer?.forceContextLoss();
    },
  };
}
