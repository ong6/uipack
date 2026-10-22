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
/** Above this preview scale the box is too wide for an exact first frame; draw a miniature. */
const MINI_ABOVE = 0.4;
const MINI_SCALE = 0.3;

/** The child level drawn as the stage would show it at the first frame of the zoom: `slice`-fitted, centred. */
function Ghost({
  child,
  ctx,
  box,
  uid,
}: {
  child: DrillLevel;
  ctx: DrillContextValue;
  box: { x: number; y: number; w: number; h: number };
  uid: string;
}) {
  const narrow = ctx.variant === "narrow" && !!ctx.frame.narrow;
  const frame = narrow ? ctx.frame.narrow! : ctx.frame.wide;
  const render = narrow && child.narrow ? child.narrow : child.render;
  const levelVb = (narrow ? child.narrowViewBox : child.viewBox) ?? frame;
  const f = vbSize(frame);
  const inner: DrillContextValue = { ...ctx, ghost: true, interactive: false, open: undefined };
  // The preview is the stage as the zoom's first frame shows it: the child at 1/Z, centred, cropped
  // to the box. When the box is nearly as wide as the stage (a narrow column) that would be the
  // child at full size behind the label, so it becomes a small miniature at the right instead.
  const slice = Math.max(box.w / f.w, box.h / f.h);
  const mini = slice > MINI_ABOVE;
  const k = MINI_SCALE;
  const port = mini
    ? {
        x: box.x + box.w - f.w * k - 30,
        y: box.y,
        width: f.w * k,
        height: box.h,
        viewBox: `0 ${(f.h - box.h / k) / 2} ${f.w} ${box.h / k}`,
      }
    : { x: box.x, y: box.y, width: box.w, height: box.h, viewBox: `0 0 ${f.w} ${f.h}` };
  return (
    <svg {...port} preserveAspectRatio="xMidYMid slice" overflow="hidden">
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
                  <Ghost child={child} ctx={ctx} box={box} uid={uid} />
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
