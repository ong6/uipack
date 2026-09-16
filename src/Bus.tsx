import { Connector, connectorStroke, type ConnectorKind } from "./Connector";
import { useFigureHover, hoverAttrs, type Flow } from "./hover";
import type { Point } from "./geometry";

export interface BusStub {
  /** Position along the trunk (y for a vertical bus, x for a horizontal one). */
  at: number;
  /** Where the stub ends: the node edge's x (vertical bus) or y (horizontal). */
  to: number;
  flow?: Flow;
  /** Arrowhead at the node end: only for a stub that enters a node, never one that leaves it. */
  arrow?: boolean;
}

export interface BusProps {
  axis?: "v" | "h";
  /** Trunk position: x for vertical, y for horizontal. */
  at: number;
  /** Trunk extent along its axis. */
  from: number;
  to: number;
  stubs: BusStub[];
  kind?: ConnectorKind;
  flow?: Flow;
  /** Marker prefix from `<Defs id>`, needed by any stub with `arrow`. */
  defs?: string;
  /** Draw a junction dot where each stub meets the trunk. Default true. */
  dots?: boolean;
  id?: string;
}

/** Points of one stub, trunk junction first, node edge last. */
export function busStub(props: Pick<BusProps, "axis" | "at">, stub: BusStub): Point[] {
  return props.axis === "h" ? [[stub.at, props.at], [stub.at, stub.to]] : [[props.at, stub.at], [stub.to, stub.at]];
}

/** Points of every stub, in order, for packets to ride. */
export function busStubs(props: Pick<BusProps, "axis" | "at" | "stubs">): Point[][] {
  return props.stubs.map((s) => busStub(props, s));
}

/**
 * A trunk with stubs and a junction dot at each join. Stubs carry no
 * arrowhead unless they enter a node; direction comes from the packets.
 */
export function Bus({ axis = "v", at, from, to, stubs, kind, flow, defs, dots = true, id }: BusProps) {
  const hover = useFigureHover();
  const trunk: Point[] = axis === "h" ? [[from, at], [to, at]] : [[at, from], [at, to]];
  return (
    <g id={id} data-uipack="bus" {...hoverAttrs(flow, kind, hover)}>
      <Connector points={trunk} arrow={false} kind={kind} flow={flow} inset={0} />
      {stubs.map((s, i) => (
        <Connector key={i} points={busStub({ axis, at }, s)} defs={defs} arrow={!!s.arrow} kind={kind} flow={s.flow ?? flow} inset={[0, 2]} />
      ))}
      {dots
        ? stubs.map((s, i) => {
            const [cx, cy] = axis === "h" ? [s.at, at] : [at, s.at];
            return <circle key={i} data-uipack="junction" cx={cx} cy={cy} r={2.5} fill={connectorStroke(kind)} fillOpacity={kind ? 1 : 0.7} />;
          })
        : null}
    </g>
  );
}
