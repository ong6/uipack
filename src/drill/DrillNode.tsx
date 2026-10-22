import { useEffect, useId, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { Node, nodeName, type NodeProps } from "../Node";
import { SelectionContext } from "../selection";
import { FigureMotionContext, type FigureMotion } from "../context";
import { FigureScaleContext } from "../scale";
import { DrillContext, useDrill, type DrillContextValue } from "./context";
import { cleanId, drillBox, DRILL_GROW, vbSize, type DrillLevel } from "./model";

export interface DrillNodeProps extends Omit<NodeProps, "label" | "href" | "inlay"> {
  /** Id of the level this node opens. */
  drill: string;
  /** Visible label. Defaults to the child level's label. */
  label?: string;
  /** Height step in user units, added about the centre (default 8: a 56 box draws 64). 0 keeps the box as given. */
  grow?: number;
  /** Show the faint miniature of the child level inside the box. Default true. */
  preview?: boolean;
}

const noSelection = { enabled: false, selected: null, select: () => {} };
const stillMotion: FigureMotion = { playing: false, reduced: true, cycle: 0, toggle: () => {}, replay: () => {} };
const RADIUS = 6;
/** The preview keeps to the node's right third, and clear of the label's words. */
const PREVIEW_SHARE = 1 / 3;
/** Rough advance widths, as a share of the font size: the label's sans at 600, the subtitle's mono. */
const SANS_ADVANCE = 0.6;
const MONO_ADVANCE = 0.6;

/**
 * Where a node's label ends, from its text and sizes (Node's own layout: 14px inset, a 26px icon
 * column, left-aligned after an icon, else centred). An estimate, on the generous side, so the
 * preview fades in only after the words.
 */
function labelRight(
  box: { x: number; w: number },
  label: string,
  { sub, icon, align, size = 14, subSize = 11 }: Pick<NodeProps, "sub" | "icon" | "align" | "size" | "subSize">,
): number {
  const width = Math.max(label.length * size * SANS_ADVANCE, (sub?.length ?? 0) * subSize * MONO_ADVANCE);
  return (align ?? (icon ? "left" : "center")) === "center"
    ? box.x + box.w / 2 + width / 2
    : box.x + 14 + (icon ? 26 : 0) + width;
}

/** The child level drawn as the stage would show it at the first frame of the zoom: `slice`-fitted, centred. */
function Ghost({
  child,
  ctx,
  box,
  uid,
  clearOf,
}: {
  child: DrillLevel;
  ctx: DrillContextValue;
  box: { x: number; y: number; w: number; h: number };
  uid: string;
  /** The x where the node's label ends: the preview fades in after it. */
  clearOf: number;
}) {
  const narrow = ctx.variant === "narrow" && !!ctx.frame.narrow;
  const frame = narrow ? ctx.frame.narrow! : ctx.frame.wide;
  const render = narrow && child.narrow ? child.narrow : child.render;
  const levelVb = (narrow ? child.narrowViewBox : child.viewBox) ?? frame;
  const f = vbSize(frame);
  const inner: DrillContextValue = { ...ctx, ghost: true, interactive: false, open: undefined };
  // A miniature of the whole level, fitted into the node's right third, so the label and icon read
  // on the plain node and the preview says "more in here" beside them. Where the label's last
  // words reach into that third, the preview fades in after them instead of running under them.
  const left = box.x + box.w * (1 - PREVIEW_SHARE);
  // Under the open marker (top right, 10 to 22 down), so the two never overlap.
  const port = { x: left, y: box.y + 26, width: box.x + box.w - 8 - left, height: box.h - 32, viewBox: `0 0 ${f.w} ${f.h}` };
  const fade = clearOf + 4 > left ? { from: clearOf + 2, to: Math.min(clearOf + 22, port.x + port.width) } : null;
  return (
    <g mask={fade ? `url(#${uid}-fade)` : undefined}>
      {fade ? (
        <mask id={`${uid}-fade`} maskUnits="userSpaceOnUse" x={port.x} y={port.y} width={port.width} height={port.height}>
          <linearGradient id={`${uid}-fade-g`} gradientUnits="userSpaceOnUse" x1={fade.from} x2={fade.to} y1={0} y2={0}>
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset="1" stopColor="#fff" />
          </linearGradient>
          <rect x={port.x} y={port.y} width={port.width} height={port.height} fill={`url(#${uid}-fade-g)`} />
        </mask>
      ) : null}
      <svg {...port} preserveAspectRatio="xMaxYMid meet" overflow="hidden">
        <svg width={f.w} height={f.h} viewBox={levelVb} preserveAspectRatio="xMidYMid meet">
          <SelectionContext.Provider value={noSelection}>
            <FigureMotionContext.Provider value={stillMotion}>
              <FigureScaleContext.Provider value={{ floor: 0 }}>
                <DrillContext.Provider value={inner}>
                  {render({ id: `${ctx.idPrefix}-g${uid}`, variant: narrow ? "narrow" : "wide", ghost: true, level: child })}
                </DrillContext.Provider>
              </FigureScaleContext.Provider>
            </FigureMotionContext.Provider>
          </SelectionContext.Provider>
        </svg>
      </svg>
    </g>
  );
}

/**
 * A Node that opens another level of a DrillFigure. It draws one size step
 * larger, with a soft accent glow and a faint miniature of the level inside,
 * so it reads as "there's more in here" before anyone clicks. Outside a
 * DrillFigure (or in a ghost preview) it is a plain Node.
 */
export function DrillNode({ drill, label, grow = DRILL_GROW, preview = true, ...node }: DrillNodeProps) {
  const ctx = useDrill();
  const uid = cleanId(useId());
  const child = ctx?.levels.get(drill);
  const text = label ?? child?.label ?? drill;
  const ghostRef = useRef<SVGGElement>(null);
  const [count, setCount] = useState(0);
  useEffect(() => {
    const g = ghostRef.current;
    if (g) setCount(g.querySelectorAll('[data-uipack="node"]').length);
  }, [drill, ctx?.variant]);

  if (!ctx || !child) return <Node {...node} label={text} />;
  const box = drillBox({ x: node.x, y: node.y, w: node.w, h: node.h }, grow);
  if (ctx.ghost) return <Node {...node} {...box} label={text} />;

  const summary = child.summary ?? (count ? `${count} part${count === 1 ? "" : "s"} inside` : "");
  // Starts with the visible text (WCAG 2.5.3 label in name), then says what activating it does.
  const name = `${nodeName(text, node.sub)}, open${summary ? `: ${summary}` : ""}`;
  const interactive = ctx.interactive && !!ctx.open;
  const activate = (e: MouseEvent | KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    ctx.open?.(drill);
  };
  const pad = 24;
  const region = { x: box.x - pad, y: box.y - pad, width: box.w + pad * 2, height: box.h + pad * 2 };
  const mx = box.x + box.w - 22;
  const my = box.y + 10;

  return (
    <g
      className="uipack-drill-node"
      data-uipack="drill-node"
      data-drill={drill}
      {...(interactive
        ? {
            role: "button",
            tabIndex: 0,
            "aria-label": name,
            onClick: activate,
            onKeyDown: (e: KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") activate(e);
            },
          }
        : {})}
    >
      <defs>
        <filter id={`${uid}-halo`} filterUnits="userSpaceOnUse" {...region}>
          <feGaussianBlur stdDeviation={7} />
        </filter>
        <filter id={`${uid}-soft`} filterUnits="userSpaceOnUse" {...region}>
          <feGaussianBlur stdDeviation={5} />
        </filter>
        <clipPath id={`${uid}-clip`}>
          <rect x={box.x} y={box.y} width={box.w} height={box.h} rx={RADIUS} />
        </clipPath>
      </defs>
      <rect
        className="uipack-drill-node__halo"
        x={box.x}
        y={box.y}
        width={box.w}
        height={box.h}
        rx={RADIUS}
        fill="none"
        stroke="var(--uipack-accent)"
        strokeWidth={8}
        strokeOpacity={0.3}
        filter={`url(#${uid}-halo)`}
        aria-hidden="true"
      />
      <SelectionContext.Provider value={noSelection}>
        <Node
          {...node}
          {...box}
          label={text}
          inlay={
            <g className="uipack-drill-node__inlay" clipPath={`url(#${uid}-clip)`} aria-hidden="true" pointerEvents="none">
              <rect
                className="uipack-drill-node__wash"
                x={box.x}
                y={box.y}
                width={box.w}
                height={box.h}
                fill="var(--uipack-accent)"
                fillOpacity={0.035}
              />
              <rect
                className="uipack-drill-node__inner"
                x={box.x}
                y={box.y}
                width={box.w}
                height={box.h}
                rx={RADIUS}
                fill="none"
                stroke="var(--uipack-accent)"
                strokeWidth={10}
                strokeOpacity={0.12}
                filter={`url(#${uid}-soft)`}
              />
              {preview ? (
                <g ref={ghostRef} className="uipack-drill-node__ghost" opacity={0.16}>
                  <Ghost child={child} ctx={ctx} box={box} uid={uid} clearOf={labelRight(box, text, node)} />
                </g>
              ) : null}
            </g>
          }
        />
      </SelectionContext.Provider>
      <g
        className="uipack-drill-node__mark"
        transform={`translate(${mx}, ${my})`}
        fill="none"
        stroke="var(--uipack-accent)"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        pointerEvents="none"
      >
        <path d="M2.5 9.5 9.5 2.5M5.5 2.5h4v4M2.5 5.5v4h4" />
      </g>
    </g>
  );
}
