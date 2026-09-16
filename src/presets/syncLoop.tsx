import { Connector } from "../Connector";
import { Defs } from "../Defs";
import { Group } from "../Group";
import { Label } from "../Label";
import { Lane } from "../Lane";
import { Node } from "../Node";
import { Packet } from "../Packet";
import type { Point } from "../geometry";
import { Stack, stackHeight, presetFigure, NARROW_W, type FigureMeta, type Item, type PresetParts } from "./shared";

export interface SyncLoopSpec {
  figure: FigureMeta;
  upstream: { label: string; sub?: string; items: Item[] };
  /** Repos that hold a copy. `hooks` names the two moments the copy syncs. `plugin` marks a read-only consumer. */
  consumers: (Item & { hooks?: [string, string]; plugin?: boolean })[];
  pull?: string;
  push?: string;
}

export const defaultSyncLoop: SyncLoopSpec = {
  figure: {
    number: "Figure 01",
    eyebrow: "Sync loop",
    title: "Edit where you use it, it flows back",
    caption: "One upstream repo is a subtree inside every consumer. A start hook merges what moved upstream; a stop hook pushes local edits back. A plugin install reads the same repo one way.",
    alt: "An upstream repo on the left holds skills, a catalog and a plugin manifest; three consumer repos on the right each pull at session start and push at session stop, and a plugin marketplace reads the upstream one way.",
  },
  upstream: {
    label: "Upstream",
    sub: "ong6/skillpack",
    items: [
      { label: "skills/", sub: "one folder per skill", icon: "doc" },
      { label: "catalog.yaml", sub: "build fails on drift", icon: "doc" },
      { label: ".claude-plugin/", sub: "marketplace + plugin", icon: "tool" },
    ],
  },
  consumers: [
    { label: "private-notes", sub: "subtree", icon: "git", hooks: ["SessionStart", "Stop"] },
    { label: "junxiong-homepage", sub: "subtree", icon: "git", hooks: ["SessionStart", "Stop"] },
    { label: "Plugin marketplace", sub: "read-only", icon: "cloud", plugin: true },
  ],
  pull: "merge at start",
  push: "push at stop",
};

const PULL = "pull";
const PUSH = "push";

export function syncLoopParts(spec: SyncLoopSpec = defaultSyncLoop, id: string): PresetParts {
  const items = spec.upstream.items;
  const n = spec.consumers.length;
  const con = { x: 720, w: 336, h: 64, step: 88, y0: 72 };
  const up = { x: 24, y: 64, w: 320, h: Math.max(48 + items.length * 64 + 8, con.y0 + n * con.step - 64 - 8) };
  const conY = (i: number) => con.y0 + i * con.step + con.h / 2;
  const height = Math.max(up.y + up.h, con.y0 + n * con.step - 24) + 32;

  const wide = (
    <>
      <Defs id={id} />
      <Lane x={up.x} w={up.w} y={40} title="Upstream" />
      <Lane x={con.x} w={con.w} y={40} title="Consumers" />
      <Group {...up} title={spec.upstream.label} flow={[PULL, PUSH]}>
        {items.map((it, i) => (
          <Node key={it.label} x={up.x + 16} y={up.y + 40 + i * 64} w={up.w - 32} h={48} label={it.label} sub={it.sub} icon={it.icon} align="left" flow={[PULL, PUSH]} size={13} subSize={10} />
        ))}
      </Group>
      {spec.consumers.map((c, i) => {
        const cy = conY(i);
        const pull: Point[] = [
          [up.x + up.w, cy - 8],
          [con.x, cy - 8],
        ];
        const push: Point[] = [
          [con.x, cy + 8],
          [up.x + up.w, cy + 8],
        ];
        const single: Point[] = [
          [up.x + up.w, cy],
          [con.x, cy],
        ];
        return (
          <g key={c.label}>
            {c.plugin ? (
              <>
                <Connector points={single} defs={id} kind="request" dashed flow={PULL} />
                <Packet points={single} kind="request" dur={2.6} delay={-i * 0.5} flow={PULL} r={4} />
              </>
            ) : (
              <>
                <Connector points={pull} defs={id} kind="request" flow={PULL} />
                <Packet points={pull} kind="request" dur={2.4} delay={-i * 0.6} flow={PULL} r={4} />
                <Connector points={push} defs={id} kind="change" flow={PUSH} />
                <Packet points={push} kind="change" dur={2.4} delay={-i * 0.6 - 1.2} flow={PUSH} r={4} />
              </>
            )}
            <Node x={con.x} y={con.y0 + i * con.step} w={con.w} h={con.h} label={c.label} sub={c.hooks ? `${c.sub ?? ""} · ${c.hooks[0]} → ${c.hooks[1]}`.replace(/^ · /, "") : c.sub} icon={c.icon} align="left" flow={c.plugin ? PULL : [PULL, PUSH]} />
          </g>
        );
      })}
      <Label x={(up.x + up.w + con.x) / 2} y={conY(0) - 16} text={spec.pull ?? "pull"} anchor="middle" />
      <Label x={(up.x + up.w + con.x) / 2} y={conY(0) + 28} text={spec.push ?? "push"} anchor="middle" />
    </>
  );

  const steps = [
    { label: spec.upstream.label, sub: spec.upstream.sub ?? items.map((i) => i.label).join(" · "), icon: "git" as const, flow: [PULL, PUSH].join(" ") },
    ...spec.consumers.map((c) => ({ label: c.label, sub: c.plugin ? "reads one way" : (spec.pull ?? "pull") + " · " + (spec.push ?? "push"), icon: c.icon ?? ("git" as const), flow: c.plugin ? PULL : [PULL, PUSH].join(" "), kind: c.plugin ? ("request" as const) : ("change" as const), dashed: c.plugin })),
  ];

  return {
    wide,
    narrow: <Stack steps={steps} id={`${id}-n`} />,
    viewBox: `0 0 1120 ${height}`,
    narrowViewBox: `0 0 ${NARROW_W} ${stackHeight(steps.length)}`,
    legend: [
      { label: spec.pull ?? "Pull", kind: "request" },
      { label: spec.push ?? "Push", kind: "change" },
    ],
  };
}

export const syncLoop = (spec: SyncLoopSpec = defaultSyncLoop, id?: string) => presetFigure(spec, syncLoopParts, id);
