import * as react from 'react';
import { ReactNode } from 'react';
import { b as LegendItem, T as TokenKind } from './Legend-S2FQoAxv.cjs';
import { I as IconName } from './index-DwRqkLtz.cjs';

/** One box in a preset spec. */
interface Item {
    label: string;
    sub?: string;
    icon?: IconName;
}
/** Header fields every preset takes. `alt` is required: it is the figure's accessible description. */
interface FigureMeta {
    number?: string;
    eyebrow?: string;
    title?: string;
    caption?: string;
    alt: string;
    headingLevel?: 2 | 3 | 4 | 5;
}
/** What a preset produces; `Figure`-ready. */
interface PresetParts {
    wide: ReactNode;
    narrow: ReactNode;
    viewBox: string;
    narrowViewBox: string;
    legend: LegendItem[];
}
/** Props of the element every preset wrapper returns; `renderStatic` reads them. */
interface PresetFigureProps<S> {
    spec: S;
    parts: (spec: S, id: string) => PresetParts;
    id?: string;
}
/**
 * A preset as a component: the marker and stack ids come from `useId()` unless
 * the caller passes one, so two figures of the same preset on a page never
 * collide.
 */
declare function PresetFigure<S extends {
    figure: FigureMeta;
}>({ spec, parts, id }: PresetFigureProps<S>): react.JSX.Element;
/** Build the element a preset wrapper returns. */
declare function presetFigure<S extends {
    figure: FigureMeta;
}>(spec: S, parts: (spec: S, id: string) => PresetParts, id?: string): react.JSX.Element;
declare function toFigure(meta: FigureMeta, parts: PresetParts, id?: string): react.JSX.Element;
interface StackStep extends Item {
    /** Kind of the connector and packet leading INTO this step. */
    kind?: TokenKind;
    /** Draw the packet into this step backwards (a return). */
    back?: boolean;
    flow?: string;
    accent?: boolean;
    dashed?: boolean;
}
declare const NARROW_W = 360;
/** Height of a narrow stack of `n` steps starting at `y0`. */
declare function stackHeight(n: number, y0?: number): number;
/**
 * The narrow drawing every preset falls back to: one column of boxes with a
 * connector and a packet between each pair. Direction is top to bottom.
 */
declare function Stack({ steps, id, y0 }: {
    steps: StackStep[];
    id: string;
    y0?: number;
}): react.JSX.Element;

interface PipelineSpec {
    figure: FigureMeta;
    stages: Item[];
    /** A queue drawn after stage `after` (0-based), with `depth` waiting slots. */
    queue?: Item & {
        after: number;
        depth?: number;
    };
    laneTitle?: string;
}
declare const defaultPipeline: PipelineSpec;
declare function pipelineParts(spec: PipelineSpec | undefined, id: string): PresetParts;
declare const pipeline: (spec?: PipelineSpec, id?: string) => react.JSX.Element;

interface BeforeAfterPanel {
    title: string;
    stages: Item[];
    /** Indices of stages that are new or changed; their inbound edge is accented. */
    changed?: number[];
}
interface BeforeAfterSpec {
    figure: FigureMeta;
    before: BeforeAfterPanel;
    after: BeforeAfterPanel;
}
declare const defaultBeforeAfter: BeforeAfterSpec;
declare function beforeAfterParts(spec: BeforeAfterSpec | undefined, id: string): PresetParts;
declare const beforeAfter: (spec?: BeforeAfterSpec, id?: string) => react.JSX.Element;

interface SyncLoopSpec {
    figure: FigureMeta;
    upstream: {
        label: string;
        sub?: string;
        items: Item[];
    };
    /** Repos that hold a copy. `hooks` names the two moments the copy syncs. `plugin` marks a read-only consumer. */
    consumers: (Item & {
        hooks?: [string, string];
        plugin?: boolean;
    })[];
    pull?: string;
    push?: string;
}
declare const defaultSyncLoop: SyncLoopSpec;
declare function syncLoopParts(spec: SyncLoopSpec | undefined, id: string): PresetParts;
declare const syncLoop: (spec?: SyncLoopSpec, id?: string) => react.JSX.Element;

interface SkillLifecycleSpec {
    figure: FigureMeta;
    author: Item;
    evaluate: Item & {
        baseline: string;
    };
    version: Item;
    consumers: Item[];
    feedback: Item;
}
declare const defaultSkillLifecycle: SkillLifecycleSpec;
declare function skillLifecycleParts(spec: SkillLifecycleSpec | undefined, id: string): PresetParts;
declare const skillLifecycle: (spec?: SkillLifecycleSpec, id?: string) => react.JSX.Element;

