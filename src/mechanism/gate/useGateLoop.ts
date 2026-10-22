// The gate's animation loop: a requestAnimationFrame tick that advances the pose's clock, springs the
// display toward the scene and paints it onto the SVG in place, without re-rendering React. It runs
// only while the machine is on screen and something still moves, and holds still frames for reduced
// motion and motion="none". GateMachine renders the first frame; this owns every frame after it.
import * as React from "react";
import { useIsoLayoutEffect } from "../../env";
import { displayOf, paintDisplay, readoutOf, step, type Display } from "./display";
import { RUN_LONG, sceneAt, stillScene, STILL_AT, type GatePose, type Scene } from "./motion";
import { ASSEMBLIES, type Assembly } from "./view";

/** Seconds between explode-spring starts as the assemblies part or close in turn. */
const STAGGER_MS = 70;

interface LoopState {
  display: Display;
  /** Seconds into the current pose's script. */
  t: number;
  /** Bumped by every restart of a pose, so a script can vary its tokens between runs. */
  round: number;
  paused: boolean;
  visible: boolean;
  /** The pending requestAnimationFrame id; 0 when the loop is stopped. */
  frame: number;
  last: number;
  /** Where each assembly's explode spring is heading: 0 assembled, 1 apart. */
  targets: Record<Assembly, number>;
  /** Staggered explode-spring starts still pending. */
  timers: number[];
  readout: string;
  phase: string;
  /** The token height each slot last drew, so paintDisplay rebuilds a token only when it changes. */
  heights: number[];
}

/** The display a pose starts from: its still frame when calm, else the start of its script. */
function firstFrame(pose: GatePose, calm: boolean): { display: Display; t: number } {
  const t = calm || pose === "idle" ? STILL_AT[pose] : 0;
  const scene = calm ? stillScene(pose) : sceneAt(pose, t);
  return { display: displayOf(scene, calm && pose === "apart" ? 1 : 0), t };
}

const liveText = (pose: GatePose, paused: boolean) =>
  pose === "idle" ? (paused ? "paused" : "running") : pose === "apart" ? "reassembling or taking apart" : "running again";

export interface GateLoopOptions {
  pose: GatePose;
  motion: "auto" | "none";
  interactive: boolean;
  /** The viewer's reduced-motion setting. */
  reduced: boolean;
  onReadout?: (text: string) => void;
}

