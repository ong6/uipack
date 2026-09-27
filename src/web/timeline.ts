import type { ReactNode } from "react";

/** Pure playback model for DemoPlayer. Time in, frame out: no DOM, easy to test. */

export interface DemoAction {
  label: string;
  /** Optional mono detail, e.g. "22 threads". */
  detail?: string;
  /** Metric value once this action completes (e.g. the inbox count). */
  metric?: number;
}

export interface DemoStep {
  id: string;
  /** Short tab label: "Ask", "Act", "Review". */
  label: string;
  /** One-line caption announced when the step starts. */
  title: string;
  /** Typed into the composer, one character at a time. */
  prompt?: string;
  /** Ticked off one by one after the prompt is typed. */
  actions?: (string | DemoAction)[];
  /** Metric value once the step settles. */
  metric?: number;
  /** Shown in the result pane once the step settles. Consumer-supplied content. */
  screen?: ReactNode;
  /** Milliseconds to hold the settled step before the next one. */
  hold?: number;
}

export interface DemoTiming {
  /** Pause before typing starts. */
  leadMs: number;
  typeMs: number;
  actionMs: number;
  holdMs: number;
}

export const DEFAULT_TIMING: DemoTiming = { leadMs: 450, typeMs: 34, actionMs: 720, holdMs: 1800 };

export interface DemoFrame {
  step: number;
  /** Characters of the current prompt that are visible. */
  typed: number;
  /** Completed actions in the current step. */
  actionsDone: number;
  /** True once the prompt is typed and every action is done. */
  settled: boolean;
  /** True once the final step has settled. */
  done: boolean;
  metric: number | undefined;
}

export const toAction = (a: string | DemoAction): DemoAction => (typeof a === "string" ? { label: a } : a);

function parts(step: DemoStep, t: DemoTiming) {
  const typing = (step.prompt?.length ?? 0) * t.typeMs;
  const acting = (step.actions?.length ?? 0) * t.actionMs;
  const settle = t.leadMs + typing + acting;
  return { typing, acting, settle, total: settle + (step.hold ?? t.holdMs) };
}

/** Where step `i` starts, in ms. */
export function stepStart(steps: DemoStep[], i: number, timing: DemoTiming = DEFAULT_TIMING): number {
  let at = 0;
  for (let k = 0; k < Math.min(i, steps.length); k++) at += parts(steps[k], timing).total;
  return at;
}

/** Elapsed time at which the last step settles; playback stops here unless looping. */
export function demoEnd(steps: DemoStep[], timing: DemoTiming = DEFAULT_TIMING): number {
  if (!steps.length) return 0;
  return stepStart(steps, steps.length - 1, timing) + parts(steps[steps.length - 1], timing).settle;
}

/** Full cycle length including the last hold, used for looping. */
export function demoCycle(steps: DemoStep[], timing: DemoTiming = DEFAULT_TIMING): number {
  return stepStart(steps, steps.length, timing);
}

function metricThrough(steps: DemoStep[], step: number, actionsDone: number, settled: boolean, initial?: number) {
  let metric = initial;
  for (let k = 0; k <= step && k < steps.length; k++) {
    const actions = (steps[k].actions ?? []).map(toAction);
    const n = k < step ? actions.length : actionsDone;
    for (let a = 0; a < n; a++) if (actions[a].metric !== undefined) metric = actions[a].metric;
    if ((k < step || settled) && steps[k].metric !== undefined) metric = steps[k].metric;
  }
  return metric;
}

export function demoFrame(
  steps: DemoStep[],
  elapsed: number,
  timing: DemoTiming = DEFAULT_TIMING,
  initialMetric?: number,
): DemoFrame {
  if (!steps.length) return { step: 0, typed: 0, actionsDone: 0, settled: true, done: true, metric: initialMetric };
  const end = demoEnd(steps, timing);
  const t = Math.max(0, Math.min(elapsed, end));
  let step = 0;
  let local = t;
  while (step < steps.length - 1 && local >= parts(steps[step], timing).total) {
    local -= parts(steps[step], timing).total;
    step++;
  }
  const s = steps[step];
  const p = parts(s, timing);
  const promptLen = s.prompt?.length ?? 0;
  const nActions = s.actions?.length ?? 0;
  const typed = Math.max(0, Math.min(promptLen, Math.floor((local - timing.leadMs) / timing.typeMs) + 1));
  const typedEnd = timing.leadMs + p.typing;
  const actionsDone = local < typedEnd ? 0 : Math.min(nActions, Math.floor((local - typedEnd) / timing.actionMs));
  const settled = local >= p.settle;
  return {
    step,
    typed: local < timing.leadMs ? 0 : typed,
    actionsDone: settled ? nActions : actionsDone,
    settled,
    done: t >= end,
    metric: metricThrough(steps, step, settled ? nActions : actionsDone, settled, initialMetric),
  };
}
