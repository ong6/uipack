import type {
  ResolvedNodePose,
  SlideNode,
  SlidePalette,
  SlideStop,
  SlideStory,
  SlideTheme,
} from "./types";

export const slidePalettes: Record<SlideTheme, SlidePalette> = {
  dark: {
    background: "#0e1512",
    surface: "#14201b",
    ink: "#e8ece9",
    muted: "#9aa39e",
    rule: "#43544b",
    accent: "#71dcb2",
    request: "#8ea4ff",
    response: "#5fd39b",
    change: "#c39aff",
  },
  light: {
    background: "#f1eee6",
    surface: "#f8f6f0",
    ink: "#1a2420",
    muted: "#55675f",
    rule: "#bac3bc",
    accent: "#205f49",
    request: "#4f6fe6",
    response: "#27835a",
    change: "#9a63e0",
  },
};
export function clampStop(index: number, count: number): number {
  return Math.max(
    0,
    Math.min(
      Math.max(0, count - 1),
      Number.isFinite(index) ? Math.trunc(index) : 0,
    ),
  );
}
export function resolveNodePose(
  node: SlideNode,
  stop: SlideStop,
): ResolvedNodePose {
  const pose = stop.nodes?.[node.id];
  return {
    position: [...(pose?.position ?? node.position)],
    opacity: pose?.opacity ?? 1,
    scale: pose?.scale ?? 1,
  };
}
export function validateSlideStory(story: SlideStory): string[] {
  const issues: string[] = [];
  const ids = new Set<string>();
  const finite3 = (value: unknown): value is [number, number, number] =>
    Array.isArray(value) && value.length === 3 && value.every(Number.isFinite);
  if (!story.stops.length) issues.push("A story needs at least one stop.");
  for (const n of story.nodes) {
    if (!n.id || ids.has(n.id))
      issues.push(`Duplicate or empty node id: ${n.id}`);
    ids.add(n.id);
    if (!finite3(n.position)) issues.push(`Invalid position: ${n.id}`);
    if (n.size && (!finite3(n.size) || n.size.some((v) => v <= 0)))
      issues.push(`Invalid size: ${n.id}`);
  }
  const edges = new Set<string>();
  for (const c of story.connections) {
    if (edges.has(c.id)) issues.push(`Duplicate connection id: ${c.id}`);
    edges.add(c.id);
    if (!ids.has(c.from) || !ids.has(c.to))
      issues.push(`Unknown connection endpoint: ${c.id}`);
    if (c.from === c.to)
      issues.push(`Self-connections are unsupported: ${c.id}`);
  }
  const stops = new Set<string>();
  for (const s of story.stops) {
    if (stops.has(s.id)) issues.push(`Duplicate stop id: ${s.id}`);
    stops.add(s.id);
    if (
      !finite3(s.camera.position) ||
      !finite3(s.camera.target) ||
      s.camera.position.every((v, i) => v === s.camera.target[i])
    )
      issues.push(`Invalid camera: ${s.id}`);
    for (const [id, pose] of Object.entries(s.nodes ?? {})) {
      if (!ids.has(id)) issues.push(`Unknown node: ${id}`);
      if (pose.position && !finite3(pose.position))
        issues.push(`Invalid pose position: ${id}`);
      if (
        pose.opacity !== undefined &&
        (!Number.isFinite(pose.opacity) || pose.opacity < 0 || pose.opacity > 1)
      )
        issues.push(`Invalid opacity: ${id}`);
      if (
        pose.scale !== undefined &&
        (!Number.isFinite(pose.scale) || pose.scale <= 0)
      )
        issues.push(`Invalid scale: ${id}`);
    }
    for (const id of s.labels ?? [])
      if (!ids.has(id)) issues.push(`Unknown label: ${id}`);
    for (const id of s.activeConnections ?? [])
      if (!edges.has(id)) issues.push(`Unknown active connection: ${id}`);
  }
  return issues;
}
