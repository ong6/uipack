import { useId, type ReactNode } from "react";
import { Connector } from "../Connector";
import { Defs } from "../Defs";
import { Figure } from "../Figure";
import type { LegendItem } from "../Legend";
import { Node } from "../Node";
import { Packet } from "../Packet";
import type { IconName } from "../icons";
import type { Point } from "../geometry";
import type { TokenKind } from "../tokens";

/** One box in a preset spec. */
export interface Item {
  label: string;
  sub?: string;
  icon?: IconName;
}

/** Header fields every preset takes. `alt` is required: it is the figure's accessible description. */
export interface FigureMeta {
  number?: string;
  eyebrow?: string;
  title?: string;
  caption?: string;
  alt: string;
  headingLevel?: 2 | 3 | 4 | 5;
}

/** What a preset produces; `Figure`-ready. */
export interface PresetParts {
  wide: ReactNode;
  narrow: ReactNode;
  viewBox: string;
  narrowViewBox: string;
  legend: LegendItem[];
}

/** Props of the element every preset wrapper returns; `renderStatic` reads them. */
export interface PresetFigureProps<S> {
  spec: S;
  parts: (spec: S, id: string) => PresetParts;
  id?: string;
}

const clean = (s: string) => s.replace(/:/g, "");

/**
 * A preset as a component: the marker and stack ids come from `useId()` unless
 * the caller passes one, so two figures of the same preset on a page never
 * collide.
 */
export function PresetFigure<S extends { figure: FigureMeta }>({ spec, parts, id }: PresetFigureProps<S>) {
  const auto = useId();
  const fid = id ?? `p${clean(auto)}`;
  return toFigure(spec.figure, parts(spec, fid), fid);
}

/** Build the element a preset wrapper returns. */
export function presetFigure<S extends { figure: FigureMeta }>(spec: S, parts: (spec: S, id: string) => PresetParts, id?: string) {
  return <PresetFigure spec={spec} parts={parts} id={id} />;
}

export function toFigure(meta: FigureMeta, parts: PresetParts, id?: string) {
  return (
    <Figure
      id={id}
      number={meta.number}
      eyebrow={meta.eyebrow}
      title={meta.title}
      caption={meta.caption}
      headingLevel={meta.headingLevel}
      legend={parts.legend}
      viewBox={parts.viewBox}
      narrow={parts.narrow}
      narrowViewBox={parts.narrowViewBox}
      alt={meta.alt}>
      {parts.wide}
    </Figure>
  );
}

/** Characters that fit in `px` at `size` for the mono or sans face (the same estimate Label uses). */
export function fits(px: number, size: number, mono = false): number {
  return Math.max(3, Math.floor(px / (size * (mono ? 0.62 : 0.55))));
}

/** Truncate with an ellipsis when `text` cannot fit; the full text goes to `hint`. */
export function fit(text: string, px: number, size: number, mono = false): { text: string; hint?: string } {
  const n = fits(px, size, mono);
  if (text.length <= n) return { text };
  return { text: text.slice(0, Math.max(1, n - 1)).trimEnd() + "\u2026", hint: text };
}

/** Split `items` into rows of at most `per`. */
export function rows<T>(items: T[], per = 3): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += per) out.push(items.slice(i, i + per));
  return out;
}

export interface StackStep extends Item {
  /** Kind of the connector and packet leading INTO this step. */
  kind?: TokenKind;
  /** Draw the packet into this step backwards (a return). */
  back?: boolean;
  flow?: string;
  accent?: boolean;
  dashed?: boolean;
  /** No connector from the step above; sits 8 units under it (a wrapped row of one box). */
  link?: boolean;
  hint?: string;
}

export const NARROW_W = 360;
const SX = 16;
const SW = 328;
const SH = 48;
const GAP = 40;

const TIGHT = 8;
/** Text width inside a narrow node: 328 minus padding and the icon slot. */
export const STACK_TEXT_W = SW - 14 - 26 - 12;

/** Height of a narrow stack of `n` linked steps starting at `y0`. */
export function stackHeight(n: number, y0 = 24): number {
  return y0 + n * SH + (n - 1) * GAP + 24;
}

/** Y of each step, honouring `link: false` rows, and the total height. */
export function stackLayout(steps: StackStep[], y0 = 24): { ys: number[]; height: number } {
  const ys: number[] = [];
  let y = y0;
  steps.forEach((s, i) => {
    if (i > 0) y += SH + (s.link === false ? TIGHT : GAP);
    ys.push(y);
  });
  return { ys, height: (ys[ys.length - 1] ?? y0) + SH + 24 };
}

/** Height of a narrow stack whose steps may include unlinked rows. */
export function stackHeightFor(steps: StackStep[], y0 = 24): number {
  return stackLayout(steps, y0).height;
}

/**
 * The narrow drawing every preset falls back to: one column of boxes with a
 * connector and a packet between each pair. Direction is top to bottom.
 */
export function Stack({ steps, id, y0 = 24 }: { steps: StackStep[]; id: string; y0?: number }) {
  const { ys } = stackLayout(steps, y0);
  return (
    <>
      <Defs id={id} />
      {steps.map((s, i) => {
        const y = ys[i];
        const into: Point[] = [
          [SX + SW / 2, y - GAP],
          [SX + SW / 2, y],
        ];
        const kind = s.kind ?? "request";
        return (
          <g key={i}>
            {i > 0 && s.link !== false ? (
              <>
                <Connector points={into} defs={id} kind={kind === "neutral" ? undefined : (kind as Exclude<TokenKind, "neutral">)} flow={s.flow} />
                <Packet points={into} kind={kind} dur={1.4} delay={-i * 0.35} reverse={s.back} flow={s.flow} r={4} />
              </>
            ) : null}
            <Node x={SX} y={y} w={SW} h={SH} label={s.label} sub={s.sub} icon={s.icon} hint={s.hint} size={13} subSize={10} flow={s.flow} accent={s.accent} dashed={s.dashed} />
          </g>
        );
      })}
    </>
  );
}

export const centreY = (y: number, h: number) => y + h / 2;
