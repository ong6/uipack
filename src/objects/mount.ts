// Mounts one 3D object scene on a canvas: loads Three.js and the scene lazily, builds the renderer,
// lights and camera, runs the playback loop, and tears all of it down again. No React: ObjectStage
// calls it from an effect and drives it through the returned handle, and the loop reads the
// stage's live flags (active, paused, reduced…) from the object it is given, each frame.
import type { ObjectKind, ObjectPalette } from "./scenes";
import type { ObjectEdition, ObjectVariant } from "./variants";

const REST_START_MS = 5400;
/** Stages narrower than this use an object's `userData.narrowFrame`, if it has one. */
const NARROW_STAGE_PX = 480;
const MOBILE_FRAME_MS = 1000 / 30;

/** Camera half-extents in world units, and the view's vertical centre. */
interface ObjectFrame {
  halfWidth: number;
  halfHeight: number;
  y?: number;
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
  colors: ObjectPalette;
  variant: ObjectVariant;
  edition: ObjectEdition;
  modelUrl?: string;
  flags: ObjectStageFlags;
  /** The stage's root, which mirrors the scene's phase for styling. */
  host: () => HTMLElement | null;
  /** The WebGL scene drew its first frame (true), or was lost or never started (false). */
  onReady: (ready: boolean) => void;
  /** A play-once scene reached its rest pose. */
  onCompleted: () => void;
  /** Replay reset the paused and completed flags; mirror them in the UI. */
  onReplayed: () => void;
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

/** Free every GPU resource under a scene: geometries, materials, their maps and shadow maps. */
function disposeScene(scene: import("three").Scene) {
  scene.traverse((item) => {
    item.userData.dispose?.();
    (item as import("three").DirectionalLight).shadow?.dispose();
    const drawable = item as import("three").Mesh;
    drawable.geometry?.dispose();
    const materials = Array.isArray(drawable.material) ? drawable.material : drawable.material ? [drawable.material] : [];
    materials.forEach((entry) => {
      (entry as import("three").MeshStandardMaterial).map?.dispose();
      entry.dispose();
    });
  });
}

export function mountObjectScene(canvas: HTMLCanvasElement, options: ObjectSceneOptions): ObjectSceneHandle {
  const { kind, colors, variant, edition, modelUrl, flags, host, onReady, onCompleted, onReplayed } = options;
  let disposed = false;
  let contextLost = false;
  let frame: number | null = null;
  let renderer: import("three").WebGLRenderer | undefined;
  let environment: import("three").WebGLRenderTarget | undefined;
  let scene: import("three").Scene | undefined;
  let resizeObserver: ResizeObserver | undefined;
  let viewportObserver: IntersectionObserver | undefined;
  let inViewport = true;
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

  Promise.all([import("three"), import("./scenes"), import("three/addons/environments/RoomEnvironment.js")])
    .then(async ([THREE, { createObject, disposeObject }, { RoomEnvironment }]) => {
      if (disposed) return;
      try {
        const gl = new THREE.WebGLRenderer({
          canvas,
          alpha: true,
          antialias: true,
          powerPreference: "default",
        });
        renderer = gl;
        gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        gl.outputColorSpace = THREE.SRGBColorSpace;
        const world = new THREE.Scene();
        scene = world;
        const room = new RoomEnvironment();
        const pmrem = new THREE.PMREMGenerator(gl);
        environment = pmrem.fromScene(room, 0.04);
        world.environment = environment.texture;
        world.environmentIntensity = variant === 5 ? 0.85 : 0.35;
        room.dispose();
        pmrem.dispose();
        const camera = new THREE.OrthographicCamera(-3, 3, 3, -3, 0.1, 100);
        camera.position.set(0, variant === 4 && kind !== "contact" ? -0.15 : 0, 10);
        const object = await createObject(kind, colors, variant, edition, modelUrl);
        if (disposed || contextLost) {
          disposeObject(object);
          return;
        }
        canvas.dataset.source = object.userData.source ?? "procedural";
        canvas.dataset.artDirection = object.userData.style;
        const shadows = kind === "tennis" || (variant !== 0 && variant !== 5);
        if (variant !== 0 && variant !== 5)
          object.traverse((item) => {
            if (item instanceof THREE.Mesh) {
              item.castShadow = true;
              item.receiveShadow = true;
            }
          });
        if (shadows) {
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }
        world.add(object, new THREE.HemisphereLight(0xf5f4eb, 0x596778, 2.0));
        const key = new THREE.DirectionalLight(0xfff2dc, 2.5);
        key.position.set(-3, 5, 7);
        key.castShadow = shadows;
        key.shadow.mapSize.set(1024, 1024);
        Object.assign(key.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4 });
        key.shadow.normalBias = 0.025;
        key.shadow.bias = -0.0003;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        world.add(key);
        const rim = new THREE.DirectionalLight(0xc6ddff, 1.4);
        rim.position.set(4, 2, -3);
        world.add(rim);

        const loopDuration = object.userData.loopDuration as number | undefined;
        const restTime = object.userData.restTime ?? REST_START_MS;
        canvas.dataset.playback = loopDuration ? "loop" : "once";
        let frames = 0;
        let elapsed = 0;
        let lastTickAt: number | undefined;
        let lastPaintAt = -Infinity;
        const frameInterval = window.matchMedia("(max-width: 767px)").matches ? MOBILE_FRAME_MS : 0;
        const paint = (sceneTime: number, time: number) => {
          object.userData.animate?.(sceneTime);
          gl.render(world, camera);
          canvas.dataset.drawCalls = String(gl.info.render.calls);
          canvas.dataset.triangles = String(gl.info.render.triangles);
          lastPaintAt = frameInterval ? time - (Number.isFinite(lastPaintAt) ? (time - lastPaintAt) % frameInterval : 0) : time;
          frames += 1;
          canvas.dataset.frames = String(frames);
          const phase = flags.reduced ? "rest" : object.userData.phase;
          canvas.dataset.phase = phase;
          canvas.dataset.pose = object.userData.pose.toFixed(3);
          const root = host();
          if (root) root.dataset.phase = phase;
        };
        const render = (time = 0) => {
          frame = null;
          if (disposed || contextLost) return;
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
        loaded.settle = () => paint(restTime, performance.now());
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
          // An object may declare a tighter fit for narrow canvases, where the
          // shared framing leaves a compact model small in a square stage.
          const narrow = width < NARROW_STAGE_PX ? (object.userData.narrowFrame as ObjectFrame | undefined) : undefined;
          const halfWidth =
            narrow?.halfWidth ?? (variant === 4 && kind !== "contact" ? 2.15 : kind === "server" && variant === 0 ? 3.25 : 2.65);
          const halfHeight = Math.max(
            narrow?.halfHeight ?? (variant === 4 && kind !== "contact" ? 1.75 : 2.2),
            halfWidth / aspect,
          );
          camera.position.y = narrow?.y ?? (variant === 4 && kind !== "contact" ? -0.15 : 0);
          camera.left = -halfHeight * aspect;
          camera.right = halfHeight * aspect;
          camera.top = halfHeight;
          camera.bottom = -halfHeight;
          camera.zoom = flags.zoom;
          camera.updateProjectionMatrix();
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
      if (scene) disposeScene(scene);
      environment?.dispose();
      renderer?.dispose();
      renderer?.forceContextLoss();
    },
  };
}