export function useGateLoop({ pose, motion, interactive, reduced, onReadout }: GateLoopOptions) {
  const root = React.useRef<HTMLDivElement>(null);
  const live = React.useRef<HTMLSpanElement>(null);
  const animated = interactive && motion === "auto";

  // First frame: the pose's still for thumbnails and stillness; otherwise the start of the pose.
  // An interactive machine keeps the frame it mounted with (the loop moves it from there); a still
  // one follows its pose.
  const [first] = React.useState(() => firstFrame(pose, !animated || reduced));
  const still = React.useMemo(() => (interactive ? null : firstFrame(pose, true)), [interactive, pose]);

  // The visible Pause control's label, for the pose it was pressed in: a pose change resumes.
  const [pauseView, setPauseView] = React.useState({ pose, paused: false });
  if (pauseView.pose !== pose) setPauseView({ pose, paused: false });

  const state = React.useRef<LoopState>({
    display: first.display,
    t: first.t,
    round: 0,
    paused: false,
    visible: false,
    frame: 0,
    last: 0,
    targets: Object.fromEntries(ASSEMBLIES.map((name) => [name, first.display.shares[name].at])) as Record<Assembly, number>,
    timers: [],
    readout: "",
    phase: "",
    heights: [],
  });
  const poseRef = React.useRef(pose);
  // The loop outlives renders, so it reads the latest props through these refs rather than closing
  // over them: a running tick must see today's motion setting, not the one it started under.
  const latest = React.useRef({ reduced, motion, onReadout });
  useIsoLayoutEffect(() => {
    latest.current = { reduced, motion, onReadout };
  });
  const isCalm = React.useCallback(() => latest.current.reduced || latest.current.motion === "none", []);

  const sceneNow = React.useCallback((): Scene => {
    const s = state.current;
    const scene = isCalm() ? stillScene(poseRef.current) : sceneAt(poseRef.current, s.t, s.round);
    if (s.paused && poseRef.current === "idle")
      return { ...scene, belt: 0, readout: `${scene.readout} · paused`, phase: "paused" };
    return scene;
  }, [isCalm]);

  const draw = React.useCallback((scene: Scene) => {
    const node = root.current;
    const svg = node?.querySelector("svg");
    if (!node || !svg) return;
    const s = state.current;
    paintDisplay(svg, s.display, s.heights);
    const text = readoutOf(poseRef.current, s.display, scene);
    if (text !== s.readout) {
      s.readout = text;
      const slot = node.closest(".um-frame")?.querySelector("[data-readout]");
      if (slot && slot.textContent !== text) slot.textContent = text;
      latest.current.onReadout?.(text);
    }
    if (scene.phase !== s.phase && live.current) {
      s.phase = scene.phase;
      if (document.activeElement === node) live.current.textContent = scene.phase;
    }
  }, []);

  /** Snap straight to the scene's settled frame (calm: reduced motion or motion="none"). */
  const settle = React.useCallback(() => {
    const s = state.current;
    const scene = sceneNow();
    step(s.display, scene, 1, true, s.targets);
    draw(scene);
  }, [draw, sceneNow]);

  const run = React.useCallback(() => {
    const s = state.current;
    if (s.frame || !s.visible) return;
    s.last = 0;
    const tick = (now: number) => {
      const dt = s.last ? Math.min((now - s.last) / 1000, 1 / 30) : 1 / 60;
      s.last = now;
      const calm = isCalm();
      const current = poseRef.current;
      if (!s.paused && !calm) s.t += dt;
      const scene = sceneNow();
      const moving = step(s.display, scene, dt, calm, s.targets);
      draw(scene);
      const scripted =
        !calm &&
        !s.paused &&
        (current === "idle" || ((current === "pass" || current === "return") && s.t < RUN_LONG[current] + 0.2));
      const pending = s.timers.length > 0;
      s.frame = s.visible && (moving || scripted || pending) ? requestAnimationFrame(tick) : 0;
    };
    s.frame = requestAnimationFrame(tick);
  }, [draw, isCalm, sceneNow]);

  const stop = React.useCallback(() => {
    const s = state.current;
    cancelAnimationFrame(s.frame);
    s.frame = 0;
  }, []);

  /** Aim the explode springs: open in stagger order, close in reverse. */
  const aim = React.useCallback((apart: boolean, calm: boolean) => {
    const s = state.current;
    s.timers.forEach((timer) => window.clearTimeout(timer));
    s.timers = [];
    const order = apart ? [...ASSEMBLIES] : [...ASSEMBLIES].reverse();
    const changing = order.filter((name) => s.targets[name] !== (apart ? 1 : 0));
    changing.forEach((name, index) => {
      if (calm || index === 0) {
        s.targets[name] = apart ? 1 : 0;
        return;
      }
      const timer = window.setTimeout(() => {
        s.targets[name] = apart ? 1 : 0;
        s.timers = s.timers.filter((other) => other !== timer);
      }, index * STAGGER_MS);
      s.timers.push(timer);
    });
  }, []);

  // A pose change: restart the pose's clock and move there from wherever the parts are.
  React.useEffect(() => {
    if (!interactive) return;
    const s = state.current;
    const changed = poseRef.current !== pose;
    poseRef.current = pose;
    const calm = isCalm();
    if (changed) {
      s.t = calm ? STILL_AT[pose] : 0;
      s.round++;
      s.paused = false;
    }
    aim(pose === "apart", calm);
    if (calm) settle();
    else run();
    // `motion` is read through `latest`; it is listed so that changing it re-aims and redraws.
  }, [pose, interactive, motion, aim, isCalm, run, settle]);

  // Run only while on screen.
  React.useEffect(() => {
    if (!interactive) return;
    const node = root.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      state.current.visible = true;
      run();
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = Boolean(entries[entries.length - 1]?.isIntersecting);
        state.current.visible = visible;
        if (visible) run();
        else stop();
      },
      { rootMargin: "120px 0px" },
    );
    observer.observe(node);
    const s = state.current;
    return () => {
      observer.disconnect();
      stop();
      s.timers.forEach((timer) => window.clearTimeout(timer));
      s.timers = [];
    };
  }, [interactive, run, stop]);

  // Reduced motion switched on mid-flight: settle on the still frame. Switched off: run again.
  const wasReduced = React.useRef(reduced);
  React.useEffect(() => {
    if (wasReduced.current === reduced) return;
    wasReduced.current = reduced;
    if (!interactive) return;
    if (reduced) {
      stop();
      state.current.t = STILL_AT[poseRef.current];
      aim(poseRef.current === "apart", true);
      settle();
    } else run();
  }, [reduced, interactive, aim, run, settle, stop]);

  /** A press on the machine or its Pause control: pause the idle tour, part or close, or run the pose again. */
  const act = () => {
    const s = state.current;
    const current = poseRef.current;
    const calm = isCalm();
    if (current === "idle") {
      s.paused = !s.paused;
      setPauseView({ pose: current, paused: s.paused });
    } else if (current === "apart") {
      const open = ASSEMBLIES.every((name) => s.targets[name] === 1);
      aim(!open, calm);
    } else {
      s.round++;
      s.t = calm ? STILL_AT[current] : 0;
    }
    if (calm) settle();
    run();
    if (live.current) live.current.textContent = liveText(current, s.paused);
  };

  return { root, live, shown: still ? still.display : first.display, paused: pauseView.paused, act };
}
