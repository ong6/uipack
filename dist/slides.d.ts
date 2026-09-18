import * as react from 'react';
import { ReactNode, CSSProperties } from 'react';

/** Serializable scene data. Every stop resolves from these defaults, never from the previous stop. */
type Vec3 = [number, number, number];
type SceneTone = "accent" | "request" | "response" | "change" | "neutral";
interface SlideNode {
    id: string;
    label: string;
    detail?: string;
    position: Vec3;
    size?: Vec3;
    kind?: "block" | "sphere" | "layer" | "boundary";
    tone?: SceneTone;
}
interface SlideConnection {
    id: string;
    from: string;
    to: string;
    tone?: SceneTone;
}
interface NodePose {
    position?: Vec3;
    opacity?: number;
    scale?: number;
}
interface SlideTransition {
    camera?: "orbit" | "dolly";
    duration?: number;
    /** Seconds between component arrivals; capped at 0.15. */
    stagger?: number;
}
interface SlideStop {
    transition?: SlideTransition;
    id: string;
    title: string;
    caption: string;
    camera: {
        position: Vec3;
        target: Vec3;
    };
    nodes?: Record<string, NodePose>;
    /** IDs of labels to show. Omit to show every non-boundary node. */
    labels?: string[];
    /** Only these connections are highlighted and carry moving packets. */
    activeConnections?: string[];
    /** Optional short narration for the presenter, separate from the visible slide. */
    notes?: string;
}
interface SlideStory {
    id: string;
    title: string;
    description: string;
    nodes: SlideNode[];
    connections: SlideConnection[];
    stops: SlideStop[];
}
interface ResolvedNodePose {
    position: Vec3;
    opacity: number;
    scale: number;
}
type SlideTheme = "dark" | "light";
interface SlidePalette {
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

interface SlideSceneProps {
    story: SlideStory;
    stopId?: string;
    theme?: SlideTheme;
    /** auto respects the OS preference; none also disables packet motion. */
    motion?: "auto" | "none";
    paused?: boolean;
    /** diagram is also useful for server-rendered or printable views. */
    renderMode?: "auto" | "diagram";
    className?: string;
    onSettled?: (stopId: string) => void;
}
/** A persistent 3D scene controlled by a named presentation stop. */
declare function SlideScene(props: SlideSceneProps): react.JSX.Element;
interface SlidePlayerProps extends SlideSceneProps {
    defaultStopId?: string;
    onStopChange?: (stopId: string) => void;
    /** A footer slot for deck-specific attribution. */
    footer?: ReactNode;
    style?: CSSProperties;
}
/** Slide chrome, keyboard navigation, progressive fallback, and a persistent scene. */
declare function SlidePlayer(props: SlidePlayerProps): react.JSX.Element;

declare const harnessDive: SlideStory;
declare const retrievalLayers: SlideStory;
declare const parallelAgents: SlideStory;
/** Four exact cardinal viewpoints around one unchanged architecture. */
declare const quarterTurn: SlideStory;
declare const stagedAssembly: SlideStory;
declare const architectureShift: SlideStory;
declare const slideStories: readonly [SlideStory, SlideStory, SlideStory, SlideStory, SlideStory, SlideStory];

declare const slidePalettes: Record<SlideTheme, SlidePalette>;
declare function clampStop(index: number, count: number): number;
declare function resolveNodePose(node: SlideNode, stop: SlideStop): ResolvedNodePose;
declare function validateSlideStory(story: SlideStory): string[];

export { type NodePose, type ResolvedNodePose, type SceneTone, type SlideConnection, type SlideNode, type SlidePalette, SlidePlayer, type SlidePlayerProps, SlideScene, type SlideSceneProps, type SlideStop, type SlideStory, type SlideTheme, type SlideTransition, type Vec3, architectureShift, clampStop, harnessDive, parallelAgents, quarterTurn, resolveNodePose, retrievalLayers, slidePalettes, slideStories, stagedAssembly, validateSlideStory };