interface RagPipelineSpec {
    figure: FigureMeta;
    sources: Item[];
    /** Ingest stages, left to right, ending in the index. */
    ingest: Item[];
    index: Item;
    query: Item;
    /** Query stages, left to right; the first one reads the index. */
    stages: Item[];
    answer: Item;
}
declare const defaultRagPipeline: RagPipelineSpec;
declare function ragPipelineParts(spec: RagPipelineSpec | undefined, id: string): PresetParts;
declare const ragPipeline: (spec?: RagPipelineSpec, id?: string) => react.JSX.Element;

interface AgentLoopSpec {
    figure: FigureMeta;
    user: Item;
    agent: Item;
    tools: Item[];
    /** The deterministic check between the agent and what the user sees. */
    boundary: Item;
    output: Item;
    laneTitles?: [string, string, string];
}
declare const defaultAgentLoop: AgentLoopSpec;
declare function agentLoopParts(spec: AgentLoopSpec | undefined, id: string): PresetParts;
declare const agentLoop: (spec?: AgentLoopSpec, id?: string) => react.JSX.Element;

interface ServiceMapSpec {
    figure: FigureMeta;
    /** Left lane. */
    clients: Item[];
    /** The boxed platform in the middle: a title, cells three per row, an optional full-width footer cell. */
    platform: {
        title: string;
        cells: Item[];
        footer?: Item;
    };
    /** Right lane. */
    resources: Item[];
    /** Optional change stream under the platform fanning out to sinks. */
    sinks?: {
        via: Item;
        items: Item[];
    };
    laneTitles?: [string, string, string];
}
declare const defaultServiceMap: ServiceMapSpec;
declare function serviceMapParts(spec: ServiceMapSpec | undefined, id: string): PresetParts;
declare const serviceMap: (spec?: ServiceMapSpec, id?: string) => react.JSX.Element;

/** Every preset with its default spec, for catalogues and tests. */
declare const PRESETS: {
    readonly serviceMap: {
        readonly render: (spec?: ServiceMapSpec, id?: string) => react.JSX.Element;
        readonly spec: ServiceMapSpec;
        readonly name: "Service map";
    };
    readonly agentLoop: {
        readonly render: (spec?: AgentLoopSpec, id?: string) => react.JSX.Element;
        readonly spec: AgentLoopSpec;
        readonly name: "Agent loop";
    };
    readonly ragPipeline: {
        readonly render: (spec?: RagPipelineSpec, id?: string) => react.JSX.Element;
        readonly spec: RagPipelineSpec;
        readonly name: "RAG pipeline";
    };
    readonly skillLifecycle: {
        readonly render: (spec?: SkillLifecycleSpec, id?: string) => react.JSX.Element;
        readonly spec: SkillLifecycleSpec;
        readonly name: "Skill lifecycle";
    };
    readonly syncLoop: {
        readonly render: (spec?: SyncLoopSpec, id?: string) => react.JSX.Element;
        readonly spec: SyncLoopSpec;
        readonly name: "Sync loop";
    };
    readonly beforeAfter: {
        readonly render: (spec?: BeforeAfterSpec, id?: string) => react.JSX.Element;
        readonly spec: BeforeAfterSpec;
        readonly name: "Before and after";
    };
    readonly pipeline: {
        readonly render: (spec?: PipelineSpec, id?: string) => react.JSX.Element;
        readonly spec: PipelineSpec;
        readonly name: "Pipeline";
    };
};
type PresetName = keyof typeof PRESETS;

export { type AgentLoopSpec, type BeforeAfterPanel, type BeforeAfterSpec, type FigureMeta, type Item, NARROW_W, PRESETS, type PipelineSpec, PresetFigure, type PresetFigureProps, type PresetName, type PresetParts, type RagPipelineSpec, type ServiceMapSpec, type SkillLifecycleSpec, Stack, type StackStep, type SyncLoopSpec, agentLoop, agentLoopParts, beforeAfter, beforeAfterParts, defaultAgentLoop, defaultBeforeAfter, defaultPipeline, defaultRagPipeline, defaultServiceMap, defaultSkillLifecycle, defaultSyncLoop, pipeline, pipelineParts, presetFigure, ragPipeline, ragPipelineParts, serviceMap, serviceMapParts, skillLifecycle, skillLifecycleParts, stackHeight, syncLoop, syncLoopParts, toFigure };
