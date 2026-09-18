/** Serializable scene data. Every stop resolves from these defaults, never from the previous stop. */
export type Vec3 = [number, number, number];
export type SceneTone =
  | "accent"
  | "request"
  | "response"
  | "change"
  | "neutral";
export interface SlideNode {
  id: string;
  label: string;
  detail?: string;
  position: Vec3;
  size?: Vec3;
  kind?: "block" | "sphere" | "layer" | "boundary";
  tone?: SceneTone;
}
export interface SlideConnection {
  id: string;
  from: string;
  to: string;
  tone?: SceneTone;
}
export interface NodePose {
  position?: Vec3;
  opacity?: number;
  scale?: number;
}
export interface SlideStop {
  id: string;
  title: string;
  caption: string;
  camera: { position: Vec3; target: Vec3 };
  nodes?: Record<string, NodePose>;
  /** IDs of labels to show. Omit to show every non-boundary node. */
  labels?: string[];
  /** Only these connections are highlighted and carry moving packets. */
  activeConnections?: string[];
  /** Optional short narration for the presenter, separate from the visible slide. */
  notes?: string;
}
export interface SlideStory {
  id: string;
  title: string;
  description: string;
  nodes: SlideNode[];
  connections: SlideConnection[];
  stops: SlideStop[];
}
export interface ResolvedNodePose {
  position: Vec3;
  opacity: number;
  scale: number;
}
export type SlideTheme = "dark" | "light";
export interface SlidePalette {
  background: string;
  surface: string;
  ink: string;
  muted: string;
  rule: string;
  accent: string;
  request: string;
  response: string;
  change: string;
}
