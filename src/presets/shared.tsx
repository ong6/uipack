import type { ReactNode } from "react";
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

export interface StackStep extends Item {
  /** Kind of the connector and packet leading INTO this step. */
  kind?: TokenKind;
  /** Draw the packet into this step backwards (a return). */
  back?: boolean;
  flow?: string;
  accent?: boolean;
  dashed?: boolean;
}

export const NARROW_W = 360;
const SX = 16;
const SW = 328;
const SH = 48;
const GAP = 40;

/** Height of a narrow stack of `n` steps starting at `y0`. */
export function stackHeight(n: number, y0 = 24): number {
  return y0 + n * SH + (n - 1) * GAP + 24;
}

/**
 * The narrow drawing every preset falls back to: one column of boxes with a
 * connector and a packet between each pair. Direction is top to bottom.
 */
export function Stack({ steps, id, y0 = 24 }: { steps: StackStep[]; id: string; y0?: number }) {
  return (
    <>
      <Defs id={id} />
      {steps.map((s, i) => {
        const y = y0 + i * (SH + GAP);
        const into: Point[] = [
          [SX + SW / 2, y - GAP],
          [SX + SW / 2, y],
        ];
        const kind = s.kind ?? "request";
        return (
          <g key={i}>
            {i > 0 ? (
              <>
                <Connector points={into} defs={id} kind={kind === "neutral" ? undefined : (kind as Exclude<TokenKind, "neutral">)} flow={s.flow} />
                <Packet points={into} kind={kind} dur={1.4} delay={-i * 0.35} reverse={s.back} flow={s.flow} r={4} />
              </>
            ) : null}
            <Node x={SX} y={y} w={SW} h={SH} label={s.label} sub={s.sub} icon={s.icon} size={13} subSize={10} flow={s.flow} accent={s.accent} dashed={s.dashed} />
          </g>
        );
      })}
    </>
  );
}

export const centreY = (y: number, h: number) => y + h / 2;
